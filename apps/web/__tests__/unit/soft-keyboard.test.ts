import { describe, expect, it } from "vitest";
import { isSoftKeyboardOpen } from "../../hooks/useSoftKeyboardOpen";

describe("화상 키보드 판단", () => {
  it("글자 칸에 있고 화면이 키보드만큼 줄면 열린 것이다", () => {
    expect(isSoftKeyboardOpen(891, 500, true)).toBe(true);
  });

  it("뒤로 가기로 키보드를 내리면 포커스가 남아 있어도 닫힌 것이다", () => {
    expect(isSoftKeyboardOpen(891, 891, true)).toBe(false);
  });

  it("글자 칸이 아니면 화면이 줄어도 키보드가 아니다(창 나누기)", () => {
    expect(isSoftKeyboardOpen(891, 500, false)).toBe(false);
  });

  it("주소창이 접히는 정도로는 키보드로 보지 않는다", () => {
    expect(isSoftKeyboardOpen(891, 835, true)).toBe(false);
  });
});
