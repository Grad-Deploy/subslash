"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * 브라우저에서 화면을 그리는 중인지. 서버 렌더링과 하이드레이션 동안은 false, 그 뒤로는 true다.
 *
 * 구독 기록은 브라우저 저장소에만 있어 서버에서는 그릴 수 없다. 예전에는 페이지마다 effect
 * 안에서 setMounted(true)를 불러 같은 일을 했는데, 렌더링을 한 번 더 일으키는 패턴이라 React가
 * 경고한다(react-hooks/set-state-in-effect).
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
