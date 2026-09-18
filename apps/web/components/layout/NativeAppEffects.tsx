"use client";

import { useEffect } from "react";
import { IS_APP_BUILD } from "@lib/platform";
import { restoreRecords } from "@lib/mirrored-storage";
import { useStore } from "@lib/store";

/**
 * 앱(Capacitor)에서만 하는 시작 작업. 웹에서는 아무것도 하지 않는다.
 *
 * 운영체제가 웹뷰 저장소를 비웠으면 기기 저장소의 사본으로 기록을 되살리고 스토어가 다시 읽게
 * 한다(lib/mirrored-storage).
 */
export function NativeAppEffects() {
  useEffect(() => {
    if (!IS_APP_BUILD) return;
    void restoreRecords(useStore.persist.getOptions().name ?? "").then((restored) => {
      if (restored) return useStore.persist.rehydrate();
    });
  }, []);

  return null;
}
