/**
 * 서버와 공개 웹 주소를 한곳에서 만든다.
 *
 * 웹에서는 화면과 API가 같은 사이트에 있어 상대 주소(/api/...)로 충분하다. 앱(Capacitor)에서는
 * 화면이 앱 안에 들어 있어 상대 주소가 앱 자신(capacitor://localhost)을 가리키므로, 앱을 빌드할
 * 때 NEXT_PUBLIC_WEB_ORIGIN에 배포된 웹 주소를 넣는다. 웹 빌드에서는 비워 둔다 — 그래야 미리보기
 * 배포가 운영 API를 부르지 않는다.
 */
import { IS_APP_BUILD } from "./platform";
import { loadSessionToken, trackSessionResponse } from "./session-token";

const WEB_ORIGIN = (process.env.NEXT_PUBLIC_WEB_ORIGIN ?? "").replace(/\/+$/, "");

/** 서버 API 주소. 웹에서는 상대 주소 그대로다. */
export function apiUrl(path: `/api/${string}`): string {
  return `${WEB_ORIGIN}${path}`;
}

/**
 * 로그인이 필요한 API 요청(서버가 readSessionToken으로 읽는 곳 전부). 웹은 세션 쿠키를 싣는다. 앱은 화면이 다른 출처라 쿠키가 실리지 않으므로
 * 보관한 세션 토큰을 Authorization 헤더로 싣고, 응답에 새 토큰이 있으면 보관한다
 * (lib/session-token).
 *
 * 알림 동기화(lib/notify-client)는 로그인과 무관한 자기 토큰을 쓰므로 이것을 쓰지 않는다.
 */
export async function apiFetch(path: `/api/${string}`, init: RequestInit = {}): Promise<Response> {
  if (!IS_APP_BUILD) return fetch(apiUrl(path), { ...init, credentials: "same-origin" });

  const token = await loadSessionToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(apiUrl(path), { ...init, headers, credentials: "omit" });
  await trackSessionResponse(path, init.method ?? "GET", res);
  return res;
}

/**
 * 남에게 보낼 링크(공유 카드 등)의 주소. 앱 안의 주소는 다른 사람이 열 수 없으므로 앱에서는
 * 배포된 웹 주소를 쓴다. 웹에서는 지금 보고 있는 사이트(미리보기 배포 포함)의 주소다.
 */
export function webUrl(path: `/${string}`): string {
  const origin = WEB_ORIGIN || window.location.origin;
  return `${origin}${path}`;
}
