/**
 * 서버와 공개 웹 주소를 한곳에서 만든다.
 *
 * 웹에서는 화면과 API가 같은 사이트에 있어 상대 주소(/api/...)로 충분하다. 앱(Capacitor)에서는
 * 화면이 앱 안에 들어 있어 상대 주소가 앱 자신(capacitor://localhost)을 가리키므로, 앱을 빌드할
 * 때 NEXT_PUBLIC_WEB_ORIGIN에 배포된 웹 주소를 넣는다. 웹 빌드에서는 비워 둔다 — 그래야 미리보기
 * 배포가 운영 API를 부르지 않는다.
 */
const WEB_ORIGIN = (process.env.NEXT_PUBLIC_WEB_ORIGIN ?? "").replace(/\/+$/, "");

/** 서버 API 주소. 웹에서는 상대 주소 그대로다. */
export function apiUrl(path: `/api/${string}`): string {
  return `${WEB_ORIGIN}${path}`;
}

/**
 * 남에게 보낼 링크(공유 카드 등)의 주소. 앱 안의 주소는 다른 사람이 열 수 없으므로 앱에서는
 * 배포된 웹 주소를 쓴다. 웹에서는 지금 보고 있는 사이트(미리보기 배포 포함)의 주소다.
 */
export function webUrl(path: `/${string}`): string {
  const origin = WEB_ORIGIN || window.location.origin;
  return `${origin}${path}`;
}
