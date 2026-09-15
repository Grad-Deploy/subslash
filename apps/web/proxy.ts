import { NextResponse, type NextRequest } from "next/server";
import { isAppOrigin } from "./lib/app-origins";

/**
 * 앱(Capacitor)에서 오는 API 요청의 CORS. Next.js 16부터 middleware는 proxy라는 이름을 쓴다.
 *
 * 앱의 화면은 capacitor://localhost 같은 다른 출처에서 돌므로, 브라우저(WebView)가 API 응답을
 * 화면에 넘겨주려면 이 출처를 허용한다는 헤더가 있어야 한다. 앱 출처만 허용하고 나머지는 손대지
 * 않는다 — 웹은 같은 출처라 CORS가 필요 없다.
 *
 * 쿠키는 다른 출처로 보내지 않는다(Allow-Credentials 없음). 앱은 세션 토큰을
 * `Authorization` 헤더로 보낸다(auth-server의 readSessionToken).
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  // If-Match·If-None-Match: 계정 기록 자동 동기화의 조건부 저장(app/api/account/snapshot).
  "Access-Control-Allow-Headers": "Content-Type, Authorization, If-Match, If-None-Match",
  "Access-Control-Max-Age": "600",
  Vary: "Origin",
};

export function proxy(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || !isAppOrigin(origin)) return NextResponse.next();

  // 사전 요청(preflight)은 라우트까지 가지 않고 여기서 답한다.
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: { ...CORS_HEADERS, "Access-Control-Allow-Origin": origin },
    });
  }

  const response = NextResponse.next();
  response.headers.set("Access-Control-Allow-Origin", origin);
  for (const [name, value] of Object.entries(CORS_HEADERS)) response.headers.set(name, value);
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
