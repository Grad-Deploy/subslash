import { describe, it, expect, vi, afterEach } from "vitest";
import { DrizzleQueryError } from "drizzle-orm";
import { describeError, isUniqueViolation, logError } from "../../lib/log";

const EMAIL = "someone@example.com";
const HASH = "scrypt$131072$8$1$c2FsdA$aGFzaA";

function queryError(causeMessage = "SQLITE_CONSTRAINT: UNIQUE constraint failed: accounts.email") {
  const cause = new Error(causeMessage);
  return new DrizzleQueryError(
    "insert into accounts (email, password_hash) values (?, ?)",
    [EMAIL, HASH],
    cause,
  );
}

afterEach(() => vi.restoreAllMocks());

describe("logError", () => {
  it("쿼리 오류의 바인딩 값(이메일·비밀번호 해시)을 로그에 남기지 않는다", () => {
    const error = queryError();
    // 전제: Drizzle의 원래 메시지에는 값이 그대로 들어 있다.
    expect(error.message).toContain(EMAIL);

    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    logError("api/auth/signup", error);
    const logged = spy.mock.calls.flat().map(String).join(" ");
    expect(logged).not.toContain(EMAIL);
    expect(logged).not.toContain(HASH);
    // 무엇이 실패했는지는 남는다.
    expect(logged).toContain("insert into accounts");
    expect(logged).toContain("UNIQUE constraint failed: accounts.email");
  });

  it("보통 오류는 이름과 메시지, 원인을 남긴다", () => {
    const error = new Error("바깥", { cause: new TypeError("안쪽") });
    expect(describeError(error)).toBe("Error: 바깥 <- TypeError: 안쪽");
  });
});

describe("isUniqueViolation", () => {
  it("Drizzle이 원인에 감싼 UNIQUE 오류도 알아본다", () => {
    expect(isUniqueViolation(queryError())).toBe(true);
    expect(isUniqueViolation(queryError("SQLITE_BUSY: database is locked"))).toBe(false);
    expect(isUniqueViolation(new Error("UNIQUE constraint failed: x"))).toBe(true);
    expect(isUniqueViolation("nope")).toBe(false);
  });
});
