import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { MIN_SESSION_MS, SESSION_GAP_MS } from "@subslash/shared";
import { ANDROID_PACKAGES } from "../../lib/device-usage";
import { USAGE_PACKAGES } from "../../lib/usage/packages";

/**
 * 폰 사용 기록(UsageStatsPlugin, 이 폰만)과 여러 기기 사용 측정(linkSessions, 모든 기기)은 같은 리포트에
 * 나란히 나온다. '한 번'의 기준이나 서비스 표가 다르면 같은 사용이 두 가지 뜻의 숫자가 된다.
 */

const PLUGIN = path.resolve(
  __dirname,
  "../../../mobile/android/app/src/main/java/com/subslash/app/UsageStatsPlugin.java",
);

/** `private static final long NAME = 30 * 60 * 1000L;`의 값을 계산한다. */
function javaConstant(source: string, name: string): number {
  const match = source.match(new RegExp(`static final long ${name} = ([\\d\\s*L]+);`));
  if (!match) throw new Error(`${name}을 찾지 못했습니다`);
  return match[1]
    .replace(/L/g, "")
    .split("*")
    .reduce((product, part) => product * Number(part.trim()), 1);
}

describe("폰 사용 기록과 여러 기기 측정의 기준", () => {
  const source = readFileSync(PLUGIN, "utf8");

  it("'한 번 썼다'의 기준이 같다", () => {
    expect(javaConstant(source, "SESSION_GAP_MS")).toBe(SESSION_GAP_MS);
    expect(javaConstant(source, "MIN_SESSION_MS")).toBe(MIN_SESSION_MS);
  });

  it("서비스 → 패키지 표가 하나다", () => {
    expect(ANDROID_PACKAGES).toBe(USAGE_PACKAGES);
  });
});
