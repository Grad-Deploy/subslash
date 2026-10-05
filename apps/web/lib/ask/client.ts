import { apiUrl, readApiError } from "@lib/api";
import { isValidAskCall, type AskCall } from "./tools";

/**
 * 질문을 서버에 보내고 AI가 고른 도구를 받는다. 로그인이 필요 없어 `apiFetch`가 아니라 `fetch`로 부른다. 받은 호출도
 * 다시 확인한다 — 서버가 확인했어도, 기기에서 계산에 넘기기 전에 한 번 더 본다.
 */
export async function askReport(question: string): Promise<AskCall> {
  const response = await fetch(apiUrl("/api/ask"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) throw new Error(await readApiError(response, "지금은 답할 수 없어요."));
  const { call } = (await response.json()) as { call?: unknown };
  return isValidAskCall(call) ? call : { tool: "unsupported" };
}
