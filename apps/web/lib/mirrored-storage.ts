/**
 * 구독 기록 저장소(lib/store의 persist)가 쓰는 저장소. 웹은 localStorage 그대로다.
 *
 * 앱(Capacitor)에서는 localStorage에 쓰는 값을 기기 저장소(Preferences)에도 똑같이 적고, 앱을
 * 열 때 localStorage가 비어 있었으면 그 사본으로 되살린다. 기록은 기기에만 있어서, 운영체제가
 * 웹뷰 저장소를 비우면 통째로 사라진다.
 *
 * 저장소 자체를 Preferences로 옮기지 않는 이유: 읽기가 비동기가 되면 기록을 읽기 전의 빈 상태가
 * 먼저 저장돼 기록을 덮어쓸 수 있다. localStorage를 원본으로 두면 읽기는 지금처럼 동기다.
 */
import type { StateStorage } from "zustand/middleware";
import { IS_APP_BUILD } from "./platform";

type LocalStorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface NativeKeyValue {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface MirroredStorage {
  storage: StateStorage;
  /**
   * 앱을 연 뒤 한 번 부른다. 처음 읽을 때 localStorage에 key가 없었고 사본이 있으면 사본을
   * localStorage로 되돌리고 true를 준다 — 부른 쪽이 persist를 다시 읽힌다.
   */
  restore(key: string): Promise<boolean>;
}

function warn(error: unknown) {
  console.warn("[mirrored-storage] 기기 저장소에 사본을 적지 못했습니다", error);
}

export function createMirroredStorage(
  local: LocalStorageLike,
  native: NativeKeyValue,
): MirroredStorage {
  // 비어 있었는지는 persist가 처음 읽기 전에 정한다. 되살리기를 확인하는 사이 앱이 무언가를
  // 적어 localStorage가 채워져도, 그것은 빈 상태 위에 쓴 것이라 사본을 되살리는 게 맞다.
  const emptyAtStart = new Set<string>();
  const seen = new Set<string>();
  // 되살리기를 확인하기 전에는 사본을 건드리지 않는다. 그 전에 적으면 되살릴 사본이 빈 기록으로
  // 덮인다. 그동안 바뀐 key는 확인이 끝난 뒤 한꺼번에 적는다.
  let ready = false;
  const pending = new Set<string>();

  const mirror = (key: string) => {
    const value = local.getItem(key);
    void (value === null ? native.remove(key) : native.set(key, value)).catch(warn);
  };

  const storage: StateStorage = {
    getItem: (key) => {
      const value = local.getItem(key);
      if (!seen.has(key)) {
        seen.add(key);
        if (value === null) emptyAtStart.add(key);
      }
      return value;
    },
    setItem: (key, value) => {
      local.setItem(key, value);
      if (ready) mirror(key);
      else pending.add(key);
    },
    removeItem: (key) => {
      local.removeItem(key);
      if (ready) mirror(key);
      else pending.add(key);
    },
  };

  async function restore(key: string): Promise<boolean> {
    let restored = false;
    try {
      if (emptyAtStart.has(key)) {
        const saved = await native.get(key);
        if (saved !== null) {
          local.setItem(key, saved);
          pending.delete(key);
          restored = true;
        }
      }
    } catch (error) {
      // 사본을 읽지 못했으면 되살리지 않는다. 이때 사본을 덮어쓰면 기록을 잃을 수 있어,
      // 이번 실행에서는 사본을 건드리지 않는다.
      console.warn("[mirrored-storage] 기기 저장소의 사본을 읽지 못했습니다", error);
      return false;
    }
    ready = true;
    for (const pendingKey of pending) mirror(pendingKey);
    pending.clear();
    return restored;
  }

  return { storage, restore };
}

let appStorage: MirroredStorage | null = null;

function preferencesKeyValue(): NativeKeyValue {
  // 플러그인 객체가 아니라 모듈을 기다린다. 플러그인은 프록시라 Promise의 결과가 되면 then을
  // 찾는 순간 실패한다(lib/session-token 참고).
  const plugin = import("@capacitor/preferences");
  return {
    get: async (key) => (await (await plugin).Preferences.get({ key })).value,
    set: async (key, value) => (await plugin).Preferences.set({ key, value }),
    remove: async (key) => (await plugin).Preferences.remove({ key }),
  };
}

/** persist의 createJSONStorage에 넘길 저장소. 서버(미리 그리기)에서는 부르지 않는다. */
export function recordStorage(): StateStorage {
  if (!IS_APP_BUILD) return localStorage;
  appStorage ??= createMirroredStorage(localStorage, preferencesKeyValue());
  return appStorage.storage;
}

/** 앱에서 기록을 되살렸으면 true. 웹이거나 아직 저장소를 만들지 않았으면 false. */
export function restoreRecords(key: string): Promise<boolean> {
  if (!IS_APP_BUILD || !appStorage) return Promise.resolve(false);
  return appStorage.restore(key);
}
