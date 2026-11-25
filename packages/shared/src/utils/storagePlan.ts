import type { Subscription } from "../types";
import {
  POPULAR_SERVICES,
  findPresetForSubscription,
  type ServicePlan,
} from "../constants/services";

/**
 * 저장 공간 구독이 더 작은 요금제에 들어가는지.
 *
 * 체크인은 '요금제 용량 중 몇 %'를 묻는다. 요금제의 용량을 알면(서비스 목록의 `storageGB`) 쓰는 양을
 * 계산해, 그 양이 들어가는 가장 싼 요금제를 찾는다. 예전에는 요금제를 모른 채 '절반 미만이면 한 단계
 * 작은 요금제로 충분할 수 있어요'라고 했는데, 아이클라우드 2TB의 40%(약 800GB)는 한 단계 아래인
 * 200GB에 들어가지 않는다. 요금제를 모르면 계산하지 않는다.
 *
 * 무료 용량(아이클라우드 5GB 등)은 요금제 목록에 없어 권하지 않는다. 금액은 요금표 가격끼리 나란히
 * 보여 주고 '아낀다'로 바꾸지 않는다 — 가족과 나누는 요금제면 내 몫은 그보다 작다.
 *
 * 용량 말고도 함께 주는 것(`extras`, 구글 원 AI 프로의 Gemini)이 있는 요금제는 그것이 빠지는 요금제를
 * 권하지 않는다. AI 프로 5TB에 3GB를 두었다고 '베이직 100GB에 들어가요'라고 하면, AI를 쓰려고 내는
 * 사람에게 AI를 끊으라고 권하게 된다. 그 대신 용량만으로는 판단하지 않는다고 말한다(`bundledExtras`).
 */
export interface StoragePlanFit {
  planName: string;
  capacityGB: number;
  usedGB: number;
  /** 쓰는 양이 들어가는 더 싼 요금제. 없으면 null. */
  smaller: { planName: string; capacityGB: number; amount: number } | null;
  /**
   * 용량만 보면 더 싼 요금제에 들어가지만, 그 요금제에는 이 요금제가 함께 주는 것(`extras`)이 없어 권하지
   * 않았을 때 그 이름. 그 밖에는 null.
   */
  bundledExtras: string | null;
}

/** 더 작은 요금제로 옮겨도 이만큼은 비어 있어야 권한다 — 꽉 차면 곧 모자란다. */
const HEADROOM = 0.8;

type StorageSub = Pick<Subscription, "name" | "cancelUrl" | "planId">;

function currentPlan(sub: StorageSub): ServicePlan | null {
  if (!sub.planId) return null;
  const plan = findPresetForSubscription(sub)?.plans?.find((p) => p.id === sub.planId);
  return plan?.storageGB ? plan : null;
}

export function storagePlanFit(sub: StorageSub, percent: number): StoragePlanFit | null {
  const plan = currentPlan(sub);
  if (!plan?.storageGB) return null;
  const usedGB = (plan.storageGB * Math.min(100, Math.max(0, percent))) / 100;
  const plans = findPresetForSubscription(sub)?.plans ?? [];
  const fits = plans.filter(
    (p) =>
      p.storageGB &&
      // 용량이 같은 다른 결제처의 요금제(네이버 MYBOX의 웹 2TB와 App Store 2TB)는 '더 작은 요금제'가
      // 아니다. 더 싸게 내는 길은 요금제 대안(planAlternatives)이 보여 준다.
      p.storageGB < plan.storageGB! &&
      p.amount < plan.amount &&
      (p.billingCycle ?? "monthly") === (plan.billingCycle ?? "monthly") &&
      usedGB <= p.storageGB * HEADROOM,
  );
  const candidates = plan.extras ? fits.filter((p) => p.extras === plan.extras) : fits;
  const cheapest = candidates.sort((a, b) => a.amount - b.amount)[0];
  return {
    planName: plan.name,
    capacityGB: plan.storageGB,
    usedGB,
    smaller: cheapest
      ? { planName: cheapest.name, capacityGB: cheapest.storageGB!, amount: cheapest.amount }
      : null,
    bundledExtras: !cheapest && fits.length > 0 ? (plan.extras ?? null) : null,
  };
}

