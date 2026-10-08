"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Share2 } from "lucide-react";
import { buildReceipt, previousMonth, type ReceiptPeriod } from "@subslash/shared";
import { useStore } from "@lib/store";
import { useIsClient } from "@hooks/useIsClient";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { rateRangeFor, useHistoricalRates } from "@hooks/useHistoricalRates";
import { copyText, saveImage, shareText } from "@lib/native";
import { webUrl } from "@lib/api";
import {
  formatReceiptPeriodText,
  formatReceiptShareText,
  parseReceiptPeriod,
  receiptHref,
  receiptNumber,
} from "@lib/receipt-view";
import { useLatestT, useT } from "@lib/i18n";
import { renderReceiptImage } from "@lib/receipt-image";
import { ReceiptPaper } from "@components/report/ReceiptPaper";
import { Button } from "@components/ui/button";
import { Spinner } from "@components/ui/spinner";
import { CopyFallbackDialog } from "@components/ui/copy-fallback-dialog";
import { cn } from "@lib/utils";

/** 이보다 이른 해는 이 앱에 기록이 있을 수 없다(연말 결산과 같은 값). */
const EARLIEST_YEAR = 2020;

function LoadingScreen() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}

function shift(period: ReceiptPeriod, step: number): ReceiptPeriod {
  if (period.kind === "year") return { kind: "year", year: period.year + step };
  const date = new Date(period.year, period.month - 1 + step, 1);
  return { kind: "month", year: date.getFullYear(), month: date.getMonth() + 1 };
}

/** 영수증 기간의 첫날과 마지막 날. */
function periodBounds(period: ReceiptPeriod): { start: Date; end: Date } {
  return period.kind === "month"
    ? {
        start: new Date(period.year, period.month - 1, 1),
        end: new Date(period.year, period.month, 0),
      }
    : { start: new Date(period.year, 0, 1), end: new Date(period.year, 11, 31) };
}

function isFuture(period: ReceiptPeriod, now: Date): boolean {
  if (period.year !== now.getFullYear()) return period.year > now.getFullYear();
  return period.kind === "month" && period.month > now.getMonth() + 1;
}

/**
 * 구독 영수증 — 지난달(또는 고른 달·해)에 기록상 결제된 구독을 영수증 모양으로.
 *
 * 매달 1일 앱 알림(lib/local-reminders)이 지난달 영수증을 여기로 연다. 주소는 `?month=2026-09`나
 * `?year=2026`이고, 없으면 지난달이다. 영수증은 이미지로 저장하거나 글로 공유할 수 있다 — 둘 다
 * 사용자가 누를 때만 기기 밖으로 나간다.
 */
