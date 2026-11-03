import type { FieldErrors } from "@subslash/shared";
import { fieldErrorsOf, textOf, type ResponseBody } from "./api-body";

/**
 * 회원가입 폼(SignupForm)이 서버에 보내는 본문과 받은 응답의 해석. 화면 코드와 나눠 두어 테스트한다.
 */

export interface SignupFormValues {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  isOver14: boolean;
}

/**
 * 값은 JSON 본문으로 보낸다. 주소창(쿼리스트링)에 실으면 브라우저 기록과 서버 접근 로그에 비밀번호가
 * 그대로 남는다.
 */
export function signupRequestBody(values: SignupFormValues): string {
  return JSON.stringify({
    username: values.username,
    email: values.email,
    password: values.password,
    passwordConfirm: values.passwordConfirm,
    isOver14: values.isOver14,
  });
}

export interface VerificationNotice {
  email: string;
  /** 확인 메일이 실제로 나갔는지. 못 보냈으면 안내를 오류 색으로 보인다. */
  sent: boolean;
  message: string;
}

export type SignupOutcome =
  | {
      ok: false;
      fieldErrors: FieldErrors;
      formError: string;
      /** 확인 전인 계정이 쥐고 있어 가입이 막힌 주소. 아니면 null. */
      pendingEmail: string | null;
    }
  | { ok: true; notice: VerificationNotice };

/** 안에 든 객체 칸. 객체가 아니면 빈 본문. */
function objectOf(body: ResponseBody, key: string): ResponseBody {
  const value = body[key];
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as ResponseBody)
    : {};
}

/**
 * 가입 응답을 화면이 쓸 모양으로 바꾼다. 본문을 읽지 못했으면(빈 객체) 모른다고 말한다 — 확인 메일을
 * 보냈다고 단정하지 않는다. 칸은 모양을 확인해 꺼낸다(문자열이 아닌 문구를 화면에 넘기지 않는다).
 */
export function readSignupResponse(
  ok: boolean,
  data: ResponseBody,
  /** 사용자가 적은 주소를 정규화한 값. 응답에 주소가 없으면 이것을 쓴다. */
  normalizedEmail: string,
  /** 응답에 문구가 없을 때 쓰는 화면 언어의 문구. */
  fallback: { failed: string; unknownMail: string },
): SignupOutcome {
  if (!ok) {
    return {
      ok: false,
      fieldErrors: (fieldErrorsOf(data) ?? {}) as FieldErrors,
      formError: textOf(data, "error") ?? fallback.failed,
      pendingEmail: data.emailPending === true ? normalizedEmail : null,
    };
  }
  const verification = objectOf(data, "emailVerification");
  return {
    ok: true,
    notice: {
      email: textOf(objectOf(data, "account"), "email") ?? normalizedEmail,
      sent: verification.status === "sent",
      message: textOf(verification, "message") ?? fallback.unknownMail,
    },
  };
}
