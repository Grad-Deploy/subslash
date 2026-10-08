import {
  formatCurrency,
  metricOfLog,
  unitCostPart,
  type Currency,
  type UsageLog,
} from "@subslash/shared";
import type { Messages } from "./messages";

/**
 * 체크인 기록 한 줄: '12회 이용 · 1회당 ₩3,000'. `@subslash/shared`의 `describeCheckIn`과 같은 뜻을 지금
 * 언어로 만든다 — 단가는 같은 판단(`unitCostPart`)을 쓰므로 두 곳이 어긋나지 않는다.
 */
export function describeCheckInText(
  t: Messages,
  log: Pick<UsageLog, "metric" | "usageCount" | "costPerUse">,
  currency: Currency,
): string {
  const metric = metricOfLog(log);
  const c = t.value.checkIn;
  const n = log.usageCount;
  const quantity =
    metric === "uses"
      ? c.uses(n)
      : metric === "days"
        ? c.days(n)
        : metric === "hours"
          ? c.hours(n)
          : metric === "benefit"
            ? c.benefit(formatCurrency(n, "KRW"))
            : c.storage(n);

  const part = unitCostPart(metric, log.costPerUse, n);
  if (!part) return quantity;
  const unit =
    part.type === "per-use"
      ? c.perUse(formatCurrency(part.cost, currency))
      : part.type === "per-day"
        ? c.perDay(formatCurrency(part.cost, currency))
        : part.type === "per-hour"
          ? c.perHour(formatCurrency(part.cost, currency))
          : part.type === "not-used"
            ? c.notUsed
            : c.benefitReturned(part.percent);
  return `${quantity} · ${unit}`;
}
