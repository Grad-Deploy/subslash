#!/usr/bin/env node
/**
 * Claude Code 훅(PostToolUse · Edit|Write): 방금 고친 TypeScript 파일 하나에 prettier·eslint를 돌린다.
 *
 * 문제가 있으면 exit 2로 끝내 stderr를 Claude에게 돌려준다 — 고친 사람이 곧바로 다시 고치게.
 * 저장소 밖 파일, ts/tsx가 아닌 파일, 생성물(out/.next/node_modules)은 건너뛴다.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

let input = {};
try {
  input = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const file = input.tool_input?.file_path ?? input.tool_response?.filePath;
if (!file || !/\.(ts|tsx)$/.test(file) || !existsSync(file)) process.exit(0);

const abs = path.resolve(file);
const rel = path.relative(root, abs);
if (rel.startsWith("..") || /(^|[\\/])(node_modules|out|\.next|dist)[\\/]/.test(rel)) process.exit(0);

// 파일이 속한 워크스페이스(eslint 설정이 있는 곳)에서 돌린다.
const workspace = ["apps/web", "packages/shared"].find((dir) =>
  rel.split(path.sep).join("/").startsWith(`${dir}/`),
);
if (!workspace) process.exit(0);
const cwd = path.join(root, workspace);
// 셸을 거쳐 실행하므로(윈도우의 npx) 공백이 든 절대 경로('바탕 화면')가 쪼개진다. 워크스페이스
// 기준 상대 경로로 넘긴다.
const target = path.relative(cwd, abs);

const run = (cmd, args) =>
  spawnSync(cmd, args, { cwd, encoding: "utf8", shell: process.platform === "win32" });

const problems = [];

const prettier = run("npx", ["--no-install", "prettier", "--check", target]);
if (prettier.status !== 0) {
  problems.push(`prettier: 서식이 맞지 않습니다. \`npx prettier --write "${rel}"\`로 고치세요.`);
}

const eslint = run("npx", ["--no-install", "eslint", "--max-warnings=0", target]);
if (eslint.status !== 0) {
  problems.push(`eslint:\n${(eslint.stdout || eslint.stderr).trim()}`);
}

if (problems.length > 0) {
  process.stderr.write(`[post-edit] ${rel}\n${problems.join("\n\n")}\n`);
  process.exit(2);
}
