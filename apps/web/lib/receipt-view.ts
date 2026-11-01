import {
  buildReceipt,
  formatChargeDate,
  formatKRW,
  pad2,
  previousMonth,
  type Receipt,
  type ReceiptLine,
  type ReceiptPeriod,
  type Subscription,
  type UsageLog,
} from "@subslash/shared";
import type { Messages } from "@lib/i18n/messages";

/**
 * 영수증 화면과 영수증 이미지(lib/receipt-image)가 함께 쓰는 문구. 두 곳이 따로 적으면 공유한
 * 그림과 화면이 다른 말을 하게 된다.
 */

/** "2026년 9월" / "September 2026". */
export function formatReceiptPeriodText(t: Messages, period: ReceiptPeriod): string {
  return period.kind === "month"
    ? t.receiptView.periodMonth(period.year, period.month)
    : t.receiptView.periodYear(period.year);
}

/** 줄 아래의 작은 글 — 결제일, 나눠 냄, 해지, 그 기간의 체크인. */
export function describeReceiptLine(
  t: Messages,
  line: ReceiptLine,
  period: ReceiptPeriod,
  { unverified = false }: ReceiptRenderOptions = {},
): string {
  const l = t.receiptView.line;
  const parts: string[] = [];
  const upcoming = new Set(line.upcomingDates);
  const paid = line.chargeDates.filter((date) => !upcoming.has(date));
  if (paid.length > 0) {
    parts.push(
      period.kind === "month" || paid.length === 1
        ? l.paidDates(paid.map(formatChargeDate).join(", "))
        : l.paidCount(paid.length),
    );
  }
  // 이번 달에 아직 오지 않은 결제일. 나간 돈과 섞어 적지 않는다.
  if (line.upcomingDates.length > 0) {
    parts.push(l.upcoming(line.upcomingDates.map(formatChargeDate).join(", ")));
  }
  // 등록 전 달을 기록이 아니라 결제 메일로 넣었다는 것. 금액의 근거가 다르다.
  if (line.evidencedDates.length > 0) {
    parts.push(
      line.evidencedDates.length === paid.length
        ? l.evidenceAll
        : l.evidenceSome(line.evidencedDates.length),
    );
  }
  if (line.billingCycle === "yearly") parts.push(l.yearly);
  if (line.shared) parts.push(l.shared(formatKRW(line.billedKRW)));
  if (line.killedOn) parts.push(l.killedOn(formatChargeDate(line.killedOn)));
  // 공유받은 영수증은 체크인을 싣지 않았으므로 아무 말도 하지 않는다(ReceiptRenderOptions).
  if (unverified) return parts.join(" · ");
  if (line.usage) {
    parts.push(
      line.usage.count === 0
        ? l.zeroUses
        : l.uses(line.usage.count, formatKRW(line.usage.costPerUseKRW)),
    );
  } else if (period.kind === "month") {
    // 체크인이 없으면 0회가 아니라 모른다.
    parts.push(l.noCheckIn);
  }
  return parts.join(" · ");
}

/** 기간 옆의 표시 — 끝난 기간은 없고, 이번 달 결제 예정이 있으면 '결제 예정 포함', 아니면 '오늘까지'. */
export function receiptPeriodSuffix(t: Messages, receipt: Receipt): string {
  if (receipt.isComplete) return "";
  const s = t.receiptView.suffix;
  return receipt.upcomingCount > 0 ? s.withUpcoming : s.untilToday;
}

export interface ReceiptRenderOptions {
  /**
   * 공유 링크로 받은 영수증이다. 링크는 누구나 지어 만들 수 있으므로, 화면 밖 문구가 잘리는 캡처에서도 남게 영수증 안 맨
   * 앞에 '확인되지 않은 내용'이라고 적는다(lib/receipt-share). 체크인은 링크에 싣지 않으므로 줄마다 '체크인 없음'이라고
   * 적지 않는다 — 안 한 것이 아니라 모른다.
   */
  unverified?: boolean;
  /**
   * 가려서 공유한 영수증: 합계만 보인다. 구독 수·결제 건수·지킨 돈과 개수가 든 알림도 적지 않는다(개수만으로도 무엇을
   * 내는지 좁혀진다). 줄 자리에는 가렸다는 말을 적는다 — 비워 두면 '결제된 구독이 없어요'로 읽힌다.
   */
  hidden?: boolean;
}

