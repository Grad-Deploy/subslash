import {
  normalizeUsername,
  validateEmail,
  validatePassword,
  validateUsername,
} from "@subslash/shared";

/**
 * 가입 폼 칸마다 보여줄 상태.
 *
 * 문구는 서버와 같은 검증 함수에서 온다. 그래서 여기서 초록이면 서버의 형식
 * 검사도 통과한다. 다만 아이디·이메일이 이미 쓰이는지는 가입 요청만 알 수
 * 있으므로, 초록 문구가 그것까지 약속하지는 않는다.
 *
 * `neutral`은 맞다 틀리다를 말할 수 없는 상태(확인 중, 조회 실패)다 — 조회가
 * 실패한 것을 빨간색으로 칠하면 도메인이 틀렸다고 말하는 셈이 된다.
 *
 * 폼은 한 번이라도 손댄 칸(입력했거나 거쳐 간 칸)에만 이 함수들을 쓴다. 처음
 * 연 폼이 온통 빨가면 아직 틀린 게 없는데 틀렸다고 말하는 셈이다. 손댄 칸이
 * 비어 있으면 "입력해주세요"가 나온다 — 다 지우고 넘어간 칸을 제출할 때까지
 * 모르게 두지 않는다.
 */
export type LiveStatus = {
  tone: "ok" | "error" | "neutral";
  message: string;
  pending?: boolean;
} | null;

export type EmailCheck = { email: string; status: LiveStatus } | null;

function errorOr(issue: string | undefined, okMessage: string): LiveStatus {
  return issue ? { tone: "error", message: issue } : { tone: "ok", message: okMessage };
}

export function usernameStatusOf(username: string): LiveStatus {
  // 서버처럼 소문자로 바꾼 뒤 검사한다. 대문자로 적어도 가입은 된다.
  return errorOr(
    validateUsername(normalizeUsername(username)),
    "쓸 수 있는 형식입니다. 이미 쓰는 아이디인지는 가입할 때 확인합니다.",
  );
}

export function passwordStatusOf(password: string): LiveStatus {
  return errorOr(validatePassword(password), "사용할 수 있는 비밀번호입니다.");
}

export function confirmStatusOf(password: string, confirm: string): LiveStatus {
  if (!confirm) return { tone: "error", message: "비밀번호를 한 번 더 입력해주세요." };
  return password === confirm
    ? { tone: "ok", message: "비밀번호가 일치합니다." }
    : { tone: "error", message: "비밀번호가 일치하지 않습니다." };
}

/** 형식만 본 이메일 상태. 형식이 맞으면 null이다 — 그다음은 도메인 확인이 답한다. */
export function emailFormatStatus(email: string): LiveStatus {
  const issue = validateEmail(email);
  return issue ? { tone: "error", message: issue } : null;
}

/**
 * 이메일 칸의 상태. 형식·도메인 결과(`check`)는 입력이 멈춘 뒤에 오므로, 지금
 * 칸에 있는 주소에 대한 결과일 때만 쓴다. 고치는 순간 예전 결과는 사라진다.
 */
export function emailStatusOf(email: string, check: EmailCheck): LiveStatus {
  if (!email) return emailFormatStatus(email);
  return check?.email === email ? check.status : null;
}

/** 제출 때 받은 오류(이미 쓰는 아이디 등)가 있으면 입력 중 상태보다 먼저 보인다. */
export function shownStatus(submitError: string | undefined, live: LiveStatus): LiveStatus {
  return submitError ? { tone: "error", message: submitError } : live;
}
