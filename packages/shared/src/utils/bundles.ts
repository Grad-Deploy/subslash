import type { Subscription } from "../types";
import { POPULAR_SERVICES, findPresetForSubscription } from "../constants/services";

type Identified = Pick<Subscription, "name" | "cancelUrl">;

/**
 * 이 구독으로 받는 서비스(서비스 목록의 id). 결합 상품이면 자신과 포함된 서비스, 아니면 자신뿐이다.
 * 서비스 목록에 없는 구독은 빈 배열 — 이름이 비슷하다고 같은 서비스로 보지 않는다.
 */
export function coveredServices(sub: Identified): string[] {
  const preset = findPresetForSubscription(sub);
  if (!preset) return [];
  return [preset.id, ...(preset.includes ?? [])];
}

/** 이 서비스를 포함하는 결합 상품들(서비스 목록에서). 등록 화면이 '결합 상품으로도 있어요'에 쓴다. */
export function bundlesIncluding(serviceId: string) {
  return POPULAR_SERVICES.filter((preset) => preset.includes?.includes(serviceId));
}

export interface BundleOverlap {
  /** 결합 상품 구독. */
  bundle: Subscription;
  /** 같은 서비스를 따로 받는 구독(다른 결합 상품일 수도 있다). */
  other: Subscription;
  /** 겹치는 서비스 id. */
  serviceIds: string[];
}

/**
 * 결합 상품에 포함된 서비스를 따로도 구독하고 있는 쌍. 가족 공유·다른 계정처럼 일부러 두 번 내는
 * 경우도 있어 막지 않고 알리기만 한다 — 결합 상품을 결제하면서 기존 구독을 끊지 않아 두 번 내는
 * 일이 실제로 있다(배민클럽 + 유튜브 프리미엄).
 */
export function findBundleOverlaps(subscriptions: readonly Subscription[]): BundleOverlap[] {
  const active = subscriptions.filter((sub) => sub.status === "active");
  const overlaps: BundleOverlap[] = [];
  for (const bundle of active) {
    const preset = findPresetForSubscription(bundle);
    if (!preset?.includes?.length) continue;
    for (const other of active) {
      if (other.id === bundle.id) continue;
      const covered = coveredServices(other);
      const serviceIds = preset.includes.filter((id) => covered.includes(id));
      if (serviceIds.length === 0) continue;
      // 두 결합 상품이 서로 겹치면 한 번만 적는다.
      if (overlaps.some((o) => o.bundle.id === other.id && o.other.id === bundle.id)) continue;
      overlaps.push({ bundle, other, serviceIds });
    }
  }
  return overlaps;
}

/** 서비스 id → 화면에 적을 이름. */
export function serviceNameOf(serviceId: string): string {
  const preset = POPULAR_SERVICES.find((service) => service.id === serviceId);
  return preset?.nameKo ?? preset?.name ?? serviceId;
}

export interface BundleCheckLink {
  serviceId: string;
  name: string;
  url: string;
  /** 그 서비스의 해지·멤버십 화면이면 direct, 첫 화면·계정 화면이면 entry. */
  kind: "direct" | "entry";
}

/**
 * 결합 상품을 해지한 뒤 포함된 서비스마다 구독이 끝났는지 볼 곳(그 서비스의 해지 주소).
 *
 * 해지 버튼을 서비스마다 따로 두지 않는다 — 결합 상품은 판매처가 결제하므로(유튜브 화면에
 * '제공: Woowa Brothers KR'로 나온다) 포함된 서비스의 해지 화면에서는 해지되지 않고, 한쪽만
 * 해지하는 경로는 확인하지 못했다. 판매처와 같은 사이트로 가는 서비스(배민클럽 ↔ 배민)는
 * 해지 버튼과 같은 곳이라 빼고, 결합 상품이 아니거나 서비스 목록에 없으면 빈 배열이다.
 */
export function bundleCheckLinks(sub: Identified): BundleCheckLink[] {
  const preset = findPresetForSubscription(sub);
  if (!preset?.includes?.length) return [];
  const sellerHost = hostOf(sub.cancelUrl ?? preset.cancelUrl);
  const links: BundleCheckLink[] = [];
  for (const serviceId of preset.includes) {
    const included = POPULAR_SERVICES.find((service) => service.id === serviceId);
    if (!included?.cancelUrl) continue;
    if (hostOf(included.cancelUrl) === sellerHost) continue;
    links.push({
      serviceId,
      name: included.nameKo,
      url: included.cancelUrl,
      kind: included.cancelUrlKind,
    });
  }
  return links;
}

function hostOf(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}
