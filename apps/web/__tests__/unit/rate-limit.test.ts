import { beforeEach, describe, expect, it, vi } from "vitest";
import { clientIp, hit, reset, resetAllRateLimits, retryAfterSeconds } from "../../lib/rate-limit";

const RULE = { limit: 3, windowMs: 60_000 };

beforeEach(() => resetAllRateLimits());

describe("요청 수 제한", () => {
  it("창 안에서 한도를 채우면 창이 끝날 때까지 막는다", () => {
    const t = 1_000_000;
    hit("k", RULE, t);
    hit("k", RULE, t + 10_000);
    expect(retryAfterSeconds("k", RULE, t + 10_000)).toBe(0);
    hit("k", RULE, t + 20_000);
    // 가장 오래된 기록(t)이 창 밖으로 나가는 때까지.
    expect(retryAfterSeconds("k", RULE, t + 20_000)).toBe(40);
    expect(retryAfterSeconds("k", RULE, t + 60_000)).toBe(0);
  });

  it("다른 키는 따로 세고, 지우면 처음부터 센다", () => {
    for (let i = 0; i < 3; i++) hit("a", RULE, 0);
    expect(retryAfterSeconds("a", RULE, 1)).toBeGreaterThan(0);
    expect(retryAfterSeconds("b", RULE, 1)).toBe(0);
    reset("a");
    expect(retryAfterSeconds("a", RULE, 1)).toBe(0);
  });

  it("칸이 가득 차 청소해도 창이 더 긴 규칙의 기록은 지우지 않는다", () => {
    const DAY = { limit: 50, windowMs: 24 * 60 * 60_000 };
    const SHORT = { limit: 10, windowMs: 10 * 60_000 };
    const t = 1_000_000;
    // 하루 규칙으로 한도를 채운 사용자.
    for (let i = 0; i < DAY.limit; i++) hit("day-user", DAY, t);
    // 짧은 규칙의 칸이 5,000개를 넘게 쌓인 뒤, 11분 지나 짧은 규칙의 요청이 온다.
    for (let i = 0; i < 5000; i++) hit(`short-${i}`, SHORT, t);
    const later = t + 11 * 60_000;
    hit("trigger", SHORT, later);
    // 예전에는 짧은 창(10분)으로 모든 칸을 재서 하루 규칙의 기록이 지워지고 한도가 풀렸다.
    expect(retryAfterSeconds("day-user", DAY, later)).toBeGreaterThan(0);
    // 짧은 규칙의 낡은 칸은 치워진다.
    expect(retryAfterSeconds("short-0", SHORT, later)).toBe(0);
  });

  it("청소는 1분에 한 번만 한다 — 칸이 모두 최근 것이어도 요청마다 훑지 않는다", () => {
    const SHORT = { limit: 10, windowMs: 10 * 60_000 };
    const t = 5_000_000;
    for (let i = 0; i < 5000; i++) hit(`k-${i}`, SHORT, t);
    // 아무것도 지울 수 없는 청소를 한 번 겪게 한다.
    hit("probe", SHORT, t + 1);
    const iterate = vi.spyOn(Map.prototype, Symbol.iterator);
    try {
      for (let i = 0; i < 20; i++) hit("probe", SHORT, t + 2 + i);
      expect(iterate).not.toHaveBeenCalled();
    } finally {
      iterate.mockRestore();
    }
  });

  it("IP는 x-forwarded-for의 맨 앞 주소를 쓴다", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("takeRateLimit", () => {
  it("한도까지는 세고 그 뒤로는 429를 돌려준다", async () => {
    const { takeRateLimit, resetAllRateLimits } = await import("../../lib/rate-limit");
    resetAllRateLimits();
    const rule = { limit: 2, windowMs: 1000 };
    expect(takeRateLimit("k", rule, 0)).toBeNull();
    expect(takeRateLimit("k", rule, 1)).toBeNull();
    expect(takeRateLimit("k", rule, 2)?.status).toBe(429);
    expect(takeRateLimit("k", rule, 1001)).toBeNull();
  });
});
