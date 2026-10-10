"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { ReceiptText, X } from "lucide-react";
import type { Subscription, UsageLog } from "@subslash/shared";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { useIsClient } from "@hooks/useIsClient";
import { cn } from "@lib/utils";
import { useT } from "@lib/i18n";
import { ExchangeRateNote } from "../../settings/ExchangeRateNote";
import { useOverlayLock } from "@hooks/useOverlayLock";
import { AppSavingsLink } from "../../savings/app/AppSavingsLink";
import { ValueReceiptPaper } from "./ValueReceiptPaper";
import { type ValueReceipt, buildValueReceipt, sheetActions, won } from "./valueReceipt";

export interface AppValueReceiptProps {
  subscriptions: Subscription[];
  usageLogs: UsageLog[];
  now: Date;
  /**
   * 해지 안내를 연다. rest는 그 뒤에 이어서 물어볼 '쉬어가도 될 구독'들(금액이 큰 순)이다 —
   * 대시보드가 해지를 기록할 때마다 다음 구독을 묻는다.
   */
  onCancelGuide: (subscriptionId: string, rest?: string[]) => void;
  onCheckIn: (subscriptionId: string) => void;
}

/**
 * 앱 대시보드의 가성비 계산서 카드. 월 고정지출과 아낄 수 있는 돈만 보여주고, 누르면 영수증 모양의
 * 계산서를 아래 시트로 연다. 앱에서는 웹의 '월 고정지출' 카드와 가성비 리포트를 이 카드 하나가 맡는다.
 */
export function AppValueReceipt({
  subscriptions,
  usageLogs,
  now,
  onCancelGuide,
  onCheckIn,
}: AppValueReceiptProps) {
  const [open, setOpen] = useState(false);
  const r = useT().receipt;
  const rate = useExchangeRate();
  const data = buildValueReceipt(subscriptions, usageLogs, rate, now);
  const { active, summary } = data;
  // 모두 해지해 구독 중인 게 없어도 지킨 돈은 보이게 한다.
  if (active.length === 0) return <AppSavingsLink variant="card" standalone />;

  const checkedCount = summary.worthItItems.length + summary.wastedItems.length;

  return (
    <section className="rounded-2xl border bg-card p-4" aria-labelledby="value-receipt-card">
      <div className="flex items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary">
          <ReceiptText className="size-[19px]" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 id="value-receipt-card" className="text-[14.5px] font-extrabold tracking-tight">
            {r.title(now.getMonth() + 1)}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {r.summary(active.length, checkedCount)}
          </p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-secondary px-2.5 py-2">
          <dt className="text-[10.5px] text-muted-foreground">{r.fixed}</dt>
          <dd className="font-mono text-[17px] font-black tracking-tight tabular-nums">
            {won(data.fixedKRW)}
          </dd>
        </div>
        <div className="rounded-xl bg-secondary px-2.5 py-2">
          {summary.wastedKRW > 0 ? (
            <>
              <dt className="text-[10.5px] text-muted-foreground">{r.savable}</dt>
              <dd className="font-mono text-[17px] font-black tracking-tight text-amber-700 tabular-nums dark:text-amber-400">
                {won(summary.wastedKRW)}
              </dd>
            </>
          ) : summary.unknownItems.length > 0 ? (
            <>
              <dt className="text-[10.5px] text-muted-foreground">{r.needsCheckIn}</dt>
              <dd className="font-mono text-[17px] font-black tracking-tight tabular-nums">
                {r.count(summary.unknownItems.length)}
              </dd>
            </>
          ) : (
            <>
              <dt className="text-[10.5px] text-muted-foreground">{r.worth}</dt>
              <dd className="font-mono text-[17px] font-black tracking-tight text-emerald-700 tabular-nums dark:text-emerald-400">
                {r.count(summary.worthItItems.length)}
              </dd>
            </>
          )}
        </div>
      </dl>
      {/* 절약 현황은 하단 탭에 없어서, 매일 보는 이 카드에 지킨 돈 한 줄을 둔다. */}
      <AppSavingsLink variant="card" />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2.5 h-11 w-full rounded-xl bg-primary text-[13px] font-extrabold text-primary-foreground"
      >
        {r.open}
      </button>

      <ReceiptSheet
        open={open}
        onClose={() => setOpen(false)}
        now={now}
        data={data}
        // 해지 안내·체크인 창은 계산서 위에 겹쳐 뜬다(나중에 붙은 포털이 위). 계산서를 닫지 않아야
        // 해지를 이어 가는 동안 계산서가 그대로 남고, 끝나면 바뀐 숫자를 바로 볼 수 있다.
        onCheckIn={onCheckIn}
        onCancelGuide={onCancelGuide}
      />
    </section>
  );
}

function ReceiptSheet({
  open,
  onClose,
  now,
  data,
  onCheckIn,
  onCancelGuide,
}: {
  open: boolean;
  onClose: () => void;
  now: Date;
  data: ValueReceipt;
  onCheckIn: (id: string) => void;
  onCancelGuide: (id: string, rest?: string[]) => void;
}) {
  const isClient = useIsClient();
  const t = useT();

  useOverlayLock(open, onClose);

  if (!open || !isClient) return null;
  const { summary } = data;
  const { cancel, checkIn } = sheetActions(t, summary);
  return createPortal(
    <div className="fixed inset-0 z-50 flex h-[100dvh] items-end px-safe">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="value-receipt-title"
        className="relative flex h-[92dvh] w-full flex-col rounded-t-3xl bg-background shadow-2xl animate-in slide-in-from-bottom-8 fade-in"
      >
        <div className="relative flex h-8 shrink-0 items-center justify-center">
          <span className="h-1 w-9 rounded-full bg-border" aria-hidden />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-1.5 right-3 rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="size-5" />
            <span className="sr-only">{t.receipt.close}</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          <ValueReceiptPaper
            now={now}
            data={data}
            onCheckIn={onCheckIn}
            onCancelGuide={onCancelGuide}
          />
          <div className="mt-3">
            <ExchangeRateNote />
          </div>
        </div>
        {(summary.wastedItems.length > 0 || summary.unknownItems.length > 0) && (
          <div className="flex shrink-0 gap-2 border-t px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {cancel && (
              <button
                type="button"
                onClick={() => onCancelGuide(cancel.id, cancel.rest)}
                className="h-11 min-w-0 flex-1 truncate rounded-xl bg-primary px-3 text-[13px] font-extrabold text-primary-foreground"
              >
                {cancel.label}
              </button>
            )}
            {checkIn && (
              <button
                type="button"
                onClick={() => onCheckIn(checkIn.id)}
                className={cn(
                  "h-11 min-w-0 flex-1 truncate rounded-xl px-3 text-[13px] font-extrabold",
                  cancel ? "border bg-card" : "bg-primary text-primary-foreground",
                )}
              >
                {checkIn.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
