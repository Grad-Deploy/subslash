/**
 * 메일 링크의 토큰. 주소의 `?` 뒤는 서버 요청 로그(Vercel)에 남으므로 새 메일은 `#` 뒤에 싣고, API에도 헤더로 보낸다.
 * 이미 보낸 메일의 `?token=`도 읽는다. 읽은 뒤에는 주소창에서 지워 방문 기록·동기화에 남는 것을 줄인다.
 */
export const LINK_TOKEN_HEADER = "x-link-token";

/** 브라우저에서만 부른다. */
export function takeLinkToken(): string | null {
  const url = new URL(window.location.href);
  const token =
    new URLSearchParams(url.hash.slice(1)).get("token") ?? url.searchParams.get("token");
  if (token) {
    url.hash = "";
    url.searchParams.delete("token");
    window.history.replaceState(window.history.state, "", url.pathname + url.search);
  }
  return token;
}
