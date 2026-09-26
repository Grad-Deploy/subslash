"use client";

import { useAutoCheckIn } from "@hooks/useAutoCheckIn";

/** 헤더에 붙어 폰 기록으로 자동 체크인을 돌린다. 그리는 것은 없다. */
export function AppAutoCheckIn() {
  useAutoCheckIn();
  return null;
}
