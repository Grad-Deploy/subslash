import { describe, expect, it } from "vitest";
import { badRequestResponse, readJson, readJsonObject } from "../../lib/request-body";

const post = (body: string) => new Request("https://example.test/api/x", { method: "POST", body });

describe("readJson", () => {
  it("JSON이면 그 값을, 아니면 null을 돌려준다", async () => {
    expect(await readJson(post('{"a":1}'))).toEqual({ a: 1 });
    expect(await readJson(post("[1,2]"))).toEqual([1, 2]);
    expect(await readJson(post("not json"))).toBeNull();
    expect(await readJson(post(""))).toBeNull();
  });
});

describe("readJsonObject", () => {
  it("객체만 받는다 — 배열·숫자·문자열·null은 null이다", async () => {
    expect(await readJsonObject(post('{"email":"a"}'))).toEqual({ email: "a" });
    for (const body of ["[]", "[{}]", "1", '"text"', "null", "{"]) {
      expect(await readJsonObject(post(body))).toBeNull();
    }
  });
});

describe("badRequestResponse", () => {
  it("400과 화면이 옮기는 문구를 돌려준다", async () => {
    const response = badRequestResponse();
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "요청을 이해할 수 없습니다." });
  });
});
