import type { RiskLevel, Subscription } from "../types";
import {
  POPULAR_SERVICES,
  findPresetForSubscription,
  type BundleRequirement,
  type ServicePlan,
  type ServicePreset,
} from "../constants/services";
import { isPaying } from "./date";
import { getMyMonthlyAmountKRW, sumMyMonthlyKRW } from "./sharing";

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
  /** 견준 요금 중에 기간 한정 요금이 있으면 그 판매 마지막 날(YYYY-MM-DD, 가장 이른 것). 화면이 '기간 한정'이라고 적는다. */
  availableUntil: string | null;
  /**
   * 체크인으로 본 권유. `bundle`: 결합 상품으로 바꾸기. `both`: 대신할 구독 중에 체크인이 노랑(애매)인 것이 있어 결합과 그
   * 구독의 해지를 나란히. `cancel`: 빨강(거의 안 씀)인 것이 있어 결합 대신 해지.
   */
  advice: BundleAdvice;
  /** `both`면 노랑인 구독, `cancel`이면 빨강인 구독. `bundle`이면 비어 있다. */
  cancelTargets: Subscription[];
  /** 그 구독들을 해지하면 한 달에 덜 내는 금액(원, 내 몫). */
  cancelMonthly: number;
}

export type BundleAdvice = "bundle" | "both" | "cancel";

