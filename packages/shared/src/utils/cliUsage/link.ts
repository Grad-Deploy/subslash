import type { CliServiceId } from "./types";

/** 링크에 서비스마다 싣는 값. */
export interface PcUsageLinkValue {
  days: number;
  /** API 환산 금액(USD). 모르면 null. */
  usd?: number | null;
  /** 구독으로 쓴 토큰 수. */
  tokens?: number;
}

/**
 * SubSlash로 넘길 링크(`/pc-usage#pc=…`). 값은 `#` 뒤에만 싣는다 — `?`에 실으면 SubSlash 서버 접속 기록에 남는다.
 * 쓴 날이 0인 서비스는 싣지 않는다: PC에서 안 쓴 것이지 구독을 안 쓴 것은 아니다(웹·앱에서 썼을 수 있다).
 *
 * 서비스마다 `서비스:쓴 날[:API 환산 USD[:토큰 수]]`. 금액은 요금을 아는 요청이 있을 때만, 토큰은 0보다 클 때만
 * 싣는다(금액을 모르면 빈 칸: `서비스:쓴 날::토큰 수`). 웹은 lib/pc-usage의 parsePcUsageHash로 읽는다.
 */
export function pcUsageLink(
  origin: string,
  counts: Partial<Record<CliServiceId, number | PcUsageLinkValue>>,
  options: { windowDays: number; until: string },
): string | null {
  const parts = (Object.entries(counts) as [CliServiceId, number | PcUsageLinkValue][])
    .map(([id, value]) => [id, typeof value === "number" ? { days: value } : value] as const)
    .filter(([, value]) => value.days > 0)
    .map(([id, value]) => linkPart(id, value));
  if (parts.length === 0) return null;
  const hash = new URLSearchParams({
    pc: parts.join(","),
    window: String(options.windowDays),
    until: options.until,
  });
  return `${origin.replace(/\/$/, "")}/pc-usage#${hash.toString()}`;
}

function linkPart(id: CliServiceId, { days, usd, tokens }: PcUsageLinkValue): string {
  const amount = usd !== null && usd !== undefined && usd > 0 ? usd.toFixed(2) : "";
  const count = tokens && tokens > 0 ? String(Math.round(tokens)) : "";
  if (count) return `${id}:${days}:${amount}:${count}`;
  return amount ? `${id}:${days}:${amount}` : `${id}:${days}`;
}
