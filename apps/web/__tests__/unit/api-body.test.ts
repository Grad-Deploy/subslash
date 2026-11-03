import { describe, expect, it } from "vitest";
import { fieldErrorsOf, isApiPath, readResponseBody, textOf } from "../../lib/api-body";

const res = (body: string, contentType = "application/json") =>
  new Response(body, { headers: { "content-type": contentType } });

describe("readResponseBody", () => {
  it("JSON 객체만 받고, 아니면 빈 객체다", async () => {
    expect(await readResponseBody(res('{"status":"sent"}'))).toEqual({ status: "sent" });
    // 프록시·호스팅 오류 화면(HTML), 배열, 빈 본문
    expect(await readResponseBody(res("<html>502</html>", "text/html"))).toEqual({});
    expect(await readResponseBody(res("[1]"))).toEqual({});
    expect(await readResponseBody(res(""))).toEqual({});
  });
});

describe("textOf", () => {
  it("문자열인 칸만 꺼낸다 — 객체·숫자를 화면 문구로 넘기지 않는다", () => {
    const body = { error: "실패", message: { nested: true }, code: 3 };
    expect(textOf(body, "error")).toBe("실패");
    expect(textOf(body, "message")).toBeUndefined();
    expect(textOf(body, "code")).toBeUndefined();
    expect(textOf(body, "missing")).toBeUndefined();
  });
});

describe("fieldErrorsOf", () => {
  it("문자열인 칸 오류만 남기고, 없으면 undefined다", () => {
    expect(fieldErrorsOf({ fieldErrors: { password: "짧아요", other: 1 } })).toEqual({
      password: "짧아요",
    });
    expect(fieldErrorsOf({})).toBeUndefined();
    expect(fieldErrorsOf({ fieldErrors: ["x"] })).toBeUndefined();
  });
});

describe("isApiPath", () => {
  it("우리 API 경로만 받는다", () => {
    expect(isApiPath("/api/auth/oauth/google/start?x=1")).toBe(true);
    expect(isApiPath("https://evil.example/api/x")).toBe(false);
    expect(isApiPath("//evil.example/api/x")).toBe(false);
    expect(isApiPath("/api//evil.example")).toBe(false);
    expect(isApiPath(undefined)).toBe(false);
  });
});
