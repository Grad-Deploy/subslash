/**
 * 웹의 'PC 기록 읽기'(/pc-usage). 사용자가 고른 AI 코딩 도구의 기록 폴더를 **브라우저가 기기 안에서** 읽어 질문
 * 시각만 센다(`@subslash/shared`의 cliUsage — 명령줄 도구와 같은 함수). 파일은 서버로 가지 않는다.
 *
 * - Claude Code·Codex는 JSONL 세션 기록: `projects` 아래 `.jsonl`, `sessions` 아래 `rollout-*.jsonl`만 연다.
 *   위 폴더(`.claude`·`.codex`)를 골라도 다른 파일은 열지 않는다 — `.codex`에는 로그인 토큰(`auth.json`)이 있다.
 * - Cursor·Antigravity는 SQLite: 정해진 파일 하나(와 WAL)만 찾아 sql.js로 열고, 공유 SQL로 필요한 칸만 조회한다.
 *   Cursor의 `state.vscdb`에는 로그인 토큰도 들어 있어 파일이 메모리에 올라오지만 그 칸은 조회하지 않는다.
 */
export type { CliTool } from "@subslash/shared";
export * from "./tools";
export * from "./select";
export * from "./read";
export { pickSessionFolder } from "./pick";
