import {
  POPULAR_SERVICES,
  bundlesIncluding,
  coveredServices,
  type ServicePreset,
  type Subscription,
} from "@subslash/shared";
import { USAGE_PACKAGES } from "./packages";
import {
  addDays,
  dayKey,
  lastDays,
  totalsFor,
  type UsageHistory,
  type UsageTotals,
} from "./history";

/**
 * 폰 기록으로 '등록하지 않았는데 쓰고 있는 구독'을 찾아 묻는다(안드로이드 앱).
 *
 * 쓰는 것은 구독하는 것과 다르다 — 가족 계정으로 보거나, 결합 상품으로 받거나, 무료로 볼 수 있다. 그래서
 * 등록하지 않고 묻기만 하고, 요금제·금액·결제일은 등록 폼에서 사용자가 고른다(사용 기록으로는 알 수 없다).
 *
 * 묻는 서비스는 앱으로 볼 것이 거의 다 유료인 OTT만 둔다. 무료로도 많이 쓰는 앱(유튜브·유튜브 뮤직·스포티파이·
 * 챗GPT 같은 AI 앱)은 쓴다는 것이 구독의 근거가 되지 않아 뺐다. 쿠팡플레이는 와우 멤버십의 혜택이라 연결표에도
 * 없다(lib/usage/packages).
 */
export const SUGGESTABLE_SERVICES: readonly string[] = [
  "netflix",
  "disney-plus",
  "tving",
  "wavve",
  "watcha",
];

/** 이만큼 기록이 쌓여야 묻는다. 며칠치로는 잠깐 열어 본 것과 늘 보는 것을 가르지 못한다. */
export const SUGGEST_MIN_COVERED_DAYS = 14;
/**
 * 최근 30일 동안 이만큼 썼거나(합계) 이만큼 여러 날 썼으면 묻는다. 둘 다 근거가 있는 값이 아니라 팀이 정한
 * 기준이다 — 앱을 잠깐 열어 본 것으로 묻지 않으려는 것이다.
 */
export const SUGGEST_MIN_USED_MS = 60 * 60_000;
export const SUGGEST_MIN_ACTIVE_DAYS = 3;
/** '내가 내지 않아요'를 고르면 이만큼 묻지 않는다. 영영 묻지 않으면 나중에 구독한 것을 놓친다. */
export const SUGGEST_DISMISS_DAYS = 90;

/** 서비스 id → 이 날(YYYY-MM-DD)까지 묻지 않는다. */
export type SuggestDismissMap = Record<string, string>;

export interface SubscriptionSuggestion {
  preset: ServicePreset;
  totals: UsageTotals;
  /** 같은 서비스를 해지한 기록이 있다. 되살리지 않고 새로 등록할지 묻는다. */
  killed: boolean;
  /** 이 서비스를 포함하는 결합 상품(서비스 목록에서). '결합 상품으로 받아요'에 보여 준다. */
  bundles: ServicePreset[];
}

export function dismissUntil(now: Date): string {
  return dayKey(addDays(now, SUGGEST_DISMISS_DAYS));
}

/**
 * 물어볼 서비스들(많이 쓴 순). 이미 구독 중인 서비스 — 결합 상품에 들어 있는 것 포함, 무료 체험 중인 것 포함 —
 * 은 묻지 않는다.
 */
export function findSubscriptionSuggestions(
  subscriptions: readonly Subscription[],
  history: UsageHistory,
  dismissed: SuggestDismissMap,
  now: Date,
  /**
   * 기록이 이만큼 있어야 묻는다. 대시보드가 먼저 묻는 것은 SUGGEST_MIN_COVERED_DAYS를 쓰고, 사용자가 '폰 사용
   * 기록에서 찾기'를 눌렀을 때는 권한을 막 켜 기록이 며칠뿐이어도 찾는다 — 몇 일치인지는 화면이 함께 적는다.
   */
  minCoveredDays: number = SUGGEST_MIN_COVERED_DAYS,
): SubscriptionSuggestion[] {
  const today = dayKey(now);
  const dates = lastDays(now, 30);
  const covered = new Set(
    subscriptions.filter((sub) => sub.status === "active").flatMap(coveredServices),
  );
  const killed = new Set(
    subscriptions.filter((sub) => sub.status === "killed").flatMap(coveredServices),
  );

  const suggestions: SubscriptionSuggestion[] = [];
  for (const id of SUGGESTABLE_SERVICES) {
    if (covered.has(id) || (dismissed[id] ?? "") > today) continue;
    const preset = POPULAR_SERVICES.find((service) => service.id === id);
    const packages = USAGE_PACKAGES[id];
    if (!preset || !packages) continue;
    const totals = totalsFor(history, packages, dates);
    if (totals.coveredDays < Math.max(1, minCoveredDays)) continue;
    if (totals.usedMs < SUGGEST_MIN_USED_MS && totals.activeDays < SUGGEST_MIN_ACTIVE_DAYS) {
      continue;
    }
    suggestions.push({ preset, totals, killed: killed.has(id), bundles: bundlesIncluding(id) });
  }
  return suggestions.sort((a, b) => b.totals.usedMs - a.totals.usedMs);
}
