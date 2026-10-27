import { describe, expect, it } from "vitest";
import { isPaying } from "@subslash/shared";

const NOW = new Date(2026, 9, 27, 12);

describe("isPaying", () => {
  it("구독 중이고 체험 중이 아니면 돈이 나간다", () => {
    expect(isPaying({ status: "active" }, NOW)).toBe(true);
  });

  it("체험 중이면 아직 돈이 나가지 않는다 — 종료일 당일부터 낸다", () => {
    expect(isPaying({ status: "active", trialEndsAt: "2026-10-28" }, NOW)).toBe(false);
    expect(isPaying({ status: "active", trialEndsAt: "2026-10-27" }, NOW)).toBe(true);
  });

  it("체험 종료일을 모르면 체험 중으로 보지 않는다", () => {
    expect(isPaying({ status: "active", trialEndsAt: "날짜 아님" }, NOW)).toBe(true);
  });

  it("해지한 구독은 돈이 나가지 않는다", () => {
    expect(isPaying({ status: "killed" }, NOW)).toBe(false);
  });
});
