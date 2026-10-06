import { useEffect, useMemo, useState } from "react";
import {
  RATE_LOOKBACK_DAYS,
  localYmd,
  rateOnFromTable,
  type RateOn,
  type Subscription,
} from "@subslash/shared";
import { apiUrl } from "@lib/api";

/**
 * `start`~`end` 기간의 지난 달러 결제를 바꿀 고시 환율을 받을 구간. 주말·연휴에 결제했으면 그 전 고시일을
 * 찾으므로 며칠 앞에서 시작하고, 오늘 뒤는 받지 않는다. 달러 구독이 없으면 받지 않는다(null).
 */
export function rateRangeFor(
  subscriptions: readonly Subscription[],
  start: Date,
  end: Date,
  now: Date,
): { from: string; to: string } | null {
  if (!subscriptions.some((sub) => sub.currency === "USD")) return null;
  const from = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() - RATE_LOOKBACK_DAYS,
  );
  return { from: localYmd(from), to: localYmd(end < now ? end : now) };
}

/**
 * 날짜 구간의 USD → KRW 고시 환율(`/api/fx/history`). 구독 영수증·연말 결산이 지난 달러 결제를
 * 결제일의 환율로 바꿀 때 쓴다.
 *
 * - `range`가 null이면(달러 구독이 없으면) 부르지 않는다.
 * - 같은 구간은 이 화면을 다시 열어도 한 번만 받는다(메모리 캐시). 지난 날의 고시 환율은 바뀌지 않는다.
 * - 받지 못하면 `rateOn`은 undefined로 남고, 화면은 지금 환율로 계산하며 그렇다고 적는다.
 */
const cache = new Map<string, Promise<Record<string, number> | null>>();

function fetchRates(from: string, to: string): Promise<Record<string, number> | null> {
  const key = `${from}..${to}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = fetch(apiUrl(`/api/fx/history?from=${from}&to=${to}`))
      .then(async (response) => {
        if (!response.ok) return null;
        const body = (await response.json()) as { rates?: Record<string, number> };
        return body.rates ?? null;
      })
      .catch(() => null)
      .then((rates) => {
        // 실패는 캐시하지 않는다 — 다음에 열 때 다시 받아 본다.
        if (!rates) cache.delete(key);
        return rates;
      });
    cache.set(key, pending);
  }
  return pending;
}

export function useHistoricalRates(range: { from: string; to: string } | null): {
  rateOn: RateOn | undefined;
  loading: boolean;
} {
  const from = range?.from ?? null;
  const to = range?.to ?? null;
  const [state, setState] = useState<{ key: string; rates: Record<string, number> | null } | null>(
    null,
  );
  const key = from && to ? `${from}..${to}` : null;

  useEffect(() => {
    if (!from || !to) return;
    let cancelled = false;
    void fetchRates(from, to).then((rates) => {
      if (!cancelled) setState({ key: `${from}..${to}`, rates });
    });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  const settled = key !== null && state?.key === key;
  const rates = settled ? state.rates : null;
  const rateOn = useMemo(() => (rates ? rateOnFromTable(rates) : undefined), [rates]);
  return { rateOn, loading: key !== null && !settled };
}
