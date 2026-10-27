/**
 * 브라우저 저장소(localStorage)를 막혀 있어도 터지지 않게 읽고 쓴다. 사생활 보호 모드·사이트 데이터 차단·
 * 서버 렌더링에서는 접근만 해도 예외가 나므로, 기기 설정을 두는 곳마다 try/catch로 감싸던 것을 여기 모았다.
 * 읽지 못하면 없는 것으로, 쓰지 못하면 이번 화면에서만 그 값을 쓴다(부르는 쪽이 정한다).
 */

/** 저장된 값. 없거나 저장소를 쓸 수 없으면 null. */
export function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** 값을 남긴다. 남기지 못했으면 false. */
export function writeLocal(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * 기기에 둔 JSON 객체(id → 값 같은 표)를 읽는다. 없거나 깨졌거나 객체가 아니면 빈 객체 — 기기 설정이 깨졌다고
 * 화면이 멈추지 않게. 칸 하나하나의 모양은 확인하지 않는다.
 */
export function parseStoredObject<T extends object>(raw: string | null): T {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as T)
      : ({} as T);
  } catch {
    return {} as T;
  }
}

/** 값을 지운다. 지우지 못해도 조용히 넘어간다. */
export function removeLocal(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // 저장소를 못 쓰면 지울 것도 없다.
  }
}

/**
 * 기기 저장소에 둔 값이 바뀐 것을 듣고 알리는 통로. `storage` 이벤트는 **다른** 탭에만 오므로, 같은 탭에서 바꾼
 * 것은 `notify`가 보내는 이벤트(`event`)로 듣는다. `subscribe`는 `useSyncExternalStore`에 그대로 넘긴다.
 * `key`를 주면 다른 탭의 변경 중 그 키의 것만 듣는다.
 */
export function localChannel(event: string, key?: string) {
  return {
    subscribe(onChange: () => void): () => void {
      const onStorage = (e: StorageEvent) => {
        if (key === undefined || e.key === key) onChange();
      };
      window.addEventListener(event, onChange);
      window.addEventListener("storage", onStorage);
      return () => {
        window.removeEventListener(event, onChange);
        window.removeEventListener("storage", onStorage);
      };
    },
    notify(): void {
      window.dispatchEvent(new Event(event));
    },
  };
}
