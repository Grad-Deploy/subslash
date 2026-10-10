import {
  ANTIGRAVITY_CONVERSATIONS_SQL,
  CURSOR_BUBBLES_SQL,
  CURSOR_MEMBERSHIP_SQL,
  antigravitySessions,
  applySqliteWal,
  claudeCodeSession,
  codexSession,
  cursorSession,
  parseCliLine,
  slimCliLine,
  type CliLogLine,
  type CliSessionUsage,
  type CliTool,
} from "@subslash/shared";
import { selectSessionFiles, selectSqliteFiles } from "./select";
import { isSqliteTool } from "./tools";

/** 고른 파일을 읽어 센다. 브라우저 API(폴더 선택 창)는 쓰지 않아 테스트에서 그대로 부른다. */

/** 파일을 한 줄씩 읽어 필요한 칸만 남긴다. 질문·답 내용은 줄을 읽자마자 버린다. */
export async function readSessionFile(file: Blob, tool: CliTool): Promise<CliSessionUsage> {
  const lines: CliLogLine[] = [];
  const keep = (line: CliLogLine) => lines.push(slimCliLine(line));
  const reader = file.stream().pipeThrough(new TextDecoderStream()).getReader();
  let rest = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    rest += value;
    let cut = rest.indexOf("\n");
    while (cut >= 0) {
      const line = parseCliLine(rest.slice(0, cut));
      if (line) keep(line);
      rest = rest.slice(cut + 1);
      cut = rest.indexOf("\n");
    }
  }
  const last = parseCliLine(rest);
  if (last) keep(last);
  return tool === "claude" ? claudeCodeSession(lines) : codexSession(lines);
}

export interface FolderRead {
  sessions: CliSessionUsage[];
  /** 읽은 기록 파일 수. 0이면 맞는 폴더를 고르지 않았을 수 있다. */
  files: number;
  /** 알아보지 못한 파일 수(형식이 바뀌었을 수 있다). */
  unrecognized: number;
}

/** sql.js(SQLite를 wasm으로). 이 화면에서만 필요할 때 불러온다. wasm은 `public/vendor/`에 둔다. */
async function loadSqlJs() {
  const initSqlJs = (await import("sql.js")).default;
  return initSqlJs(
    typeof window === "undefined" ? undefined : { locateFile: () => "/vendor/sql-wasm.wasm" },
  );
}

type Row = Record<string, unknown>;

/** SQLite 도구의 DB(와 WAL)를 열어 공유 SQL로 필요한 칸만 조회하고 센다. */
export async function readSqliteFiles(
  files: { path: string; file: Blob }[],
  tool: CliTool,
): Promise<FolderRead> {
  const picked = selectSqliteFiles(files, tool);
  if (!picked || !isSqliteTool(tool)) return { sessions: [], files: 0, unrecognized: 0 };
  const SQL = await loadSqlJs();
  const bytes = applySqliteWal(
    new Uint8Array(await picked.db.file.arrayBuffer()),
    picked.wal ? new Uint8Array(await picked.wal.file.arrayBuffer()) : null,
  );
  const db = new SQL.Database(bytes);
  const query = (sql: string): Row[] => {
    const result = db.exec(sql)[0];
    if (!result) return [];
    return result.values.map((values) =>
      Object.fromEntries(result.columns.map((column, i) => [column, values[i]])),
    );
  };
  try {
    if (tool === "cursor") {
      const session = cursorSession({
        membership: query(CURSOR_MEMBERSHIP_SQL)[0]?.value ?? null,
        bubbles: query(CURSOR_BUBBLES_SQL).map((row) => ({ type: row.type, sentAt: row.sentAt })),
      });
      return { sessions: [session], files: 1, unrecognized: 0 };
    }
    const rows = query(ANTIGRAVITY_CONVERSATIONS_SQL);
    return {
      sessions: antigravitySessions(
        rows.map((row) => ({ lastInput: row.lastInput, depth: row.depth })),
      ),
      files: 1,
      unrecognized: 0,
    };
  } catch {
    // 표·칸이 없다 — 도구가 기록 형식을 바꿨을 수 있다. '안 썼다'가 아니라 '알아보지 못함'으로 둔다.
    return { sessions: [], files: 1, unrecognized: 1 };
  } finally {
    db.close();
  }
}

/** 고른 파일들을 읽는다. JSONL은 `since`보다 앞에 고친 파일을 열지 않는다(그 안의 질문도 앞이다). */
export async function readSessionFiles(
  files: { path: string; file: File }[],
  tool: CliTool,
  since: number,
): Promise<FolderRead> {
  if (isSqliteTool(tool)) return readSqliteFiles(files, tool);
  const sessions: CliSessionUsage[] = [];
  let unrecognized = 0;
  let count = 0;
  for (const { file } of selectSessionFiles(files, tool)) {
    if (file.lastModified < since) continue;
    count += 1;
    const session = await readSessionFile(file, tool);
    if (!session.recognized) unrecognized += 1;
    sessions.push(session);
  }
  return { sessions, files: count, unrecognized };
}
