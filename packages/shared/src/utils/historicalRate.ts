/**
 * 지난 결제의 USD → KRW 환율.
 *
 * 영수증처럼 지난 결제를 원화로 보여 줄 때 지금 환율을 쓰면, 환율이 움직인 만큼 그때 낸 돈과 다른 숫자가 된다.
 * 그래서 결제일의 고시 환율(ECB 기준, 웹의 `/api/fx/history`)을 쓴다. 고시 환율은 영업일에만 나오므로 주말·
 * 공휴일의 결제는 그 전 가장 가까운 고시일의 환율을 쓴다. 그래도 없으면 모른다(null) — 부르는 쪽이 지금 환율로
 * 계산하고 그렇다고 적는다.
 *
 * 카드사가 실제로 청구한 환율은 아니다(카드사는 자기 환율과 수수료를 쓴다). 화면은 고시 환율이라고 밝힌다.
 */

/** 결제일(`YYYY-MM-DD`)의 환율. 모르면 null. */
export type RateOn = (date: string) => number | null;

/** 고시가 없는 날(주말·연휴)에 거슬러 올라가 찾는 날 수. 설·추석 연휴도 넘는다. */
export const RATE_LOOKBACK_DAYS = 7;

function previousDay(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const prev = new Date(Date.UTC(year, month - 1, day - 1));
  return prev.toISOString().slice(0, 10);
}

/** 고시일 → 환율 표로 `RateOn`을 만든다. 결제일에 고시가 없으면 그 전 고시일의 환율을 쓴다. */
export function rateOnFromTable(rates: Readonly<Record<string, number>>): RateOn {
  return (date) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    let day = date;
    for (let i = 0; i <= RATE_LOOKBACK_DAYS; i++) {
      const rate = rates[day];
      if (typeof rate === "number" && Number.isFinite(rate) && rate > 0) return rate;
      day = previousDay(day);
    }
    return null;
  };
}
