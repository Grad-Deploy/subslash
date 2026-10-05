import { describe, expect, it } from "vitest";
import { queueWelcomePicks, takeWelcomePicks } from "@lib/welcome";

/**
 * 앱 소개 마지막 장에서 고른 서비스를 대시보드에 넘기는 칸. 대시보드는 받은 서비스의 등록 창을 차례로 연다.
 */
describe("소개에서 고른 서비스 넘기기", () => {
  it("한 번 받으면 비워, 대시보드를 다시 열 때 등록 창이 또 뜨지 않는다", () => {
    queueWelcomePicks(["netflix", "coupang-wow"]);
    expect(takeWelcomePicks()).toEqual(["netflix", "coupang-wow"]);
    expect(takeWelcomePicks()).toEqual([]);
  });

  it("넘긴 뒤 원래 배열을 바꿔도 넘긴 목록은 그대로다", () => {
    const ids = ["netflix"];
    queueWelcomePicks(ids);
    ids.push("youtube-premium");
    expect(takeWelcomePicks()).toEqual(["netflix"]);
  });
});
