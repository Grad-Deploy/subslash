import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

/**
 * Turso 주소와 토큰이 저장소에 올라가지 않게 한다. 공개 저장소라 커밋되면 지워도 기록에 남고, 이 검사는 PR의 필수 CI에서 돈다.
 * 값이 들어갈 곳은 Vercel 환경 변수와 Git에 들어가지 않는 `.env`뿐이다.
 */
const root = resolve(process.cwd(), "../..");
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

/** 낱말이 아니라 실제 값의 모양만 본다. 문서의 자리표시자(your-…)는 지나간다. */
function findDbSecret(text: string): string | null {
  if (/libsql:\/\/(?!your-)[a-z0-9-]+\.[a-z0-9.-]*turso\.io/i.test(text)) return "Turso 주소";
  if (/TURSO_AUTH_TOKEN\s*[=:]\s*["']?eyJ[\w-]{10,}/.test(text)) return "Turso 토큰";
  return null;
}

describe("저장소의 Turso 비밀값", () => {
  it("모양을 알아본다", () => {
    expect(findDbSecret('url = "libsql://subslash-prod.aws-ap-northeast-1.turso.io"')).toBe(
      "Turso 주소",
    );
    expect(findDbSecret('TURSO_AUTH_TOKEN="eyJhbGciOiJFZERTQSJ9"')).toBe("Turso 토큰");
    expect(findDbSecret('# TURSO_DATABASE_URL="libsql://your-database-name.turso.io"')).toBeNull();
  });

  it(".env 파일을 추적하지 않는다(.env.example 제외)", () => {
    const envFiles = tracked.filter(
      (file) => /(^|\/)\.env/.test(file) && !file.endsWith(".env.example"),
    );
    expect(envFiles).toEqual([]);
  });

  it("추적하는 글자 파일에 실제 값이 없다", () => {
    const found = tracked
      .filter((file) => !/\.(png|jpe?g|webp|gif|ico|mp4|woff2?|jar|wasm|jks)$/i.test(file))
      .filter((file) => !file.endsWith("no-db-secrets.test.ts"))
      .flatMap((file) => {
        let text: string;
        try {
          text = readFileSync(resolve(root, file), "utf8");
        } catch {
          return [];
        }
        const kind = findDbSecret(text);
        return kind ? [`${file}: ${kind}`] : [];
      });
    expect(found).toEqual([]);
  });
});
