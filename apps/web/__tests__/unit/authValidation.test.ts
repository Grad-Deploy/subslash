import { describe, it, expect } from "vitest";
import {
  validateSignup,
  validateLogin,
  validateUsername,
  validateEmail,
  validateSignupEmail,
  SIGNUP_EMAIL_DOMAINS,
  validatePassword,
  validateAge,
  validateGender,
  validateProfile,
  normalizeUsername,
  normalizeEmailAddress,
  getEmailDomain,
  isGender,
  MIN_AGE,
  MAX_AGE,
  PASSWORD_MIN,
} from "@subslash/shared";

const VALID = {
  username: "sean_lee",
  email: "sean@gmail.com",
  password: "hunter2-hunter2",
  passwordConfirm: "hunter2-hunter2",
  isOver14: true,
};

describe("validateSignup", () => {
  it("올바른 입력은 정규화된 값을 돌려준다", () => {
    const { errors, value } = validateSignup(VALID);
    expect(errors).toEqual({});
    expect(value).toEqual({
      username: "sean_lee",
      email: "sean@gmail.com",
      password: "hunter2-hunter2",
    });
  });

  it("나이·성별은 가입 값에 들어가지 않는다", () => {
    // 가입 단계의 칸을 줄이려고 '내 정보'로 옮겼다. 보내도 저장 값에 섞이지 않는다.
    const { value } = validateSignup({ ...VALID, age: 30, gender: "male" } as never);
    expect(value).not.toHaveProperty("age");
    expect(value).not.toHaveProperty("gender");
  });

  it(`만 ${MIN_AGE}세 이상 확인은 체크한 값(true)만 인정한다`, () => {
    for (const isOver14 of [false, "true", 1, undefined]) {
      const { errors, value } = validateSignup({ ...VALID, isOver14 } as never);
      expect(value).toBeNull();
      expect(errors.isOver14).toBe(`만 ${MIN_AGE}세 이상인지 확인해주세요.`);
    }
  });

  it("아이디·이메일은 대소문자와 공백을 정리해 저장한다", () => {
    const { value } = validateSignup({
      ...VALID,
      username: "  SEAN_LEE  ",
      email: "  Sean@Gmail.COM ",
    });
    expect(value?.username).toBe("sean_lee");
    expect(value?.email).toBe("sean@gmail.com");
  });

  it("자주 쓰는 메일 서비스가 아닌 이메일로는 가입 값을 돌려주지 않는다", () => {
    const { errors, value } = validateSignup({ ...VALID, email: "sean@exampl.com" });
    expect(value).toBeNull();
    expect(errors.email).toContain("가입할 수 없는 이메일");
  });

  it("비밀번호가 서로 다르면 확인 필드에 오류를 준다", () => {
    const { errors, value } = validateSignup({ ...VALID, passwordConfirm: "different-1234" });
    expect(value).toBeNull();
    expect(errors.passwordConfirm).toBe("비밀번호가 서로 다릅니다.");
  });

  it(`비밀번호가 ${PASSWORD_MIN}자보다 짧으면 두 칸이 같아도 가입 값을 돌려주지 않는다`, () => {
    const { errors, value } = validateSignup({
      ...VALID,
      password: "short-pw",
      passwordConfirm: "short-pw",
    });
    expect(value).toBeNull();
    expect(errors.password).toBe(`비밀번호를 2자 더 입력해주세요. (${PASSWORD_MIN}자 이상)`);
  });

  it("모든 필드가 비면 필드마다 오류를 준다", () => {
    const { errors, value } = validateSignup({});
    expect(value).toBeNull();
    expect(Object.keys(errors).sort()).toEqual([
      "email",
      "isOver14",
      "password",
      "passwordConfirm",
      "username",
    ]);
  });
});

