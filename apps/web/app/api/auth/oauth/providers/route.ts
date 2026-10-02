import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@lib/db";
import { OAUTH_PROVIDER_LABEL, enabledProviders, nativeProviders } from "@lib/oauth";
import { isSocialLoginOpen } from "@lib/privacy";

/**
 * 로그인·가입 화면에 둘 소셜 로그인 버튼. 방침 시행 전(isSocialLoginOpen)이거나 앱 키가 없는 제공자는
 * 빼고, 앱 빌드도 같은 목록을 쓰도록 서버가 정한다(정적 화면은 서버 환경 변수를 모른다).
 * `native`는 앱이 인앱 브라우저 대신 SDK(카카오톡)로 로그인할 수 있는 제공자다.
 */
export function GET() {
  const open = isSocialLoginOpen() && isDatabaseConfigured();
  const providers = open
    ? enabledProviders().map((id) => ({ id, label: OAUTH_PROVIDER_LABEL[id] }))
    : [];
  // 앱이 SDK로 로그인할 수 있는 제공자(앱의 KakaoLoginPlugin). 웹 버튼이 있는 것 가운데 서버가 토큰을
  // 확인할 수 있는 것만 — 없으면 앱도 인앱 브라우저로 한다.
  const native = open
    ? nativeProviders().filter((id) => providers.some((provider) => provider.id === id))
    : [];
  return NextResponse.json({ providers, native }, { headers: { "Cache-Control": "no-store" } });
}
