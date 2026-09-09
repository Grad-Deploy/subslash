import { describe, it, expect } from "vitest";
import { billingRRule, buildBillingCalendar, calendarEligible } from "../../lib/ics";

const netflix = {
  clientId: "sub-1",
  name: "넷플릭스",
  amount: 17000,
  currency: "KRW",
  billingDay: 15,
  billingCycle: "monthly",
};

const NOW = new Date(2026, 8, 9); // 2026-09-09

describe("billingRRule", () => {
  it("모든 달에 있는 날짜는 그대로 반복한다", () => {
    expect(billingRRule({ billingDay: 15 })).toBe("FREQ=MONTHLY;BYMONTHDAY=15");
  });

  it("29~31일은 짧은 달의 말일로 당겨지도록 규칙을 만든다", () => {
    // BYMONTHDAY=31,-1 + BYSETPOS=1 은 "31일"과 "말일" 중 이른 쪽을 고른다.
    expect(billingRRule({ billingDay: 31 })).toBe("FREQ=MONTHLY;BYMONTHDAY=31,-1;BYSETPOS=1");
    expect(billingRRule({ billingDay: 29 })).toBe("FREQ=MONTHLY;BYMONTHDAY=29,-1;BYSETPOS=1");
  });

  it("연간 구독은 결제 월까지 고정해 1년에 한 번만 반복한다", () => {
    expect(billingRRule({ billingDay: 3, billingCycle: "yearly", billingMonth: 11 })).toBe(
      "FREQ=YEARLY;BYMONTH=11;BYMONTHDAY=3",
    );
  });

  it("연간 2월 29일 결제는 평년에 28일로 당겨진다", () => {
    expect(billingRRule({ billingDay: 29, billingCycle: "yearly", billingMonth: 2 })).toBe(
      "FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=29,-1;BYSETPOS=1",
    );
  });
});

describe("calendarEligible", () => {
  it("결제 월을 모르는 연간 구독은 내보내지 않는다", () => {
    const entries = [netflix, { ...netflix, clientId: "sub-2", billingCycle: "yearly" }];

    expect(calendarEligible(entries).map((e) => e.clientId)).toEqual(["sub-1"]);
  });

  it("결제 월이 있는 연간 구독은 내보낸다", () => {
    const entries = [{ ...netflix, clientId: "sub-3", billingCycle: "yearly", billingMonth: 6 }];

    expect(calendarEligible(entries).map((e) => e.clientId)).toEqual(["sub-3"]);
  });
});

describe("buildBillingCalendar", () => {
  it("구독마다 반복 일정과 사전 알림을 만든다", () => {
    const ics = buildBillingCalendar([netflix], { reminderDays: 3, now: NOW });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("UID:sub-1@subslash");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260915");
    expect(ics).toContain("DTEND;VALUE=DATE:20260916");
    expect(ics).toContain("RRULE:FREQ=MONTHLY;BYMONTHDAY=15");
    expect(ics).toContain("TRIGGER:-P3D");
    expect(ics).toContain("BEGIN:VALARM");
  });

  it("결제 월 없는 연간 구독만 있으면 일정 없는 빈 캘린더를 준다", () => {
    const ics = buildBillingCalendar([{ ...netflix, billingCycle: "yearly" }], {
      reminderDays: 3,
      now: NOW,
    });

    expect(ics).not.toContain("BEGIN:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("결제 월이 있는 연간 구독은 그 달의 일정으로 나간다", () => {
    const ics = buildBillingCalendar(
      [{ ...netflix, billingDay: 3, billingCycle: "yearly", billingMonth: 11 }],
      { reminderDays: 3, now: NOW },
    );

    expect(ics).toContain("DTSTART;VALUE=DATE:20261103");
    expect(ics).toContain("RRULE:FREQ=YEARLY;BYMONTH=11;BYMONTHDAY=3");
  });

  it("올해 결제 월이 지났으면 내년 날짜로 시작한다", () => {
    const ics = buildBillingCalendar(
      [{ ...netflix, billingDay: 3, billingCycle: "yearly", billingMonth: 2 }],
      { reminderDays: 3, now: NOW },
    );

    expect(ics).toContain("DTSTART;VALUE=DATE:20270203");
  });

  it("RFC 5545가 요구하는 CRLF로 끝난다", () => {
    const ics = buildBillingCalendar([netflix], { reminderDays: 3, now: NOW });

    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.split("\r\n").every((line) => !line.endsWith("\r"))).toBe(true);
  });

  it("이름에 든 쉼표와 세미콜론을 이스케이프한다", () => {
    const ics = buildBillingCalendar([{ ...netflix, name: "A,B;C" }], {
      reminderDays: 3,
      now: NOW,
    });

    expect(ics).toContain("A\\,B\\;C");
  });

  it("긴 한글 이름도 한 줄 75옥텟을 넘기지 않는다", () => {
    const ics = buildBillingCalendar([{ ...netflix, name: "아주아주긴한글구독이름".repeat(8) }], {
      reminderDays: 3,
      now: NOW,
    });

    for (const line of ics.split("\r\n")) {
      expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
    }
  });

  it("알림 시점은 사용자가 고른 일수를 따른다", () => {
    expect(buildBillingCalendar([netflix], { reminderDays: 7, now: NOW })).toContain(
      "TRIGGER:-P7D",
    );
    expect(buildBillingCalendar([netflix], { reminderDays: 0, now: NOW })).toContain(
      "TRIGGER:PT0S",
    );
  });
});