/** 줄이 없을 때 그 자리에 적는 말. 가린 영수증이면 가렸다는 말이다. */
export function receiptEmptyText(
  t: Messages,
  receipt: Receipt,
  { hidden }: ReceiptRenderOptions = {},
): string {
  if (hidden) return t.receiptView.shared.hiddenSummary;
  return isReceiptUnknown(receipt)
    ? t.receiptView.unknownEmpty(formatReceiptPeriodText(t, receipt.period))
    : t.receiptView.empty;
}

/**
 * 줄이 하나도 없는데, 등록하기 전 달이거나 결제 월을 몰라 뺀 구독이 있는 영수증 — 결제가 없던 것이 아니라 모른다. 이때
 * '결제된 구독이 없어요'·'₩0'이라고 하면 안 낸 것처럼 읽힌다(처음 등록한 사람이 지난달 영수증을 열면 늘 이랬다).
 * 줄이 하나라도 있으면 합계는 아는 만큼이고, 빠진 것은 알림(receiptFootnotes)이 말한다.
 */
export function isReceiptUnknown(receipt: Receipt): boolean {
  return (
    receipt.lines.length === 0 &&
    (receipt.excluded.beforeRegistration > 0 || receipt.excluded.undated > 0)
  );
}

/** 합계 금액. 모르는 영수증은 ₩0이 아니라 '모름'. */
export function receiptTotalText(t: Messages, receipt: Receipt): string {
  return isReceiptUnknown(receipt) ? t.receiptView.unknownValue : formatKRW(receipt.totalKRW);
}

/** 합계 이름. 모르는·가린 영수증에는 건수를 붙이지 않는다. */
export function receiptTotalLabel(
  t: Messages,
  receipt: Receipt,
  { hidden }: ReceiptRenderOptions = {},
): string {
  return hidden || isReceiptUnknown(receipt)
    ? t.receiptView.share.total
    : t.receiptView.total(receipt.chargeCount);
}

/** 건수(탑승권의 '건수' 칸). 가린 영수증은 '가림', 모르는 영수증은 '모름'. */
export function receiptCountText(
  t: Messages,
  receipt: Receipt,
  { hidden }: ReceiptRenderOptions = {},
): string {
  if (hidden) return t.receiptView.shared.hiddenValue;
  return isReceiptUnknown(receipt)
    ? t.receiptView.unknownValue
    : t.receiptView.art.countValue(receipt.chargeCount);
}

export type ReceiptMonth = Extract<ReceiptPeriod, { kind: "month" }>;

/**
 * 처음 여는 달 영수증. 지난달이 기본이지만(매달 1일 알림이 여는 달), 지난달이 모르는 영수증이면(구독을 모두 그 뒤에
 * 등록했다) 이번 달을 연다 — 처음 등록한 사람이 리포트의 영수증을 누르면 늘 빈 지난달이 열렸다.
 */
export function defaultReceiptMonth(
  subscriptions: readonly Subscription[],
  usageLogs: readonly UsageLog[],
  rate: number,
  now: Date,
): ReceiptMonth {
  const last = { kind: "month", ...previousMonth(now) } as const;
  if (subscriptions.length === 0) return last;
  const receipt = buildReceipt(subscriptions, usageLogs, last, rate, now);
  return isReceiptUnknown(receipt)
    ? { kind: "month", year: now.getFullYear(), month: now.getMonth() + 1 }
    : last;
}

