import { describe, expect, it } from "vitest";
import { cycleText } from "../../components/import/cycleText";

/** 결제 문자로 불러오기(웹·앱)의 후보 줄에 적는 결제 주기. 연간 영수증을 매달 나가는 것처럼 적지 않는다. */
describe("찾은 후보의 결제 주기 문구", () => {
  it("월간은 매월 며칠인지 적는다", () => {
    expect(cycleText({ billingCycle: "monthly", billingDay: 15 })).toBe("매월 15일");
  });

  it("연간은 매년 몇 월 며칠인지 적는다", () => {
    expect(cycleText({ billingCycle: "yearly", billingDay: 3, billingMonth: 3 })).toBe(
      "매년 3월 3일",
    );
  });

  it("연간인데 결제 월을 모르면 지어내지 않고 미설정으로 둔다", () => {
    expect(cycleText({ billingCycle: "yearly", billingDay: 3 })).toBe("매년 · 결제월 미설정");
  });
});
