import { describe, expect, it } from "vitest";
import type { Subscription } from "@subslash/shared";
import { createSubscription, killedRecord, revivedRecord } from "../../lib/store/records";

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
});
