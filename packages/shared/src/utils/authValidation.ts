/**
 * 회원가입·로그인 입력값 검증.
 *
 * 같은 규칙을 화면과 서버가 함께 쓴다. 화면 쪽 검사는 사용자에게 빨리
 * 알려주기 위한 것일 뿐이고, 판단은 언제나 서버가 다시 한다 — 폼을 거치지
 * 않고 API를 직접 부르는 요청이 있기 때문이다.
 */

export type Gender = "male" | "female" | "other" | "undisclosed";

export const GENDER_OPTIONS: ReadonlyArray<{ value: Gender; label: string }> = [
  { value: "female", label: "여성" },
  { value: "male", label: "남성" },
  { value: "other", label: "기타" },
  { value: "undisclosed", label: "밝히지 않음" },
] as const;

export function isGender(value: unknown): value is Gender {
  return GENDER_OPTIONS.some((option) => option.value === value);
}

/** 만 14세 미만은 법정대리인 동의가 필요해 지금은 가입을 받지 않는다. */
export const MIN_AGE = 14;
export const MAX_AGE = 120;

export const USERNAME_MIN = 4;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

/** 아이디는 URL·로그·파일명에 그대로 실릴 수 있어 문자 종류를 좁게 잡는다. */
const USERNAME_PATTERN = /^[a-z0-9_]+$/;

/**
 * 이메일 형식 검사.
 *
 * RFC를 온전히 따르는 정규식은 실무에서 오탐이 더 많다. @ 앞부분은 명백히
 * 틀린 것만 거르고, 도메인은 실제 DNS 이름이 될 수 있는 모양인지까지 본다 —
 * 예전에는 `a@b.c`나 `a@exa_mple.123`도 통과했다.
 *
 * 가입에서는 여기에 더해 자주 쓰는 메일 서비스인지 본다(`validateSignupEmail`).
 * 주소가 그 사람 것인지는 확인 메일만이 답할 수 있다.
 */
const EMAIL_LOCAL_PATTERN = /^[^\s@]{1,64}$/;
/** 영문·숫자·하이픈, 하이픈으로 시작하거나 끝나지 않고 63자 이하 (RFC 1035). */
const DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
/** 숫자로만 된 최상위 도메인은 없다. 한글 도메인은 퓨니코드(xn--) 형태로 받는다. */
const TLD_PATTERN = /^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/;

export interface SignupInput {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  /**
   * "만 14세 이상입니다" 확인. 나이 자체는 가입 때 묻지 않는다 — 가입 단계의
   * 칸이 늘수록 가입을 포기하는 사람이 늘어서, 나이·성별은 가입 뒤 '내 정보'에서
   * 원할 때만 적는다. 다만 만 14세 미만의 개인정보는 법정대리인 동의 없이 받을
   * 수 없으므로 이 확인만은 필수로 남긴다.
   */
  isOver14: boolean;
}

/** 필드명 → 사용자에게 보여줄 오류 메시지. 통과하면 빈 객체다. */
export type FieldErrors = Partial<Record<keyof SignupInput, string>>;

export interface NormalizedSignup {
  username: string;
  email: string;
  password: string;
}

