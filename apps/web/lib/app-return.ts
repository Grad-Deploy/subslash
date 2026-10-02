/**
 * 인앱 브라우저에서 마친 간편 로그인·로그인 방법 연결이 앱으로 돌아오는 주소(`<앱 ID>://oauth-done?…`).
 *
 * 예전에는 끝 화면(`/oauth/done`)이 "이 창을 닫으면 앱으로 돌아갑니다"만 말했다. 카카오 화면에서
 * '카카오톡으로 로그인'을 고르면 카카오톡이 인앱 브라우저가 아니라 Chrome으로 돌려보내, 사용자는 웹에
 * 남은 채 그다음도 웹에서 했다. 이제 끝 화면이 이 주소로 앱을 연다.
 *
 * 스킴은 앱 ID다. 매니페스트(`${applicationId}`)와 iOS URL 타입이 같은 값을 등록하므로, 테스트용 앱
 * (`.dev`)은 스토어 앱이 아니라 자기에게 돌아온다. 아무 스킴이나 받으면 끝 화면이 남의 앱을 여는 데
 * 쓰이므로 이 목록만 받는다. 주소에는 결과(실패 이유·연결한 제공자)만 싣는다 — 다른 앱이 같은 스킴을
 * 가로채도 세션은 앱이 쥔 verifier로만 받으므로(`/api/auth/oauth/claim`) 얻는 것이 없다.
 *
 * 서버(시작·콜백)와 화면(끝 화면·앱)이 함께 쓰므로 서버 모듈을 끌어오지 않는다.
 */

export const APP_RETURN_SCHEMES: readonly string[] = ["com.subslash.app", "com.subslash.app.dev"];

export const APP_RETURN_HOST = "oauth-done";

export function isAppReturnScheme(value: unknown): value is string {
  return typeof value === "string" && APP_RETURN_SCHEMES.includes(value);
}

/** 끝 화면이 열 앱 주소. 결과 쿼리를 그대로 옮긴다. */
export function appReturnUrl(scheme: string, result: URLSearchParams): string {
  const query = result.toString();
  return `${scheme}://${APP_RETURN_HOST}${query ? `?${query}` : ""}`;
}

/** 앱이 받은 주소가 돌아오는 주소면 그 결과 쿼리. 아니면 null. */
export function parseAppReturn(url: string): URLSearchParams | null {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(/:$/, "");
    if (!isAppReturnScheme(scheme) || parsed.host !== APP_RETURN_HOST) return null;
    return parsed.searchParams;
  } catch {
    return null;
  }
}
