"use client";

import dynamic from "next/dynamic";
import { IS_APP_BUILD } from "@lib/platform";

/**
 * 앱(Capacitor) 첫 실행 인트로·환영 화면의 진입점. layout.tsx는 이 얇은 컴포넌트만 안다.
 *
 * "./AppLaunchFlow"처럼 상대 경로로 바로 불러오면, 웹 빌드에서도 번들러가 그 청크를 만들어
 * 낸다 — 이 아래 조건 때문에 실행되지는 않아도 파일로는 남아, 환영 화면 문구가 웹 번들
 * (.next/static)에 나타난다. 그래서 "virtual:app-launch-flow"라는 가상 지정자로 불러오고,
 * next.config.ts의 turbopack.resolveAlias가 빌드 대상에 따라 진짜 구현(AppLaunchFlow) 또는
 * 아무 것도 하지 않는 스텁(AppLaunchFlowStub)으로 바꿔 끼운다.
 */
const AppLaunchFlow = dynamic(() => import("virtual:app-launch-flow"), { ssr: false });

export function AppLaunch() {
  if (!IS_APP_BUILD) return null;
  return <AppLaunchFlow />;
}
