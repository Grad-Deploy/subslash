"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";
import {
  type DiscoveredSubscription,
  formatCurrency,
  formatKRW,
  parsePaymentSms,
  sumMonthlyKRW,
} from "@subslash/shared";
import { useIsClient } from "@hooks/useIsClient";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { useStore } from "@lib/store";
import { discoveredFormData } from "@lib/discovered-form";
import { cn } from "@lib/utils";
import { ServiceLogo } from "../../subscription/ServiceLogo";
import type { AutoImportModalProps } from "../AutoImportModal";
import { SAMPLE_NAVER_RECEIPT, SAMPLE_SMS } from "../samples";
import { cycleText } from "../cycleText";
import { useOverlayLock } from "@hooks/useOverlayLock";
import { useT, useServiceNames } from "@lib/i18n";

function Status({ item }: { item: DiscoveredSubscription }) {
  const a = useT().importing.app;
  // '만료'라고 쓰지 않는다. 앱이 아는 것은 마지막 결제가 오래됐다는 것뿐이다(웹 창과 같은 기준).
  const [dot, label] = item.isCanceled
    ? ["bg-rose-500", a.statusCanceled]
    : item.isWithin30Days
      ? ["bg-emerald-500", a.statusRecent]
      : ["bg-amber-500", a.statusCheck];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-1.5 shrink-0 rounded-full", dot)} aria-hidden />
      {label}
    </span>
  );
}

/**
 * 앱의 '문자로 가져오기'. 웹의 가운데 창(AutoImportModal) 대신 아래에서 올라오는 시트로,
 * 붙여넣기 칸과 찾은 목록, 등록 버튼만 둔다. 기존 구독 지우기는 '옵션'에 접는다.
 *
 * 웹과 달리 '기존 구독 지우고 등록'은 늘 꺼진 채로 연다. 문자 몇 줄을 더하러 온 사람의 목록이
 * 기본값 때문에 지워지면 안 된다. 전체 삭제는 구독 관리의 데이터 묶음에 따로 있다.
 */
