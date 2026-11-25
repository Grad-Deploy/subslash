import { describe, expect, it } from "vitest";
import {
  aiStorageFit,
  asksFreeTier,
  isAiStoragePlan,
  metricForSubscription,
  metricsForSubscription,
  type Subscription,
} from "@subslash/shared";
import { buildCheckInLog, createSubscription } from "../../lib/store/records";
import { createBackup, parseBackup } from "../../lib/backup";
import { describeCheckInOutcome } from "../../lib/i18n/check-in-outcome";
import { messages } from "../../lib/i18n/messages";

const NOW = new Date("2026-11-25T12:00:00");

/** Google AI Pro(5TB, ₩29,000)를 AI 분류로 등록한 구독. */
const aiPro = (storagePercent?: number, planId = "ai-pro"): Subscription => ({
  ...createSubscription(
    {
      name: "Google AI Pro",
      amount: planId === "ai-pro" ? 29000 : 11900,
      currency: "KRW",
      billingDay: 5,
      cancelUrl: "https://play.google.com/store/account/subscriptions",
      category: "ai",
      planId,
    } as Parameters<typeof createSubscription>[0],
    "sub-ai-pro",
    "2026-09-01T00:00:00.000Z",
  ),
  ...(storagePercent !== undefined ? { storagePercent } : {}),
});

const checkIn = (days: number, storagePercent?: number, planId?: string) =>
  buildCheckInLog(aiPro(storagePercent, planId), days, undefined, NOW, "log-1");

const ko = (days: number, storagePercent?: number, planId?: string) =>
  describeCheckInOutcome(messages.ko, checkIn(days, storagePercent, planId).response.outcome);

describe("구글 AI 프로: Gemini를 쓴 날 + 용량", () => {
  it("구글 원의 AI 요금제와 Google AI Pro가 같은 지표로 잰다", () => {
    const googleOne = {
      name: "구글 원",
      cancelUrl: "https://one.google.com/about/plans",
      category: "cloud" as const,
      currency: "KRW" as const,
    };
    expect(metricForSubscription({ ...googleOne, planId: "ai-pro" })).toBe("days");
    expect(metricForSubscription(aiPro())).toBe("days");
    // 예전 용량 체크인도 읽는다.
    expect(metricsForSubscription({ ...googleOne, planId: "ai-pro" })).toContain("storage");
    // AI가 없는 베이직은 그대로 용량이다.
    expect(metricForSubscription({ ...googleOne, planId: "basic" })).toBe("storage");
    // 요금제를 모르면 짐작하지 않는다.
    expect(isAiStoragePlan({ name: "Google AI Pro" })).toBe(false);
    // 같은 상품이라 '무료 요금제로도 충분했을까요?'도 똑같이 묻는다.
    expect(asksFreeTier({ ...googleOne, planId: "ai-pro" })).toBe(true);
    expect(asksFreeTier(aiPro())).toBe(true);
    expect(asksFreeTier({ ...googleOne, planId: "basic" })).toBe(false);
  });

  it("용량을 비워 두면 예전처럼 쓴 날로만 판단한다", () => {
    expect(checkIn(1).log.riskLevel).toBe("red");
    expect(checkIn(1).log.storagePercent).toBeUndefined();
  });

  it("Gemini를 적게 써도 저장한 양이 AI Plus 2TB에 안 들어가면 초록이다", () => {
    // 5TB의 60% = 3TB
    expect(aiStorageFit(aiPro(), 60)?.needsThisPlan).toBe(true);
    const { log } = checkIn(1, 60);
    expect(log.riskLevel).toBe("green");
    expect(log.storagePercent).toBe(60);
    expect(ko(1, 60)).toContain("용량 때문에라도 이 요금제가 필요해요");
  });

  it("둘 다 아니고 2TB에 들어가면 노랑으로 AI Plus를 권한다", () => {
    // 5TB의 10% = 500GB
    expect(aiStorageFit(aiPro(), 10)?.smallerAi).toEqual({
      planName: "Google AI Plus",
      capacityGB: 2000,
      amount: 11900,
    });
    expect(checkIn(3, 10).log.riskLevel).toBe("yellow");
    expect(ko(3, 10)).toContain("Google AI Plus 요금제(₩11,900)");
  });

  it("Gemini를 '잘 씀'만큼 쓰면 초록이고 AI Plus를 권하지 않는다", () => {
    expect(checkIn(15, 10).log.riskLevel).toBe("green");
    expect(ko(15, 10)).not.toContain("AI Plus");
  });

  it("Gemini를 안 쓰고 저장한 것도 무료 15GB에 들어가면 빨강이고 요금제를 권하지 않는다", () => {
    expect(checkIn(0, 0).log.riskLevel).toBe("red");
    // 5TB의 0.2% = 10GB
    expect(checkIn(0, 0.2).log.riskLevel).toBe("red");
    expect(checkIn(0, 0.2).log.storagePercent).toBe(0.2);
    expect(ko(0, 0.2)).toContain("무료 15GB 안에 들어가요");
    expect(ko(0, 0.2)).not.toContain("요금제(");
  });

  it("Gemini를 안 쓰고 무료 용량을 넘게 저장하면 들어가는 가장 싼 요금제를 권한다(AI가 없어도)", () => {
    // 5TB의 1% = 50GB → 베이직 100GB(구글 원의 요금제)
    expect(checkIn(0, 1).log.riskLevel).toBe("yellow");
    expect(ko(0, 1)).toContain("베이직 100GB 요금제(₩2,400)로 충분해요");
    // 5TB의 20% = 1TB → 베이직에 안 들어가 AI Plus 2TB
    expect(ko(0, 20)).toContain("Google AI Plus 요금제(₩11,900)로 충분해요");
  });

  it("1GB 미만도 조사가 맞는다", () => {
    expect(ko(0, 0.01)).toContain("저장한 1GB 미만도");
    expect(ko(0, 1)).toContain("저장한 약 50GB는");
    expect(ko(0, 1)).not.toContain("(는)");
    expect(ko(1, 60)).toContain("저장한 약 3TB는");
  });

  it("AI Plus는 더 작은 AI 요금제가 없다 — 베이직 100GB에도 안 들어가면 용량 때문에 필요하다", () => {
    // 2TB의 5% = 100GB → 베이직의 80%(80GB)를 넘는다.
    expect(checkIn(1, 5, "ai-plus").log.riskLevel).toBe("green");
    // 2TB의 2% = 40GB → 베이직에 들어가지만 베이직에는 Gemini가 없어 권하지 않는다.
    expect(checkIn(1, 2, "ai-plus").log.riskLevel).toBe("yellow");
    expect(ko(1, 2, "ai-plus")).not.toContain("베이직");
  });

  it("백업에 용량 비율을 싣고 다시 읽고, 100%를 넘는 값은 받지 않는다", () => {
    const restore = (percent: unknown) =>
      parseBackup(
        JSON.stringify(
          createBackup(
            {
              subscriptions: [{ ...aiPro(), storagePercent: percent }],
              usageLogs: [{ ...checkIn(3, 10).log, storagePercent: percent }],
              accounts: [],
              exchangeRate: {
                rate: 1400,
                source: "manual",
                updatedAt: "2026-09-01T00:00:00.000Z",
              },
            } as never,
            NOW,
          ),
        ),
      );
    const ok = restore(10);
    expect(ok.ok && ok.data.subscriptions[0].storagePercent).toBe(10);
    expect(ok.ok && ok.data.usageLogs[0].storagePercent).toBe(10);
    expect(restore(120).ok).toBe(false);
    expect(restore("10").ok).toBe(false);
  });
});
