import { apiFetch, readApiError } from "@lib/api";
import {
  MAX_ASK_HISTORY,
  isContextTurn,
  isValidAskCall,
  type AskCall,
  type AskTurn,
} from "./tools";

/**
 * 질문을 서버에 보내고 AI가 고른 도구를 받는다. 로그인 없이도 되지만 `apiFetch`로 보낸다 — 로그인했으면 서버가 IP가
 * 아니라 계정마다 횟수를 센다(lib/ask/guard). 앱은 쿠키가 실리지 않아 `fetch`로는 늘 IP로 세였다. 받은 호출도
 * 다시 확인한다 — 서버가 확인했어도, 기기에서 계산에 넘기기 전에 한 번 더 본다.
 *
 * `history`는 같은 대화의 앞선 턴(질문과 고른 호출)이다. 최근 `MAX_ASK_HISTORY`개만 보내고, 답은 보내지 않는다.
 */
export async function askReport(
  question: string,
  history: readonly AskTurn[] = [],
): Promise<AskCall> {
  const recent = history.filter(isContextTurn).slice(-MAX_ASK_HISTORY);
  const response = await apiFetch("/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recent.length > 0 ? { question, history: recent } : { question }),
  });
  if (!response.ok) throw new Error(await readApiError(response, "지금은 답할 수 없어요."));
  const { call } = (await response.json()) as { call?: unknown };
  return isValidAskCall(call) ? call : { tool: "unsupported" };
}
