import React from "react";
import { formatKRW, formatReceiptPeriod, type Receipt } from "@subslash/shared";
import {
  describeReceiptLine,
  receiptFootnotes,
  receiptNumber,
  receiptPeriodSuffix,
} from "@lib/receipt-view";

/**
 * 영수증 모양으로 그린 한 달·한 해의 구독 결제(utils/receipt).
 *
 * 종이는 어두운 화면에서도 밝은 종이색이다 — 영수증이라는 물건을 그린 것이라 테마를 따르지 않는다.
 * 대신 글자 색도 함께 고정해 어느 테마에서나 대비가 같다. 이미지로 저장하는 그림(lib/receipt-image)과
 * 같은 문구를 쓴다.
 */
export function ReceiptPaper({ receipt, issuedAt }: { receipt: Receipt; issuedAt: Date }) {
  const issued = `${issuedAt.getFullYear()}.${String(issuedAt.getMonth() + 1).padStart(2, "0")}.${String(issuedAt.getDate()).padStart(2, "0")}`;

  return (
    <article
      aria-label={`${formatReceiptPeriod(receipt.period)} 구독 영수증`}
      className="receipt-paper relative mx-auto w-full max-w-sm bg-[#fbfaf7] px-6 pt-7 pb-10 text-zinc-900"
    >
      <header className="space-y-1 text-center">
        <p className="text-xl font-extrabold tracking-tight">SubSlash</p>
        <p className="text-xs text-zinc-500">구독 영수증</p>
        <p className="pt-1 text-base font-bold">
          {formatReceiptPeriod(receipt.period)}
          {receiptPeriodSuffix(receipt)}
        </p>
        <p className="text-[11px] text-zinc-500 tabular-nums">
          No. {receiptNumber(receipt.period)} · 발행 {issued}
        </p>
      </header>

      <hr className="my-4 border-t border-dashed border-zinc-400" />

      {receipt.lines.length === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-500">결제된 구독이 없어요</p>
      ) : (
        <ul className="space-y-3">
          {receipt.lines.map((line) => (
            <li key={line.subscriptionId}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-[15px] font-semibold">{line.name}</span>
                <span className="shrink-0 font-semibold tabular-nums">
                  {formatKRW(line.amountKRW)}
                </span>
              </div>
              <p className="text-[11px] leading-snug text-zinc-500">
                {describeReceiptLine(line, receipt.period)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <hr className="my-4 border-t border-dashed border-zinc-400" />

      <dl className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <dt className="text-sm font-bold">합계(내 몫) · {receipt.chargeCount}건</dt>
          <dd className="text-lg font-extrabold tabular-nums">{formatKRW(receipt.totalKRW)}</dd>
        </div>
        {receipt.billedTotalKRW !== receipt.totalKRW && (
          <div className="flex items-baseline justify-between text-xs text-zinc-500">
            <dt>카드에 찍힌 금액</dt>
            <dd className="tabular-nums">{formatKRW(receipt.billedTotalKRW)}</dd>
          </div>
        )}
        {receipt.defendedKRW > 0 && (
          <div className="flex items-baseline justify-between text-sm font-bold text-emerald-700">
            <dt>해지로 지킨 돈</dt>
            <dd className="tabular-nums">{formatKRW(receipt.defendedKRW)}</dd>
          </div>
        )}
      </dl>
      {receipt.killed.length > 0 && (
        <p className="mt-1.5 text-[11px] text-zinc-500">
          이 기간에 해지: {receipt.killed.map((k) => k.name).join(", ")}
        </p>
      )}
      {receipt.priciestPerUse?.usage && (
        <p className="mt-2 text-xs">
          1회가 가장 비쌌던 구독: <b>{receipt.priciestPerUse.name}</b> (1회{" "}
          {formatKRW(receipt.priciestPerUse.usage.costPerUseKRW)})
        </p>
      )}

      <hr className="my-4 border-t border-dashed border-zinc-400" />

      <ul className="space-y-0.5 text-[10px] leading-snug text-zinc-500">
        {receiptFootnotes(receipt).map((note) => (
          <li key={note}>· {note}</li>
        ))}
      </ul>

      {/* 바코드 모양 장식. 읽을 수 있는 코드가 아니다. */}
      <div
        aria-hidden
        className="mx-auto mt-5 h-9 w-48 bg-[repeating-linear-gradient(90deg,#18181b_0_2px,transparent_2px_4px,#18181b_4px_5px,transparent_5px_8px)]"
      />
    </article>
  );
}
