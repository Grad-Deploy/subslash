import { describe, expect, it } from "vitest";
import {
  sumMyAnnualKRW,
  sumMyMonthlyKRW,
  type Subscription,
  type UsageLog,
} from "@subslash/shared";
import { answerAsk, matchSubscriptions, type AskContext } from "@lib/ask/answer";
import { messages } from "@lib/i18n/messages";
import { ASK_TOOLS, type AskToolName } from "@lib/ask/tools";
import { ASK_EVAL_SET } from "@lib/ask/eval-set";

const NOW = new Date(2026, 9, 5, 12); // 2026-10-05

function sub(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: overrides.id ?? "netflix",
    name: "넷플릭스",
    amount: 17000,
    currency: "KRW",
    billingDay: 25,
    billingCycle: "monthly",
    category: "ott",
    status: "active",
    createdAt: new Date(2026, 0, 1).toISOString(),
    ...overrides,
  };
}

function uses(subscriptionId: string, count: number, risk: UsageLog["riskLevel"]): UsageLog {
  return {
    id: `log-${subscriptionId}`,
    subscriptionId,
    month: "2026-10",
    usageCount: count,
    costPerUse: 0,
    riskLevel: risk,
    checkedAt: new Date(2026, 9, 1).toISOString(),
  };
}

const SUBS: Subscription[] = [
  sub({ id: "netflix", name: "넷플릭스", amount: 17000, planId: "premium", billingDay: 25 }),
  sub({ id: "wavve", name: "웨이브", amount: 7900, billingDay: 8 }),
  sub({ id: "tving", name: "티빙", amount: 9500, billingDay: 6, sharingCount: 2 }),
  sub({ id: "gpt", name: "ChatGPT Plus", amount: 29000, category: "ai", billingDay: 20 }),
  sub({ id: "trial", name: "쿠팡플레이", amount: 7890, trialEndsAt: "2026-10-09" }),
  sub({
    id: "new",
    name: "멜론",
    amount: 10900,
    category: "music",
    createdAt: new Date(2026, 9, 2).toISOString(),
  }),
  sub({
    id: "old",
    name: "왓챠",
    amount: 7900,
    status: "killed",
    killedAt: new Date(2026, 9, 3).toISOString(),
    billingDay: 1,
  }),
];
const LOGS = [uses("netflix", 8, "green"), uses("wavve", 1, "red"), uses("tving", 3, "yellow")];
const CTX: AskContext = {
  subscriptions: SUBS,
  usageLogs: LOGS,
  rate: 1400,
  now: NOW,
  t: messages.ko,
};
const PAYING = SUBS.filter((s) => s.status === "active" && s.id !== "trial");

const won = (n: number) => `₩${Math.round(n).toLocaleString("ko-KR")}`;

