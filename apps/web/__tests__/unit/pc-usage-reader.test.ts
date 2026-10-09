import { describe, expect, it } from "vitest";
import {
  folderPath,
  isWindowsUserName,
  picksFile,
  readSessionFile,
  readSessionFiles,
  selectSessionFiles,
} from "@lib/pc-usage-reader";

const jsonl = (lines: object[]) => lines.map((line) => JSON.stringify(line)).join("\n");
const file = (name: string, text: string, lastModified = Date.parse("2026-10-08T00:00:00Z")) =>
  new File([text], name, { lastModified });

const claudeLines = [
  {
    type: "user",
    sessionId: "s",
    timestamp: "2026-10-08T01:00:00Z",
    origin: { kind: "human" },
    message: { content: "비밀 질문" },
  },
  { type: "user", sessionId: "s", timestamp: "2026-10-08T01:01:00Z", toolUseResult: { x: 1 } },
  { type: "assistant", sessionId: "s", timestamp: "2026-10-08T01:02:00Z", message: "비밀 답" },
];

describe("고른 폴더에서 세션 기록만 고르기", () => {
  it(".claude를 골라도 projects 아래 기록만 본다(입력 기록 history.jsonl 등은 빼고)", () => {
    const picked = selectSessionFiles(
      [
        { path: ".claude/history.jsonl" },
        { path: ".claude/projects/a/s1.jsonl" },
        { path: ".claude/projects/a/notes.md" },
        { path: ".claude/settings.json" },
      ],
      "claude",
    );
    expect(picked.map((f) => f.path)).toEqual([".claude/projects/a/s1.jsonl"]);
  });

  it("Codex는 sessions 아래 rollout 기록만 본다 — auth.json은 열지 않는다", () => {
    const picked = selectSessionFiles(
      [
        { path: ".codex/auth.json" },
        { path: ".codex/session_index.jsonl" },
        { path: ".codex/sessions/2026/10/08/rollout-1.jsonl" },
      ],
      "codex",
    );
    expect(picked.map((f) => f.path)).toEqual([".codex/sessions/2026/10/08/rollout-1.jsonl"]);
  });

  it("projects 폴더 자체를 골랐으면 그 안의 기록을 본다", () => {
    const picked = selectSessionFiles([{ path: "a/s1.jsonl" }, { path: "a/b.txt" }], "claude");
    expect(picked.map((f) => f.path)).toEqual(["a/s1.jsonl"]);
  });
});

describe("기록 파일 읽기", () => {
  it("질문 시각만 꺼내고 내용은 담지 않는다", async () => {
    const session = await readSessionFile(file("s1.jsonl", jsonl(claudeLines)), "claude");
    expect(session.prompts).toEqual([Date.parse("2026-10-08T01:00:00Z")]);
    expect(JSON.stringify(session)).not.toMatch(/비밀/);
  });

  it("줄이 조각나 들어와도(큰 파일) 끝 줄까지 읽고, 깨진 줄은 건너뛴다", async () => {
    const text = `${jsonl(claudeLines)}\n{broken\n${JSON.stringify(claudeLines[0])}`;
    const session = await readSessionFile(file("s.jsonl", text), "claude");
    expect(session.prompts).toHaveLength(2);
  });

  it("Codex 요금제를 꺼낸다", async () => {
    const text = jsonl([
      { timestamp: "2026-10-08T01:00:00Z", type: "session_meta", payload: { id: "x" } },
      {
        timestamp: "2026-10-08T01:00:01Z",
        type: "event_msg",
        payload: { type: "user_message", message: "비밀 질문" },
      },
      {
        timestamp: "2026-10-08T01:00:02Z",
        type: "event_msg",
        payload: { type: "token_count", rate_limits: { plan_type: "plus", primary: {} } },
      },
    ]);
    const session = await readSessionFile(file("rollout-1.jsonl", text), "codex");
    expect(session).toMatchObject({ planType: "plus", subscription: true });
    expect(session.prompts).toHaveLength(1);
  });

  it("기간보다 앞에 고친 파일은 열지 않는다", async () => {
    const result = await readSessionFiles(
      [
        { path: "projects/a/new.jsonl", file: file("new.jsonl", jsonl(claudeLines)) },
        {
          path: "projects/a/old.jsonl",
          file: file("old.jsonl", jsonl(claudeLines), Date.parse("2026-08-01T00:00:00Z")),
        },
      ],
      "claude",
      Date.parse("2026-09-08T00:00:00Z"),
    );
    expect(result.files).toBe(1);
    expect(result.sessions).toHaveLength(1);
  });
});

describe("기록 폴더 경로", () => {
  it("윈도우는 C 드라이브 사용자 폴더 아래 경로를, 맥은 ~ 경로를 보인다", () => {
    expect(folderPath("claude", "windows", "user")).toBe(
      String.raw`C:\Users\user\.claude\projects`,
    );
    expect(folderPath("codex", "windows", "user")).toBe(String.raw`C:\Users\user\.codex\sessions`);
    expect(folderPath("claude", "mac", "")).toBe("~/.claude/projects");
  });

  it("폴더 이름에 못 쓰는 글자는 사용자 이름으로 받지 않는다", () => {
    expect(isWindowsUserName("user")).toBe(true);
    expect(isWindowsUserName("홍길동")).toBe(true);
    expect(isWindowsUserName("")).toBe(false);
    expect(isWindowsUserName(String.raw`a\b`)).toBe(false);
    expect(isWindowsUserName("a:b")).toBe(false);
  });
});

describe("picksFile", () => {
  it("Cursor만 폴더 대신 파일을 고른다(브라우저가 AppData 폴더를 열지 않는다)", () => {
    expect(picksFile("cursor")).toBe(true);
    expect(picksFile("claude")).toBe(false);
    expect(picksFile("codex")).toBe(false);
    expect(picksFile("antigravity")).toBe(false);
  });
});
