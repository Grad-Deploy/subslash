import { describe, expect, it } from "vitest";
import {
  PASSWORD_MAX,
  validateLogin,
  validatePassword,
  validateSignup,
  validateSignupEmail,
  validateUsername,
} from "@subslash/shared";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { translateKnownText } from "@lib/i18n/known-text";
import { parseBackup } from "@lib/backup";
import {
  confirmStatusOf,
  emailStatusFor,
  passwordStatusOf,
  usernameStatusOf,
} from "@lib/signup-status";
import { describeSendOutcome } from "@lib/account-verification";
import { describeResetOutcome } from "@lib/password-reset";
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
  // 비밀번호 재설정 메일(app/api/auth/password-reset)
  describeResetOutcome({ status: "sent" }, "sean@example.com"),
  describeResetOutcome({ status: "rate_limited", retryAfterSeconds: 600 }, "a@b.co"),
  describeResetOutcome({ status: "not_sent", reason: "not_configured" }, "a@b.co"),
  describeResetOutcome({ status: "not_sent", reason: "failed" }, "a@b.co"),
  "이 이메일로 가입한 계정이 없습니다.",
  // 내 정보·비밀번호 변경·탈퇴·로그인 방법(app/api/auth/profile·password·account·oauth/link)
  "로그인이 필요합니다.",
  "내 정보를 저장하지 못했습니다.",
  "지금 비밀번호를 입력해주세요.",
  "지금 비밀번호가 맞지 않습니다.",
  "지금 비밀번호와 다른 비밀번호를 정해주세요.",
  "다른 곳에서 비밀번호가 먼저 바뀌었습니다. 새 비밀번호로 다시 로그인해주세요.",
  "비밀번호를 바꾸지 못했습니다. 잠시 후 다시 시도해주세요.",
  "비밀번호가 맞지 않습니다.",
  "탈퇴를 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
  "연결을 시작하지 못했습니다.",
  "연결을 끊지 못했습니다.",
  "로그인할 방법이 하나뿐이라 끊을 수 없어요. 비밀번호를 만들거나 다른 계정을 먼저 연결해 주세요.",
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
    // 서버는 '탈퇴'와 'DELETE'를 모두 받는다. 영어 화면에는 영어 확인 글자를 안내한다.
    expect(en("확인을 위해 '탈퇴'를 입력해주세요.")).toBe("Type 'DELETE' to confirm.");
    expect(en(tooManyRequestsMessage(600))).toBe("Too many requests. Try again in 10 minutes.");
    expect(en("잘못된 이메일 주소입니다. 혹시 you@gmail.com 아닌가요?")).toBe(
      "That email address looks wrong. Did you mean you@gmail.com?",
    );
  });

  it("Gmail·캘린더·사용 측정·통계·물어보기·계정 저장의 오류 문장도 바뀐다", () => {
    // 이 화면들은 응답의 오류 문장(e.message)을 그대로 보여, 영어 화면에도 한국어가 나왔다.
    const messages = [
      "아직 시작하지 않은 기능입니다.",
      "연결 상태를 읽지 못했습니다.",
      "연결 토큰을 만들지 못했습니다.",
      "Gmail 연결을 시작하지 못했습니다.",
      "원클릭 연결이 설정되지 않았습니다. 스크립트를 직접 설치해 주세요.",
      "찾아 둔 구독을 읽지 못했습니다.",
      "찾아 둔 구독을 지우지 못했습니다.",
      "이 서버에는 구글 캘린더 등록이 설정되어 있지 않습니다. 알림 설정의 캘린더 구독을 쓰세요.",
      "보낸 구독 목록을 읽지 못했습니다.",
      "캘린더에 올릴 구독이 없습니다.",
      "캘린더 등록을 시작하지 못했습니다.",
      "사용 정보 접근 설정을 열지 못했습니다.",
      "사용 기록을 올리지 못했습니다.",
      "사용 기록을 읽지 못했습니다.",
      "사용 기록을 저장하지 못했습니다.",
      "사용 기록을 지우지 못했습니다.",
      "로그인해야 통계에 참여할 수 있습니다.",
      "통계에 보내지 못했습니다.",
      "통계를 읽지 못했습니다.",
      "지금은 답할 수 없어요.",
      "지금은 답할 수 없어요. 잠시 뒤에 다시 물어봐 주세요.",
      "질문은 200자까지 적을 수 있어요.",
      "질문이 많아 잠시 쉬어 갈게요. 조금 뒤에 다시 물어봐 주세요.",
      "계정에 저장된 기록이 없습니다.",
      "기록이 너무 커서 계정에 저장할 수 없습니다. 백업 파일로 저장해 주세요.",
      "계정에 저장하지 못했습니다.",
      "이 서버에는 데이터베이스가 설정되어 있지 않아 알림·계정 기능을 사용할 수 없습니다. 구독 목록은 브라우저에 그대로 남아 있습니다.",
    ];
    for (const message of messages) expect(en(message), message).not.toMatch(HANGUL);
  });

  it("백업 파일을 읽지 못한 이유도 바뀐다", () => {
    const backup = (data: unknown, version = 1) =>
      JSON.stringify({ app: "subslash", version, data });
    const sub = { id: "a", name: "넷플릭스", amount: 1, currency: "KRW", status: "active" };
    const inputs = [
      "not json",
      JSON.stringify({ app: "other" }),
      backup({}),
      backup({ subscriptions: [], usageLogs: [], accounts: [] }, 999),
      backup({ subscriptions: [{ id: "a" }], usageLogs: [], accounts: [] }),
      backup({ subscriptions: [], usageLogs: [{ id: "x" }], accounts: [] }),
      backup({ subscriptions: [sub, sub], usageLogs: [], accounts: [] }),
      backup({ subscriptions: [], usageLogs: [], accounts: [], exchangeRate: "x" }),
    ];
    for (const input of inputs) {
      const result = parseBackup(input);
      expect(result.ok, input).toBe(false);
      if (!result.ok) expect(en(result.error), result.error).not.toMatch(HANGUL);
    }
  });

  it("백업 검사가 알리는 칸 이름은 모두 영어가 있다", () => {
    const source = readFileSync(resolve(__dirname, "../../lib/backup.ts"), "utf8");
    const fields = [...source.matchAll(/return "([^"]+)";/g)].map((m) => m[1]);
    expect(fields.length).toBeGreaterThan(20);
    for (const field of fields) {
      expect(en(`구독 1번째 항목의 '${field}' 칸이 올바르지 않습니다.`), field).not.toMatch(HANGUL);
    }
  });

  it("한국어 화면은 그대로이고, 표에 없는 문장은 지어내지 않고 원문을 보인다", () => {
    expect(translateKnownText("아이디를 입력해주세요.", "ko")).toBe("아이디를 입력해주세요.");
    expect(en("처음 보는 문장입니다.")).toBe("처음 보는 문장입니다.");
  });
});
