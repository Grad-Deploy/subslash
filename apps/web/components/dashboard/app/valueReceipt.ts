import {
  type Subscription,
  type SubscriptionCategory,
  type UsageLog,
  type ValueReportItem,
  formatCurrency,
  formatKRW,
  getMonthlyValueSummary,
  isInTrial,
  isShared,
  metricOfLog,
  sumMonthlyKRW,
  sumMyMonthlyKRW,
} from "@subslash/shared";
import type { Messages } from "@lib/i18n";
import { describeCheckInText } from "@lib/i18n/check-in-text";
import { describeWasteSuggestion } from "@lib/i18n/value-report";

/**
 * 앱 대시보드의 가성비 계산서(AppValueReceipt)가 쓰는 숫자와 문구. 화면 코드와 나눠 두어 테스트한다.
 */

/** 줄이 이보다 많으면 구역마다 앞의 두 줄만 보이고 나머지는 접는다. 합계는 늘 전체 기준이다. */
export const COLLAPSE_OVER = 6;
export const PREVIEW_PER_SECTION = 2;

export type SectionKey = "worth" | "wasted" | "unknown";

/**
 * 영수증 금액은 통화 기호와 숫자 사이를 한 칸 띄운다(₩ 17,000). 고정폭 숫자와 함께 가게 영수증처럼
 * 자릿수가 정갈하게 보인다. 부호(−)는 기호 앞에 둔다.
 */
export function won(amount: number): string {
  return spaced(formatKRW(amount));
}

export function spaced(text: string): string {
  return text.replace(/^([−-]?)([₩$])\s*/, "$1$2 ");
}

/** 먼저 연 구독을 빼고, 남은 '쉬어가도 될 구독'을 금액이 큰 순서로. 이어서 해지할 차례다. */
export function wasteOrder(items: ValueReportItem[], firstId: string): string[] {
  return items
    .filter((item) => item.sub.id !== firstId)
    .sort((a, b) => b.monthlyAmountKRW - a.monthlyAmountKRW)
    .map((item) => item.sub.id);
}

/** 계산서 한 줄 아래의 작은 글씨. 체크인이 없으면 회당 단가를 지어내지 않는다. */
export function receiptDetail(t: Messages, item: ValueReportItem): string {
  if (item.status === "unknown" || !item.log) return t.receipt.detailUnknown;
  if (metricOfLog(item.log) !== "uses") return describeCheckInText(t, item.log, item.sub.currency);
  const count = item.log.usageCount ?? 0;
  if (count === 0) return t.receipt.detailUnused;
  return t.receipt.detailUses(
    count,
    spaced(formatCurrency(item.costPerUse ?? 0, item.sub.currency)),
  );
}

export interface ValueReceipt {
  active: Subscription[];
  summary: ReturnType<typeof getMonthlyValueSummary>;
  inTrial: Subscription[];
  trialKRW: number;
  fixedKRW: number;
  sharedCount: number;
  billedKRW: number;
  categories: { category: SubscriptionCategory; amount: number }[];
}

/**
 * 계산서에 쓰는 숫자를 한곳에서 만든다. 가성비 분류는 웹 리포트와 같은 getMonthlyValueSummary,
 * 월 고정지출은 웹의 '월 고정지출' 카드(TotalSpend)와 같은 기준이다 — 체험 중인 구독은 아직 카드에서
 * 나가지 않으므로 빼고, 공유 구독은 내 몫만 센다.
 */
