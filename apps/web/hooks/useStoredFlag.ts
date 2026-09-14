"use client";

import { useCallback, useSyncExternalStore } from "react";

/** 같은 탭 안에서 값이 바뀐 것을 알린다. storage 이벤트는 다른 탭에만 온다. */
const CHANGE_EVENT = "subslash:stored-flag";

/** 저장소에 쓰지 못한 경우(사생활 보호 모드 등)에도 이 탭에서는 켠 것으로 친다. */
const setInMemory = new Set<string>();

function read(key: string): boolean {
  if (setInMemory.has(key)) return true;
  try {
    return localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

/**
 * 브라우저 저장소에 두는 '한 번 켜면 계속 켜진' 표시(예: 안내를 닫았는지).
 *
 * 서버 렌더링과 하이드레이션 동안은 `serverValue`를 쓴다. 닫은 사람에게 안내가 한 번
 * 번쩍이지 않게, 안내를 숨기는 쪽 값을 넘긴다.
 */
export function useStoredFlag(key: string, serverValue: boolean): [boolean, () => void] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) onChange();
      };
      window.addEventListener("storage", onStorage);
      window.addEventListener(CHANGE_EVENT, onChange);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(CHANGE_EVENT, onChange);
      };
    },
    [key],
  );

  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => serverValue,
  );

  const turnOn = useCallback(() => {
    setInMemory.add(key);
    try {
      localStorage.setItem(key, "true");
    } catch {}
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, [key]);

  return [value, turnOn];
}