/** 영수증 밑의 알림. 빠진 것이 있으면 몇 개가 왜 빠졌는지 말한다. */
export function receiptFootnotes(
  t: Messages,
  receipt: Receipt,
  { unverified = false, hidden = false }: ReceiptRenderOptions = {},
): string[] {
  const n = t.receiptView.notes;
  const notes = unverified ? [t.receiptView.shared.unverifiedMark, n.base] : [n.base];
  // 가린 영수증은 합계가 무엇까지인지(오늘까지·결제 예정 포함)만 적는다. 나머지 알림은 개수를 말한다.
  if (hidden) {
    if (!receipt.isComplete) {
      notes.push(receipt.upcomingCount > 0 ? n.incompleteUpcoming : n.incompleteToday);
    }
    return notes;
  }
  if (receipt.evidencedCount > 0) {
    const sharedEvidence = receipt.lines.some(
      (line) => line.shared && line.evidencedDates.length > 0,
    );
    notes.push(n.evidenced(receipt.evidencedCount, sharedEvidence));
  }
  // 달러 결제를 어느 환율로 바꿨는지. 고시 환율도 카드사가 청구한 환율은 아니다.
  const { historical, current } = receipt.fx;
  if (historical > 0) {
    notes.push(n.historical);
  }
  if (current > 0) {
    notes.push(n.current(current));
  }
  // 금액을 고치기 전의 결제를 고치기 전 금액으로 셈했으면, 그 금액이 사용자가 적은 값이라고 밝힌다.
  if (receipt.priorAmount > 0) notes.push(n.priorAmount(receipt.priorAmount));
  if (!receipt.isComplete) {
    notes.push(receipt.upcomingCount > 0 ? n.incompleteUpcoming : n.incompleteToday);
  }
  const { undated, beforeRegistration, trial } = receipt.excluded;
  if (undated > 0) notes.push(n.undated(undated));
  if (beforeRegistration > 0) {
    notes.push(n.beforeRegistration(beforeRegistration));
  }
  if (trial > 0) notes.push(n.trial(trial));
  if (receipt.defendedUnknownCount > 0) {
    notes.push(n.defendedUnknown(receipt.defendedUnknownCount));
  }
  return notes;
}

/** 영수증 번호. 기간에서 정해지는 표시일 뿐 어떤 기록의 번호도 아니다. */
export function receiptNumber(period: ReceiptPeriod): string {
  return period.kind === "month" ? `${period.year}-${pad2(period.month)}` : `${period.year}`;
}

/** `?month=2026-09` 또는 `?year=2026`을 읽는다. 틀리면 null. */
export function parseReceiptPeriod(params: {
  get(name: string): string | null;
}): ReceiptPeriod | null {
  const month = params.get("month");
  if (month) {
    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (!match) return null;
    const [year, value] = [Number(match[1]), Number(match[2])];
    return value >= 1 && value <= 12 ? { kind: "month", year, month: value } : null;
  }
  const year = params.get("year");
  if (year && /^\d{4}$/.test(year)) return { kind: "year", year: Number(year) };
  return null;
}

/** 영수증 페이지 주소. */
export function receiptHref(period: ReceiptPeriod): string {
  return period.kind === "month"
    ? `/report/receipt?month=${receiptNumber(period)}`
    : `/report/receipt?year=${period.year}`;
}

/**
 * 공유·복사용 글 영수증. 화면과 같은 숫자만 적고, 카드 명세서가 아니라는 말을 끝에 붙인다 — 받은
 * 사람이 은행 기록으로 읽지 않게.
 */
export function formatReceiptShareText(
  t: Messages,
  receipt: Receipt,
  options: ReceiptRenderOptions = {},
): string {
  const s = t.receiptView.share;
  const suffix = receipt.isComplete
    ? ""
    : receipt.upcomingCount > 0
      ? s.upcomingInTitle
      : s.todayInTitle;
  const lines = [s.title(formatReceiptPeriodText(t, receipt.period), suffix), "-".repeat(28)];
  if (receipt.lines.length === 0) lines.push(receiptEmptyText(t, receipt, options));
  for (const line of receipt.lines) {
    const count = line.chargeDates.length > 1 ? ` ×${line.chargeDates.length}` : "";
    const upcoming = line.upcomingDates.length > 0 ? s.upcomingMark : "";
    lines.push(`${line.name}${count}${upcoming}  ${formatKRW(line.amountKRW)}`);
  }
  lines.push("-".repeat(28));
  lines.push(`${s.total}  ${receiptTotalText(t, receipt)}`);
  if (receipt.defendedKRW > 0) lines.push(`${s.defended}  ${formatKRW(receipt.defendedKRW)}`);
  lines.push("", t.receiptView.notes.base);
  return lines.join("\n");
}
