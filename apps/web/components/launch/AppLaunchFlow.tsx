"use client";

import { useEffect, useRef, useState } from "react";
import { hasSeenWelcome } from "@lib/welcome";
import { AppIntro } from "./AppIntro";
import { AppBrandSplash } from "./AppBrandSplash";
import { AppWelcome } from "./AppWelcome";

/**
 * 실행 화면은 앱 프로세스당 한 번만. 화면 이동으로 AppLaunch가 다시 마운트돼도(레이아웃이 다시
 * 그려지는 경우 등) 다시 나오지 않게 모듈 스코프에 둔다.
 */
let launchShown = false;

/**
 * - pending: 환영 화면을 본 적 있는지 읽는 중. AppLaunch의 검은 덮개가 화면을 가리고 있다.
 * - intro → welcome: 처음 실행(환영 화면을 아직 안 봄). 긴 인트로 뒤 환영 화면.
 * - brief → done: 다시 실행. 로고와 이름만 잠깐 보여주고 넘긴다. 매번 긴 인트로를 보면 앱을
 *   여는 데 방해가 된다.
 */
type Phase = "pending" | "intro" | "brief" | "welcome" | "done";

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
    void hasSeenWelcome().then((seen) => {
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
  if (phase === "brief") return <AppBrandSplash onDone={() => setPhase("done")} />;
  // 인트로의 바깥 판(overlay)은 끝까지 검은색이라, 환영 화면으로 바뀌는 사이 홈 화면이 비치지 않는다.
  if (phase === "intro") return <AppIntro onDone={() => setPhase("welcome")} />;
  return <AppWelcome onDone={() => setPhase("done")} />;
}