describe("validateProfile", () => {
  it("둘 다 선택 항목이라 비워 두면 null로 통과한다", () => {
    expect(validateProfile({}).value).toEqual({ age: null, gender: null });
    expect(validateProfile({ age: "", gender: "" }).value).toEqual({ age: null, gender: null });
    expect(validateProfile({ age: null, gender: null }).value).toEqual({ age: null, gender: null });
  });

  it("나이를 문자열로 보내도 숫자로 저장한다", () => {
    expect(validateProfile({ age: "42" }).value?.age).toBe(42);
  });

  it("적은 나이는 범위를 검사한다", () => {
    expect(validateProfile({ age: MIN_AGE - 1 }).errors.age).toBeDefined();
    expect(validateProfile({ age: 30.5 }).errors.age).toBeDefined();
    expect(validateProfile({ age: "서른" }).value).toBeNull();
  });

  it("'밝히지 않음'을 고른 것과 비워 둔 것을 구분한다", () => {
    expect(validateProfile({ gender: "undisclosed" }).value?.gender).toBe("undisclosed");
    expect(validateProfile({ gender: "" }).value?.gender).toBeNull();
  });

  it("성별을 임의의 문자열로 밀어 넣을 수 없다", () => {
    const { errors, value } = validateProfile({ gender: "'; DROP TABLE accounts; --" });
    expect(value).toBeNull();
    expect(errors.gender).toBeDefined();
    expect(validateProfile({ gender: 3 as never }).value).toBeNull();
  });
});

describe("validateUsername", () => {
  it.each([
    ["ab", "너무 짧음"],
    ["a".repeat(21), "너무 김"],
    ["Sean Lee", "공백"],
    ["sean-lee", "허용하지 않는 기호"],
    ["세안", "한글"],
    ["' OR 1=1 --", "SQL처럼 보이는 문자열"],
  ])("%s 은(는) 거부한다 (%s)", (value) => {
    expect(validateUsername(normalizeUsername(value))).toBeDefined();
  });

  it("영문 소문자·숫자·밑줄만 통과시킨다", () => {
    expect(validateUsername("sean_lee_2")).toBeUndefined();
  });
});

describe("validateEmail", () => {
  it.each(["", "sean", "sean@", "@example.com", "sean@example", "se an@example.com"])(
    "%s 은(는) 거부한다",
    (value) => {
      expect(validateEmail(normalizeEmailAddress(value))).toBeDefined();
    },
  );

  it.each([
    ["sean@@example.com", "@가 두 개"],
    ["sean@example.c", "한 글자 최상위 도메인"],
    ["sean@example.123", "숫자뿐인 최상위 도메인"],
    ["sean@example..com", "빈 칸이 낀 도메인"],
    ["sean@-example.com", "하이픈으로 시작"],
    ["sean@example-.com", "하이픈으로 끝남"],
    ["sean@exa_mple.com", "도메인에 밑줄"],
    ["sean@exam ple.com", "도메인에 공백"],
  ])("도메인 모양이 틀린 %s 은(는) 거부한다 (%s)", (value) => {
    expect(validateEmail(value)).toBeDefined();
  });

  it("평범한 주소는 통과시킨다", () => {
    expect(validateEmail("sean.lee+tag@mail.example.co.kr")).toBeUndefined();
    expect(validateEmail("sean@my-company.io")).toBeUndefined();
  });

  it("한글 도메인은 퓨니코드 형태로 받는다", () => {
    expect(validateEmail("sean@xn--3e0b707e.kr")).toBeUndefined();
  });
});

