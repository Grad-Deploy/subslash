"use client";

import { useEffect, useRef, useState } from "react";
import { hasSeenWelcome } from "@lib/welcome";
import { AppIntro } from "./AppIntro";
import { AppWelcome } from "./AppWelcome";

/**
 * 인트로는 앱 프로세스당 한 번만. 화면 이동으로 AppLaunch가 다시 마운트돼도(레이아웃이 다시
 * 그려지는 경우 등) 재생되지 않게 모듈 스코프에 둔다.
 */
let introShown = false;

type Phase = "intro" | "welcome" | "done";

export default function AppLaunchFlow() {
  const [phase, setPhase] = useState<Phase>(() => (introShown ? "done" : "intro"));
  // 인트로가 끝나는 순간 지연 없이 다음 화면을 고르기 위해 재생 중에 미리 읽어 둔다.
  const seenWelcome = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    if (phase !== "intro") return;
    introShown = true;
    seenWelcome.current ??= hasSeenWelcome();
  }, [phase]);

  if (phase === "done") return null;

  if (phase === "intro") {
    return (
      <AppIntro
        onDone={() => {
          void (seenWelcome.current ?? hasSeenWelcome()).then((seen) => {
            setPhase(seen ? "done" : "welcome");
          });
        }}
      />
    );
  }

  return <AppWelcome onDone={() => setPhase("done")} />;
}
