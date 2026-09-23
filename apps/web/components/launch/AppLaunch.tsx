"use client";

import { useEffect, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { IS_APP_BUILD } from "@lib/platform";

/**
 * 앱(Capacitor) 실행 화면(인트로·짧은 로고·환영 화면)의 진입점. layout.tsx는 이 얇은 컴포넌트만 안다.
 *
 * "./AppLaunchFlow"처럼 상대 경로로 바로 불러오면, 웹 빌드에서도 번들러가 그 청크를 만들어
 * 낸다 — 이 아래 조건 때문에 실행되지는 않아도 파일로는 남아, 환영 화면 문구가 웹 번들
 * (.next/static)에 나타난다. 그래서 "virtual:app-launch-flow"라는 가상 지정자로 불러오고,
 * next.config.ts의 turbopack.resolveAlias가 빌드 대상에 따라 진짜 구현(AppLaunchFlow) 또는
 * 아무 것도 하지 않는 스텁(AppLaunchFlowStub)으로 바꿔 끼운다.
 */
const AppLaunchFlow = dynamic(() => import("virtual:app-launch-flow"), { ssr: false });

/**
 * 실행 화면 청크는 페이지가 그려진 뒤에 따로 받아진다. 그 사이 홈 화면이 잠깐 보였다가 인트로가
 * 덮는 깜빡임이 있었다. 정적 HTML에 처음부터 검은 덮개를 넣어 두고, 실행 화면이 자리를 잡으면
 * (onReady) 걷는다. 전역 CSS를 건드리지 않도록 인라인 스타일로 둔다. 웹 빌드에서는 그리지 않는다.
 */
const COVER_STYLE: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  background: "#09090B",
};

/** 실행 화면 청크를 끝내 못 불러와도 앱을 못 쓰게 되지 않도록, 이 시간이 지나면 덮개를 걷는다. */
const COVER_FALLBACK_MS = 5000;

export function AppLaunch() {
  const [covered, setCovered] = useState(true);

  useEffect(() => {
    if (!IS_APP_BUILD) return;
    const timer = window.setTimeout(() => setCovered(false), COVER_FALLBACK_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!IS_APP_BUILD) return null;
  return (
    <>
      {covered && <div aria-hidden="true" style={COVER_STYLE} />}
      <AppLaunchFlow onReady={() => setCovered(false)} />
    </>
  );
}
