/**
 * 구독 상세 페이지 주소.
 *
 * 구독 ID는 브라우저에서 만든 값이라, 경로(/subs/<id>)로 두면 페이지를 미리 만들어 둘 수 없고
 * 앱(Capacitor)에 화면을 정적으로 담을 수 없다. 그래서 주소 파라미터로 넘긴다. 예전 주소는
 * next.config의 redirects가 이리로 보낸다.
 */
export function subscriptionDetailHref(id: string): string {
  return `/subs/detail?id=${encodeURIComponent(id)}`;
}
