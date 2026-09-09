import { NextResponse } from "next/server";

/**
 * Latest published USD → KRW reference rate.
 *
 * Proxied through the server for two reasons: the browser would otherwise
 * depend on a third party's CORS headers, and one upstream call can be cached
 * for every visitor instead of one per browser.
 *
 * The upstream is the ECB's daily reference rate, which is not what a card
 * issuer bills — issuers add their own spread. The client labels it as a
 * reference rate for exactly that reason.
 */
const UPSTREAM = "https://api.frankfurter.app/latest?base=USD&symbols=KRW";

/** The ECB publishes once per working day, so a longer cache changes nothing. */
export const revalidate = 3600;

export async function GET() {
  try {
    const response = await fetch(UPSTREAM, {
      next: { revalidate },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error("[api/fx] upstream responded", response.status);
      return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
    }

    const body = (await response.json()) as { date?: string; rates?: { KRW?: number } };
    const rate = body.rates?.KRW;

    // A malformed payload must not become a rate: every won total on screen is
    // derived from this number.
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      console.error("[api/fx] unusable payload", body);
      return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
    }

    return NextResponse.json({
      rate,
      date: body.date ?? null,
      source: "ecb" as const,
    });
  } catch (error) {
    console.error("[api/fx]", error);
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
