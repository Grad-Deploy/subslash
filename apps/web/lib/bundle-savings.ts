import {
  findBundleOpportunities,
  type BundleOpportunity,
  type Subscription,
  type UsageLog,
} from "@subslash/shared";
import { latestFreshLogFor } from "@lib/checkins";

/**
 * 결합 상품으로 바꾸면 덜 내는 경우(`findBundleOpportunities`)를 이 기기의 체크인으로 판단해 돌려준다. 리포트의 칸과
 * '리포트에 물어보기'의 `bundleSavings`가 이 함수 하나를 쓴다 — 같은 질문에 칸과 다른 숫자가 나오면 어느 쪽도 믿을 수 없다.
 *
 * 체크인 색은 최근 30일 안의, 지금 재는 지표로 적은 체크인(`latestFreshLogFor`)이다. 없으면 모른다(null) — 모름을 '안 씀'으로
 * 읽어 해지를 권하지 않는다.
 */
export function bundleOpportunitiesFor(
  subscriptions: Subscription[],
  usageLogs: UsageLog[],
  rate: number,
  now: Date,
): BundleOpportunity[] {
  return findBundleOpportunities(
    subscriptions,
    rate,
    now,
    (sub) => latestFreshLogFor(usageLogs, sub, now)?.riskLevel ?? null,
  );
}
