import { apiFetch, readApiError } from "@lib/api";

/**
 * 도움말 AI에 질문을 보내고 고른 도움말 id를 받는다. 받은 id가 지금 화면의 목록에 있는지는 화면이 확인한다. 로그인했으면
 * 계정마다 횟수를 세도록 `apiFetch`로 보낸다(lib/ask/guard).
 */
export async function askHelp(question: string): Promise<string[]> {
  const response = await apiFetch("/api/help-ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  if (!response.ok) throw new Error(await readApiError(response, "지금은 답할 수 없어요."));
  const { ids } = (await response.json()) as { ids?: unknown };
  return Array.isArray(ids)
    ? ids.filter((id): id is string => typeof id === "string").slice(0, 2)
    : [];
}
