import { findPresetForSubscription, type Subscription } from "@subslash/shared";

/**
 * PC의 AI 코딩 도구 사용(`apps/usage-cli`, `npx subslash-usage`)이 만든 링크(`/pc-usage#pc=…`)를 읽는다.
 *
 * 링크는 그 PC의 Claude Code·Codex 기록에서 센 '최근 N일 중 쓴 날 수'만 싣는다. 값은 `#` 뒤에 있어 서버로
 * 가지 않고, 이 화면은 숫자를 체크인 창에 채우기만 한다 — 저장은 사용자가 확인을 눌러야 된다. PC에서 쓴 날만
 * 셌으므로 웹·폰에서 쓴 날이 더 있을 수 있다(그래서 덮어쓰지 않고 채워 보여 준다).
 */

/** CLI가 재는 구독. 둘 다 쓴 날(`days`)로 재는 서비스다. */
export const PC_USAGE_SERVICES = ["claude-pro", "chatgpt-plus"] as const;
export type PcUsageServiceId = (typeof PC_USAGE_SERVICES)[number];

/** 링크를 만든 뒤 이만큼 지나면 숫자가 지난 것이라 다시 실행하게 한다. */
export const PC_USAGE_STALE_DAYS = 3;

export interface PcUsageLink {
  entries: { serviceId: PcUsageServiceId; days: number }[];
  windowDays: number;
  /** 센 날(그 PC의 날짜, YYYY-MM-DD). */
  until: string;
}

export type PcUsageParse =
  { ok: true; link: PcUsageLink } | { ok: false; reason: "invalid" | "stale" };

const isService = (value: string): value is PcUsageServiceId =>
  (PC_USAGE_SERVICES as readonly string[]).includes(value);

/** `#pc=claude-pro:12,chatgpt-plus:5&window=30&until=2026-10-09`을 읽는다. 하나라도 틀리면 통째로 거절한다. */
export function parsePcUsageHash(hash: string, now: Date = new Date()): PcUsageParse {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const windowDays = Number(params.get("window"));
  if (!Number.isInteger(windowDays) || windowDays < 1 || windowDays > 31) {
    return { ok: false, reason: "invalid" };
  }
  const until = params.get("until") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) return { ok: false, reason: "invalid" };
  const untilMs = Date.parse(`${until}T00:00:00`);
  if (!Number.isFinite(untilMs)) return { ok: false, reason: "invalid" };
  const dayMs = 24 * 60 * 60 * 1000;
  // PC와 이 기기의 날짜가 하루 어긋날 수 있다(시간대). 그보다 미래면 틀린 링크다.
  if (untilMs > now.getTime() + dayMs) return { ok: false, reason: "invalid" };

  const entries: PcUsageLink["entries"] = [];
  for (const part of (params.get("pc") ?? "").split(",")) {
    const [serviceId, raw] = part.split(":");
    const days = Number(raw);
    if (!serviceId || !isService(serviceId)) return { ok: false, reason: "invalid" };
    if (!Number.isInteger(days) || days < 1 || days > windowDays) {
      return { ok: false, reason: "invalid" };
    }
    if (entries.some((entry) => entry.serviceId === serviceId)) {
      return { ok: false, reason: "invalid" };
    }
    entries.push({ serviceId, days });
  }
  if (entries.length === 0) return { ok: false, reason: "invalid" };

  if (now.getTime() - untilMs > PC_USAGE_STALE_DAYS * dayMs) return { ok: false, reason: "stale" };
  return { ok: true, link: { entries, windowDays, until } };
}

/**
 * 이 서비스의 구독 중인 구독. 같은 서비스 구독이 여럿이면 어느 것에 적을지 모르므로 고르지 않는다
 * (`ambiguous`) — 리포트에 물어보기와 같은 규칙이다.
 */
export function matchPcUsageSubscription(
  serviceId: PcUsageServiceId,
  subscriptions: readonly Subscription[],
):
  | { kind: "match"; subscription: Subscription }
  | { kind: "none" }
  | { kind: "ambiguous"; count: number } {
  const matches = subscriptions.filter(
    (sub) => sub.status === "active" && findPresetForSubscription(sub)?.id === serviceId,
  );
  if (matches.length === 0) return { kind: "none" };
  if (matches.length > 1) return { kind: "ambiguous", count: matches.length };
  return { kind: "match", subscription: matches[0] };
}
