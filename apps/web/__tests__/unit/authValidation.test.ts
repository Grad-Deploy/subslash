import { describe, it, expect } from "vitest";
import {
  validateSignup,
  validateLogin,
  validateUsername,
  validateEmail,
  validatePassword,
  validateAge,
  validateGender,
  normalizeUsername,
  normalizeEmailAddress,
  isGender,
  MIN_AGE,
  MAX_AGE,
  PASSWORD_MIN,
} from "@subslash/shared";

const VALID = {
  username: "sean_lee",
  email: "sean@example.com",
  password: "hunter2-hunter2",
  passwordConfirm: "hunter2-hunter2",
  age: 30,
  gender: "male",
};

describe("validateSignup", () => {
  it("올바른 입력은 정규화된 값을 돌려준다", () => {
    const { errors, value } = validateSignup(VALID);
    expect(errors).toEqual({});
    expect(value).toEqual({
      username: "sean_lee",
      email: "sean@example.com",
      password: "hunter2-hunter2",
      age: 30,
      gender: "male",
    });
  });

  it("아이디·이메일은 대소문자와 공백을 정리해 저장한다", () => {
    const { value } = validateSignup({
      ...VALID,
      username: "  SEAN_LEE  ",
      email: "  Sean@Example.COM ",
    });
    expect(value?.username).toBe("sean_lee");
    expect(value?.email).toBe("sean@example.com");
  });

  it("비밀번호가 서로 다르면 확인 필드에 오류를 준다", () => {
    const { errors, value } = validateSignup({ ...VALID, passwordConfirm: "different-1234" });
    expect(value).toBeNull();
    expect(errors.passwordConfirm).toBe("비밀번호가 서로 다릅니다.");
  });

  it("나이를 문자열로 보내도 숫자로 저장한다", () => {
    expect(validateSignup({ ...VALID, age: "42" }).value?.age).toBe(42);
  });

  it("모든 필드가 비면 필드마다 오류를 준다", () => {
    const { errors, value } = validateSignup({});
    expect(value).toBeNull();
    expect(Object.keys(errors).sort()).toEqual([
      "age",
      "email",
      "gender",
      "password",
      "passwordConfirm",
      "username",
    ]);
  });

  it("성별을 임의의 문자열로 밀어 넣을 수 없다", () => {
    expect(validateSignup({ ...VALID, gender: "'; DROP TABLE accounts; --" }).value).toBeNull();
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

  it("평범한 주소는 통과시킨다", () => {
    expect(validateEmail("sean.lee+tag@mail.example.co.kr")).toBeUndefined();
  });
});

describe("validatePassword", () => {
  it(`${PASSWORD_MIN}자 미만은 거부한다`, () => {
    expect(validatePassword("a".repeat(PASSWORD_MIN - 1))).toBeDefined();
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