/** `now`의 날짜(기기 시간대, YYYY-MM-DD). 기간 한정 요금의 마지막 날과 견준다. */
function dayOf(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
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
 * - 조건이 붙은 요금(`condition`: 통신사 쿠폰·약정·가입자 대상 프로모션)은 쓰지 않는다 — 누구나 낼 수 있는 요금만 견준다.
 *   누구나 낼 수 있는 기간 한정 요금(`availableUntil`)은 판매 마지막 날까지만 쓰고 그 날을 실어 화면이 적게 한다.
 * - 체크인(`levelOf`)이 빨강인 구독이 들었으면 결합보다 해지를, 노랑이면 둘을 나란히 권한다. 체크인 전은 모름이라 결합만.
 * - 대신할 구독이 둘 이상일 때만 — 하나뿐이면 새 멤버십에 가입하라는 말이 된다.
 */
export function findBundleOpportunities(
  subscriptions: readonly Subscription[],
  rate: number,
  now: Date = new Date(),
  /** 구독의 최근 체크인 색. 체크인 전이거나 오래돼 모르면 null. 주지 않으면 모두 모름이다. */
  levelOf: (sub: Subscription) => RiskLevel | null = () => null,
): BundleOpportunity[] {
  const today = dayOf(now);
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
      {
        amount: bundle.defaultAmount as number,
        billingCycle: undefined,
        includedPlans: undefined,
        condition: bundle.condition,
        availableUntil: bundle.availableUntil,
      },
    ];
    const usable = options.filter((option) => {
      if (typeof option.amount !== "number") return false;
      if (option.condition) return false;
      const until = option.availableUntil ?? bundle.availableUntil;
      if (until && today > until) return false;
      return true;
    });
    const matched = usable.filter((option) => {
      const given = option.includedPlans ?? bundle.includedPlans ?? {};
      return pairs.every(
        ({ sub, preset }) =>
          !preset.plans?.length || (!!sub.planId && given[preset.id] === sub.planId),
      );
    });
    const prices = matched.map((option) =>
      option.billingCycle === "yearly" ? option.amount / 12 : option.amount,
    );
    const limitedUntil = matched
      .map((option) => option.availableUntil ?? bundle.availableUntil)
      .filter((until): until is string => !!until)
      .sort()[0];
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
    const replaced = pairs.map((pair) => pair.sub);
    const red = replaced.filter((sub) => levelOf(sub) === "red");
    const yellow = replaced.filter((sub) => levelOf(sub) === "yellow");
    const cancelTargets = red.length > 0 ? red : yellow;
    out.push({
      bundle,
      replaced,
      currentMonthly,
      bundleMonthly,
      saving,
      extraServiceIds: bundle.includes.filter((id) => !ids.includes(id)),
      requires: bundle.requires ?? [],
      availableUntil: limitedUntil ?? null,
      advice: red.length > 0 ? "cancel" : yellow.length > 0 ? "both" : "bundle",
      cancelTargets,
      cancelMonthly: Math.round(sumMyMonthlyKRW(cancelTargets, rate)),
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

export interface BundleDowngrade {
  /** 지금 내는 결합 상품 구독. */
  sub: Subscription;
  bundle: ServicePreset;
  /** 따로 내면 되는 서비스와 그 요금제(결합이 주는 것과 같은 등급). 요금제 목록이 없는 서비스면 null. */
  keep: ServicePreset;
  keepPlan: ServicePlan | null;
  /** 이 결합 구독에서 쓰지 않는다고 확인된 서비스(서비스 목록의 id). */
  unusedServiceIds: string[];
  /** 지금 내는 내 몫 한 달(원). */
  currentMonthly: number;
  /** 따로 낼 때의 한 달 요금표 가격(원). */
  soloMonthly: number;
  saving: number;
}

/**
 * 결합 상품을 내는데 포함된 서비스 하나만 쓰면, 그 서비스만 따로 내는 편이 덜 드는 경우(`findBundleOpportunities`의 반대).
 *
 * - '안 쓴다'는 부르는 쪽이 `unusedOf`로 준다(앱의 폰 기록). 잴 수 없거나 모르는 서비스는 넣지 않는다 — 모름을 안 씀으로
 *   읽지 않는다. 그래서 혜택형 멤버십(배민클럽·네이버플러스)은 안 쓴다고 보지 않는다.
 * - 남는 서비스가 하나일 때만 — 둘 이상이면 더 작은 결합 상품과 견줘야 하는데 아직 하지 않는다. 하나도 안 남으면 해지의 일이다.
 * - 남길 서비스의 요금제는 결합이 주는 요금제(`includedPlans`)와 같은 것, 요금제가 하나뿐이면 그것, 요금제 목록이 없는
 *   서비스면 서비스의 한 달 요금(`defaultAmount`). 모르면 견주지 않는다. 결합 상품에 요금제가 여럿이면 내 구독의 요금제
 *   (`planId`)를 알아야 한다. 그래서 유튜브를 안 쓰는 배민클럽 + 유튜브 프리미엄은 배민클럽만 내는 편과 견준다.
 * - 단독 요금은 매달 내는 원화 요금표 가격만 — 조건 붙은 요금, 판매가 끝난 기간 한정 요금, 연 결제는 쓰지 않는다.
 * - 나눠 내는 구독은 뺀다 — 같이 내는 사람이 나머지 서비스를 쓸 수 있다. 체험 중·0원 기록도 뺀다.
 */
export function findBundleDowngrades(
  subscriptions: readonly Subscription[],
  rate: number,
  now: Date,
  unusedOf: (sub: Subscription) => readonly string[],
): BundleDowngrade[] {
  const today = dayOf(now);
  const out: BundleDowngrade[] = [];
  for (const sub of subscriptions) {
    const bundle = findPresetForSubscription(sub);
    if (!bundle?.includes?.length || !isPaying(sub, now) || (sub.sharingCount ?? 1) > 1) continue;
    const unused = unusedOf(sub).filter((id) => bundle.includes!.includes(id));
    const kept = bundle.includes.filter((id) => !unused.includes(id));
    if (unused.length === 0 || kept.length !== 1) continue;

    const bundlePlan = bundle.plans?.length
      ? bundle.plans.find((plan) => plan.id === sub.planId)
      : undefined;
    if (bundle.plans?.length && !bundlePlan) continue;
    const given = { ...bundle.includedPlans, ...bundlePlan?.includedPlans };
    const keep = POPULAR_SERVICES.find((service) => service.id === kept[0]);
    if (!keep) continue;
    // 요금제가 여럿이면 결합이 주는 것(없으면 하나뿐일 때 그것), 요금제 목록이 없으면 서비스의 한 달 요금(배민클럽·네이버플러스).
    const keepPlan = keep.plans?.length
      ? given[keep.id]
        ? keep.plans.find((plan) => plan.id === given[keep.id])
        : keep.plans.length === 1
          ? keep.plans[0]
          : undefined
      : null;
    if (keepPlan === undefined) continue;
    const price = keepPlan ? keepPlan.amount : keep.defaultAmount;
    const condition = keepPlan ? keepPlan.condition : keep.condition;
    const until = keepPlan ? keepPlan.availableUntil : keep.availableUntil;
    if (typeof price !== "number" || !(price > 0) || condition) continue;
    if ((keepPlan?.billingCycle ?? "monthly") !== "monthly") continue;
    if ((keepPlan?.currency ?? keep.currency) !== "KRW") continue;
    if (until && today > until) continue;

    const currentMonthly = Math.round(getMyMonthlyAmountKRW(sub, rate));
    const saving = currentMonthly - price;
    if (!(currentMonthly > 0) || saving <= 0) continue;
    out.push({
      sub,
      bundle,
      keep,
      keepPlan,
      unusedServiceIds: unused,
      currentMonthly,
      soloMonthly: price,
      saving,
    });
  }
  return out.sort((a, b) => b.saving - a.saving);
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
