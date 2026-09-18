import { describe, it, expect } from "vitest";
import { buildCalendarEvents, parseCalendarPlan } from "../../lib/calendar-sync";

/**
 * 구글 캘린더에 쓸 결제일을 만드는 규칙.
 *
 * 캘린더 피드와 같은 계산(`getNextBillingDateFor`·`billingRRule`)을 쓰는지, 그리고 결제 월을
 * 모르는 연간 구독을 매달 결제처럼 찍지 않는지가 핵심이다.
 */

const NOW = new Date(2026, 8, 18); // 2026-09-18

function entry(over: Partial<Record<string, unknown>> = {}) {
  return {
    clientId: "sub-1",
    name: "넷플릭스",
    amount: 17000,
    currency: "KRW",
    billingDay: 25,
    billingCycle: "monthly",
    billingMonth: null,
    ...over,
  };
}

describe("parseCalendarPlan", () => {
  it("브라우저가 보낸 목록을 그대로 믿지 않고 칸마다 검사한다", () => {
    expect(parseCalendarPlan(null)).toBeNull();
    expect(parseCalendarPlan({})).toBeNull();
    expect(parseCalendarPlan({ entries: [entry({ name: "  " })] })).toBeNull();
    expect(parseCalendarPlan({ entries: [entry({ amount: "17000" })] })).toBeNull();
    expect(parseCalendarPlan({ entries: [entry({ billingDay: 0 })] })).toBeNull();
    expect(parseCalendarPlan({ entries: [entry({ billingDay: 32 })] })).toBeNull();
    expect(parseCalendarPlan({ entries: [entry({ billingMonth: 13 })] })).toBeNull();
  });

  it("알림 일수는 0일과 4주 사이로 둔다 — 캘린더가 그보다 앞선 알림을 거절한다", () => {
    expect(parseCalendarPlan({ entries: [], reminderDays: -5 })?.reminderDays).toBe(0);
    expect(parseCalendarPlan({ entries: [], reminderDays: 400 })?.reminderDays).toBe(28);
    expect(parseCalendarPlan({ entries: [], reminderDays: 3 })?.reminderDays).toBe(3);
  });

  it("200건을 넘기면 거절한다 — 조용히 자르면 빠진 줄 모른다", () => {
    const many = Array.from({ length: 201 }, (_, i) => entry({ clientId: `sub-${i}` }));
    expect(parseCalendarPlan({ entries: many })).toBeNull();
  });
});

describe("buildCalendarEvents", () => {
  it("다음 결제일부터 매달 반복하고, 금액은 받은 값 그대로 적는다", () => {
    const plan = parseCalendarPlan({ entries: [entry()], reminderDays: 3 })!;
    const [event] = buildCalendarEvents(plan, { now: NOW });

    expect(event.start).toBe("2026-09-25");
    expect(event.end).toBe("2026-09-26");
    expect(event.rrule).toBe("FREQ=MONTHLY;BYMONTHDAY=25");
    expect(event.summary).toContain("넷플릭스");
    expect(event.summary).toContain("17,000");
    expect(event.reminderMinutes).toBe(3 * 24 * 60);
  });

  it("결제 월을 적은 연간 구독은 1년에 한 번만 반복한다", () => {
    const plan = parseCalendarPlan({
      entries: [entry({ billingCycle: "yearly", billingMonth: 3, billingDay: 2 })],
    })!;
    const [event] = buildCalendarEvents(plan, { now: NOW });

    expect(event.rrule).toBe("FREQ=YEARLY;BYMONTH=3;BYMONTHDAY=2");
    expect(event.start).toBe("2027-03-02");
  });

  it("결제 월을 모르는 연간 구독은 캘린더에 올리지 않는다", () => {
    const plan = parseCalendarPlan({
      entries: [entry({ billingCycle: "yearly", billingMonth: null })],
    })!;
    expect(buildCalendarEvents(plan, { now: NOW })).toEqual([]);
  });

  it("29~31일 결제는 그 날이 없는 달에 말일로 당긴다", () => {
    const plan = parseCalendarPlan({ entries: [entry({ billingDay: 31 })] })!;
    const [event] = buildCalendarEvents(plan, { now: NOW });
    expect(event.rrule).toBe("FREQ=MONTHLY;BYMONTHDAY=31,-1;BYSETPOS=1");
  });

  it("구독 상세 링크는 주소를 알 때만 적는다", () => {
    const plan = parseCalendarPlan({ entries: [entry()] })!;
    expect(buildCalendarEvents(plan, { now: NOW })[0].description).not.toContain("http");
    expect(
      buildCalendarEvents(plan, { now: NOW, appUrl: "https://subslash.me" })[0].description,
    ).toContain("https://subslash.me/subs/detail?id=sub-1");
  });
});
