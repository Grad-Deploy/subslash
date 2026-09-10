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
 * RFC를 온전히 따르는 정규식은 실무에서 오탐이 더 많다. 여기서는 명백히
 * 틀린 것만 걸러내고, 주소가 실제로 살아있는지는 확인하지 않는다 — 그건
 * 확인 메일만이 답할 수 있다.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export interface SignupInput {
  username: string;
  email: string;
  password: string;
  passwordConfirm: string;
  age: number | string;
  gender: string;
}

/** 필드명 → 사용자에게 보여줄 오류 메시지. 통과하면 빈 객체다. */
export type FieldErrors = Partial<Record<keyof SignupInput, string>>;

export interface NormalizedSignup {
  username: string;
  email: string;
  password: string;
  age: number;
  gender: Gender;
}

/** 아이디·이메일은 대소문자 차이로 같은 사람이 두 계정을 만들지 않도록 낮춘다. */
export function normalizeUsername(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeEmailAddress(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
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
  if (!EMAIL_PATTERN.test(value)) return "이메일 형식을 확인해주세요.";
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) return "비밀번호를 입력해주세요.";
  if (value.length < PASSWORD_MIN) {
    return `비밀번호는 ${PASSWORD_MIN}자 이상이어야 합니다.`;
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
  if (age < MIN_AGE) return `만 ${MIN_AGE}세 미만은 가입할 수 없습니다.`;
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
  const genderRaw = typeof input.gender === "string" ? input.gender : "";
  const ageRaw = input.age ?? "";

  const errors: FieldErrors = {};
  const usernameError = validateUsername(username);
  if (usernameError) errors.username = usernameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  if (!passwordConfirm) {
    errors.passwordConfirm = "비밀번호를 한 번 더 입력해주세요.";
  } else if (password !== passwordConfirm) {
    errors.passwordConfirm = "비밀번호가 서로 다릅니다.";
  }

  const ageError = validateAge(ageRaw as number | string);
  if (ageError) errors.age = ageError;

  const genderError = validateGender(genderRaw);
  if (genderError) errors.gender = genderError;

  if (Object.keys(errors).length > 0) return { errors, value: null };

  return {
    errors,
    value: {
      username,
      email,
      password,
      age: typeof ageRaw === "number" ? ageRaw : Number(ageRaw),
      gender: genderRaw as Gender,
    },
  };
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
