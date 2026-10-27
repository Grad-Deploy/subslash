import React from "react";
import { formatKRW, type Receipt } from "@subslash/shared";
import { useT } from "@lib/i18n";
import { receiptArt } from "@lib/receipt-art";
import type { ReceiptRenderOptions } from "@lib/receipt-view";

/**
 * 영수증 모양으로 그린 한 달·한 해의 구독 결제(utils/receipt).
 *
 * 종이는 어두운 화면에서도 밝은 종이색이다 — 영수증이라는 물건을 그린 것이라 테마를 따르지 않는다.
 * 대신 글자 색도 함께 고정해 어느 테마에서나 대비가 같다. 적는 말은 이미지로 저장하는 그림과 같은 곳
 * (lib/receipt-art)에서 만들고, 합계 아래 덧붙임만 이 종이의 모양대로 나눠 적는다.
 */
export function ReceiptPaper({
  receipt,
  issuedAt,
  render = {},
}: {
  receipt: Receipt;
  issuedAt: Date;
  /** 공유 링크로 받은 영수증이면 '확인되지 않은 내용'·가린 줄의 요약을 그린다(ReceiptRenderOptions). */
  render?: ReceiptRenderOptions;
}) {
  const t = useT();
  const v = t.receiptView;
  const art = receiptArt(t, receipt, issuedAt, render);

  return (
    <article
      aria-label={v.paperLabel(art.periodPlain)}
      className="receipt-paper relative mx-auto w-full max-w-sm bg-[#fbfaf7] px-6 pt-7 pb-10 text-zinc-900"
    >
      <header className="space-y-1 text-center">
        <p className="text-xl font-extrabold tracking-tight">SubSlash</p>
        <p className="text-xs text-zinc-500">{v.title}</p>
        <p className="pt-1 text-base font-bold">{art.period}</p>
        <p className="text-[11px] text-zinc-500 tabular-nums">{art.issuedLine}</p>
      </header>

      <hr className="my-4 border-t border-dashed border-zinc-400" />

      {art.empty !== null ? (
        <p className="py-4 text-center text-sm text-zinc-500">{art.empty}</p>
      ) : (
        <ul className="space-y-3">
          {art.lines.map((line, i) => (
            <li key={receipt.lines[i].subscriptionId}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-[15px] font-semibold">{line.name}</span>
                <span className="shrink-0 font-semibold tabular-nums">{line.amount}</span>
              </div>
              <p className="text-[11px] leading-snug text-zinc-500">{line.meta}</p>
            </li>
          ))}
        </ul>
      )}

      <hr className="my-4 border-t border-dashed border-zinc-400" />

      <dl className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <dt className="text-sm font-bold">{art.totalLabel}</dt>
          <dd className="text-lg font-extrabold tabular-nums">{art.total}</dd>
        </div>
        {receipt.billedTotalKRW !== receipt.totalKRW && (
          <div className="flex items-baseline justify-between text-xs text-zinc-500">
            <dt>{v.billed}</dt>
            <dd className="tabular-nums">{formatKRW(receipt.billedTotalKRW)}</dd>
          </div>
        )}
        {receipt.defendedKRW > 0 && (
          <div className="flex items-baseline justify-between text-sm font-bold text-emerald-700">
            <dt>{v.defended}</dt>
            <dd className="tabular-nums">{formatKRW(receipt.defendedKRW)}</dd>
          </div>
        )}
      </dl>
      {receipt.killed.length > 0 && (
        <p className="mt-1.5 text-[11px] text-zinc-500">
          {v.killedIn(receipt.killed.map((k) => k.name).join(", "))}
        </p>
      )}
      {receipt.priciestPerUse?.usage && (
        <p className="mt-2 text-xs">
          {v.priciestBefore}
          <b>{receipt.priciestPerUse.name}</b>
          {v.priciestAfter(formatKRW(receipt.priciestPerUse.usage.costPerUseKRW))}
        </p>
      )}

      <hr className="my-4 border-t border-dashed border-zinc-400" />

      <ul className="space-y-0.5 text-[10px] leading-snug text-zinc-500">
        {art.notes.map((note) => (
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
