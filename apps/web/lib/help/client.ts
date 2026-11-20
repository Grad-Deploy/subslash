import { readApiError, apiPostJson } from "@lib/api";
import { isBlockedQuestion } from "@lib/ask/attack";

/**
 * 도움말 AI에 질문을 보내고 고른 도움말 id를 받는다. 받은 id가 지금 화면의 목록에 있는지는 화면이 확인한다. 로그인했으면
 * 계정마다 횟수를 세도록 `apiFetch`로 보낸다(lib/ask/guard).
 */
export async function askHelp(question: string): Promise<string[]> {
  // 공격 문구·언어가 섞인 질문은 서버로 보내지 않는다 — 서버도 막지만 횟수를 쓰지 않게 기기에서 먼저 끝낸다.
  if (isBlockedQuestion(question)) return [];
  const response = await apiPostJson("/api/help-ask", { question });
  if (!response.ok) throw new Error(await readApiError(response, "지금은 답할 수 없어요."));
  const { ids } = (await response.json()) as { ids?: unknown };
  return Array.isArray(ids)
    ? ids.filter((id): id is string => typeof id === "string").slice(0, 2)
    : [];
}
