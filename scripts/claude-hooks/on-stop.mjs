#!/usr/bin/env node
/**
 * Claude Code 훅(Stop): 작업을 마치기 전에, 커밋하지 않은 TypeScript 변경이 있으면 타입 검사와
 * 그 변경에 걸린 단위·통합 테스트를 돌린다.
 *
 * 실패하면 exit 2로 끝내 Claude가 멈추지 않고 고치게 한다. 한 번 막은 뒤(stop_hook_active)에는
 * 다시 막지 않는다 — 고칠 수 없는 실패로 끝없이 도는 것을 막는다.
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  // 입력이 없어도 검사는 한다.
}
if (input.stop_hook_active) process.exit(0);

const run = (cmd, args, cwd = root) =>
  spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    shell: process.platform === "win32",
    maxBuffer: 20 * 1024 * 1024,
  });

const status = run("git", ["status", "--porcelain", "--untracked-files=all"]);
const changed = status.stdout
  .split("\n")
  .map((line) => line.slice(3).trim().replace(/^"|"$/g, ""))
  .filter((file) => /\.(ts|tsx)$/.test(file) && !/(^|\/)(out|\.next|node_modules)\//.test(file));
if (changed.length === 0) process.exit(0);

const failures = [];

const typecheck = run("pnpm", ["turbo", "typecheck", "--output-logs=errors-only"]);
if (typecheck.status !== 0) {
  failures.push(`타입 검사 실패:\n${(typecheck.stdout + typecheck.stderr).trim().slice(-4000)}`);
}

// 바뀐 웹 파일에 걸린 테스트만 돌린다(vitest related). 전체 테스트는 CI가 돌린다.
const webFiles = changed
  .filter((file) => file.startsWith("apps/web/"))
  .map((file) => file.slice("apps/web/".length));
if (webFiles.length > 0) {
  const tests = run(
    "npx",
    ["--no-install", "vitest", "related", "--run", "--passWithNoTests", ...webFiles],
    path.join(root, "apps/web"),
  );
  if (tests.status !== 0) {
    failures.push(`관련 테스트 실패:\n${(tests.stdout + tests.stderr).trim().slice(-4000)}`);
  }
}

if (failures.length > 0) {
  process.stderr.write(`[on-stop] 끝내기 전에 고쳐 주세요.\n\n${failures.join("\n\n")}\n`);
  process.exit(2);
}
