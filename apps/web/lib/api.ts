/**
 * 서버와 공개 웹 주소를 한곳에서 만든다.
 *
 * 웹에서는 화면과 API가 같은 사이트에 있어 상대 주소(/api/...)로 충분하다. 앱(Capacitor)에서는
 * 화면이 앱 안에 들어 있어 상대 주소가 앱 자신(https://localhost)을 가리키므로, 앱을 빌드할
 * 때 NEXT_PUBLIC_WEB_ORIGIN에 배포된 웹 주소를 넣는다. 웹 빌드에서는 비워 둔다 — 그래야 미리보기
 * 배포가 운영 API를 부르지 않는다.
 */
import { IS_APP_BUILD } from "./platform";
import { loadSessionToken, trackSessionResponse } from "./session-token";

const WEB_ORIGIN = (process.env.NEXT_PUBLIC_WEB_ORIGIN ?? "").replace(/\/+$/, "");

/**
 * API 요청 하나를 기다리는 시간. 브라우저의 fetch는 스스로 끊지 않아, 모바일 네트워크가 응답 없이 멈추면 몇 분 동안
 * 로딩이 돌고 그동안 자동 동기화도 다음 차례를 기다린다. 서버에서 오래 걸리는 단계(AI 10초, DB 요청마다 8초)보다
 * 넉넉히 둔다. 끊긴 요청은 네트워크 오류처럼 거절되므로 부르는 곳의 오류 처리를 그대로 탄다.
 */
export const API_TIMEOUT_MS = 30_000;

/** 부르는 곳이 넘긴 신호(취소)와 제한 시간 중 먼저 오는 것으로 끊는다. */
function withTimeout(signal: AbortSignal | null | undefined): AbortSignal {
  const timeout = AbortSignal.timeout(API_TIMEOUT_MS);
  if (!signal) return timeout;
  // AbortSignal.any가 없는 오래된 웹뷰에서는 부르는 곳의 취소를 지킨다 — 취소는 화면이 바뀌어 꼭 끊어야 하는 것이다.
  return typeof AbortSignal.any === "function" ? AbortSignal.any([signal, timeout]) : signal;
}

/** 서버 API 주소. 웹에서는 상대 주소 그대로다. */
export function apiUrl(path: `/api/${string}`): string {
  return `${WEB_ORIGIN}${path}`;
}

/**
 * 로그인이 필요한 API 요청(서버가 readSessionToken으로 읽는 곳 전부). 웹은 세션 쿠키를 싣는다. 앱은 화면이 다른 출처라 쿠키가 실리지 않으므로
 * 보관한 세션 토큰을 Authorization 헤더로 싣고, 응답에 새 토큰이 있으면 보관한다
 * (lib/session-token).
 */
export async function apiFetch(path: `/api/${string}`, init: RequestInit = {}): Promise<Response> {
  const signal = withTimeout(init.signal);
  if (!IS_APP_BUILD) return fetch(apiUrl(path), { ...init, signal, credentials: "same-origin" });

  const token = await loadSessionToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(apiUrl(path), { ...init, headers, signal, credentials: "omit" });
  await trackSessionResponse(path, init.method ?? "GET", res);
  return res;
}

/** JSON 본문을 싣는 POST. `apiFetch`와 같고, 머리글과 직렬화를 부르는 곳마다 적지 않게 한다. */
export function apiPostJson(path: `/api/${string}`, body: unknown): Promise<Response> {
  return apiFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * 남에게 보낼 링크(공유 카드 등)의 주소. 앱 안의 주소는 다른 사람이 열 수 없으므로 앱에서는
 * 배포된 웹 주소를 쓴다. 웹에서는 지금 보고 있는 사이트(미리보기 배포 포함)의 주소다.
 */
export function webUrl(path: `/${string}`): string {
  const origin = WEB_ORIGIN || window.location.origin;
  return `${origin}${path}`;
}

/**
 * 실패한 API 응답에서 화면에 보여 줄 문장을 꺼낸다. 서버는 `{ error: "..." }`로 이유를 적고, 본문이
 * 없거나 JSON이 아니면 `fallback`을 쓴다.
 */
export async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const body = await response.json();
    return typeof body?.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}
