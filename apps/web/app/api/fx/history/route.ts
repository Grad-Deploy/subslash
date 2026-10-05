import { NextRequest, NextResponse } from "next/server";
import { logError } from "@lib/log";

/**
 * 날짜 구간의 USD → KRW 고시 환율(ECB, 영업일마다 하나). 구독 영수증이 지난 달러 결제를 그 결제일의 환율로
 * 바꿀 때 쓴다(utils/historicalRate) — 지금 환율로 바꾸면 그때 낸 돈과 다른 숫자가 된다.
 *
 * `/api/fx`와 같은 곳(Frankfurter, ECB 고시 환율)을 서버가 대신 부른다. 브라우저가 보내는 것은 날짜 구간뿐이고
 * 구독 기록은 오지 않는다. 지난 날의 고시 환율은 바뀌지 않으므로 오래 캐시한다.
 *
 *   GET /api/fx/history?from=2026-01-01&to=2026-09-30 → { rates: { "2026-01-02": 1450.2, … }, source: "ecb" }
 */
// api.frankfurter.app은 이 주소로 넘겨준다(301). 넘어가는 한 번을 줄이려 바뀐 주소를 쓴다.
const UPSTREAM = "https://api.frankfurter.dev/v1";

/** 한 번에 받는 구간의 상한. 연 영수증(1년)과 주말을 거슬러 찾는 며칠이 들어간다. */
const MAX_DAYS = 400;

export const revalidate = 86400;

function parseDate(value: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export async function GET(request: NextRequest) {
  const from = parseDate(request.nextUrl.searchParams.get("from"));
  const to = parseDate(request.nextUrl.searchParams.get("to"));
  if (!from || !to || from > to || (to.getTime() - from.getTime()) / 86_400_000 > MAX_DAYS) {
    return NextResponse.json({ error: "invalid_range" }, { status: 400 });
  }
  // 오늘 뒤의 환율은 없다. 끝을 오늘로 당긴다.
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const end = to > today ? today : to;
  if (from > end) return NextResponse.json({ rates: {}, source: "ecb" as const });

  const range = `${from.toISOString().slice(0, 10)}..${end.toISOString().slice(0, 10)}`;
  try {
    const response = await fetch(`${UPSTREAM}/${range}?base=USD&symbols=KRW`, {
      next: { revalidate },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("[api/fx/history] upstream responded", response.status);
      return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
    }
    const body = (await response.json()) as { rates?: Record<string, { KRW?: unknown }> };
    // 숫자가 아닌 값은 버린다. 이 숫자로 영수증의 원화가 정해진다.
    const rates: Record<string, number> = {};
    for (const [date, value] of Object.entries(body.rates ?? {})) {
      const rate = value?.KRW;
      if (
        /^\d{4}-\d{2}-\d{2}$/.test(date) &&
        typeof rate === "number" &&
        Number.isFinite(rate) &&
        rate > 0
      ) {
        rates[date] = rate;
      }
    }
    return NextResponse.json({ rates, source: "ecb" as const });
  } catch (error) {
    logError("api/fx/history", error);
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