export function AppAutoImportModal({
  isOpen,
  onClose,
  initialSmsText,
  initialDiscovered,
  initialResultsNote,
  onRegistered,
}: AutoImportModalProps) {
  const names = useServiceNames();
  const t = useT();
  const a = t.importing.app;
  const isClient = useIsClient();
  const { addBatchSubscriptions, subscriptions } = useStore();
  const rate = useExchangeRate();
  const killedCount = subscriptions.filter((sub) => sub.status === "killed").length;

  const [smsText, setSmsText] = useState(initialSmsText ?? "");
  const [items, setItems] = useState<DiscoveredSubscription[]>(initialDiscovered ?? []);
  const [resultsNote, setResultsNote] = useState<string | null>(initialResultsNote ?? null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [, startTransition] = useTransition();
  const sharedTextParsed = useRef(false);

  // 메일에서 이미 찾아 온 후보를 확인하는 때는 붙여넣기 칸을 보이지 않는다.
  const reviewOnly = Boolean(initialDiscovered);

  const parse = (text: string) => {
    setItems(parsePaymentSms(text));
    setResultsNote(null);
  };

  const clear = () => {
    setSmsText("");
    setItems([]);
    setResultsNote(null);
  };

  const close = () => {
    clear();
    setReplaceExisting(false);
    onClose();
  };

  // 공유하기로 받은 글은 열리자마자 읽는다.
  useEffect(() => {
    if (!isOpen || !initialSmsText || sharedTextParsed.current) return;
    sharedTextParsed.current = true;
    parse(initialSmsText);
  }, [isOpen, initialSmsText]);

  useOverlayLock(isOpen, close);

  const fillSample = () => {
    // 예시는 카드 문자와 네이버페이 영수증을 번갈아 채운다.
    const text = sampleIndex % 2 === 0 ? SAMPLE_SMS : SAMPLE_NAVER_RECEIPT;
    setSampleIndex((i) => i + 1);
    setSmsText(text);
    parse(text);
  };

  const toggle = (id: string) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)),
    );

  const selected = items.filter((i) => i.selected);
  // 연간 영수증도 섞이므로 금액을 그대로 더하지 않고 월 환산 헬퍼를 쓴다.
  const monthlyKRW = sumMonthlyKRW(selected, rate);
  const willReplace = replaceExisting && subscriptions.length > 0;

  const register = () => {
    if (selected.length === 0) return;
    const dataList = selected.map(discoveredFormData);
    startTransition(() => {
      addBatchSubscriptions(dataList, { clearPrevious: willReplace });
      // 결제 메일에서 찾은 후보는 이전 결제 메일들을 방금 등록한 구독에 적는다(웹의 등록 창과 같다).
      useStore.getState().recordChargeHistory(selected);
      onRegistered?.();
      close();
    });
  };

  if (!isOpen || !isClient) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex h-[100dvh] items-end">
      <div className="absolute inset-0 bg-black/50" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-import-title"
        className="relative flex max-h-[88dvh] w-full flex-col rounded-t-3xl border-t bg-background shadow-2xl animate-in slide-in-from-bottom-8 fade-in"
      >
        <div className="flex h-6 shrink-0 items-center justify-center">
          <span className="h-1 w-9 rounded-full bg-border" aria-hidden />
        </div>

        <header className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3">
          <div className="min-w-0">
            <h2 id="app-import-title" className="text-lg font-black tracking-tight">
              {reviewOnly ? a.reviewTitle : a.pasteTitle}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {reviewOnly ? (resultsNote ?? a.reviewHint) : a.pasteHint}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="-mr-1.5 rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="size-5" />
            <span className="sr-only">{a.close}</span>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-3 text-sm">
          {!reviewOnly && (
            <>
              <textarea
                rows={items.length > 0 ? 2 : 6}
                value={smsText}
                onChange={(e) => {
                  setSmsText(e.target.value);
                  parse(e.target.value);
                }}
                placeholder={a.placeholder}
                className="w-full resize-none rounded-2xl border bg-card p-3 text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="mt-2 flex gap-1.5">
                {smsText ? (
                  <button
                    type="button"
                    onClick={clear}
                    className="rounded-full border border-dashed px-3 py-1 text-xs font-semibold text-muted-foreground"
                  >
                    {a.clear}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={fillSample}
                    className="rounded-full border border-dashed px-3 py-1 text-xs font-semibold text-muted-foreground"
                  >
                    {a.sample}
                  </button>
                )}
              </div>
            </>
          )}

          {/* 금액이 없으면 등록할 수 없다. 지어낼 수 없는 값이라, 할 일 한 줄만 알려 준다. */}
          {!reviewOnly && smsText.trim().length > 0 && items.length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed p-4 text-center">
              <p className="text-[13px] font-bold">{a.noneTitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">{a.noneBody}</p>
            </div>
          )}

          {items.length > 0 && (
            <section className={reviewOnly ? "" : "mt-4"}>
              <div className="mb-1 flex items-baseline justify-between">
                <p className="text-[13.5px] font-bold">{a.found(items.length)}</p>
                <p className="text-[11px] text-muted-foreground">{a.tapToRemove}</p>
              </div>
              <ul>
                {items.map((item) => (
                  <li key={item.id} className="border-b last:border-b-0">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={item.selected}
                      onClick={() => toggle(item.id)}
                      className={cn(
                        "flex w-full items-center gap-2.5 py-2.5 text-left transition-opacity",
                        !item.selected && "opacity-45",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-md border-[1.5px] text-[11px] font-black",
                          item.selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border",
                        )}
                        aria-hidden
                      >
                        {item.selected && <Check className="size-3.5" strokeWidth={3} />}
                      </span>
                      <ServiceLogo
                        presetId={item.presetId}
                        name={item.name}
                        cancelUrl={item.cancelUrl}
                        size={32}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-[13.5px] font-bold",
                            item.isCanceled && "line-through",
                          )}
                        >
                          {names.sub(item)}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Status item={item} />
                          {!item.isCanceled && <span>· {cycleText(t, item)}</span>}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 text-[13.5px] font-extrabold tabular-nums",
                          item.isCanceled && "line-through",
                        )}
                      >
                        {formatCurrency(item.amount, item.currency)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {subscriptions.length > 0 && (
                <details className="group mt-3 rounded-2xl border px-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-2.5 text-[12.5px] font-bold">
                    {a.options}
                    <ChevronDown
                      className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                      aria-hidden
                    />
                  </summary>
                  <label className="flex items-center justify-between gap-3 border-t py-2.5 text-[12.5px]">
                    <span>{a.replaceOption}</span>
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="size-4 shrink-0 accent-rose-500"
                    />
                  </label>
                  {willReplace && (
                    <p className="pb-2.5 text-[11px] text-rose-600 dark:text-rose-400" role="alert">
                      {a.replaceWarning(subscriptions.length, killedCount)}
                    </p>
                  )}
                </details>
              )}
            </section>
          )}
        </div>

        <div className="shrink-0 border-t px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={register}
            className={cn(
              "h-12 w-full rounded-xl text-sm font-extrabold disabled:opacity-40",
              willReplace
                ? "bg-rose-600 text-white dark:bg-rose-500"
                : "bg-primary text-primary-foreground",
            )}
          >
            {selected.length === 0 ? a.none : a.register(selected.length, willReplace)}
            {selected.length > 0 && monthlyKRW > 0 && (
              <span className="ml-1.5 text-xs font-semibold opacity-80">
                {a.monthly(formatKRW(monthlyKRW))}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
