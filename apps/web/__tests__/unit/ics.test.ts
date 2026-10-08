import { describe, it, expect } from "vitest";
import { billingRRule, calendarEligible, eventDescription } from "../../lib/ics";

const netflix = {
  clientId: "sub-1",
  name: "넷플릭스",
  amount: 17000,
  currency: "KRW",
  billingDay: 15,
  billingCycle: "monthly",
};

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

describe("eventDescription — 일정 메모", () => {
  it("영어로 등록하면 메모도 영어로 쓴다", () => {
    const text = eventDescription(
      { ...netflix, name: "Netflix", cancelUrl: "https://www.netflix.com/cancelplan" },
      "https://subslash.me/subs/detail?id=sub-1",
      "en",
    );
    expect(text).toContain("verified cancel page");
    expect(text).toContain("View or edit the subscription");
    expect(text).not.toMatch(/[가-힣]/);
  });

  it("해지 주소가 있으면 메모에 적는다", () => {
    const text = eventDescription(
      { ...netflix, cancelUrl: "https://www.netflix.com/cancelplan" },
      null,
    );
    expect(text).toContain("netflix.com/cancelplan");
    expect(text).toContain("확인된 해지 화면");
  });

  it("해지 주소가 없으면 메모에 해지 줄이 없다", () => {
    const text = eventDescription({ ...netflix, cancelUrl: null }, null);
    expect(text).not.toContain("해지하러 가기");
    expect(text).not.toContain("확인된 해지 화면");
  });

  it("상세 주소가 있으면 다른 기기에서는 보이지 않을 수 있다는 것과 함께 적는다", () => {
    const text = eventDescription(netflix, "https://subslash.me/subs/detail?id=sub-1");
    expect(text).toContain("구독 보기·수정: https://subslash.me/subs/detail?id=sub-1");
    expect(text).toContain("로그인해 두면 다른 기기에서도 보입니다");
  });
});
