import { describe, expect, it } from "vitest";
import type { Subscription } from "@subslash/shared";
import { hasPhoneMeasurable } from "../../components/usage/app/AppPhoneCheckInButton";

const sub = (id: string, name: string, category: Subscription["category"]): Subscription => ({
  id,
  name,
  amount: 10000,
  currency: "KRW",
  billingDay: 1,
  billingCycle: "monthly",
  category,
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
});

describe("폰 기록으로 잴 수 있는 구독", () => {
  it("연결표에 있는 OTT가 있으면 잴 수 있다", () => {
    expect(hasPhoneMeasurable([sub("t", "티빙", "ott")])).toBe(true);
  });

  it("구독이 없거나 연결표에 없는 것뿐이면 잴 수 없다 — 설정의 '체크인' 제목도 숨긴다", () => {
    expect(hasPhoneMeasurable([])).toBe(false);
    expect(hasPhoneMeasurable([sub("x", "동네 헬스장", "other")])).toBe(false);
  });
});
