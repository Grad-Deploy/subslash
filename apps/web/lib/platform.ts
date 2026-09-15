/**
 * 앱(Capacitor)에 담을 정적 빌드인지. `pnpm build:app`(scripts/build-app.ts)이 켠다.
 *
 * 앱에서만 달라지는 동작(서비스 워커를 등록하지 않는 것 등)은 이 값으로 가른다. 웹 빌드와 개발
 * 서버에서는 늘 false다.
 */
export const IS_APP_BUILD = process.env.NEXT_PUBLIC_BUILD_TARGET === "app";