/**
 * 저장 용량과 AI(`extras`)를 함께 주는 요금제(구글 원·Google AI Pro의 AI Plus·AI Pro)의 용량 쪽 근거.
 *
 * 이런 구독은 Gemini를 쓴 날로 재되, 해지하면 저장한 것도 잃으므로 용량도 본다(`metricRiskLevel`의
 * `aiStorage`). 한국에는 AI 없이 2TB·5TB만 주는 요금제가 없어서, 권할 수 있는 것은 AI를 주는 더 작은 요금제
 * (AI Pro → AI Plus)이고, Gemini를 쓰지 않으면 AI가 없는 요금제(베이직 100GB)도 권한다. 무료 용량(15GB) 안에
 * 들어가면 아무 요금제도 권하지 않는다 — Gemini도 안 쓰면 해지해도 잃는 것이 없다.
 */
export interface AiStorageFit {
  /** 지금 요금제(서비스 목록의 한국어 이름). */
  planName: string;
  /** 요금제 용량 중 쓰는 비율(%). */
  percent: number;
  usedGB: number;
  /** 쓰는 양이 이 요금제보다 싼 어느 요금제에도 여유 있게 들어가지 않는다 — 용량 때문에 이 요금제가 필요하다. */
  needsThisPlan: boolean;
  /** 쓰는 양이 들어가는, AI도 주는 더 싼 요금제. 없으면 null. */
  smallerAi: { planName: string; capacityGB: number; amount: number } | null;
  /** 쓰는 양이 들어가는 가장 싼 요금제(AI가 없어도). Gemini를 쓰지 않을 때 권한다. 없으면 null. */
  cheapest: { planName: string; capacityGB: number; amount: number } | null;
  /** 쓰는 양이 모든 Google 계정의 무료 용량(`GOOGLE_FREE_STORAGE_GB`)에 들어간다. */
  fitsFree: boolean;
}

/**
 * 모든 Google 계정에 주는 무료 용량(GB). one.google.com/about/plans(2026-11-25 확인): "모든 Google 계정에는 최대
 * 15GB의 스토리지가 제공되며". 용량과 AI를 함께 주는 요금제는 지금 구글 것뿐이라 여기 둔다.
 */
export const GOOGLE_FREE_STORAGE_GB = 15;

/** 이 구독의 요금제가 용량과 AI를 함께 주는지. 요금제를 모르면 false(짐작하지 않는다). */
export function isAiStoragePlan(sub: StorageSub): boolean {
  return !!currentPlan(sub)?.extras;
}

export function aiStorageFit(sub: StorageSub, percent: number): AiStorageFit | null {
  const plan = currentPlan(sub);
  if (!plan?.storageGB || !plan.extras) return null;
  const clamped = Math.min(100, Math.max(0, percent));
  const usedGB = (plan.storageGB * clamped) / 100;
  // 같은 AI(`extras`)를 주는 서비스의 요금제를 모두 본다. Google AI Pro와 구글 원은 같은 상품인데 Google AI Pro의
  // 목록에는 AI가 없는 베이직 100GB가 없어, 그쪽으로 등록한 AI Plus는 용량을 조금만 써도 '용량 때문에 필요'가 됐다.
  // 등록한 서비스를 앞에 두어, 같은 값이면 그 서비스의 요금제 이름으로 권한다.
  const own = findPresetForSubscription(sub);
  const siblings = [
    ...(own ? [own] : []),
    ...POPULAR_SERVICES.filter((s) => s !== own && s.plans?.some((p) => p.extras === plan.extras)),
  ];
  const cheaper = siblings
    .flatMap((s) => s.plans ?? [])
    .filter(
      (p) =>
        p.storageGB &&
        p.storageGB < plan.storageGB! &&
        p.amount < plan.amount &&
        (p.billingCycle ?? "monthly") === (plan.billingCycle ?? "monthly") &&
        usedGB <= p.storageGB * HEADROOM,
    );
  const byAmount = [...cheaper].sort((a, b) => a.amount - b.amount);
  const smallerAi = byAmount.find((p) => p.extras);
  const cheapest = byAmount[0];
  const brief = (p: ServicePlan) => ({
    planName: p.name,
    capacityGB: p.storageGB!,
    amount: p.amount,
  });
  return {
    planName: plan.name,
    percent: clamped,
    usedGB,
    needsThisPlan: clamped > 0 && cheaper.length === 0,
    smallerAi: smallerAi ? brief(smallerAi) : null,
    cheapest: cheapest ? brief(cheapest) : null,
    fitsFree: usedGB <= GOOGLE_FREE_STORAGE_GB,
  };
}

/** '약 800GB', '약 1.2TB', '1GB 미만'. */
export function formatStorageGB(gb: number): string {
  if (gb < 1) return "1GB 미만";
  if (gb < 1000) return `약 ${Math.round(gb)}GB`;
  const tb = gb / 1000;
  return `약 ${Number.isInteger(Math.round(tb * 10) / 10) ? Math.round(tb) : tb.toFixed(1)}TB`;
}
