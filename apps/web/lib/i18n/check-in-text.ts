import {
  formatCurrency,
  metricOfLog,
  unitCostPart,
  type Currency,
  type UsageLog,
  type ValueMetric,
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
  const quantity = describeQuantityText(t, metric, n);

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

/** 수량만: '12회 이용', '30일 중 8일 사용', '15시간 사용', '혜택 ₩12,000', '용량의 40% 사용'. */
export function describeQuantityText(t: Messages, metric: ValueMetric, quantity: number): string {
  const c = t.value.checkIn;
  switch (metric) {
    case "uses":
      return c.uses(quantity);
    case "days":
      return c.days(quantity);
    case "hours":
      return c.hours(quantity);
    case "benefit":
      return c.benefit(formatCurrency(quantity, "KRW"));
    case "storage":
      return c.storage(quantity);
  }
}

/**
 * 표의 단가 칸처럼 좁은 자리의 한 마디. `@subslash/shared`의 `shortUnitCost`와 같은 뜻을 지금 언어로 만든다.
 */
export function shortUnitCostText(
  t: Messages,
  log: Pick<UsageLog, "metric" | "usageCount" | "costPerUse">,
  currency: Currency,
): string {
  const c = t.value.checkIn;
  const metric = metricOfLog(log);
  if (metric === "storage") return c.shortStorage(log.usageCount);
  const part = unitCostPart(metric, log.costPerUse, log.usageCount);
  if (!part) return c.shortNone;
  const money = formatCurrency(log.costPerUse, currency);
  switch (part.type) {
    case "per-use":
      return money;
    case "per-day":
      return c.shortPerDay(money);
    case "per-hour":
      return c.shortPerHour(money);
    case "not-used":
      return c.shortNotUsed;
    case "benefit-returned":
      return c.shortReturned(part.percent);
  }
}
