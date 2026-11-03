import { afterEach, describe, expect, it, vi } from "vitest";
import { checkCronSecret, safeEqual } from "../../lib/secret";

describe("safeEqual", () => {
  it("같은 문자열만 같다고 한다", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abd", "abc")).toBe(false);
    expect(safeEqual("ab", "abc")).toBe(false);
    expect(safeEqual(null, "abc")).toBe(false);
    expect(safeEqual(undefined, "")).toBe(true);
  });

  it("한글처럼 여러 바이트인 글자도 바이트로 견준다", () => {
    expect(safeEqual("상태", "상태")).toBe(true);
    expect(safeEqual("상태", "상대")).toBe(false);
  });
});

describe("checkCronSecret", () => {
  afterEach(() => vi.unstubAllEnvs());

  const withAuth = (value?: string) =>
    new Request("https://example.test/api/cron/notify", {
      headers: value ? { authorization: value } : {},
    });

  it("비밀값이 배포에 없으면 missing이다", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(checkCronSecret(withAuth("Bearer "))).toBe("missing");
  });

  it("Bearer 헤더가 맞을 때만 ok다", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(checkCronSecret(withAuth("Bearer s3cret"))).toBe("ok");
    expect(checkCronSecret(withAuth("s3cret"))).toBe("unauthorized");
    expect(checkCronSecret(withAuth("Bearer wrong"))).toBe("unauthorized");
    expect(checkCronSecret(withAuth())).toBe("unauthorized");
  });
});