/** 아이디·이메일은 대소문자 차이로 같은 사람이 두 계정을 만들지 않도록 낮춘다. */
export function normalizeUsername(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeEmailAddress(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/** `@` 뒤의 도메인. `validateEmail`을 통과한 주소에 쓴다. */
export function getEmailDomain(email: string): string {
  return email.slice(email.lastIndexOf("@") + 1).toLowerCase();
}

export function validateUsername(value: string): string | undefined {
  if (!value) return "아이디를 입력해주세요.";
  if (value.length < USERNAME_MIN || value.length > USERNAME_MAX) {
    return `아이디는 ${USERNAME_MIN}~${USERNAME_MAX}자로 입력해주세요.`;
  }
  if (!USERNAME_PATTERN.test(value)) {
    return "아이디는 영문 소문자, 숫자, 밑줄(_)만 쓸 수 있습니다.";
  }
  return undefined;
}

export function validateEmail(value: string): string | undefined {
  if (!value) return "이메일을 입력해주세요.";
  if (value.length > 254) return "이메일이 너무 깁니다.";
  const parts = value.split("@");
  if (parts.length !== 2 || !EMAIL_LOCAL_PATTERN.test(parts[0])) {
    return "잘못된 이메일 형식입니다. (예: you@example.com)";
  }
  const labels = parts[1].toLowerCase().split(".");
  const domainOk =
    labels.length >= 2 &&
    labels.every((label) => DOMAIN_LABEL_PATTERN.test(label)) &&
    TLD_PATTERN.test(labels[labels.length - 1]);
  if (!domainOk) {
    return "잘못된 이메일 형식입니다. @ 뒤의 도메인을 확인해주세요. (예: gmail.com, naver.com)";
  }
  return undefined;
}

/**
 * 가입에 쓸 수 있는 이메일 도메인 — 사람들이 많이 쓰는 메일 서비스.
 *
 * 예전에는 형식을 본 뒤 DNS로 "메일을 받을 수 있는 도메인"인지만 확인했다.
 * 그러면 `exampl.com`처럼 오타인데 우연히 실제로 있는 도메인이 그대로
 * 통과했다. 이제 이 목록에 있는 곳만 받는다. 대신 회사·학교 메일로는 가입할
 * 수 없으므로, 받아야 할 곳이 생기면 이 목록에 더한다.
 */
export const SIGNUP_EMAIL_DOMAINS: readonly string[] = [
  "naver.com",
  "gmail.com",
  "daum.net",
  "hanmail.net",
  "kakao.com",
  "nate.com",
  "icloud.com",
  "me.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "yahoo.com",
];

/**
 * 가입용 이메일 검사: 형식, 그리고 자주 쓰는 메일 서비스인지.
 *
 * 목록에 없는 도메인을 "없는 도메인"이라고 부르지 않는다 — `exampl.com`은
 * 실제로 있다. 받지 않는다는 사실만 말한다. 목록의 도메인과 한두 글자만
 * 다르면 오타일 가능성이 높으니 그 도메인을 짚어 준다.
 */
export function validateSignupEmail(value: string): string | undefined {
  const formatError = validateEmail(value);
  if (formatError) return formatError;

  const domain = getEmailDomain(value);
  if (SIGNUP_EMAIL_DOMAINS.includes(domain)) return undefined;

  const suggestion = closestSignupDomain(domain);
  if (suggestion) return `잘못된 이메일 주소입니다. 혹시 ${suggestion} 아닌가요?`;
  return "가입할 수 없는 이메일입니다. naver.com, gmail.com, daum.net 등 자주 쓰는 메일 주소를 입력해주세요.";
}

/**
 * 오타로 보이는 도메인이면 맞는 도메인. `gmial.com` → `gmail.com`
 *
 * 짧은 도메인은 한 글자 차이까지만 본다. 두 글자까지 보면 `gmx.com` 같은 다른
 * 서비스를 `me.com`의 오타라고 짚게 된다.
 */
function closestSignupDomain(domain: string): string | undefined {
  let best: { domain: string; distance: number } | undefined;
  for (const candidate of SIGNUP_EMAIL_DOMAINS) {
    const limit = candidate.length <= 7 ? 1 : 2;
    const distance = editDistance(domain, candidate);
    if (distance <= limit && (!best || distance < best.distance)) {
      best = { domain: candidate, distance };
    }
  }
  return best?.domain;
}

/** 레벤슈타인 거리 — 글자를 넣고, 빼고, 바꾸는 최소 횟수. */
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

export function validatePassword(value: string): string | undefined {
  if (!value) return "비밀번호를 입력해주세요.";
  // 규칙만 말하면 몇 자를 더 써야 하는지 사용자가 세어야 한다. 남은 수를 알려준다.
  if (value.length < PASSWORD_MIN) {
    return `비밀번호를 ${PASSWORD_MIN - value.length}자 더 입력해주세요. (${PASSWORD_MIN}자 이상)`;
  }
  // 해시 함수에 무한정 긴 입력을 넘기면 그 자체로 부하 공격이 된다.
  if (value.length > PASSWORD_MAX) {
    return `비밀번호는 ${PASSWORD_MAX}자 이하여야 합니다.`;
  }
  // 종류를 강제하기보다 길이를 확보하는 편이 실제로 더 안전하지만,
  // 전부 같은 문자인 비밀번호는 길이만 채운 것이라 막는다.
  if (/^(.)\1*$/.test(value)) return "같은 문자만으로는 비밀번호를 만들 수 없습니다.";
  return undefined;
}

export function validateAge(value: number | string): string | undefined {
  if (value === "" || value === null || value === undefined) return "나이를 입력해주세요.";
  const age = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(age)) return "나이는 숫자로 입력해주세요.";
  if (age < MIN_AGE) return `만 ${MIN_AGE}세 이상만 이용할 수 있습니다.`;
  if (age > MAX_AGE) return "나이를 다시 확인해주세요.";
  return undefined;
}

export function validateGender(value: string): string | undefined {
  if (!value) return "성별을 선택해주세요.";
  if (!isGender(value)) return "성별을 다시 선택해주세요.";
  return undefined;
}

/**
 * 회원가입 입력 전체를 검사하고, 통과하면 저장에 쓸 정규화된 값을 함께 준다.
 *
 * 정규화까지 여기서 끝내는 이유는, 화면이 보낸 문자열을 그대로 저장하는
 * 경로를 만들지 않기 위해서다. 서버는 이 함수가 돌려준 값만 쓴다.
 */
export function validateSignup(input: Partial<SignupInput>): {
  errors: FieldErrors;
  value: NormalizedSignup | null;
} {
  const username = normalizeUsername(input.username);
  const email = normalizeEmailAddress(input.email);
  const password = typeof input.password === "string" ? input.password : "";
  const passwordConfirm = typeof input.passwordConfirm === "string" ? input.passwordConfirm : "";

  const errors: FieldErrors = {};
  const usernameError = validateUsername(username);
  if (usernameError) errors.username = usernameError;

  const emailError = validateSignupEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  if (!passwordConfirm) {
    errors.passwordConfirm = "비밀번호를 한 번 더 입력해주세요.";
  } else if (password !== passwordConfirm) {
    errors.passwordConfirm = "비밀번호가 서로 다릅니다.";
  }

  // 문자열 "true"나 1은 받지 않는다. 체크박스를 실제로 눌렀다는 값만 인정한다.
  if (input.isOver14 !== true) {
    errors.isOver14 = `만 ${MIN_AGE}세 이상인지 확인해주세요.`;
  }

  if (Object.keys(errors).length > 0) return { errors, value: null };

  return { errors, value: { username, email, password } };
}

export interface ProfileInput {
  age?: number | string | null;
  gender?: string | null;
}

export type ProfileErrors = Partial<Record<keyof ProfileInput, string>>;

export interface NormalizedProfile {
  /** 적지 않았으면 null. */
  age: number | null;
  /** 적지 않았으면 null. '밝히지 않음'을 고른 것과는 다른 상태다. */
  gender: Gender | null;
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

/**
 * '내 정보'의 나이·성별 검사. 둘 다 선택 항목이다.
 *
 * 비운 칸은 null로 저장한다. 0이나 '밝히지 않음'으로 채우면, 적지 않은 사람과
 * 그렇게 답한 사람이 구분되지 않는다 — 나중에 비교 통계를 낼 때 없는 응답을
 * 있는 것처럼 세게 된다.
 */
export function validateProfile(input: ProfileInput): {
  errors: ProfileErrors;
  value: NormalizedProfile | null;
} {
  const errors: ProfileErrors = {};

  let age: number | null = null;
  if (!isBlank(input.age)) {
    const ageError = validateAge(input.age as number | string);
    if (ageError) errors.age = ageError;
    else age = Number(input.age);
  }

  let gender: Gender | null = null;
  if (!isBlank(input.gender)) {
    const genderError =
      typeof input.gender === "string" ? validateGender(input.gender) : "성별을 다시 선택해주세요.";
    if (genderError) errors.gender = genderError;
    else gender = input.gender as Gender;
  }

  if (Object.keys(errors).length > 0) return { errors, value: null };
  return { errors, value: { age, gender } };
}

export interface LoginInput {
  /** 아이디 또는 이메일 어느 쪽으로도 로그인할 수 있다. */
  identifier: string;
  password: string;
}

export function validateLogin(input: Partial<LoginInput>): {
  errors: Partial<Record<keyof LoginInput, string>>;
  value: { identifier: string; password: string } | null;
} {
  const identifier = normalizeUsername(input.identifier);
  const password = typeof input.password === "string" ? input.password : "";

  const errors: Partial<Record<keyof LoginInput, string>> = {};
  if (!identifier) errors.identifier = "아이디 또는 이메일을 입력해주세요.";
  if (!password) errors.password = "비밀번호를 입력해주세요.";
  // 로그인에서는 형식 규칙을 다시 걸지 않는다. 규칙이 바뀌기 전에 가입한
  // 계정이 자기 비밀번호로도 못 들어오는 일을 막기 위해서다.
  if (password.length > PASSWORD_MAX) errors.password = "비밀번호가 너무 깁니다.";

  if (Object.keys(errors).length > 0) return { errors, value: null };
  return { errors, value: { identifier, password } };
}
