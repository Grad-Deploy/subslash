import type { CliTool } from "@subslash/shared";
import { isSessionFile } from "./select";
import { MAX_DEPTH, SESSION_DIR, SQLITE_FILES, isSqliteTool, picksFile, segmentsOf } from "./tools";
import type { JsonlTool, SqliteTool } from "./tools";

/** 폴더·파일 고르기(브라우저 API). 고른 것 중 이 도구가 읽을 파일만 넘긴다. */

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
