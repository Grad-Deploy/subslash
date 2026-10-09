import {
  claudeCodeSession,
  codexSession,
  parseCliLine,
  slimCliLine,
  type CliLogLine,
  type CliSessionUsage,
} from "@subslash/shared";

/**
 * 웹의 'PC 기록 읽기'(/pc-usage). 사용자가 고른 Claude Code·Codex 기록 폴더를 **브라우저가 기기 안에서** 읽어
 * 질문 시각만 센다(`@subslash/shared`의 cliUsage — 명령줄 도구와 같은 함수). 파일은 서버로 가지 않는다.
 *
 * 고른 폴더에서 세션 기록만 가려 읽는다: Claude Code는 `projects` 아래 `.jsonl`, Codex는 `sessions` 아래
 * `rollout-*.jsonl`. 사용자가 그 위 폴더(`.claude`·`.codex`)를 골라도 다른 파일은 열지 않는다 — `.codex`에는
 * 로그인 토큰(`auth.json`)이 있다.
 */

export type CliTool = "claude" | "codex";

/** 기록이 있는 하위 폴더 이름. 이 폴더 아래만 본다. */
const SESSION_DIR: Record<CliTool, string> = { claude: "projects", codex: "sessions" };

/** 폴더를 고른 곳에서 세션 기록까지의 깊이(Claude: 프로젝트/파일, Codex: 연/월/일/파일). */
const MAX_DEPTH: Record<CliTool, number> = { claude: 2, codex: 4 };

/** 이 경로(고른 폴더 기준, `/`로 나눔)가 이 도구의 세션 기록 파일인지. */
export function isSessionFile(path: string, tool: CliTool): boolean {
  const parts = path.split(/[\\/]/).filter(Boolean);
  const name = parts[parts.length - 1] ?? "";
  if (!name.endsWith(".jsonl")) return false;
  if (tool === "codex" && !name.startsWith("rollout-")) return false;
  return true;
}

/**
 * 고른 폴더의 파일 목록(`<input webkitdirectory>`)에서 세션 기록만 고른다. 목록에 세션 폴더(`projects`·
 * `sessions`)가 있으면 그 아래만 본다 — 위 폴더를 골랐을 때 다른 기록(Claude Code의 입력 기록 등)을 세지 않게.
 */
export function selectSessionFiles<T extends { path: string }>(files: T[], tool: CliTool): T[] {
  const dir = SESSION_DIR[tool];
  const segments = (path: string) => path.split(/[\\/]/).filter(Boolean);
  const underDir = files.filter((file) => segments(file.path).slice(0, -1).includes(dir));
  const pool = underDir.length > 0 ? underDir : files;
  return pool.filter((file) => isSessionFile(file.path, tool));
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
  /** 읽은 세션 기록 수. 0이면 맞는 폴더를 고르지 않았을 수 있다. */
  files: number;
  /** 알아보지 못한 파일 수(형식이 바뀌었을 수 있다). */
  unrecognized: number;
}

/** 고른 파일들을 읽는다. `since`보다 앞에 고친 파일은 그 안의 질문도 앞이라 열지 않는다. */
export async function readSessionFiles(
  files: { path: string; file: File }[],
  tool: CliTool,
  since: number,
): Promise<FolderRead> {
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

/**
 * 기록 폴더 경로. 윈도우는 `C:\Users\<사용자 이름>\…`로 적는다 — 폴더 선택 창 주소 칸에 `%USERPROFILE%`를 붙여
 * 넣으면 열리지 않았다. 브라우저는 사용자 이름을 알 수 없어 사용자가 적는다. 맥·리눅스는 `~`가 된다.
 */
export function folderPath(tool: CliTool, windows: boolean, windowsUser: string): string {
  const sub = tool === "claude" ? ".claude/projects" : ".codex/sessions";
  return windows ? `C:\\Users\\${windowsUser}\\${sub.replace("/", "\\")}` : `~/${sub}`;
}

/** Windows 사용자 이름으로 쓸 수 있는 값인지(폴더 이름에 못 쓰는 글자를 막는다). */
export const isWindowsUserName = (name: string) => name.length > 0 && !/[\\/:*?"<>|]/.test(name);

/* ---- 폴더 고르기 (브라우저) ---- */

interface DirHandle {
  kind: "directory";
  name: string;
  values(): AsyncIterable<DirHandle | FileHandle>;
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
 * 올리기 입력을 쓴다 — 둘 다 파일을 서버로 보내지 않고 이 페이지가 읽기만 한다. 취소하면 null.
 */
export async function pickSessionFolder(
  tool: CliTool,
  since: number,
): Promise<{ path: string; file: File }[] | null> {
  const picker = (window as PickerWindow).showDirectoryPicker;
  if (picker) {
    let root: DirHandle;
    try {
      root = await picker.call(window, { id: `subslash-${tool}`, mode: "read" });
    } catch {
      return null;
    }
    return walkHandle(root, tool, since);
  }
  return pickWithInput();
}

async function walkHandle(root: DirHandle, tool: CliTool, since: number) {
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

function pickWithInput(): Promise<{ path: string; file: File }[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.setAttribute("webkitdirectory", "");
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
