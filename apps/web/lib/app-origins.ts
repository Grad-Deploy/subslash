/**
 * 앱(Capacitor)의 화면이 도는 출처(Origin).
 *
 * 앱은 웹 화면을 앱 안에 담아 이 출처에서 열고, API는 배포된 웹 주소로 부른다(lib/api).
 * iOS는 capacitor://localhost, 안드로이드는 https://localhost가 Capacitor 기본값이다. 앱
 * 설정에서 스킴이나 호스트를 바꾸면 여기도 바꾼다.
 *
 * 이 파일은 proxy.ts(CORS)도 읽으므로 다른 모듈을 가져오지 않는다.
 */
export const APP_ORIGINS: readonly string[] = ["capacitor://localhost", "https://localhost"];

export function isAppOrigin(origin: string | null | undefined): boolean {
  return !!origin && APP_ORIGINS.includes(origin);
}
