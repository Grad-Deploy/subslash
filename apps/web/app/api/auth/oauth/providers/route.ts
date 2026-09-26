import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@lib/db";
import { OAUTH_PROVIDER_LABEL, enabledProviders } from "@lib/oauth";
import { isSocialLoginOpen } from "@lib/privacy";

/**
 * 로그인·가입 화면에 둘 소셜 로그인 버튼. 방침 시행 전(isSocialLoginOpen)이거나 앱 키가 없는 제공자는
 * 빼고, 앱 빌드도 같은 목록을 쓰도록 서버가 정한다(정적 화면은 서버 환경 변수를 모른다).
 */
export function GET() {
  const open = isSocialLoginOpen() && isDatabaseConfigured();
  const providers = open
    ? enabledProviders().map((id) => ({ id, label: OAUTH_PROVIDER_LABEL[id] }))
    : [];
  return NextResponse.json({ providers }, { headers: { "Cache-Control": "no-store" } });
}
