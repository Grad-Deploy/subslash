import {
  formatCurrency,
  metricOfLog,
  unitCostPart,
  type Currency,
  type UsageLog,
  type UnitCostPart,
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
  const n = log.usageCount;
  const quantity = describeQuantityText(t, metric, n);

  const unit = unitCostText(t, unitCostPart(metric, log.costPerUse, n), currency);
  return unit ? `${quantity} · ${unit}` : quantity;
}

/** 수량 옆에 붙는 단가 한 마디(`unitCostPart`의 문장). 용량처럼 단가가 없으면 null. */
export function unitCostText(
  t: Messages,
  part: UnitCostPart | null,
  currency: Currency,
): string | null {
  if (!part) return null;
  const c = t.value.checkIn;
  switch (part.type) {
    case "per-use":
      return c.perUse(formatCurrency(part.cost, currency));
    case "per-day":
      return c.perDay(formatCurrency(part.cost, currency));
    case "per-hour":
      return c.perHour(formatCurrency(part.cost, currency));
    case "not-used":
      return c.notUsed;
    case "benefit-returned":
      return c.benefitReturned(part.percent);
  }
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
