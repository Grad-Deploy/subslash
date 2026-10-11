import { describe, expect, it } from "vitest";
import { OAUTH_PROVIDER_IDS, providerLabel } from "@lib/oauth-providers";
import { messages } from "@lib/i18n/messages";

describe("간편 로그인 회사 이름", () => {
  // 예전에는 서버의 한국어 이름표만 써서 영어 화면에도 '구글로 계속하기'·'구글 연결됨'이 나왔다.
  it("화면 언어의 이름표로 보인다", () => {
    expect(providerLabel("google", messages.en.auth.social.providers)).toBe("Google");
    expect(providerLabel("kakao", messages.ko.auth.social.providers)).toBe("카카오");
  });

  it("모든 언어가 모든 회사의 이름을 가진다", () => {
    for (const names of [messages.ko.auth.social.providers, messages.en.auth.social.providers]) {
      for (const id of OAUTH_PROVIDER_IDS) expect(names[id]).toBeTruthy();
    }
  });

  it("모르는 값은 받은 그대로 보인다", () => {
    expect(providerLabel("apple", messages.en.auth.social.providers)).toBe("apple");
  });
});
