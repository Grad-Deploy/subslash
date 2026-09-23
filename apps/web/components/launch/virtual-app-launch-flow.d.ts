/**
 * next.config.ts의 turbopack.resolveAlias가 빌드 대상에 따라 실제 파일로 바꿔 끼우는 가상
 * 지정자. 타입 검사기는 그 치환을 모르므로 모양만 선언해 둔다.
 */
declare module "virtual:app-launch-flow" {
  import type { ComponentType } from "react";

  const AppLaunchFlow: ComponentType;
  export default AppLaunchFlow;
}
