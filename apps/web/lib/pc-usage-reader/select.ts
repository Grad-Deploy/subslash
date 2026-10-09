import type { CliTool } from "@subslash/shared";
import { SESSION_DIR, SQLITE_FILES, isSqliteTool, segmentsOf } from "./tools";

/** 고른 폴더의 파일 목록에서 이 도구가 읽을 파일만 고른다. 고르지 않은 파일은 열지 않는다. */

/** 이 경로(고른 폴더 기준, `/`로 나눔)가 이 도구의 JSONL 세션 기록 파일인지. */
export function isSessionFile(path: string, tool: CliTool): boolean {
  if (isSqliteTool(tool)) return false;
  const parts = segmentsOf(path);
  const name = parts[parts.length - 1] ?? "";
  if (!name.endsWith(".jsonl")) return false;
  if (tool === "codex" && !name.startsWith("rollout-")) return false;
  return true;
}

/**
 * 고른 폴더의 파일 목록(`<input webkitdirectory>`)에서 JSONL 세션 기록만 고른다. 목록에 세션 폴더(`projects`·
 * `sessions`)가 있으면 그 아래만 본다 — 위 폴더를 골랐을 때 다른 기록(Claude Code의 입력 기록 등)을 세지 않게.
 */
export function selectSessionFiles<T extends { path: string }>(files: T[], tool: CliTool): T[] {
  if (isSqliteTool(tool)) return [];
  const dir = SESSION_DIR[tool];
  const underDir = files.filter((file) => segmentsOf(file.path).slice(0, -1).includes(dir));
  const pool = underDir.length > 0 ? underDir : files;
  return pool.filter((file) => isSessionFile(file.path, tool));
}

/**
 * 파일 목록에서 SQLite 도구의 DB 파일과 WAL을 고른다. 목록의 경로는 고른 폴더 이름부터 시작하므로(`globalStorage/
 * state.vscdb`), 후보 경로로 **끝나는** 것을 찾는다. 후보 순서대로 — Cursor 앱 폴더를 골랐을 때 작업 공간마다 있는
 * `workspaceStorage/*\/state.vscdb`가 아니라 `User/globalStorage/state.vscdb`를 고른다.
 */
export function selectSqliteFiles<T extends { path: string }>(
  files: T[],
  tool: CliTool,
): { db: T; wal: T | null } | null {
  if (!isSqliteTool(tool)) return null;
  const endsWith = (path: string, tail: string) => {
    const parts = segmentsOf(path);
    const want = segmentsOf(tail);
    return want.every((part, i) => parts[parts.length - want.length + i] === part);
  };
  // 짧은 후보(파일 이름만)는 마지막에 본다 — 더 긴 경로가 맞으면 그쪽이 정확하다.
  const candidates = [...SQLITE_FILES[tool]].sort(
    (a, b) => segmentsOf(b).length - segmentsOf(a).length,
  );
  for (const tail of candidates) {
    const matches = files.filter((file) => endsWith(file.path, tail));
    // 파일 이름만 맞는 후보는 바로 그 폴더의 것만(경로 깊이가 고른 폴더 + 파일 하나) 받는다.
    const db =
      segmentsOf(tail).length === 1
        ? matches.find((file) => segmentsOf(file.path).length <= 2)
        : matches[0];
    if (!db) continue;
    const walPath = `${db.path}-wal`;
    const wal = files.find((file) => file.path === walPath) ?? null;
    return { db, wal };
  }
  return null;
}
