import { describe, expect, it } from "vitest";
import { readSignupResponse, signupRequestBody } from "@lib/signup-request";

const VALUES = {
  username: "sean_1",
  email: "Sean@Example.com",
  password: "password123",
  passwordConfirm: "password123",
  isOver14: true,
  age: "",
  gender: "",
};

describe("signupRequestBody", () => {
  it("비운 선택 항목은 null로 보낸다", () => {
    const body = JSON.parse(signupRequestBody({ ...VALUES, age: "  " }));
    expect(body.age).toBeNull();
    expect(body.gender).toBeNull();
    expect(body.isOver14).toBe(true);
  });

  it("적은 나이·성별은 그대로 보낸다", () => {
    const body = JSON.parse(signupRequestBody({ ...VALUES, age: "30", gender: "female" }));
    expect(body).toMatchObject({ age: "30", gender: "female" });
  });
});

describe("readSignupResponse", () => {
  it("칸별 오류와 문구를 그대로 붙인다", () => {
    const outcome = readSignupResponse(
      false,
      { error: "이미 쓰는 아이디입니다.", fieldErrors: { username: "이미 쓰는 아이디입니다." } },
      "sean@example.com",
    );
    expect(outcome).toEqual({
      ok: false,
      fieldErrors: { username: "이미 쓰는 아이디입니다." },
      formError: "이미 쓰는 아이디입니다.",
      pendingEmail: null,
    });
  });

  it("확인 전 계정에 막힌 주소면 적은 주소를 남긴다", () => {
    const outcome = readSignupResponse(false, { emailPending: true }, "sean@example.com");
    expect(outcome).toMatchObject({ ok: false, pendingEmail: "sean@example.com" });
  });

  it("본문을 읽지 못한 실패는 일반 문구를 쓴다", () => {
    expect(readSignupResponse(false, {}, "a@b.co")).toMatchObject({
      formError: "가입을 처리하지 못했습니다.",
      fieldErrors: {},
    });
  });

  it("확인 메일을 보냈으면 서버의 문구와 주소를 쓴다", () => {
    const outcome = readSignupResponse(
      true,
      {
        account: { email: "sean@example.com" },
        emailVerification: { status: "sent", message: "확인 메일을 보냈습니다." },
      },
      "x@y.co",
    );
    expect(outcome).toEqual({
      ok: true,
      notice: { email: "sean@example.com", sent: true, message: "확인 메일을 보냈습니다." },
    });
  });

  it("메일 결과를 모르면 보냈다고 단정하지 않는다", () => {
    const outcome = readSignupResponse(true, {}, "sean@example.com");
    expect(outcome).toEqual({
      ok: true,
      notice: {
        email: "sean@example.com",
        sent: false,
        message: "확인 메일을 보냈는지 알 수 없습니다.",
      },
    });
  });
});
