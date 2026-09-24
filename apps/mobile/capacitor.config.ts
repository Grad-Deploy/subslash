import type { CapacitorConfig } from "@capacitor/cli";

/**
 * 앱은 웹 화면을 정적으로 내보낸 것(apps/web의 `pnpm build:app` → out/)을 담고, API는 배포된 웹을
 * 부른다(apps/web/lib/api). 안드로이드 화면의 출처는 https://localhost다 — 서버의 CORS가 이 출처만
 * 연다(apps/web/lib/app-origins). 스킴이나 호스트를 바꾸면 그 목록도 함께 바꾼다.
 *
 * appId는 스토어에 올리면 바꿀 수 없다.
 */
const config: CapacitorConfig = {
  appId: "com.subslash.app",
  appName: "SubSlash",
  webDir: "../web/out",
  // 웹뷰가 첫 화면을 그리기 전의 바탕색. 기본값(흰색)이면 검은 실행 화면 사이에 흰 화면이 번쩍인다.
  // 실행 화면·웹 manifest의 background_color와 같은 브랜드 검정.
  backgroundColor: "#09090B",
};

export default config;
