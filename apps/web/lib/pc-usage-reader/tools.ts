import type { CliTool } from "@subslash/shared";

/** 도구마다 기록이 어디에 어떤 모양으로 있는지. */

export type JsonlTool = "claude" | "codex";
export type SqliteTool = "cursor" | "antigravity";

export const isSqliteTool = (tool: CliTool): tool is SqliteTool =>
  tool === "cursor" || tool === "antigravity";

/**
 * 폴더가 아니라 파일을 고르는 도구. Cursor의 기록은 `AppData`(맥은 `~/Library`) 아래에 있는데, 크롬·엣지의 폴더
 * 선택 창은 이 폴더와 그 안을 '시스템 파일이 있는 폴더'라며 열지 않는다. 파일 선택 창(`<input type="file">`)은
 * 막지 않아 DB 파일(과 WAL)을 직접 고르게 한다.
 */
export const picksFile = (tool: CliTool): tool is "cursor" => tool === "cursor";

/** JSONL 기록이 있는 하위 폴더 이름. 이 폴더 아래만 본다. */
export const SESSION_DIR: Record<JsonlTool, string> = { claude: "projects", codex: "sessions" };

/** 폴더를 고른 곳에서 세션 기록까지의 깊이(Claude: 프로젝트/파일, Codex: 연/월/일/파일). */
export const MAX_DEPTH: Record<JsonlTool, number> = { claude: 2, codex: 4 };

/**
 * SQLite 도구가 여는 파일 — 고른 폴더에서의 경로 후보(앞쪽이 우선). 사용자가 기록 폴더 자체를 골라도, 그 위
 * 폴더(Cursor는 `User`·앱 폴더, Antigravity는 `.gemini`)를 골라도 찾는다. 다른 파일은 열지 않는다.
 */
export const SQLITE_FILES: Record<SqliteTool, string[]> = {
  cursor: ["state.vscdb", "globalStorage/state.vscdb", "User/globalStorage/state.vscdb"],
  antigravity: ["conversation_summaries.db", "antigravity/conversation_summaries.db"],
};

export const segmentsOf = (path: string) => path.split(/[\\/]/).filter(Boolean);

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
