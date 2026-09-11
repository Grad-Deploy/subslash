import { describe, it, expect } from "vitest";
import {
  confirmStatusOf,
  emailStatusFor,
  emailStatusOf,
  passwordStatusOf,
  shownStatus,
  usernameStatusOf,
} from "../../lib/signup-status";

describe("가입 폼 칸 상태", () => {
  it("아이디는 비었거나 규칙에 맞지 않으면 그 자리에서 이유를 알려준다", () => {
    expect(usernameStatusOf("")).toEqual({ tone: "error", message: "아이디를 입력해주세요." });
    expect(usernameStatusOf("ab")?.message).toContain("4~20자");
    expect(usernameStatusOf("sean!")?.message).toContain("영문 소문자");
  });

  it("대문자로 적은 아이디는 서버처럼 소문자로 바꿔 판정한다", () => {
    expect(usernameStatusOf("Sean_01")?.tone).toBe("ok");
  });

  it("아이디의 초록 문구는 중복까지 약속하지 않는다", () => {
    // 중복 여부는 가입 요청만 안다. "사용 가능한 아이디"라고 하면 사실이 아니다.
    expect(usernameStatusOf("sean_01")?.message).toContain("가입할 때 확인");
  });

  it("비밀번호와 확인 칸은 비면 입력을, 다르면 불일치를 알려준다", () => {
    expect(passwordStatusOf("")?.message).toBe("비밀번호를 입력해주세요.");
    expect(passwordStatusOf("short")?.message).toContain("5자 더");
    expect(passwordStatusOf("correct-horse")?.tone).toBe("ok");

    expect(confirmStatusOf("correct-horse", "")?.message).toBe("비밀번호를 한 번 더 입력해주세요.");
    expect(confirmStatusOf("correct-horse", "correct")?.tone).toBe("error");
    expect(confirmStatusOf("correct-horse", "correct-horse")?.tone).toBe("ok");
  });

  it("잘못된 이메일 형식은 형식이 틀렸다고, 도메인 모양이 틀리면 도메인을 짚어 알려준다", () => {
    expect(emailStatusFor("sean")?.message).toContain("잘못된 이메일 형식입니다");
    expect(emailStatusFor("sean@gmail")?.message).toContain("@ 뒤의 도메인");
  });

  it("자주 쓰는 메일 서비스만 초록이고, 그 밖의 도메인은 받지 않는다고 알려준다", () => {
    expect(emailStatusFor("sean@gmail.com")?.tone).toBe("ok");
    expect(emailStatusFor("sean@exampl.com")).toEqual({
      tone: "error",
      message: expect.stringContaining("가입할 수 없는 이메일"),
    });
    expect(emailStatusFor("sean@gmial.com")?.message).toContain("gmail.com");
  });

  it("이메일 판정은 지금 칸에 있는 주소에 대한 것일 때만 보인다", () => {
    const check = { email: "sean@gmial.com", status: emailStatusFor("sean@gmial.com") };

    expect(emailStatusOf("sean@gmial.com", check)).toBe(check.status);
    expect(emailStatusOf("sean@gmail.com", check)).toBeNull();
    expect(emailStatusOf("", check)?.message).toBe("이메일을 입력해주세요.");
  });

  it("제출 때 받은 오류는 입력 중 상태보다 먼저 보인다", () => {
    const live = { tone: "ok" as const, message: "쓸 수 있는 형식입니다." };

    expect(shownStatus("이미 사용 중인 아이디입니다.", live)).toEqual({
      tone: "error",
      message: "이미 사용 중인 아이디입니다.",
    });
    expect(shownStatus(undefined, live)).toBe(live);
  });
});
