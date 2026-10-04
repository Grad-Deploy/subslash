"use client";

/**
 * 앱 첫 실행·재실행 인트로와 소개 슬라이드의 진짜 구현. 이 파일을 직접 import하는 곳이 없는 것이 정상이다 —
 * AppLaunch가 "virtual:app-launch-flow"로 불러오고, next.config.ts의 turbopack.resolveAlias가 앱 빌드에서만
 * 이 파일로, 웹 빌드에서는 AppLaunchFlowStub으로 바꿔 끼운다(웹 번들에 앱 화면 문구가 들어가지 않게).
 * 타입은 virtual-app-launch-flow.d.ts가 선언한다. 지우거나 이름을 바꾸면 next.config.ts도 함께 고친다.
 */

import { useEffect, useRef, useState } from "react";
import { hasSeenOnboarding } from "@lib/onboarding-seen";
import { AppIntro, RELAUNCH_HOLD_MS } from "./AppIntro";
import { AppOnboarding } from "./onboarding/AppOnboarding";

/**
 * 실행 화면은 앱 프로세스당 한 번만. 화면 이동으로 AppLaunch가 다시 마운트돼도(레이아웃이 다시
 * 그려지는 경우 등) 다시 나오지 않게 모듈 스코프에 둔다.
 */
let launchShown = false;

/**
 * - pending: 소개를 본 적 있는지 읽는 중. AppLaunch의 검은 덮개가 화면을 가리고 있다.
 * - intro → onboarding: 처음 실행(소개를 아직 안 봄). 긴 인트로 뒤 옆으로 넘기는 소개(AppOnboarding).
 * - brief → done: 다시 실행. 같은 인트로(로고를 가르는 동작)를 로고가 머무는 시간만 줄여 보여주고
 *   소개 없이 넘긴다. 예전에는 가르는 동작 없이 로고만 잠깐 보여줬는데, 앱의 인상인 슬래시가
 *   처음 실행에만 나와 "애니메이션이 사라졌다"로 읽혔다. 탭하면 바로 넘어간다.
 */
type Phase = "pending" | "intro" | "brief" | "onboarding" | "done";

export default function AppLaunchFlow({ onReady }: { onReady: () => void }) {
  const [phase, setPhase] = useState<Phase>(() => (launchShown ? "done" : "pending"));
  const onReadyRef = useRef(onReady);
  const readyCalled = useRef(false);

  useEffect(() => {
    onReadyRef.current = onReady;
  });

  useEffect(() => {
    if (phase !== "pending") return;
    launchShown = true;
    let cancelled = false;
    void hasSeenOnboarding().then((seen) => {
      if (!cancelled) setPhase(seen ? "brief" : "intro");
    });
    return () => {
      cancelled = true;
    };
  }, [phase]);

  // 검은 바탕의 실행 화면이 그려진 뒤에(또는 보여줄 것이 없으면 곧바로) 덮개를 걷는다.
  useEffect(() => {
    if (phase === "pending" || readyCalled.current) return;
    readyCalled.current = true;
    onReadyRef.current();
  }, [phase]);

  if (phase === "pending" || phase === "done") return null;
  if (phase === "brief")
    return <AppIntro holdMs={RELAUNCH_HOLD_MS} revealOnExit onDone={() => setPhase("done")} />;
  // 인트로의 바깥 판(overlay)은 끝까지 검은색이라, 소개로 바뀌는 사이 홈 화면이 비치지 않는다.
  if (phase === "intro") return <AppIntro onDone={() => setPhase("onboarding")} />;
  return <AppOnboarding onDone={() => setPhase("done")} />;
}
