import { formatKRW, type Receipt, formatDotDate, pad2 } from "@subslash/shared";
import type { Messages } from "@lib/i18n/messages";
import {
  describeReceiptLine,
  formatReceiptPeriodText,
  receiptCountText,
  receiptEmptyText,
  receiptFootnotes,
  receiptTotalLabel,
  receiptTotalText,
  receiptNumber,
  receiptPeriodSuffix,
  type ReceiptRenderOptions,
} from "./receipt-view";

/**
 * 영수증 이미지 테마(lib/receipt-image-themes)가 그리는 내용. 테마는 모양만 다르고 적는 말은 같아야 해서 한 곳에서
 * 만든다 — 문구는 화면 영수증과 같은 함수(lib/receipt-view)다. 테마가 칸을 빼면 그 사실이 사라지므로 모든 테마가
 * `lines`·`extras`·`notes`를 전부 그린다.
 */
export interface ReceiptArt {
  /** "2026년 9월" + " · 오늘까지" 같은 표시 */
  period: string;
  /** 꼬리말 없는 기간("2026년 9월"). 탑승권의 기간 칸. */
  periodPlain: string;
  /** 채팅 테마의 질문("9월에 구독료 얼마 냈어?" / "2026년에 …")과 답 첫 줄. */
  ask: string;
  reply: string;
  number: string;
  /** "2026.10.13" */
  issuedDate: string;
  /** "No. 2026-09 · 발행 2026.10.13" */
  issuedLine: string;
  total: string;
  /** "합계(내 몫) · 2건" */
  totalLabel: string;
  /** 탑승권의 '건수' 칸("3건"). 모르는 영수증이면 '모름'. */
  countText: string;
  lines: { name: string; amount: string; meta: string }[];
  /** 결제된 구독이 없을 때의 한 줄. 있으면 null. */
  empty: string | null;
  /** 합계 아래의 덧붙임(카드에 찍힌 금액, 지킨 돈, 해지, 1회가 가장 비쌌던 구독). */
  extras: string[];
  notes: string[];
  /** 탑승권 테마의 구간. "09.01" → "09.30". 끝나지 않은 기간은 결제 예정을 넣었으면 그 기간의 끝, 아니면 오늘까지다. */
  from: string;
  to: string;
}

export function receiptArt(
  t: Messages,
  receipt: Receipt,
  issuedAt: Date,
  options: ReceiptRenderOptions = {},
): ReceiptArt {
  const v = t.receiptView;
  const issuedDate = formatDotDate(issuedAt);
  const number = receiptNumber(receipt.period);
  const { period } = receipt;

  const startMonth = period.kind === "month" ? period.month : 1;
  const endMonth = period.kind === "month" ? period.month : 12;
  const lastDay = new Date(period.year, endMonth, 0).getDate();
  // 끝나지 않은 기간(이번 달·올해)은 발행한 날까지만 적는다 — 다만 결제 예정을 넣었으면 그 날짜가 오늘 뒤에 있으므로
  // 기간의 끝까지다(10.28 결제 예정이 적힌 표에 'TO 10.13'이라고 쓰면 서로 어긋난다).
  const to =
    receipt.isComplete || receipt.upcomingCount > 0
      ? `${pad2(endMonth)}.${pad2(lastDay)}`
      : `${pad2(issuedAt.getMonth() + 1)}.${pad2(issuedAt.getDate())}`;

  const extras: string[] = [];
  if (receipt.billedTotalKRW !== receipt.totalKRW) {
    extras.push(`${v.billed} ${formatKRW(receipt.billedTotalKRW)}`);
  }
  if (receipt.defendedKRW > 0) extras.push(`${v.defended} ${formatKRW(receipt.defendedKRW)}`);
  if (receipt.killed.length > 0)
    extras.push(v.killedIn(receipt.killed.map((k) => k.name).join(", ")));
  if (receipt.priciestPerUse?.usage) {
    extras.push(
      v.priciestPlain(
        receipt.priciestPerUse.name,
        formatKRW(receipt.priciestPerUse.usage.costPerUseKRW),
      ),
    );
  }

  return {
    period: `${formatReceiptPeriodText(t, period)}${receiptPeriodSuffix(t, receipt)}`,
    periodPlain: formatReceiptPeriodText(t, period),
    ask:
      period.kind === "month" ? v.art.chatAskMonth(period.month) : v.art.chatAskYear(period.year),
    reply: v.art.chatReply(formatReceiptPeriodText(t, period)),
    number,
    issuedDate,
    issuedLine: v.issued(number, issuedDate),
    total: receiptTotalText(t, receipt),
    totalLabel: receiptTotalLabel(t, receipt, options),
    countText: receiptCountText(t, receipt, options),
    lines: receipt.lines.map((line) => ({
      name: line.name,
      amount: formatKRW(line.amountKRW),
      meta: describeReceiptLine(t, line, period, options),
    })),
    empty: receipt.lines.length === 0 ? receiptEmptyText(t, receipt, options) : null,
    extras,
    notes: receiptFootnotes(t, receipt, options),
    from: `${pad2(startMonth)}.01`,
    to,
  };
}