describe("validateSignupEmail", () => {
  it.each(SIGNUP_EMAIL_DOMAINS)("%s 은(는) 받는다", (domain) => {
    expect(validateSignupEmail(`sean@${domain}`)).toBeUndefined();
  });

  it.each(["sean@exampl.com", "sean@example.com", "sean@my-company.io"])(
    "%s 은(는) 받지 않되, 없는 도메인이라고 하지 않는다",
    (email) => {
      // exampl.com은 실제로 있는 도메인이다. "존재하지 않는다"고 하면 사실이 아니다.
      const message = validateSignupEmail(email);
      expect(message).toContain("가입할 수 없는 이메일");
      expect(message).not.toContain("존재하지 않");
    },
  );

  it.each([
    ["sean@gmial.com", "gmail.com"],
    ["sean@naver.co", "naver.com"],
    ["sean@hanmial.net", "hanmail.net"],
  ])("한두 글자 틀린 %s 은(는) %s 을(를) 짚어 준다", (email, suggestion) => {
    expect(validateSignupEmail(email)).toContain(`혹시 ${suggestion} 아닌가요?`);
  });

  it("짧은 도메인은 한 글자 차이까지만 오타로 본다", () => {
    // gmx.com은 me.com과 두 글자 다르지만 다른 서비스다.
    expect(validateSignupEmail("sean@gmx.com")).not.toContain("me.com");
  });

  it("형식부터 틀리면 형식 오류가 먼저다", () => {
    expect(validateSignupEmail("sean@gmail")).toContain("잘못된 이메일 형식");
  });
});

describe("getEmailDomain", () => {
  it("@ 뒤의 도메인을 소문자로 돌려준다", () => {
    expect(getEmailDomain("sean@Mail.Example.co.kr")).toBe("mail.example.co.kr");
  });
});

describe("validatePassword", () => {
  it(`${PASSWORD_MIN}자 미만은 거부하고, 몇 자가 더 필요한지 알려준다`, () => {
    expect(validatePassword("ab1")).toBe(
      `비밀번호를 ${PASSWORD_MIN - 3}자 더 입력해주세요. (${PASSWORD_MIN}자 이상)`,
    );
    expect(validatePassword("abcdefgh1")).toContain("1자 더");
    expect(validatePassword("abcdefgh12")).toBeUndefined();
  });

  it("같은 문자만 반복한 비밀번호는 거부한다", () => {
    expect(validatePassword("aaaaaaaaaaaa")).toBeDefined();
  });

  it("지나치게 긴 비밀번호는 거부한다 (해시 부하 공격 방지)", () => {
    expect(validatePassword("a".repeat(129))).toBeDefined();
  });

  it("길이를 채운 평범한 비밀번호는 통과시킨다", () => {
    expect(validatePassword("subslash-2026!")).toBeUndefined();
  });
});

describe("validateAge", () => {
  it(`만 ${MIN_AGE}세 미만은 거부한다`, () => {
    expect(validateAge(MIN_AGE - 1)).toBeDefined();
    expect(validateAge(MIN_AGE)).toBeUndefined();
  });

  it(`${MAX_AGE}세를 넘으면 거부한다`, () => {
    expect(validateAge(MAX_AGE + 1)).toBeDefined();
  });

  it("숫자가 아니거나 소수면 거부한다", () => {
    expect(validateAge("서른")).toBeDefined();
    expect(validateAge(30.5)).toBeDefined();
    expect(validateAge("")).toBeDefined();
  });
});

describe("validateGender", () => {
  it("정해진 값만 통과시킨다", () => {
    expect(validateGender("female")).toBeUndefined();
    expect(validateGender("undisclosed")).toBeUndefined();
    expect(validateGender("남")).toBeDefined();
    expect(validateGender("")).toBeDefined();
  });

  it("isGender는 목록 밖의 값을 걸러낸다", () => {
    expect(isGender("male")).toBe(true);
    expect(isGender("robot")).toBe(false);
  });
});

describe("validateLogin", () => {
  it("아이디와 비밀번호가 있으면 통과한다", () => {
    const { value } = validateLogin({ identifier: "  SEAN_LEE ", password: "whatever" });
    expect(value).toEqual({ identifier: "sean_lee", password: "whatever" });
  });

  it("로그인에서는 비밀번호 형식 규칙을 다시 걸지 않는다", () => {
    // 규칙이 바뀌기 전에 가입한 계정이 자기 비밀번호로 못 들어오면 안 된다.
    expect(validateLogin({ identifier: "sean", password: "old" }).value).not.toBeNull();
  });

  it("빈 값은 거부한다", () => {
    const { errors, value } = validateLogin({});
    expect(value).toBeNull();
    expect(errors.identifier).toBeDefined();
    expect(errors.password).toBeDefined();
  });
});