describe("리포트에 물어보기 — 기기에서 만드는 답", () => {
  it("모든 도구에 답이 있다 — 평가 세트의 정답 호출로 한 번씩 계산해도 던지지 않는다", () => {
    const seen = new Set<AskToolName>();
    for (const item of ASK_EVAL_SET) {
      const result = answerAsk(item.expect, CTX);
      expect(result.headline.length, item.q).toBeGreaterThan(0);
      expect(result.source.length, item.q).toBeGreaterThan(0);
      seen.add(item.expect.tool);
    }
    expect([...seen].sort()).toEqual((Object.keys(ASK_TOOLS) as AskToolName[]).sort());
  });

  it("지출 합계는 리포트 칸과 같은 함수로 계산하고, 무료 체험 중인 구독은 뺀다", () => {
    const month = answerAsk({ tool: "spendTotal", args: { period: "month" } }, CTX);
    expect(month.headline).toContain(won(sumMyMonthlyKRW(PAYING, 1400)));
    expect(month.headline).toContain(`${PAYING.length}개`);
    expect(month.notes.join()).toContain("무료 체험 중인 1개");

    const year = answerAsk({ tool: "spendTotal", args: { period: "year" } }, CTX);
    expect(year.headline).toContain(won(sumMyAnnualKRW(PAYING, 1400)));
  });

  it("분류별 지출은 그 분류만 더하고 전체에서의 비율을 함께 말한다", () => {
    const ott = PAYING.filter((s) => s.category === "ott");
    const result = answerAsk({ tool: "spendByCategory", args: { category: "ott" } }, CTX);
    const share = Math.round((sumMyMonthlyKRW(ott, 1400) / sumMyMonthlyKRW(PAYING, 1400)) * 100);
    expect(result.headline).toContain(won(sumMyMonthlyKRW(ott, 1400)));
    expect(result.headline).toContain(`${share}%`);
    expect(result.rows.map((r) => r.label)).toEqual(["넷플릭스", "웨이브", "티빙"]);
    expect(
      answerAsk({ tool: "spendByCategory", args: { category: "cloud" } }, CTX).headline,
    ).toContain("등록한 구독이 없어요");
  });

  it("1회 단가 순위는 리포트와 같고, worst와 best가 반대 순서다", () => {
    const worst = answerAsk({ tool: "costPerUseRank", args: { order: "worst", limit: 3 } }, CTX);
    const best = answerAsk({ tool: "costPerUseRank", args: { order: "best", limit: 3 } }, CTX);
    expect(worst.rows[0].label).toBe("웨이브");
    // 티빙은 둘이 나눠 내서 내 몫 4,750원 ÷ 3회 — 넷플릭스(17,000원 ÷ 8회)보다 1회가 싸다.
    expect(best.rows[0].label).toBe("티빙");
    expect(worst.rows.map((r) => r.label)).toEqual([...best.rows.map((r) => r.label)].reverse());
  });

  it("안 쓰는 구독은 체크인 빨강만 말하고, 체크인이 없는 구독은 모른다고 한다", () => {
    const result = answerAsk({ tool: "lowUsage" }, CTX);
    expect(result.rows.map((r) => r.label)).toEqual(["웨이브"]);
    expect(result.notes.join()).toContain("체크인이 없는");
  });

  it("다가오는 결제는 기간 안의 것만, 날짜 순으로", () => {
    const week = answerAsk({ tool: "upcomingCharges", args: { days: 7 } }, CTX);
    expect(week.rows.map((r) => r.label)).toEqual(["10월 6일 티빙", "10월 8일 웨이브"]);
    expect(
      answerAsk({ tool: "upcomingCharges", args: { days: 1 } }, CTX).rows.map((r) => r.label),
    ).toEqual(["10월 6일 티빙"]);
  });

  it("무료 체험이 끝나는 구독을 남은 날과 함께", () => {
    const result = answerAsk({ tool: "trialsEnding", args: { days: 7 } }, CTX);
    expect(result.rows).toEqual([{ label: "쿠팡플레이", value: "4일 남음" }]);
  });

  it("서비스 이름은 줄여 적어도 맞추고, 여러 개가 맞으면 하나를 골라 답하지 않는다", () => {
    expect(matchSubscriptions("넷플", SUBS).map((s) => s.id)).toEqual(["netflix"]);
    expect(matchSubscriptions("chat gpt", SUBS).map((s) => s.id)).toEqual(["gpt"]);
    expect(matchSubscriptions("넷", SUBS)).toEqual([]);
    const both = [...SUBS, sub({ id: "netflix2", name: "넷플릭스 (가족)" })];
    const result = answerAsk(
      { tool: "serviceDetail", args: { service: "넷플릭스" } },
      { ...CTX, subscriptions: both },
    );
    expect(result.headline).toContain("2개");
    expect(
      answerAsk({ tool: "serviceDetail", args: { service: "디즈니" } }, CTX).headline,
    ).toContain("찾지 못했어요");
  });

  it("더 싼 요금제는 서비스 목록의 요금으로만 말한다", () => {
    const result = answerAsk({ tool: "cheaperPlan", args: { service: "넷플" } }, CTX);
    expect(result.headline).toContain("광고형 스탠다드");
    expect(result.headline).toContain(won((17000 - 7000) * 12));
    // 요금제를 모르면 비교하지 않는다(제1원칙).
    expect(answerAsk({ tool: "cheaperPlan", args: { service: "웨이브" } }, CTX).headline).toContain(
      "요금제를 몰라",
    );
  });

  it("지난달 비교는 이번 달에 등록·해지한 구독으로만 말하고, 그렇다고 밝힌다", () => {
    const result = answerAsk({ tool: "compareLastMonth" }, CTX);
    expect(result.rows).toEqual([
      { label: "해지 왓챠", value: `−${won(7900)}` },
      { label: "등록 멜론", value: `+${won(10900)}` },
    ]);
    expect(result.headline).toContain(`${won(3000)} 늘었어요`);
    expect(result.notes.join()).toContain("달마다 쓴 돈의 기록이 없어");
  });

  it("이번 달에 등록하고 해지한 구독은 지난달에 없던 것이라 '줄었어요'로 세지 않는다", () => {
    const tried = sub({
      id: "tving",
      name: "티빙",
      amount: 9500,
      status: "killed",
      createdAt: new Date(2026, 9, 1).toISOString(),
      killedAt: new Date(2026, 9, 3).toISOString(),
    });
    const result = answerAsk(
      { tool: "compareLastMonth" },
      { ...CTX, subscriptions: [sub(), tried] },
    );
    expect(result.rows).toEqual([]);
    expect(result.headline).toBe("이번 달에 새로 등록하거나 해지한 구독이 없어요.");
  });

  it("범위 밖이면 숫자 없이 물어볼 수 있는 질문을, 사용법이면 도움말을 안내한다", () => {
    const unsupported = answerAsk({ tool: "unsupported" }, CTX);
    expect(unsupported.headline).not.toMatch(/\d/);
    expect(unsupported.notes.join()).toContain("한 달에 구독비 얼마 나가?");
    expect(answerAsk({ tool: "help" }, CTX).goHelp).toBe(true);
  });

  it("구독이 없으면 0원이 아니라 등록하라고 한다", () => {
    const empty = { ...CTX, subscriptions: [] };
    expect(answerAsk({ tool: "spendTotal", args: { period: "month" } }, empty).headline).toContain(
      "없어요",
    );
  });
});