export function buildValueReceipt(
  subscriptions: Subscription[],
  usageLogs: UsageLog[],
  rate: number,
  now: Date,
): ValueReceipt {
  const active = subscriptions.filter((s) => s.status === "active");
  const summary = getMonthlyValueSummary(subscriptions, usageLogs, rate);
  const inTrial = active.filter((sub) => isInTrial(sub, now));
  const trialKRW = sumMyMonthlyKRW(inTrial, rate);
  const fixedKRW = sumMyMonthlyKRW(
    active.filter((sub) => !isInTrial(sub, now)),
    rate,
  );

  const byCategory = new Map<SubscriptionCategory, Subscription[]>();
  for (const sub of active) {
    byCategory.set(sub.category, [...(byCategory.get(sub.category) ?? []), sub]);
  }
  const categories = [...byCategory.entries()]
    .map(([category, subs]) => ({ category, amount: sumMyMonthlyKRW(subs, rate) }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return {
    active,
    summary,
    inTrial,
    trialKRW,
    fixedKRW,
    sharedCount: active.filter(isShared).length,
    billedKRW: sumMonthlyKRW(active, rate),
    categories,
  };
}

export interface ReceiptSection {
  key: SectionKey;
  items: ValueReportItem[];
  /** 접혔을 때 보이는 줄. 펼쳤으면 items 전부. */
  shown: ValueReportItem[];
  subtotal: number;
}

/**
 * 계산서의 구역(뽕 뽑은·쉬어가도 될·체크인 필요)과 접기 상태. 줄이 COLLAPSE_OVER보다 많을 때만 접을 수
 * 있고, 접으면 구역마다 앞의 PREVIEW_PER_SECTION줄만 보인다.
 */
export function receiptSections(receipt: ValueReceipt, expanded: boolean) {
  const { summary } = receipt;
  const all = [
    { key: "worth" as const, items: summary.worthItItems, subtotal: summary.worthItKRW },
    { key: "wasted" as const, items: summary.wastedItems, subtotal: summary.wastedKRW },
    { key: "unknown" as const, items: summary.unknownItems, subtotal: summary.unknownKRW },
  ].filter((s) => s.items.length > 0);

  const lineCount = all.reduce((n, s) => n + s.items.length, 0);
  const collapsible = lineCount > COLLAPSE_OVER;
  const collapsed = collapsible && !expanded;
  const sections: ReceiptSection[] = all.map((s) => ({
    ...s,
    shown: collapsed ? s.items.slice(0, PREVIEW_PER_SECTION) : s.items,
  }));
  const hiddenCount = sections.reduce((n, s) => n + s.items.length - s.shown.length, 0);
  return { sections, collapsible, collapsed, hiddenCount };
}

/** 계산서 머리의 날짜(2026.10.07). */
export function receiptDate(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
}

/** 계산서 맨 아래 한 줄. 체크인이 하나도 없으면 체크인을 권한다. */
export function receiptFooter(t: Messages, summary: ValueReceipt["summary"]): string {
  if (summary.wasteSuggestion) return describeWasteSuggestion(t, summary.wasteSuggestion);
  return summary.worthItItems.length === 0 && summary.wastedItems.length === 0
    ? t.receipt.footerNoCheckIn
    : t.receipt.footerMore;
}

export interface SheetAction {
  id: string;
  label: string;
}

export interface SheetCancelAction extends SheetAction {
  /** 이 구독 다음에 이어서 물어볼 '쉬어가도 될 구독'(wasteOrder). */
  rest: string[];
}

/**
 * 계산서 아래 고정 버튼. 금액이 큰 구독부터 연다(나머지는 계산서의 각 줄을 눌러 연다). 여럿이면
 * '…부터'라고 적어 이어서 묻는다는 것을 알린다.
 */
export function sheetActions(
  t: Messages,
  summary: ValueReceipt["summary"],
): {
  cancel: SheetCancelAction | null;
  checkIn: SheetAction | null;
} {
  const largest = (items: ValueReportItem[]) =>
    [...items].sort((a, b) => b.monthlyAmountKRW - a.monthlyAmountKRW)[0];
  const waste = largest(summary.wastedItems);
  const check = largest(summary.unknownItems);
  return {
    cancel: waste
      ? {
          id: waste.sub.id,
          label: t.receipt.cancelFrom(waste.sub.name, summary.wastedItems.length > 1),
          rest: wasteOrder(summary.wastedItems, waste.sub.id),
        }
      : null,
    checkIn: check
      ? {
          id: check.sub.id,
          label: t.receipt.checkInFrom(check.sub.name, summary.unknownItems.length > 1),
        }
      : null,
  };
}
