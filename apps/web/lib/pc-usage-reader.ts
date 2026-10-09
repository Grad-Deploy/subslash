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

export type { CliTool };

/**
 * 웹의 'PC 기록 읽기'(/pc-usage). 사용자가 고른 AI 코딩 도구의 기록 폴더를 **브라우저가 기기 안에서** 읽어 질문
 * 시각만 센다(`@subslash/shared`의 cliUsage — 명령줄 도구와 같은 함수). 파일은 서버로 가지 않는다.
 *
 * - Claude Code·Codex는 JSONL 세션 기록: `projects` 아래 `.jsonl`, `sessions` 아래 `rollout-*.jsonl`만 연다.
 *   위 폴더(`.claude`·`.codex`)를 골라도 다른 파일은 열지 않는다 — `.codex`에는 로그인 토큰(`auth.json`)이 있다.
 * - Cursor·Antigravity는 SQLite: 정해진 파일 하나(와 WAL)만 찾아 sql.js로 열고, 공유 SQL로 필요한 칸만 조회한다.
 *   Cursor의 `state.vscdb`에는 로그인 토큰도 들어 있어 파일이 메모리에 올라오지만 그 칸은 조회하지 않는다.
 */

type JsonlTool = "claude" | "codex";
type SqliteTool = "cursor" | "antigravity";

export const isSqliteTool = (tool: CliTool): tool is SqliteTool =>
  tool === "cursor" || tool === "antigravity";

/**
 * 폴더가 아니라 파일을 고르는 도구. Cursor의 기록은 `AppData`(맥은 `~/Library`) 아래에 있는데, 크롬·엣지의 폴더
 * 선택 창은 이 폴더와 그 안을 '시스템 파일이 있는 폴더'라며 열지 않는다. 파일 선택 창(`<input type="file">`)은
 * 막지 않아 DB 파일(과 WAL)을 직접 고르게 한다.
 */
export const picksFile = (tool: CliTool): tool is "cursor" => tool === "cursor";

/** JSONL 기록이 있는 하위 폴더 이름. 이 폴더 아래만 본다. */
const SESSION_DIR: Record<JsonlTool, string> = { claude: "projects", codex: "sessions" };

/** 폴더를 고른 곳에서 세션 기록까지의 깊이(Claude: 프로젝트/파일, Codex: 연/월/일/파일). */
const MAX_DEPTH: Record<JsonlTool, number> = { claude: 2, codex: 4 };

/**
 * SQLite 도구가 여는 파일 — 고른 폴더에서의 경로 후보(앞쪽이 우선). 사용자가 기록 폴더 자체를 골라도, 그 위
 * 폴더(Cursor는 `User`·앱 폴더, Antigravity는 `.gemini`)를 골라도 찾는다. 다른 파일은 열지 않는다.
 */
const SQLITE_FILES: Record<SqliteTool, string[]> = {
  cursor: ["state.vscdb", "globalStorage/state.vscdb", "User/globalStorage/state.vscdb"],
  antigravity: ["conversation_summaries.db", "antigravity/conversation_summaries.db"],
};

const segmentsOf = (path: string) => path.split(/[\\/]/).filter(Boolean);

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

export type PcPlatform = "windows" | "mac" | "linux";

/**
 * 기록 폴더 경로. 윈도우는 `C:\Users\<사용자 이름>\…`로 적는다 — 폴더 선택 창 주소 칸에 `%USERPROFILE%`를 붙여
 * 넣으면 열리지 않았다. 브라우저는 사용자 이름을 알 수 없어 사용자가 적는다. 맥·리눅스는 `~`가 된다.
 */
export function folderPath(tool: CliTool, platform: PcPlatform, windowsUser: string): string {
  const home: Record<Exclude<CliTool, "cursor">, string> = {
    claude: ".claude/projects",
    codex: ".codex/sessions",
    antigravity: ".gemini/antigravity",
  };
  const cursor: Record<PcPlatform, string> = {
    windows: "AppData/Roaming/Cursor/User/globalStorage",
    mac: "Library/Application Support/Cursor/User/globalStorage",
    linux: ".config/Cursor/User/globalStorage",
  };
  const sub = tool === "cursor" ? cursor[platform] : home[tool];
  return platform === "windows"
    ? `C:\\Users\\${windowsUser}\\${sub.replaceAll("/", "\\")}`
    : `~/${sub}`;
}

