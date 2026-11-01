import { describe, expect, it } from "vitest";
import type { Subscription } from "@subslash/shared";
import {
  buildCheckInLog,
  createSubscription,
  killedRecord,
  revivedRecord,
} from "../../lib/store/records";
import { previewFirstCheckInRisk } from "../../components/app-start/FirstCheckInCard";

const base = createSubscription(
  { name: "넷플릭스", amount: 13500, billingDay: 5 } as Parameters<typeof createSubscription>[0],
  "sub-1",
  "2026-01-01T00:00:00.000Z",
);

describe("구독 기록 규칙(lib/store/records)", () => {
  it("새 구독은 구독 중이고, 통화·주기·분류를 비우면 원화·월간·기타다", () => {
    expect(base).toMatchObject({
      id: "sub-1",
      status: "active",
      currency: "KRW",
      billingCycle: "monthly",
      category: "other",
    });
  });

  it("해지하면 앞선 해지에 딸린 기록(확인·다시 볼 날·근거·해지 알림)을 지운다", () => {
    const before: Subscription = {
      ...base,
      killVerifiedAt: "2025-12-01T00:00:00.000Z",
      resubscribeRemindOn: "2026-06-01",
      killEvidence: { reference: "A-1", recordedAt: "2025-12-01T00:00:00.000Z" },
      cancelNoticeAt: "2026.09.30",
    };
    const killed = killedRecord(before, "2026-10-04T00:00:00.000Z");
    expect(killed.status).toBe("killed");
    expect(killed.killedAt).toBe("2026-10-04T00:00:00.000Z");
    expect(killed.killVerifiedAt).toBeUndefined();
    expect(killed.resubscribeRemindOn).toBeUndefined();
    expect(killed.killEvidence).toBeUndefined();
    expect(killed.cancelNoticeAt).toBeUndefined();
  });

  it("되살리면 해지 한 번에 딸린 기록과 숨김·해지 뒤 결제 증거를 모두 지운다", () => {
    const killed: Subscription = {
      ...killedRecord(base, "2026-09-01T00:00:00.000Z"),
      killVerifiedAt: "2026-09-10T00:00:00.000Z",
      hiddenAt: "2026-09-11T00:00:00.000Z",
      chargedAfterKillAt: "2026.10.01",
      chargedAfterKillAmount: 13500,
    };
    const revived = revivedRecord(killed);
    expect(revived.status).toBe("active");
    for (const key of [
      "killedAt",
      "killVerifiedAt",
      "resubscribeRemindOn",
      "killEvidence",
      "hiddenAt",
      "chargedAfterKillAt",
      "chargedAfterKillAmount",
      "cancelNoticeAt",
    ] as const) {
      expect(revived[key]).toBeUndefined();
    }
    expect(revived.amount).toBe(13500);
  });

  it("첫 체크인 카드 프리뷰 위험도는 모든 지표·요금제·무료 요금제 응답에서 저장 직후 기록의 riskLevel과 일치한다", () => {
    const now = new Date("2026-10-25T09:00:00+09:00");
    const cases: Array<{ sub: Subscription; counts: number[]; expected: string[] }> = [
      {
        sub: { ...base, name: "넷플릭스", amount: 17000, category: "ott" },
        counts: [0, 1, 2, 3, 4, 8],
        expected: ["red", "red", "yellow", "yellow", "green", "green"],
      },
      {
        sub: { ...base, name: "ChatGPT", amount: 29000, category: "ai" },
        counts: [0, 2, 4, 9, 10],
        expected: ["red", "red", "yellow", "yellow", "green"],
      },
      {
        // 무료 요금제가 확인된 서비스(asksFreeTier = true)에서 '무료로도 충분했다'고 답한 경우 10일 이상도 노랑이다.
        sub: {
          ...base,
          name: "ChatGPT",
          amount: 29000,
          category: "ai",
          freeTierAnswer: "enough",
        },
        counts: [1, 4, 15],
        expected: ["red", "yellow", "yellow"],
      },
      {
        // 무료 요금제를 묻지 않는 직접 입력 AI 서비스(asksFreeTier = false)는 freeTierAnswer를 적용하지 않는다.
        sub: {
          ...base,
          name: "사내 전용 AI",
          amount: 29000,
          category: "ai",
          freeTierAnswer: "enough",
        },
        counts: [1, 4, 15],
        expected: ["red", "yellow", "green"],
      },
      {
        sub: { ...base, name: "유튜브 뮤직", amount: 11900, category: "music" },
        counts: [0, 1, 4, 9, 10],
        expected: ["red", "red", "yellow", "yellow", "green"],
      },
      {
        // 공유 구독: 내 몫(4900 / 2 = 2450원) 기준으로 혜택을 평가한다.
        sub: {
          ...base,
          name: "네이버플러스 멤버십",
          amount: 4900,
          sharingCount: 2,
          category: "shopping",
        },
        counts: [0, 1000, 1500, 2450],
        expected: ["red", "red", "yellow", "green"],
      },
      {
        // 저장 공간(요금제 미지정): 0% 빨강, 50% 미만 노랑, 50% 이상 초록
        sub: { ...base, name: "iCloud+", amount: 1100, category: "cloud" },
        counts: [0, 10, 40, 50, 120],
        expected: ["red", "yellow", "yellow", "green", "green"],
      },
      {
        // 저장 공간(200GB 요금제 지정): 30%(60GB)는 50GB 요금제에 들어가지 않으므로 storagePlanFit에 따라 초록이다.
        sub: { ...base, name: "iCloud+", amount: 3300, category: "cloud", planId: "200gb" },
        counts: [0, 20, 30, 80],
        expected: ["red", "yellow", "green", "green"],
      },
      {
        // 앱·웹에서 지표가 다른 결합 상품(구글 AI 프로 + 유튜브 프리미엄)도 현재 화면 기준(currentMetricFor)으로 프리뷰와 저장 결과가 일치한다.
        sub: {
          ...base,
          name: "유독 구글 AI 프로 + 유튜브 프리미엄",
          amount: 29000,
          category: "ai",
        },
        counts: [0, 2, 5, 10],
        expected: ["red", "red", "yellow", "green"],
      },
    ];

    for (const { sub, counts, expected } of cases) {
      counts.forEach((count, index) => {
        const preview = previewFirstCheckInRisk(sub, count);
        const saved = buildCheckInLog(sub, count, undefined, now, "log-1").log.riskLevel;
        expect(preview).toBe(expected[index]);
        expect(preview).toBe(saved);
      });
    }
  });
});