describe("리포트에 물어보기 — 문장", () => {
  it("이름 뒤 조사를 받침으로 고른다", async () => {
    const { josa } = await import("@lib/ask/answer");
    expect(`웨이브${josa("웨이브", "이에요", "예요")}`).toBe("웨이브예요");
    expect(`넷플릭스${josa("넷플릭스", "은", "는")}`).toBe("넷플릭스는");
    expect(`티빙${josa("티빙", "은", "는")}`).toBe("티빙은");
    expect(`광고형 스탠다드${josa("광고형 스탠다드", "으로", "로")}`).toBe("광고형 스탠다드로");
    expect(`멜론${josa("멜론", "으로", "로")}`).toBe("멜론으로");
    expect(`음악${josa("음악", "으로", "로")}`).toBe("음악으로");
    expect(`클라우드${josa("클라우드", "으로", "로")}`).toBe("클라우드로");
    expect(`ChatGPT Plus${josa("ChatGPT Plus", "은", "는")}`).toBe("ChatGPT Plus은(는)");
  });

  it("사용자에게 보이는 계산 출처에 코드 이름을 적지 않는다", () => {
    for (const item of ASK_EVAL_SET) {
      expect(answerAsk(item.expect, CTX).source, item.q).not.toMatch(/[a-z][A-Z]|KRW|\(\w+\)/);
    }
  });
});

describe("리포트에 물어보기 — 영어 답", () => {
  const EN: AskContext = { ...CTX, t: messages.en };

  it("같은 계산에 영어 문장 틀을 쓴다", () => {
    const month = answerAsk({ tool: "spendTotal", args: { period: "month" } }, EN);
    expect(month.headline).toMatch(/^You pay ₩[\d,]+ a month for \d+ subscriptions?\.$/);
    expect(month.source).toBe("Your share, monthly total");
    const ko = answerAsk({ tool: "spendTotal", args: { period: "month" } }, CTX);
    // 숫자는 두 언어에서 같다.
    expect(month.headline.match(/₩[\d,]+/)?.[0]).toBe(ko.headline.match(/₩[\d,]+/)?.[0]);
  });

  it("도구 호출이 지원되지 않으면 영어 질문 칩을 안내한다", () => {
    const result = answerAsk({ tool: "unsupported" }, EN);
    expect(result.headline).toBe("That's not something I can answer.");
    expect(result.notes[0]).toContain(messages.en.ask.suggestions[0]);
  });

  it("분류 이름도 영어로 말한다", () => {
    const result = answerAsk({ tool: "spendByCategory", args: { category: "ott" } }, EN);
    expect(result.headline).toContain("in OTT");
    expect(result.headline).not.toMatch(/[가-힣]/);
  });
});
