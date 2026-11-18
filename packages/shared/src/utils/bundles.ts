import type { Subscription } from "../types";
import {
  POPULAR_SERVICES,
  findPresetForSubscription,
  type BundleRequirement,
  type ServicePreset,
} from "../constants/services";
import { isPaying } from "./date";
import { getMyMonthlyAmountKRW } from "./sharing";

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

/**
 * 같은 이름의 결제 메일이 단독 구독과 결합 상품 중 어느 쪽인지 메일만으로는 알 수 없는 서비스 →
 * 그 결합 상품(서비스 목록의 id). 배민클럽 이용료는 단독 요금이든 배민클럽 + 유튜브 프리미엄이든
 * 같은 '배민클럽' 메일로 오므로, 확인 없이 단독 구독으로 등록하면 결합 상품 사용자가 유튜브 프리미엄을
 * 따로 낸다고 읽힌다. 모든 결합 포함 서비스(넷플릭스·유튜브)에 걸면 평범한 영수증까지 묻게 되므로
 * 메일이 구분되지 않는다고 확인한 서비스만 적는다.
 */
const BUNDLE_TO_CONFIRM: Record<string, string> = {
  "baemin-club": "baemin-youtube-premium",
};

/** 이 서비스의 영수증을 등록하기 전에 결합 상품인지 물어야 하면 그 결합 상품의 이름. */
export function bundleToConfirm(serviceId: string | null | undefined): string | null {
  const bundleId = serviceId ? BUNDLE_TO_CONFIRM[serviceId] : undefined;
  return bundleId ? serviceNameOf(bundleId) : null;
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

export interface BundleOpportunity {
  bundle: ServicePreset;
  /** 결합 상품으로 대신할 수 있는 지금 구독(서비스마다 하나, 둘 이상). */
  replaced: Subscription[];
  /** 그 구독들에 내 몫으로 내는 한 달 금액(원). */
  currentMonthly: number;
  /** 결합 상품의 한 달 요금 범위(원). 같은 구성에 조건별 요금(할인가·정가)이 있으면 둘이 다르다. */
  bundleMonthly: { min: number; max: number };
  /** 한 달에 덜 내는 금액 범위(원). `min`은 가장 비싼 요금 기준이라 늘 0보다 크다. */
  saving: { min: number; max: number };
  /** 결합 상품에만 있는 서비스 — 덤일 뿐 절약액에 넣지 않는다. */
  extraServiceIds: string[];
  /** 옮기려면 갖춰야 하는 것(서비스 목록의 `requires`). 사용자가 갖췄는지는 모르므로 화면이 조건으로 적는다. */
  requires: BundleRequirement[];
}

/** 결제하는 곳이 앱스토어·플레이스토어·통신사라 결합 상품의 판매처가 같지 않으면 옮길 수 없는 결제 경로. */
const PLATFORM_BILLED = new Set(["apple_iap", "google_play", "telecom"]);

/**
 * 따로 내는 구독을 결합 상품 하나로 바꾸면 덜 내는 경우. 거짓 추천을 막으려고 확인된 것만 견준다.
 *
 * - 같은 등급끼리만: 결합이 주는 요금제(`includedPlans`)를 적어 둔 상품이고, 내 구독의 요금제가 그것과
 *   같을 때만 견준다. 요금제를 고르지 않았거나 결합의 요금제를 모르면 견주지 않는다.
 * - 구독이 확실한 것만: 구독 중이고 체험 중이 아닌 등록된 구독. 폰 사용 기록의 후보는 등록 전이라 들지 않는다.
 * - 나눠 내는 구독, 같은 서비스를 둘 이상 낸다, 이미 결합 상품이다, 0원 기록이면 뺀다. 이미 그 결합
 *   상품을 쓰고 있으면 겹침 안내(`findBundleOverlaps`)가 맡는다.
 * - 결제 경로: 앱스토어·구글 플레이·통신사로 내는 구독은 결합 상품의 판매처(`billedVia`)가 같을 때만 대신한다.
 *   그 결제를 다른 곳으로 옮길 수 있는지 확인하지 못했다.
 * - 결합 상품의 가입 조건(`requires`)은 걸러 내지 않고 결과에 실어 화면이 '조건이면'으로 적는다.
 * - 대신할 구독이 둘 이상일 때만 — 하나뿐이면 새 멤버십에 가입하라는 말이 된다.
 */
export function findBundleOpportunities(
  subscriptions: readonly Subscription[],
  rate: number,
  now: Date = new Date(),
): BundleOpportunity[] {
  const paying = subscriptions.filter((sub) => isPaying(sub, now));
  const owned = new Set(paying.map((sub) => findPresetForSubscription(sub)?.id));
  // 이미 결합 상품으로 받는 서비스는 다른 결합 상품으로 옮기라고 하지 않는다 — 겹침 안내가 맡는다.
  const inBundle = new Set(
    paying.flatMap((sub) => {
      const preset = findPresetForSubscription(sub);
      return preset?.includes?.length ? coveredServices(sub) : [];
    }),
  );
  const out: BundleOpportunity[] = [];
  for (const bundle of POPULAR_SERVICES) {
    if (!bundle.includes?.length || owned.has(bundle.id) || bundle.currency !== "KRW") continue;
    const pairs = paying.flatMap((sub) => {
      const preset = findPresetForSubscription(sub);
      const solo = preset && !preset.includes?.length;
      return solo && bundle.includes?.includes(preset.id) ? [{ sub, preset }] : [];
    });
    const ids = pairs.map((pair) => pair.preset.id);
    if (
      pairs.some(
        ({ sub }) =>
          PLATFORM_BILLED.has(sub.paymentMethod ?? "") && sub.paymentMethod !== bundle.billedVia,
      )
    )
      continue;
    if (pairs.length < 2 || new Set(ids).size !== ids.length) continue;
    if (ids.some((id) => inBundle.has(id))) continue;
    if (pairs.some(({ sub }) => (sub.sharingCount ?? 1) > 1)) continue;
    const costs = pairs.map(({ sub }) => getMyMonthlyAmountKRW(sub, rate));
    if (costs.some((cost) => !(cost > 0))) continue;
    const currentMonthly = Math.round(costs.reduce((a, b) => a + b, 0));

    const options = bundle.plans ?? [
      { amount: bundle.defaultAmount as number, billingCycle: undefined, includedPlans: undefined },
    ];
    const prices = options
      .filter((option) => {
        if (typeof option.amount !== "number") return false;
        const given = option.includedPlans ?? bundle.includedPlans ?? {};
        return pairs.every(
          ({ sub, preset }) =>
            !preset.plans?.length || (!!sub.planId && given[preset.id] === sub.planId),
        );
      })
      .map((option) => (option.billingCycle === "yearly" ? option.amount / 12 : option.amount));
    if (prices.length === 0) continue;
    const bundleMonthly = {
      min: Math.round(Math.min(...prices)),
      max: Math.round(Math.max(...prices)),
    };
    const saving = {
      min: currentMonthly - bundleMonthly.max,
      max: currentMonthly - bundleMonthly.min,
    };
    if (saving.min <= 0) continue;
    out.push({
      bundle,
      replaced: pairs.map((pair) => pair.sub),
      currentMonthly,
      bundleMonthly,
      saving,
      extraServiceIds: bundle.includes.filter((id) => !ids.includes(id)),
      requires: bundle.requires ?? [],
    });
  }
  // 같은 구독들을 바꾸는 결합 상품이 여럿이면 가장 많이 덜 내는 하나만 — 쓰지 않는 서비스가 더 든 비싼 상품을
  // 함께 보이면 같은 말을 되풀이한다(티빙 더블과 3 PACK).
  const best = new Map<string, BundleOpportunity>();
  for (const opportunity of out) {
    const key = opportunity.replaced
      .map((sub) => sub.id)
      .sort()
      .join("|");
    const kept = best.get(key);
    if (!kept || opportunity.saving.min > kept.saving.min) best.set(key, opportunity);
  }
  return [...best.values()].sort((a, b) => b.saving.min - a.saving.min);
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
