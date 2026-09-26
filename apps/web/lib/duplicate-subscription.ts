import { type Subscription, coveredServices, findPresetForSubscription } from "@subslash/shared";

function normalize(name: string): string {
  return name.replace(/\s+/g, "").toLowerCase();
}

/**
 * 새로 등록하려는 구독과 같은 서비스로 보이는 구독 중인 항목. 없으면 undefined.
 *
 * 서비스 목록(프리셋)과 맞으면 같은 프리셋인지로, 아니면 공백·대소문자를 뺀 이름으로 견준다.
 * 가족·다른 계정처럼 일부러 두 번 넣는 경우도 있으므로, 막지 않고 한 번 묻는 데만 쓴다.
 */
export function findDuplicateSubscription(
  existing: Subscription[],
  candidate: { name: string; cancelUrl?: string },
): Subscription | undefined {
  const preset = findPresetForSubscription(candidate);
  const same = existing.find(
    (sub) =>
      sub.status === "active" &&
      ((preset !== undefined && findPresetForSubscription(sub)?.id === preset.id) ||
        normalize(sub.name) === normalize(candidate.name)),
  );
  if (same) return same;
  // 결합 상품과 그 안의 서비스(배민클럽 + 유튜브 프리미엄 ↔ 유튜브 프리미엄)는 이름이 달라도 같은
  // 서비스를 두 번 내는 것일 수 있다.
  return existing.find(
    (sub) => sub.status === "active" && sharedServices(sub, candidate).length > 0,
  );
}

/** 두 구독이 함께 받는 서비스(결합 상품 포함, 서비스 목록의 id). 같은 구독끼리는 자기 자신이다. */
export function sharedServices(
  a: { name: string; cancelUrl?: string },
  b: { name: string; cancelUrl?: string },
): string[] {
  const covered = coveredServices(b);
  return coveredServices(a).filter((id) => covered.includes(id));
}
