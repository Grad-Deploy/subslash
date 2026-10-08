import type { ChargeRecord, Currency, Subscription } from "../types";
import { serviceNameKey } from "../constants/services";

/**
 * 결제 메일에서 모은 결제 기록(`Subscription.chargeHistory`).
 *
 * 영수증은 등록한 달보다 앞선 달을 "구독 중이었는지 모른다"며 비워 둔다. 결제 메일이 있는 달은
 * 모르는 달이 아니다 — 그 메일이 그 달에 그만큼 나갔다는 증거다. 그래서 메일이 있는 달만 그 금액으로
 * 채우고, 첫 메일과 마지막 메일 사이라도 메일이 없는 달은 채우지 않는다(해지했다 다시 구독했거나,
 * 검색 상한에 밀려 빠졌을 수 있다).
 */

/** 한 구독에 남길 결제 기록 수. 월 결제 5년 치. 넘으면 오래된 것부터 버린다. */
export const MAX_CHARGE_HISTORY = 60;

/** `YYYY-MM-DD`이고 달력에 있는 날인지. */
export function isChargeDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function isChargeRecord(value: unknown): value is ChargeRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    isChargeDate(record.date) &&
    typeof record.amount === "number" &&
    Number.isFinite(record.amount) &&
    record.amount > 0
  );
}

/** 메일 받은 날(`YYYY.MM.DD`, 파서의 `receiptDate`)을 결제 기록의 날짜로. 틀리면 null. */
export function chargeDateFromReceiptDate(receiptDate: string): string | null {
  const date = receiptDate.replace(/\./g, "-");
  return isChargeDate(date) ? date : null;
}

/**
 * 두 기록을 날짜별로 합친다. 같은 날은 새로 온 쪽을 쓴다(같은 메일을 다시 읽은 것이다). 이른 순으로
 * 두고, 넘치면 오래된 것부터 버린다. 형식이 틀린 줄은 버린다.
 */
export function mergeChargeHistory(
  existing: readonly ChargeRecord[] | undefined,
  incoming: readonly ChargeRecord[] | undefined,
): ChargeRecord[] {
  const byDate = new Map<string, ChargeRecord>();
  for (const record of [...(existing ?? []), ...(incoming ?? [])]) {
    if (isChargeRecord(record))
      byDate.set(record.date, { date: record.date, amount: record.amount });
  }
  return [...byDate.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-MAX_CHARGE_HISTORY);
}

/** 같은 서비스인지(이름·통화). */
export function isSameService(
  a: { name: string; currency: Currency },
  b: { name: string; currency: Currency },
): boolean {
  return serviceNameKey(a.name) === serviceNameKey(b.name) && a.currency === b.currency;
}

/**
 * 결제 기록을 받을 구독. 같은 서비스(이름·통화) 중 구독 중인 것, 없으면 가장 늦게 등록한 해지 구독.
 * 가져오기가 후보와 구독을 맞추는 기준(`planDiscoveries`)과 같다.
 */
export function chargeHistoryTarget<
  T extends Pick<Subscription, "name" | "currency" | "status" | "createdAt">,
>(subscriptions: readonly T[], found: { name: string; currency: Currency }): T | null {
  const matches = subscriptions.filter((sub) => isSameService(sub, found));
  const active = matches.find((sub) => sub.status === "active");
  if (active) return active;
  const killed = matches
    .filter((sub) => sub.status === "killed")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return killed[0] ?? null;
}