/** Windows 사용자 이름으로 쓸 수 있는 값인지(폴더 이름에 못 쓰는 글자를 막는다). */
export const isWindowsUserName = (name: string) => name.length > 0 && !/[\\/:*?"<>|]/.test(name);

/* ---- 폴더 고르기 (브라우저) ---- */

interface DirHandle {
  kind: "directory";
  name: string;
  values(): AsyncIterable<DirHandle | FileHandle>;
  getDirectoryHandle(name: string): Promise<DirHandle>;
  getFileHandle(name: string): Promise<FileHandle>;
}
interface FileHandle {
  kind: "file";
  name: string;
  getFile(): Promise<File>;
}
type PickerWindow = Window & {
  showDirectoryPicker?: (options?: { id?: string; mode?: "read" }) => Promise<DirHandle>;
};

/**
 * 폴더 선택 창을 연다. 크롬·엣지는 폴더 읽기 권한을 묻는 창(`showDirectoryPicker`)을, 그 밖의 브라우저는 폴더
 * 올리기 입력을 쓴다 — 둘 다 파일을 서버로 보내지 않고 이 페이지가 읽기만 한다. Cursor는 폴더 대신 파일을
 * 고른다(`picksFile`). 취소하면 null.
 */
export async function pickSessionFolder(
  tool: CliTool,
  since: number,
): Promise<{ path: string; file: File }[] | null> {
  if (picksFile(tool)) return pickWithInput({ directory: false });
  const picker = (window as PickerWindow).showDirectoryPicker;
  if (picker) {
    let root: DirHandle;
    try {
      root = await picker.call(window, { id: `subslash-${tool}`, mode: "read" });
    } catch {
      return null;
    }
    return isSqliteTool(tool) ? findSqliteHandles(root, tool) : walkHandle(root, tool, since);
  }
  return pickWithInput({ directory: true });
}

async function walkHandle(root: DirHandle, tool: JsonlTool, since: number) {
  // 위 폴더(.claude·.codex)를 골랐으면 세션 폴더로 내려간다. 다른 파일(.codex/auth.json 등)은 열지 않는다.
  let start = root;
  for await (const entry of root.values()) {
    if (entry.kind === "directory" && entry.name === SESSION_DIR[tool]) start = entry;
  }
  const found: { path: string; file: File }[] = [];
  const walk = async (dir: DirHandle, prefix: string, depth: number) => {
    for await (const entry of dir.values()) {
      const path = `${prefix}/${entry.name}`;
      if (entry.kind === "directory") {
        if (depth > 1) await walk(entry, path, depth - 1);
      } else if (isSessionFile(path, tool)) {
        const file = await entry.getFile();
        if (file.lastModified >= since) found.push({ path, file });
      }
    }
  };
  await walk(start, start === root ? "" : SESSION_DIR[tool], MAX_DEPTH[tool]);
  return found;
}

/** 후보 경로를 하나씩 따라가 DB 파일(과 WAL)만 연다. 폴더 전체를 훑지 않는다. */
async function findSqliteHandles(root: DirHandle, tool: SqliteTool) {
  for (const tail of SQLITE_FILES[tool]) {
    const parts = segmentsOf(tail);
    try {
      let dir = root;
      for (const part of parts.slice(0, -1)) dir = await dir.getDirectoryHandle(part);
      const name = parts[parts.length - 1];
      const db = await (await dir.getFileHandle(name)).getFile();
      const found = [{ path: tail, file: db }];
      try {
        found.push({
          path: `${tail}-wal`,
          file: await (await dir.getFileHandle(`${name}-wal`)).getFile(),
        });
      } catch {
        // WAL이 없다(체크포인트됐거나 롤백 저널 모드).
      }
      return found;
    } catch {
      // 이 후보 경로에는 없다.
    }
  }
  return [];
}

/** 파일 입력으로 고른다. 파일을 고르면 경로는 파일 이름이다(`state.vscdb`·`state.vscdb-wal`). */
function pickWithInput({
  directory,
}: {
  directory: boolean;
}): Promise<{ path: string; file: File }[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    if (directory) input.setAttribute("webkitdirectory", "");
    else input.multiple = true;
    input.addEventListener("change", () => {
      const files = Array.from(input.files ?? []).map((file) => ({
        path: file.webkitRelativePath || file.name,
        file,
      }));
      resolve(files);
    });
    input.addEventListener("cancel", () => resolve(null));
    input.click();
  });
}
