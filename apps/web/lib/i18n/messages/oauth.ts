import type { Widen } from "../types";

/** 간편 로그인 실패 이유(lib/oauth-messages). 서버가 `?oauthError=` 코드로 넘기고 화면이 이 문구로 바꾼다. */
export const ko = {
  errors: {
    unavailable: "지금은 이 방법으로 로그인할 수 없어요.",
    cancelled: "로그인을 취소했어요.",
    state: "로그인 시간이 지났거나 다른 창에서 시작한 로그인이에요. 다시 눌러 주세요.",
    provider: "로그인 서비스에서 정보를 받아 오지 못했어요. 잠시 후 다시 시도해 주세요.",
    "no-email": "이메일 제공에 동의해야 가입할 수 있어요. 다시 누르고 이메일에 동의해 주세요.",
    "email-taken":
      "이 이메일로 이미 가입한 계정이 있어요. 처음 가입한 방법(이메일과 비밀번호, 또는 구글·카카오·네이버)으로 로그인한 뒤 '내 정보'의 로그인 방법에서 이 계정을 연결하면 다음부터 이것으로도 로그인할 수 있어요.",
    "need-age": "처음 가입하시네요. 아래에서 만 14세 이상인지 확인한 뒤 다시 눌러 주세요.",
    "identity-taken":
      "이 계정은 이미 다른 SubSlash 계정에 연결돼 있어요. 그 계정으로 로그인해 연결을 끊은 뒤 다시 시도해 주세요.",
    "provider-linked":
      "이미 같은 회사의 다른 계정이 연결돼 있어요. 연결을 끊은 뒤 다시 연결해 주세요.",
    server: "로그인을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
  },
  providers: { google: "구글", kakao: "카카오", naver: "네이버" },
  /** 목적격 조사까지 붙인 이름. 구글만 받침이 있다. */
  providerObject: { google: "구글을", kakao: "카카오를", naver: "네이버를" },
  password: "이메일(또는 아이디)과 비밀번호",
  /** 로그인 방법 여럿을 잇는 말. */
  or: " 또는 ",
  /**
   * `email-taken`의 문구. 서버가 그 계정의 로그인 방법과 지금 누른 제공자를 넘기면 "구글로 로그인한 뒤
   * 카카오를 연결하세요"처럼 그 계정에 맞는 말을 한다.
   */
  emailTaken: (ways: string, providerObject: string, provider: string) =>
    `이 이메일은 이미 ${ways}로 가입돼 있어요. 그 방법으로 로그인한 뒤 '내 정보'의 로그인 방법에서 ${providerObject} 연결하면 다음부터 ${provider}로도 로그인할 수 있어요.`,
};

export const en: Widen<typeof ko> = {
  errors: {
    unavailable: "This login method isn't available right now.",
    cancelled: "Login was cancelled.",
    state: "The login expired or was started in another window. Please press it again.",
    provider: "Couldn't get your details from the login service. Please try again shortly.",
    "no-email":
      "You need to agree to share your email to sign up. Press it again and allow your email.",
    "email-taken":
      "An account already uses this email. Log in the way you first signed up (email and password, or Google, Kakao or NAVER), then link this account under ‘Login methods’ in ‘My account’ to use it next time.",
    "need-age":
      "Looks like you're new. Confirm below that you're 14 or older, then press it again.",
    "identity-taken":
      "This account is already linked to another SubSlash account. Log in to that account and unlink it, then try again.",
    "provider-linked":
      "Another account from the same provider is already linked. Unlink it, then link again.",
    server: "Couldn't log you in. Please try again shortly.",
  },
  providers: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  providerObject: { google: "Google", kakao: "Kakao", naver: "NAVER" },
  password: "email (or username) and password",
  or: " or ",
  emailTaken: (ways, providerObject, provider) =>
    `This email is already registered with ${ways}. Log in that way, then link ${providerObject} under ‘Login methods’ in ‘My account’ to log in with ${provider} next time.`,
};
