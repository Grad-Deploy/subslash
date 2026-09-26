import { afterEach, describe, expect, it } from "vitest";
import {
  authorizeUrl,
  decodeFlow,
  enabledProviders,
  encodeFlow,
  fetchProfile,
  parseProfile,
  s256,
  safeNextPath,
  type OAuthFlow,
} from "@lib/oauth";

const ENV_KEYS = [
  "GOOGLE_OAUTH_CLIENT_ID",
  "GOOGLE_OAUTH_CLIENT_SECRET",
  "KAKAO_OAUTH_CLIENT_ID",
  "KAKAO_OAUTH_CLIENT_SECRET",
  "NAVER_OAUTH_CLIENT_ID",
  "NAVER_OAUTH_CLIENT_SECRET",
];

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
});

const FLOW: OAuthFlow = {
  provider: "google",
  state: "state-1",
  verifier: "verifier-1",
  appChallenge: null,
  over14: true,
  next: "/subs",
};

describe("parseProfile", () => {
  it("구글은 email_verified가 true일 때만 확인된 이메일이다", () => {
    expect(
      parseProfile("google", { sub: "1", email: "A@Gmail.com", email_verified: true }),
    ).toEqual({ subject: "1", email: "a@gmail.com", emailVerified: true });
    expect(parseProfile("google", { sub: "1", email: "a@gmail.com" })?.emailVerified).toBe(false);
    expect(parseProfile("google", { email: "a@gmail.com" })).toBeNull();
  });

  it("카카오는 확인됐고 유효한 주소일 때만 확인된 것으로 본다", () => {
    const account = { email: "a@kakao.com", is_email_verified: true, is_email_valid: true };
    expect(parseProfile("kakao", { id: 42, kakao_account: account })).toEqual({
      subject: "42",
      email: "a@kakao.com",
      emailVerified: true,
    });
    expect(
      parseProfile("kakao", { id: 42, kakao_account: { ...account, is_email_valid: false } })
        ?.emailVerified,
    ).toBe(false);
    // 이메일에 동의하지 않았다.
    expect(parseProfile("kakao", { id: 42, kakao_account: {} })?.email).toBeNull();
  });

  it("네이버는 이메일을 확인했는지 알려 주지 않으므로 늘 확인 전이다", () => {
    expect(
      parseProfile("naver", { resultcode: "00", response: { id: "n1", email: "a@naver.com" } }),
    ).toEqual({ subject: "n1", email: "a@naver.com", emailVerified: false });
    expect(parseProfile("naver", { resultcode: "024", response: {} })).toBeNull();
  });
});

describe("safeNextPath", () => {
  it("같은 사이트의 경로만 받는다", () => {
    expect(safeNextPath("/subs")).toBe("/subs");
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.com")).toBe("/dashboard");
    expect(safeNextPath(undefined)).toBe("/dashboard");
  });
});

describe("흐름 쿠키", () => {
  it("적은 대로 읽고, 망가졌으면 null", () => {
    expect(decodeFlow(encodeFlow(FLOW))).toEqual(FLOW);
    expect(decodeFlow("not-json")).toBeNull();
    expect(decodeFlow(encodeFlow({ ...FLOW, provider: "apple" as never }))).toBeNull();
  });
});

describe("authorizeUrl", () => {
  it("키가 없는 제공자는 버튼도 주소도 없다", () => {
    expect(enabledProviders()).toEqual([]);
    expect(authorizeUrl("google", "https://subslash.me", FLOW)).toBeNull();
  });

  it("구글은 PKCE와 이메일 동의만 요청한다", () => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = "gid";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "gsecret";
    const url = new URL(authorizeUrl("google", "https://subslash.me", FLOW)!);
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://subslash.me/api/auth/oauth/google/callback",
    );
    expect(url.searchParams.get("scope")).toBe("openid email");
    expect(url.searchParams.get("state")).toBe("state-1");
    expect(url.searchParams.get("code_challenge")).toBe(s256("verifier-1"));
    // 비밀값은 주소에 싣지 않는다.
    expect(url.toString()).not.toContain("gsecret");
  });

  it("카카오는 client secret 없이도 켜진다", () => {
    process.env.KAKAO_OAUTH_CLIENT_ID = "kid";
    expect(enabledProviders()).toEqual(["kakao"]);
  });
});

describe("fetchProfile", () => {
  it("코드를 토큰으로 바꾸고 프로필을 읽는다. 토큰을 못 받으면 provider 오류", async () => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = "gid";
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = "gsecret";
    const calls: string[] = [];
    const ok = (async (url: string, init?: RequestInit) => {
      calls.push(String(init?.body ?? url));
      if (url.includes("token")) return Response.json({ access_token: "at" });
      return Response.json({ sub: "1", email: "a@gmail.com", email_verified: true });
    }) as typeof fetch;
    await expect(fetchProfile("google", "https://subslash.me", "code", FLOW, ok)).resolves.toEqual({
      subject: "1",
      email: "a@gmail.com",
      emailVerified: true,
    });
    expect(calls[0]).toContain("code_verifier=verifier-1");

    const denied = (async () =>
      Response.json({ error: "invalid_grant" }, { status: 400 })) as typeof fetch;
    await expect(
      fetchProfile("google", "https://subslash.me", "code", FLOW, denied),
    ).rejects.toMatchObject({ code: "provider" });
  });
});
