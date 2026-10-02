import { describe, expect, it } from "vitest";
import { appReturnUrl, isAppReturnScheme, parseAppReturn } from "@lib/app-return";

describe("앱으로 돌아오는 주소", () => {
  it("스토어 앱과 테스트용 앱의 스킴만 받는다", () => {
    expect(isAppReturnScheme("com.subslash.app")).toBe(true);
    expect(isAppReturnScheme("com.subslash.app.dev")).toBe(true);
    expect(isAppReturnScheme("intent")).toBe(false);
    expect(isAppReturnScheme("javascript")).toBe(false);
    expect(isAppReturnScheme(undefined)).toBe(false);
  });

  it("결과 쿼리를 실어 만들고, 앱에서 같은 결과로 읽는다", () => {
    const url = appReturnUrl(
      "com.subslash.app",
      new URLSearchParams({ oauthError: "email-taken", oauthVia: "google" }),
    );
    expect(url).toBe("com.subslash.app://oauth-done?oauthError=email-taken&oauthVia=google");
    expect(parseAppReturn(url)?.get("oauthVia")).toBe("google");
    expect(appReturnUrl("com.subslash.app", new URLSearchParams())).toBe(
      "com.subslash.app://oauth-done",
    );
  });

  it("다른 스킴이나 다른 경로의 주소는 돌아오는 주소로 읽지 않는다", () => {
    expect(parseAppReturn("other.app://oauth-done?x=1")).toBeNull();
    expect(parseAppReturn("com.subslash.app://somewhere")).toBeNull();
    expect(parseAppReturn("https://www.subslash.me/oauth/done")).toBeNull();
    expect(parseAppReturn("not a url")).toBeNull();
  });
});
