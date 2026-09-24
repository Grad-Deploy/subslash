/**
 * next.config.ts의 turbopack.resolveAlias가 빌드 대상에 따라 실제 파일로 바꿔 끼우는 가상
 * 지정자. 타입 검사기는 그 치환을 모르므로 모양만 선언해 둔다.
 */
declare module "virtual:app-launch-flow" {
  import type { ComponentType } from "react";

  const AppLaunchFlow: ComponentType<{
    /** 실행 화면이 검은 바탕으로 자리를 잡았을 때(AppLaunch의 덮개를 걷어도 될 때) 한 번 부른다. */
    onReady: () => void;
  }>;
  export default AppLaunchFlow;
}