function ReceiptFromQuery() {
  const router = useRouter();
  const params = useSearchParams();
  const mounted = useIsClient();
  const t = useT();
  const tRef = useLatestT();
  const v = t.receiptView;
  const rate = useExchangeRate();
  const subscriptions = useStore((state) => state.subscriptions);
  const usageLogs = useStore((state) => state.usageLogs);
  const [now] = useState(() => new Date());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copyFallback, setCopyFallback] = useState<string | null>(null);

  const period: ReceiptPeriod = useMemo(() => {
    const parsed = parseReceiptPeriod(params);
    if (parsed && !isFuture(parsed, now) && parsed.year >= EARLIEST_YEAR) return parsed;
    return { kind: "month", ...previousMonth(now) };
  }, [params, now]);

  // 지난 달러 결제는 결제일의 고시 환율로 바꾼다. 받는 동안은 숫자가 바뀌어 보이지 않게 기다린다.
  const range = useMemo(() => {
    const { start, end } = periodBounds(period);
    return rateRangeFor(subscriptions, start, end, now);
  }, [subscriptions, period, now]);
  const { rateOn, loading: ratesLoading } = useHistoricalRates(range);

  const receipt = useMemo(
    () => buildReceipt(subscriptions, usageLogs, period, rate, now, rateOn),
    [subscriptions, usageLogs, period, rate, now, rateOn],
  );

  if (!mounted || ratesLoading) return <LoadingScreen />;

  const previous = shift(period, -1);
  const next = shift(period, 1);
  const canGoBack = previous.year >= EARLIEST_YEAR;
  const canGoForward = !isFuture(next, now);
  const monthView: ReceiptPeriod =
    period.kind === "month" ? period : { kind: "month", ...previousMonth(now) };
  const yearView: ReceiptPeriod = { kind: "year", year: period.year };

  const flash = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const saveAsImage = async () => {
    setBusy(true);
    try {
      const image = await renderReceiptImage(receipt, now, tRef.current);
      const saved = await saveImage(`subslash-receipt-${receiptNumber(period)}.png`, image);
      if (saved) flash(tRef.current.receiptView.page.imageSaved);
    } catch (error) {
      console.error("[receipt] 이미지를 만들지 못했습니다", error);
      flash(tRef.current.receiptView.page.imageFailed);
    } finally {
      setBusy(false);
    }
  };

  const shareAsText = async () => {
    const text = formatReceiptShareText(tRef.current, receipt);
    const shared = await shareText({
      title: v.paperLabel(formatReceiptPeriodText(tRef.current, period)),
      text,
      url: webUrl("/"),
    });
    if (shared) return;
    if (await copyText(text)) flash(tRef.current.receiptView.page.textCopied);
    else setCopyFallback(text);
  };

  return (
    <div className="mx-auto max-w-md space-y-5 py-2">
      {message && (
        <div
          role="status"
          className="fixed top-16 right-4 z-50 rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-2xl"
        >
          {message}
        </div>
      )}

      <header className="space-y-3">
        <Link href="/report" className="text-sm font-medium text-muted-foreground">
          {v.page.back}
        </Link>
        <h1 className="text-2xl font-black tracking-tight">{v.title}</h1>
        <div
          role="tablist"
          aria-label={v.page.tabsLabel}
          className="inline-flex rounded-xl border p-1"
        >
          {(
            [
              ["month", v.page.month, monthView],
              ["year", v.page.year, yearView],
            ] as const
          ).map(([kind, label, target]) => (
            <Link
              key={kind}
              role="tab"
              aria-selected={period.kind === kind}
              href={receiptHref(target)}
              replace
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-semibold",
                period.kind === kind
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              {label}
            </Link>
          ))}
        </div>
      </header>

      <nav className="flex items-center justify-between" aria-label={v.page.otherPeriods}>
        <Button
          variant="ghost"
          size="sm"
          disabled={!canGoBack}
          onClick={() => router.replace(receiptHref(previous))}
        >
          <ChevronLeft className="size-4" aria-hidden />
          {formatReceiptPeriodText(t, previous)}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={!canGoForward}
          onClick={() => router.replace(receiptHref(next))}
        >
          {canGoForward ? formatReceiptPeriodText(t, next) : v.page.next}
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </nav>

      <div className="drop-shadow-md">
        <ReceiptPaper receipt={receipt} issuedAt={now} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" disabled={busy} onClick={() => void saveAsImage()}>
          {busy ? <Spinner className="size-4" /> : <Download className="size-4" aria-hidden />}
          {v.page.saveImage}
        </Button>
        <Button onClick={() => void shareAsText()}>
          <Share2 className="size-4" aria-hidden />
          {v.page.share}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{v.page.privacy}</p>

      {period.kind === "year" && (
        <Link
          href={`/savings/review?year=${period.year}`}
          className="flex items-center justify-between rounded-2xl border p-4 text-sm font-semibold hover:bg-muted/50"
        >
          {v.page.yearDetail(period.year)}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      )}

      <CopyFallbackDialog
        text={copyFallback}
        title={v.title}
        onClose={() => setCopyFallback(null)}
      />
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ReceiptFromQuery />
    </Suspense>
  );
}
