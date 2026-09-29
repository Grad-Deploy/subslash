import { useStore } from "./store";

/**
 * 기록 주인(lib/records-owner — 비로그인 null, 로그인하면 계정 ID)마다 따로 두는 기기 설정의 저장 키.
 *
 * 대시보드의 '시작하기'(구독 등록·체크인·결제 알림)는 구독 기록을 보고 진행을 매기는데, 결제 알림 켜짐과
 * '닫음' 같은 값은 기기에 하나뿐이었다. 그래서 로그인해 알림을 켜고 로그아웃하면, 기록은 로그인 전으로
 * 돌아가도 '시작하기'는 로그인한 동안의 진행을 그대로 보였다. 이 값들을 주인별 칸에 두어, 로그아웃하면
 * 비로그인의 것을, 다시 로그인하면 그 계정의 것을 쓴다. 서버·백업·동기화에는 여전히 넣지 않는다(기기의 것).
 */
export function ownerScopedKey(
  base: string,
  owner: string | null = useStore.getState().recordsOwner,
): string {
  return `${base}:${owner === null ? "guest" : `account:${owner}`}`;
}

/**
 * 주인별로 나누기 전의 값(`base` 키)을 처음 읽을 때 지금 주인의 칸으로 옮긴다. 업데이트한 뒤 알림이
 * 꺼지거나 닫은 안내가 다시 뜨지 않게 한다 — 그때 쓰던 사람은 지금 주인이다.
 */
export function readOwnerScoped(
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">,
  base: string,
  owner?: string | null,
): string | null {
  const key = ownerScopedKey(base, owner);
  const value = storage.getItem(key);
  if (value !== null) return value;
  const legacy = storage.getItem(base);
  if (legacy === null) return null;
  storage.setItem(key, legacy);
  storage.removeItem(base);
  return legacy;
}
