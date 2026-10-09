import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { DatabaseSync } from "node:sqlite";
import { afterAll, describe, expect, it } from "vitest";
import {
  antigravitySessions,
  applySqliteWal,
  cursorMembershipIsSubscription,
  cursorSession,
  parseAntigravityTime,
  summarizeCliUsage,
} from "@subslash/shared";
import { readSqliteFiles, selectSqliteFiles } from "@lib/pc-usage-reader";

const dir = mkdtempSync(join(tmpdir(), "subslash-pc-usage-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const NOW = Date.parse("2026-10-09T12:00:00Z");
const day = (iso: string) => Date.parse(iso);

describe("Cursor 기록", () => {
  it("응답의 요청 시각으로 센다 — 사람이 보낸 메시지에는 시각이 없다", () => {
    const session = cursorSession({
      membership: "pro",
      bubbles: [
        { type: 1, sentAt: null },
        { type: 2, sentAt: day("2026-10-08T01:00:00Z") },
        { type: 2, sentAt: 101948 }, // 상대 시간 같은 값은 시각이 아니다
        { type: 2, sentAt: null },
      ],
    });
    expect(session.prompts).toEqual([day("2026-10-08T01:00:00Z")]);
    expect(session.subscription).toBe(true);
    expect(session.tokens).toEqual([]);
  });

  it("요금제 칸: free는 구독이 아니고, 모르는 값은 '모름'이다", () => {
    expect(cursorMembershipIsSubscription("free")).toBe(false);
    expect(cursorMembershipIsSubscription("pro")).toBe(true);
    expect(cursorMembershipIsSubscription("something-new")).toBeNull();
    expect(cursorMembershipIsSubscription(null)).toBeNull();
  });
});

describe("Antigravity 기록", () => {
  it("사람이 연 대화(깊이 0)의 마지막 입력 시각만 센다", () => {
    const sessions = antigravitySessions([
      { lastInput: "2026-10-08 05:47:46.7950697+00:00", depth: 0 },
      { lastInput: "2026-10-08 05:15:47.5066109+00:00", depth: 1 }, // 하위 에이전트
      { lastInput: "2026-10-01 01:00:00+00:00", depth: 0 },
      { lastInput: "not a time", depth: 0 },
    ]);
    expect(sessions.map((s) => s.prompts[0])).toEqual([
      day("2026-10-08T05:47:46.795Z"),
      day("2026-10-01T01:00:00Z"),
    ]);
    const summary = summarizeCliUsage(sessions, {
      now: NOW,
      windowDays: 30,
      subscriptionDefault: true,
    });
    expect(summary.days).toBe(2);
  });

  it("시각의 소수 일곱 자리와 공백 구분을 읽는다", () => {
    expect(parseAntigravityTime("2026-09-16 05:47:46.7950697+00:00")).toBe(
      day("2026-09-16T05:47:46.795Z"),
    );
    expect(parseAntigravityTime(42)).toBeNull();
  });
});

/** 실제 Antigravity처럼 WAL 모드로 쓰고, 체크포인트하지 않은 채 두 파일을 읽는다. */
function antigravityFiles() {
  const path = join(dir, "conversation_summaries.db");
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0;");
  db.exec(
    "CREATE TABLE conversation_summaries (conversation_id text primary key, title text, preview text, last_user_input_time datetime not null, nesting_depth integer not null default 0)",
  );
  const insert = db.prepare(
    "insert into conversation_summaries values (?, '비밀 제목', '비밀 미리보기', ?, ?)",
  );
  insert.run("a", "2026-10-08 05:47:46.7950697+00:00", 0);
  insert.run("b", "2026-10-05 01:00:00.1234567+00:00", 0);
  insert.run("c", "2026-10-08 06:00:00+00:00", 1);
  const files = [
    { path: "antigravity/conversation_summaries.db", file: new Blob([readFileSync(path)]) },
    {
      path: "antigravity/conversation_summaries.db-wal",
      file: new Blob([readFileSync(`${path}-wal`)]),
    },
  ];
  db.close();
  return files;
}

function cursorFiles() {
  const path = join(dir, "state.vscdb");
  const db = new DatabaseSync(path);
  db.exec("CREATE TABLE ItemTable (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB)");
  db.exec("CREATE TABLE cursorDiskKV (key TEXT UNIQUE ON CONFLICT REPLACE, value BLOB)");
  const item = db.prepare("insert into ItemTable values (?, ?)");
  item.run("cursorAuth/stripeMembershipType", "pro");
  item.run("cursorAuth/accessToken", "secret-token");
  const kv = db.prepare("insert into cursorDiskKV values (?, ?)");
  kv.run("bubbleId:c1:u1", JSON.stringify({ type: 1, text: "비밀 질문" }));
  kv.run(
    "bubbleId:c1:a1",
    JSON.stringify({
      type: 2,
      text: "비밀 답",
      timingInfo: { clientRpcSendTime: day("2026-10-07T03:00:00Z") },
    }),
  );
  db.close();
  return [{ path: "globalStorage/state.vscdb", file: new Blob([readFileSync(path)]) }];
}

describe("웹에서 SQLite 기록 읽기", () => {
  it("WAL에만 있는 Antigravity 대화도 합쳐 읽는다", async () => {
    const files = antigravityFiles();
    // WAL을 합치지 않으면 표가 아직 없다.
    const read = await readSqliteFiles(files, "antigravity");
    expect(read.files).toBe(1);
    expect(read.unrecognized).toBe(0);
    expect(read.sessions.map((s) => s.prompts[0]).sort()).toEqual(
      [day("2026-10-05T01:00:00.123Z"), day("2026-10-08T05:47:46.795Z")].sort(),
    );
    expect(JSON.stringify(read)).not.toContain("비밀");
  });

  it("Cursor 파일에서 요금제와 응답 시각만 꺼낸다 — 토큰·메시지 내용은 결과에 없다", async () => {
    const read = await readSqliteFiles(cursorFiles(), "cursor");
    expect(read.sessions).toHaveLength(1);
    expect(read.sessions[0]).toMatchObject({
      subscription: true,
      planType: "pro",
      prompts: [day("2026-10-07T03:00:00Z")],
    });
    const text = JSON.stringify(read);
    expect(text).not.toContain("secret-token");
    expect(text).not.toContain("비밀");
  });

  it("고른 폴더에서 맞는 파일만 고른다", () => {
    const pick = (paths: string[], tool: "cursor" | "antigravity") =>
      selectSqliteFiles(
        paths.map((path) => ({ path })),
        tool,
      );
    // Cursor 앱 폴더를 골랐으면 작업 공간의 state.vscdb가 아니라 User/globalStorage의 것을.
    expect(
      pick(
        ["Cursor/User/workspaceStorage/abc/state.vscdb", "Cursor/User/globalStorage/state.vscdb"],
        "cursor",
      )?.db.path,
    ).toBe("Cursor/User/globalStorage/state.vscdb");
    expect(pick(["Cursor/User/workspaceStorage/abc/state.vscdb"], "cursor")).toBeNull();
    const ag = pick(
      [
        ".gemini/antigravity/conversation_summaries.db",
        ".gemini/antigravity/conversation_summaries.db-wal",
      ],
      "antigravity",
    );
    expect(ag?.wal?.path).toBe(".gemini/antigravity/conversation_summaries.db-wal");
  });

  it("표가 없으면 '안 썼다'가 아니라 '알아보지 못함'이다", async () => {
    const path = join(dir, "empty.db");
    new DatabaseSync(path).close();
    const read = await readSqliteFiles(
      [{ path: "state.vscdb", file: new Blob([readFileSync(path)]) }],
      "cursor",
    );
    expect(read).toEqual({ sessions: [], files: 1, unrecognized: 1 });
  });
});

describe("WAL 합치기", () => {
  it("WAL이 없거나 형식이 다르면 본 파일을 그대로 쓴다", () => {
    const db = new Uint8Array(4096);
    expect(applySqliteWal(db, null)).toBe(db);
    expect(applySqliteWal(db, new Uint8Array(64))).toBe(db);
  });
});

describe("sql.js wasm", () => {
  it("public/vendor의 wasm은 설치된 sql.js의 것과 같다 — 버전을 올리면 다시 복사한다", () => {
    const require = createRequire(import.meta.url);
    const installed = readFileSync(require.resolve("sql.js/dist/sql-wasm.wasm"));
    const served = readFileSync(resolve(__dirname, "../../public/vendor/sql-wasm.wasm"));
    expect(served.equals(installed)).toBe(true);
  });
});
