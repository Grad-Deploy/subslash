import { findPresetForSubscription, type Subscription } from "@subslash/shared";
import { AUTO_CHECKIN_DAYS } from "./auto-checkin";
import { lastDays, totalsFor, type UsageHistory } from "./history";
import { USAGE_PACKAGES } from "./packages";

/**
 * 결합 상품 구독에 든 서비스 중 이 폰에서 최근 30일 동안 쓴 날(`ACTIVE_DAY_MS`)이 하루도 없는 것(`findBundleDowngrades`에 준다).
 *
 * 자동 체크인처럼 30일을 모두 잰 서비스만 본다. 잴 앱이 없는 서비스(배민클럽·네이버플러스 같은 혜택형)와 기록이 모자란
 * 서비스는 넣지 않는다 — 모름을 안 씀으로 읽지 않는다. TV·PC에서 쓴 것은 폰 기록에 없으므로 화면이 그렇게 적는다.
 */
export function unusedBundleServices(
  sub: Subscription,
  history: UsageHistory,
  now: Date,
): string[] {
  const bundle = findPresetForSubscription(sub);
  if (!bundle?.includes?.length) return [];
  const dates = lastDays(now, AUTO_CHECKIN_DAYS);
  return bundle.includes.filter((id) => {
    const packages = USAGE_PACKAGES[id];
    if (!packages?.length) return false;
    const totals = totalsFor(history, packages, dates);
    return totals.coveredDays >= dates.length && totals.activeDays === 0;
  });
}
