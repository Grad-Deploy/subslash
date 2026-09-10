import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, needsRehash } from "../../lib/password";

describe("hashPassword", () => {
  it("평문을 그대로 담지 않는다", async () => {
    const password = "correct-horse-battery";
    const stored = await hashPassword(password);
    expect(stored).not.toContain(password);
  });

  it("같은 비밀번호라도 매번 다른 값이 나온다 (솔트)", async () => {
    const a = await hashPassword("same-password-1234");
    const b = await hashPassword("same-password-1234");
    expect(a).not.toBe(b);
  });

  it("파라미터를 값 안에 함께 적어 나중에 비용을 올려도 기존 계정이 열린다", async () => {
    const stored = await hashPassword("some-password-1234");
    const [algorithm, n, r, p, salt, hash] = stored.split("$");
    expect(algorithm).toBe("scrypt");
    expect(Number(n)).toBeGreaterThanOrEqual(1 << 17);
    expect(Number(r)).toBeGreaterThanOrEqual(8);
    expect(Number(p)).toBeGreaterThanOrEqual(1);
    expect(salt.length).toBeGreaterThan(0);
    expect(hash.length).toBeGreaterThan(0);
  });
});

describe("verifyPassword", () => {
  it("맞는 비밀번호를 통과시킨다", async () => {
    const stored = await hashPassword("my-real-password");
    await expect(verifyPassword("my-real-password", stored)).resolves.toBe(true);
  });

  it("틀린 비밀번호를 막는다", async () => {
    const stored = await hashPassword("my-real-password");
    await expect(verifyPassword("my-real-passwore", stored)).resolves.toBe(false);
    await expect(verifyPassword("", stored)).resolves.toBe(false);
  });

  it("유니코드 표기가 달라도 같은 비밀번호로 본다", async () => {
    // 조합형(ㅇ+ㅏ)과 완성형(아)은 눈에 같지만 바이트가 다르다.
    const composed = "비밀번호테스트1234";
    const decomposed = composed.normalize("NFD");
    expect(decomposed).not.toBe(composed);
    const stored = await hashPassword(composed);
    await expect(verifyPassword(decomposed, stored)).resolves.toBe(true);
  });

  it("저장된 값이 깨졌으면 통과시키지 않는다", async () => {
    await expect(verifyPassword("anything", "")).resolves.toBe(false);
    await expect(verifyPassword("anything", "plaintext")).resolves.toBe(false);
    await expect(verifyPassword("anything", "scrypt$1$1$1$$")).resolves.toBe(false);
    await expect(verifyPassword("anything", "md5$1$1$1$c2FsdA$aGFzaA")).resolves.toBe(false);
  });

  it("터무니없는 파라미터로 계산을 유도하는 값을 거부한다", async () => {
    // N을 과도하게 키운 값이 들어오면 검증 자체가 자원 고갈 공격이 된다.
    await expect(verifyPassword("anything", "scrypt$999999999$8$1$c2FsdA$aGFzaA")).resolves.toBe(
      false,
    );
    await expect(verifyPassword("anything", "scrypt$abc$8$1$c2FsdA$aGFzaA")).resolves.toBe(false);
  });
});

describe("needsRehash", () => {
  it("지금 기준으로 만든 값은 다시 해시할 필요가 없다", async () => {
    expect(needsRehash(await hashPassword("a-password-1234"))).toBe(false);
  });

  it("비용이 낮게 저장된 값과 형식이 다른 값은 다시 해시한다", () => {
    expect(needsRehash("scrypt$16384$8$1$c2FsdA$aGFzaA")).toBe(true);
    expect(needsRehash("bcrypt$whatever")).toBe(true);
    expect(needsRehash("")).toBe(true);
  });
});
