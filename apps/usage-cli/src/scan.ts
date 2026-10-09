import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { claudeSession, codexSession, parseLine, type SessionUsage } from "./parse.js";

/** 기록 파일 한 줄씩 읽는다. 파일 전체를 메모리에 올리지 않는다(세션 기록은 수십 MB가 되기도 한다). */
async function readLines(path: string) {
  const lines = [];
  const reader = createInterface({ input: createReadStream(path, "utf8"), crlfDelay: Infinity });
  for await (const text of reader) {
    const line = parseLine(text);
    if (line) lines.push(line);
  }
  return lines;
}

/** `dir` 아래에서 `since` 뒤에 고친 .jsonl 파일. 고친 시각이 그보다 앞이면 그 안의 질문도 그보다 앞이다. */
function recentJsonl(dir: string, since: number, depth: number): string[] {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (depth > 0) found.push(...recentJsonl(path, since, depth - 1));
    } else if (entry.name.endsWith(".jsonl")) {
      try {
        if (statSync(path).mtimeMs >= since) found.push(path);
      } catch {
        // 읽는 동안 지워진 파일은 건너뛴다.
      }
    }
  }
  return found;
}

export interface ToolScan {
  /** 기록 폴더가 있는지(설치해 쓴 적이 있는지). */
  installed: boolean;
  sessions: SessionUsage[];
  /** 지금 로그인 상태로 본 구독 여부. 기록에 구독 여부가 없는 세션에 쓴다. 모르면 null. */
  subscriptionDefault: boolean | null;
  /** 알아보지 못한 파일 수(형식이 바뀌었을 수 있다). */
  unrecognizedFiles: number;
}

function readJson(path: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(readFileSync(path, "utf8"));
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Claude Code. 세션 기록은 `~/.claude/projects/<프로젝트>/<세션>.jsonl`이다. 기록에는 어떤 계정으로 썼는지가
 * 없어서, 지금 구독 계정으로 로그인했는지(`~/.claude.json`의 `oauthAccount`)로 본다. API 키를 환경 변수로
 * 주면 그 키가 먼저 쓰이므로 구독으로 보지 않는다.
 */
export async function scanClaudeCode(since: number, home = homedir()): Promise<ToolScan> {
  const dir = join(home, ".claude", "projects");
  const installed = existsSync(dir);
  const config = readJson(join(home, ".claude.json"));
  const subscriptionDefault = process.env.ANTHROPIC_API_KEY
    ? false
    : config
      ? Boolean(config.oauthAccount)
      : null;
  const sessions: SessionUsage[] = [];
  let unrecognizedFiles = 0;
  for (const path of recentJsonl(dir, since, 1)) {
    const session = claudeSession(await readLines(path));
    if (!session.recognized) unrecognizedFiles += 1;
    sessions.push(session);
  }
  return { installed, sessions, subscriptionDefault, unrecognizedFiles };
}

/**
 * Codex. 세션 기록은 `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`이다. 세션마다 ChatGPT 요금제가 적혀
 * 있으면 그것으로, 없으면 지금 인증 방식(`~/.codex/auth.json`의 `auth_mode`)으로 본다.
 */
export async function scanCodex(since: number, home = homedir()): Promise<ToolScan> {
  const codexHome = process.env.CODEX_HOME || join(home, ".codex");
  const dir = join(codexHome, "sessions");
  const installed = existsSync(dir);
  const auth = readJson(join(codexHome, "auth.json"));
  const mode = auth?.auth_mode;
  const subscriptionDefault = mode === "chatgpt" ? true : typeof mode === "string" ? false : null;
  const sessions: SessionUsage[] = [];
  let unrecognizedFiles = 0;
  for (const path of recentJsonl(dir, since, 3)) {
    const session = codexSession(await readLines(path));
    if (!session.recognized) unrecognizedFiles += 1;
    sessions.push(session);
  }
  return { installed, sessions, subscriptionDefault, unrecognizedFiles };
}
