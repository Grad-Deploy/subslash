import {
  formatChargeDate,
  formatKRW,
  type Receipt,
  type ReceiptLine,
  type ReceiptPeriod,
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
export function describeReceiptLine(t: Messages, line: ReceiptLine, period: ReceiptPeriod): string {
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

/** 영수증 밑의 알림. 빠진 것이 있으면 몇 개가 왜 빠졌는지 말한다. */
export function receiptFootnotes(t: Messages, receipt: Receipt): string[] {
  const n = t.receiptView.notes;
  const notes = [n.base];
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
  return period.kind === "month"
    ? `${period.year}-${String(period.month).padStart(2, "0")}`
    : `${period.year}`;
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
export function formatReceiptShareText(t: Messages, receipt: Receipt): string {
  const s = t.receiptView.share;
  const suffix = receipt.isComplete
    ? ""
    : receipt.upcomingCount > 0
      ? s.upcomingInTitle
      : s.todayInTitle;
  const lines = [s.title(formatReceiptPeriodText(t, receipt.period), suffix), "-".repeat(28)];
  if (receipt.lines.length === 0) lines.push(t.receiptView.empty);
  for (const line of receipt.lines) {
    const count = line.chargeDates.length > 1 ? ` ×${line.chargeDates.length}` : "";
    const upcoming = line.upcomingDates.length > 0 ? s.upcomingMark : "";
    lines.push(`${line.name}${count}${upcoming}  ${formatKRW(line.amountKRW)}`);
  }
  lines.push("-".repeat(28));
  lines.push(`${s.total}  ${formatKRW(receipt.totalKRW)}`);
  if (receipt.defendedKRW > 0) lines.push(`${s.defended}  ${formatKRW(receipt.defendedKRW)}`);
  lines.push("", t.receiptView.notes.base);
  return lines.join("\n");
}
