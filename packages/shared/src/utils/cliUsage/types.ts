import type { ApiTokenUsage } from "../../constants/aiApiPrices";

/**
 * PC의 AI 코딩 도구와 그 사용으로 세는 구독(SubSlash 서비스 목록의 id). 명령줄 도구·웹의 'PC 기록 읽기'·링크가
 * 모두 이 표를 쓴다 — 도구를 더하면 여기에 더한다.
 */
export const CLI_TOOL_SERVICE = {
  claude: "claude-pro",
  codex: "chatgpt-plus",
  cursor: "cursor-pro",
  antigravity: "google-ai-pro",
} as const;

export type CliTool = keyof typeof CLI_TOOL_SERVICE;
export type CliServiceId = (typeof CLI_TOOL_SERVICE)[CliTool];

/** 도구 순서(화면·출력에 보이는 순서). */
export const CLI_TOOLS = Object.keys(CLI_TOOL_SERVICE) as CliTool[];
export const CLI_SERVICES = Object.values(CLI_TOOL_SERVICE) as CliServiceId[];

/** 기록 하나(세션 파일·DB 하나)에서 꺼낸 것. */
export interface CliSessionUsage {
  /** 사람이 질문을 보낸 시각(epoch ms). */
  prompts: number[];
  /**
   * 구독 로그인으로 썼는지. true: 구독, false: API 키·무료 요금제 등 구독이 아님, null: 기록만으로는 모름.
   * 구독이 아닌 사용은 구독을 얼마나 쓰는지와 상관이 없으므로 세지 않는다.
   */
  subscription: boolean | null;
  /** 기록에 적힌 요금제(Codex의 `plan_type`, Cursor의 요금제 칸). 모르면 null. */
  planType: string | null;
  /** 이 형식의 줄을 하나라도 알아봤는지. false면 형식이 바뀐 것일 수 있다. */
  recognized: boolean;
  /** 응답(요청)마다 쓴 토큰. API로 냈다면 얼마였는지 환산하는 데 쓴다(constants/aiApiPrices). */
  tokens: CliTokenRecord[];
}

/** 응답 하나가 쓴 토큰과 그 시각. */
export interface CliTokenRecord extends ApiTokenUsage {
  at: number;
  /** 응답 id. 같은 응답이 여러 줄·여러 파일에 적혀도 한 번만 센다. 모르면 null. */
  id: string | null;
  /** 빠른 모드(요금이 다르다). 요금을 확인하지 못해 환산하지 않는다. */
  fast: boolean;
}

/** 기록 한 줄(JSON 객체). */
export type CliLogLine = Record<string, unknown>;
