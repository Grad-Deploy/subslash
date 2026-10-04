import type { Subscription } from "../types";
import { findPresetForSubscription, type ServicePlan } from "../constants/services";

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
 */
export interface StoragePlanFit {
  planName: string;
  capacityGB: number;
  usedGB: number;
  /** 쓰는 양이 들어가는 더 싼 요금제. 없으면 null. */
  smaller: { planName: string; capacityGB: number; amount: number } | null;
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
  const candidates = plans.filter(
    (p) =>
      p.storageGB &&
      // 용량이 같은 다른 결제처의 요금제(네이버 MYBOX의 웹 2TB와 App Store 2TB)는 '더 작은 요금제'가
      // 아니다. 더 싸게 내는 길은 요금제 대안(planAlternatives)이 보여 준다.
      p.storageGB < plan.storageGB! &&
      p.amount < plan.amount &&
      (p.billingCycle ?? "monthly") === (plan.billingCycle ?? "monthly") &&
      usedGB <= p.storageGB * HEADROOM,
  );
  const cheapest = candidates.sort((a, b) => a.amount - b.amount)[0];
  return {
    planName: plan.name,
    capacityGB: plan.storageGB,
    usedGB,
    smaller: cheapest
      ? { planName: cheapest.name, capacityGB: cheapest.storageGB!, amount: cheapest.amount }
      : null,
  };
}

/** '약 800GB', '약 1.2TB', '1GB 미만'. */
export function formatStorageGB(gb: number): string {
  if (gb < 1) return "1GB 미만";
  if (gb < 1000) return `약 ${Math.round(gb)}GB`;
  const tb = gb / 1000;
  return `약 ${Number.isInteger(Math.round(tb * 10) / 10) ? Math.round(tb) : tb.toFixed(1)}TB`;
}
