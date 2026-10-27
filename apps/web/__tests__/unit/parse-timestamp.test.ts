import { describe, expect, it } from "vitest";
import { parseTimestamp } from "@subslash/shared";

describe("parseTimestamp", () => {
  it("기록에 남긴 ISO 시각을 읽는다", () => {
    expect(parseTimestamp("2026-10-27T05:19:34.011Z")?.toISOString()).toBe(
      "2026-10-27T05:19:34.011Z",
    );
  });

  it("없거나 읽을 수 없는 값은 null이다 — 1970년이나 Invalid Date로 읽지 않는다", () => {
    for (const value of [undefined, null, "", "어제", "2026-13-45T99:00:00Z"]) {
      expect(parseTimestamp(value), String(value)).toBeNull();
    }
  });
});
