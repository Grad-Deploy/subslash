import { describe, expect, it } from "vitest";
import {
  PASSWORD_MAX,
  validateLogin,
  validatePassword,
  validateSignup,
  validateSignupEmail,
  validateUsername,
} from "@subslash/shared";
import { translateKnownText } from "@lib/i18n/known-text";
import {
  confirmStatusOf,
  emailStatusFor,
  passwordStatusOf,
  usernameStatusOf,
} from "@lib/signup-status";
import { describeSendOutcome } from "@lib/account-verification";
import { tooManyRequestsMessage } from "@lib/rate-limit";

const HANGUL = /[가-힣]/;
const en = (text: string) => translateKnownText(text, "en");

/** 검사 함수가 돌려줄 수 있는 문장들. 갈래마다 하나씩 부른다. */
function validatorMessages(): string[] {
  const out: (string | undefined)[] = [
    validateUsername(""),
    validateUsername("ab"),
    validateUsername("Bad-Name"),
    validateSignupEmail(""),
    validateSignupEmail(`${"a".repeat(250)}@gmail.com`),
    validateSignupEmail("no-at-sign"),
    validateSignupEmail("you@nodot"),
    validateSignupEmail("you@gmial.com"),
    validateSignupEmail("you@unknown-mail-provider.zz"),
    validatePassword(""),
    validatePassword("abc"),
    validatePassword("a".repeat(PASSWORD_MAX + 1)),
    validatePassword("aaaaaaaaaa"),
  ];
  const signup = validateSignup({
    username: "",
    email: "",
    password: "secret-pass-1",
    passwordConfirm: "different-pass",
    isOver14: false,
    age: "5",
    gender: "nope",
  }).errors;
  out.push(...Object.values(signup));
  out.push(
    ...Object.values(
      validateSignup({
        username: "sean",
        email: "sean@gmail.com",
        password: "secret-pass-1",
        passwordConfirm: "",
        isOver14: true,
        age: "abc",
        gender: "",
      }).errors,
    ),
  );
  out.push(...Object.values(validateLogin({ identifier: "", password: "" }).errors));
  out.push(
    ...Object.values(
      validateLogin({ identifier: "sean", password: "a".repeat(PASSWORD_MAX + 1) }).errors,
    ),
  );
  return out.filter((m): m is string => typeof m === "string" && m.length > 0);
}

/** 서버가 로그인·가입 응답에 싣는 문장들(app/api/auth/login·signup). */
const SERVER_MESSAGES = [
  "요청을 이해할 수 없습니다.",
  "입력값을 확인해주세요.",
  "아이디 또는 비밀번호가 올바르지 않습니다.",
  "로그인을 처리하지 못했습니다.",
  "이미 사용 중인 정보가 있습니다.",
  "이미 사용 중인 아이디입니다.",
  "확인을 기다리는 계정이 있는 이메일입니다.",
  "이미 가입된 이메일입니다.",
  "가입을 처리하지 못했습니다.",
  tooManyRequestsMessage(30),
  tooManyRequestsMessage(600),
  describeSendOutcome({ status: "sent" }, "sean@example.com"),
  describeSendOutcome({ status: "rate_limited", retryAfterSeconds: 30 }, "a@b.co"),
  describeSendOutcome({ status: "rate_limited", retryAfterSeconds: 600 }, "a@b.co"),
  describeSendOutcome({ status: "rate_limited", retryAfterSeconds: 7200 }, "a@b.co"),
  describeSendOutcome({ status: "not_sent", reason: "not_configured" }, "a@b.co"),
  describeSendOutcome({ status: "not_sent", reason: "failed" }, "a@b.co"),
];

describe("translateKnownText", () => {
  it("검사 함수가 돌려주는 문장은 모두 영어로 바뀐다", () => {
    const messages = validatorMessages();
    expect(messages.length).toBeGreaterThan(15);
    for (const message of messages) expect(en(message), message).not.toMatch(HANGUL);
  });

  it("입력 중 상태 문구도 바뀐다", () => {
    const statuses = [
      usernameStatusOf("sean_1"),
      passwordStatusOf("secret-pass-1"),
      confirmStatusOf("a", ""),
      confirmStatusOf("a", "a"),
      confirmStatusOf("a", "b"),
      emailStatusFor("sean@gmail.com"),
    ];
    for (const status of statuses) {
      expect(status).not.toBeNull();
      expect(en(status!.message), status!.message).not.toMatch(HANGUL);
    }
  });

  it("서버의 로그인·가입 응답 문장도 바뀐다", () => {
    for (const message of SERVER_MESSAGES) expect(en(message), message).not.toMatch(HANGUL);
  });

  it("문장 속 값은 그대로 옮긴다", () => {
    expect(en(describeSendOutcome({ status: "sent" }, "sean@example.com"))).toContain(
      "sean@example.com",
    );
    expect(en(tooManyRequestsMessage(600))).toBe("Too many requests. Try again in 10 minutes.");
    expect(en("잘못된 이메일 주소입니다. 혹시 you@gmail.com 아닌가요?")).toBe(
      "That email address looks wrong. Did you mean you@gmail.com?",
    );
  });

  it("한국어 화면은 그대로이고, 표에 없는 문장은 지어내지 않고 원문을 보인다", () => {
    expect(translateKnownText("아이디를 입력해주세요.", "ko")).toBe("아이디를 입력해주세요.");
    expect(en("처음 보는 문장입니다.")).toBe("처음 보는 문장입니다.");
  });
});
