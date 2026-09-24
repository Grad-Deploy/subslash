import { beforeEach, describe, expect, it } from "vitest";
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

  it("IP는 x-forwarded-for의 맨 앞 주소를 쓴다", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
