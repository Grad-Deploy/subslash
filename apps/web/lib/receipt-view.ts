import {
  formatChargeDate,
  formatKRW,
  type Receipt,
  type ReceiptLine,
  type ReceiptPeriod,
} from "@subslash/shared";

/**
 * 영수증 화면과 영수증 이미지(lib/receipt-image)가 함께 쓰는 문구. 두 곳이 따로 적으면 공유한
 * 그림과 화면이 다른 말을 하게 된다.
 */

/** 줄 아래의 작은 글 — 결제일, 나눠 냄, 해지, 그 기간의 체크인. */
export function describeReceiptLine(line: ReceiptLine, period: ReceiptPeriod): string {
  const parts: string[] = [];
  const upcoming = new Set(line.upcomingDates);
  const paid = line.chargeDates.filter((date) => !upcoming.has(date));
  if (paid.length > 0) {
    parts.push(
      period.kind === "month" || paid.length === 1
        ? `${paid.map(formatChargeDate).join(", ")} 결제`
        : `${paid.length}회 결제`,
    );
  }
  // 이번 달에 아직 오지 않은 결제일. 나간 돈과 섞어 적지 않는다.
  if (line.upcomingDates.length > 0) {
    parts.push(`${line.upcomingDates.map(formatChargeDate).join(", ")} 결제 예정`);
  }
  if (line.billingCycle === "yearly") parts.push("연간");
  if (line.shared) parts.push(`나눠 냄 · 카드 ${formatKRW(line.billedKRW)}`);
  if (line.killedOn) parts.push(`${formatChargeDate(line.killedOn)} 해지`);
  if (line.usage) {
    parts.push(
      line.usage.count === 0
        ? "체크인 0회"
        : `${line.usage.count}회 이용 · 1회 ${formatKRW(line.usage.costPerUseKRW)}`,
    );
  } else if (period.kind === "month") {
    // 체크인이 없으면 0회가 아니라 모른다.
    parts.push("체크인 없음");
  }
  return parts.join(" · ");
}

/** 기간 옆의 표시 — 끝난 기간은 없고, 이번 달 결제 예정이 있으면 '결제 예정 포함', 아니면 '오늘까지'. */
export function receiptPeriodSuffix(receipt: Receipt): string {
  if (receipt.isComplete) return "";
  return receipt.upcomingCount > 0 ? " · 결제 예정 포함" : " · 오늘까지";
}

/** 영수증 밑의 알림. 빠진 것이 있으면 몇 개가 왜 빠졌는지 말한다. */
export function receiptFootnotes(receipt: Receipt): string[] {
  const notes = ["등록한 구독 기록으로 계산했어요. 카드 명세서와 다를 수 있어요."];
  if (!receipt.isComplete) {
    notes.push(
      receipt.upcomingCount > 0
        ? "아직 끝나지 않은 기간이에요. 지금 구독 중인데 이번 달 결제일이 오지 않은 것은 '결제 예정'으로 넣었어요."
        : "아직 끝나지 않은 기간이라 오늘까지 결제된 것만 적었어요.",
    );
  }
  const { undated, beforeRegistration, trial } = receipt.excluded;
  if (undated > 0) notes.push(`결제 월을 모르는 연간 구독 ${undated}개는 넣지 못했어요.`);
  if (beforeRegistration > 0) {
    notes.push(
      `등록한 달보다 앞선 달은 구독 중이었는지 몰라 넣지 않았어요(${beforeRegistration}개).`,
    );
  }
  if (trial > 0) notes.push(`무료 체험 중이던 결제일은 뺐어요(${trial}개).`);
  if (receipt.defendedUnknownCount > 0) {
    notes.push(
      `결제 월이나 해지일을 몰라 지킨 돈에 넣지 못한 구독이 ${receipt.defendedUnknownCount}개 있어요.`,
    );
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
