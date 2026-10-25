"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Download, Share2 } from "lucide-react";
import { buildReceipt, type ReceiptPeriod } from "@subslash/shared";
import { useStore } from "@lib/store";
import { useIsClient } from "@hooks/useIsClient";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { rateRangeFor, useHistoricalRates } from "@hooks/useHistoricalRates";
import { copyText, saveImage, shareText } from "@lib/native";
import { webUrl } from "@lib/api";
import {
  defaultReceiptMonth,
  formatReceiptPeriodText,
  formatReceiptShareText,
  parseReceiptPeriod,
  receiptHref,
  receiptNumber,
} from "@lib/receipt-view";
import { useLatestT, useServiceNames, useT } from "@lib/i18n";
import { renderReceiptImage } from "@lib/receipt-image";
import { ReceiptThemePicker, ReceiptThemePreview } from "@components/report/ReceiptThemePreview";
import { useReceiptTheme } from "@lib/receipt-theme";
import { RECEIPT_SHARE_PATH, encodeReceiptShare, shareableReceipt } from "@lib/receipt-share";
import { readLocal, writeLocal } from "@lib/local-storage";
import { IS_APP_BUILD } from "@lib/platform";
import { ConfirmDialog } from "@components/ui/confirm-dialog";
import { Button } from "@components/ui/button";
import { Spinner, PageSpinner } from "@components/ui/spinner";
import { CopyFallbackDialog } from "@components/ui/copy-fallback-dialog";
import { cn } from "@lib/utils";

/** 이 기기에서 영수증 링크를 처음 보낼 때의 확인을 마쳤는지. 기기의 것이라 기록·백업·동기화에 넣지 않는다. */
const SHARE_ACK_KEY = "subslash-receipt-share-ack";

/** 이보다 이른 해는 이 앱에 기록이 있을 수 없다(연말 결산과 같은 값). */
const EARLIEST_YEAR = 2020;

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
 * `?year=2026`이고, 없으면 지난달이다(지난달이 구독을 등록하기 전이라 모르는 달이면 이번 달). 영수증은 이미지로 저장하거나 글로 공유할 수 있다 — 둘 다
 * 사용자가 누를 때만 기기 밖으로 나간다.
 */
function ReceiptFromQuery() {
  const router = useRouter();
  const params = useSearchParams();
  const mounted = useIsClient();
  const t = useT();
  const names = useServiceNames();
  const tRef = useLatestT();
  const v = t.receiptView;
  const rate = useExchangeRate();
  const subscriptions = useStore((state) => state.subscriptions);
  const usageLogs = useStore((state) => state.usageLogs);
  const [now] = useState(() => new Date());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [copyFallback, setCopyFallback] = useState<string | null>(null);
  const [theme, setTheme] = useReceiptTheme();
  const [maskNames, setMaskNames] = useState(false);
  const [confirmShare, setConfirmShare] = useState(false);

  // 주소에 기간이 없으면 지난달, 지난달이 등록하기 전이라 모르는 달이면 이번 달(defaultReceiptMonth).
  const defaultMonth = useMemo(
    () => defaultReceiptMonth(subscriptions, usageLogs, rate, now),
    [subscriptions, usageLogs, rate, now],
  );
  const period: ReceiptPeriod = useMemo(() => {
    const parsed = parseReceiptPeriod(params);
    if (parsed && !isFuture(parsed, now) && parsed.year >= EARLIEST_YEAR) return parsed;
    return defaultMonth;
  }, [params, now, defaultMonth]);

  // 지난 달러 결제는 결제일의 고시 환율로 바꾼다. 받는 동안은 숫자가 바뀌어 보이지 않게 기다린다.
  const range = useMemo(() => {
    const { start, end } = periodBounds(period);
    return rateRangeFor(subscriptions, start, end, now);
  }, [subscriptions, period, now]);
  const { rateOn, loading: ratesLoading } = useHistoricalRates(range);

  // 영수증 계산은 저장된 이름으로 하고(같은 서비스의 예전 구독을 이름으로 가린다), 보이는 이름만 화면 언어로
  // 바꾼다 — 서비스 목록의 한국어 이름 그대로인 구독만 영문이 된다(useServiceNames).
  const receipt = useMemo(() => {
    const built = buildReceipt(subscriptions, usageLogs, period, rate, now, rateOn);
    const byId = new Map(subscriptions.map((sub) => [sub.id, names.sub(sub)]));
    const rename = <T extends { subscriptionId: string; name: string }>(item: T): T => ({
      ...item,
      name: byId.get(item.subscriptionId) ?? item.name,
    });
    return {
      ...built,
      lines: built.lines.map(rename),
      priciestPerUse: built.priciestPerUse && rename(built.priciestPerUse),
      killed: built.killed.map(rename),
    };
  }, [subscriptions, usageLogs, period, rate, now, rateOn, names]);

  // 공유 링크는 미리 만들어 둔다 — 누른 뒤에 압축을 기다리면 브라우저가 공유 창을 사용자 동작으로 보지 않을 수 있다.
  // 만든 링크는 어느 영수증·디자인·가림의 것인지와 함께 두어, 바뀐 뒤에 옛 링크를 보내지 않는다. url이 null이면 받는 쪽
  // 상한을 넘는 영수증이라 글로만 공유한다.
  const shareKey = useMemo(() => ({ receipt, theme, maskNames }), [receipt, theme, maskNames]);
  const [shareLink, setShareLink] = useState<{
    key: typeof shareKey;
    url: string | null;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    void encodeReceiptShare({ receipt, issuedAt: now, theme }, { maskNames }).then((hash) => {
      if (cancelled) return;
      setShareLink({ key: shareKey, url: hash ? webUrl(`${RECEIPT_SHARE_PATH}#${hash}`) : null });
    });
    return () => {
      cancelled = true;
    };
  }, [shareKey, receipt, theme, maskNames, now]);

  if (!mounted || ratesLoading) return <PageSpinner />;

  const previous = shift(period, -1);
  const next = shift(period, 1);
  const canGoBack = previous.year >= EARLIEST_YEAR;
  const canGoForward = !isFuture(next, now);
  const monthView: ReceiptPeriod = period.kind === "month" ? period : defaultMonth;
  const yearView: ReceiptPeriod = { kind: "year", year: period.year };

  const flash = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 3000);
  };

  const saveAsImage = async () => {
    setBusy(true);
    try {
      const image = await renderReceiptImage(receipt, now, tRef.current, theme);
      const saved = await saveImage(`subslash-receipt-${receiptNumber(period)}.png`, image);
      if (saved) flash(tRef.current.receiptView.page.imageSaved);
    } catch (error) {
      console.error("[receipt] 이미지를 만들지 못했습니다", error);
      flash(tRef.current.receiptView.page.imageFailed);
    } finally {
      setBusy(false);
    }
  };

  // 링크는 영수증만 보여 주는 화면이다. 지금 영수증·디자인의 링크가 준비되기 전에는 공유 버튼을 잠근다.
  const link = shareLink?.key === shareKey ? shareLink : null;
  // 결제가 적힌 줄이 없으면 보낼 것이 없다. 등록하기 전 달의 빈 영수증을 보내면 받는 사람은 '안 냈다'로 읽는다.
  const nothingToShare = receipt.lines.length === 0;

  const shareAsText = async () => {
    if (!link) return;
    // 글도 링크에 실린 것과 같은 영수증으로 만든다 — 이름을 가렸으면 글에서도 가린다.
    const s = tRef.current.receiptView.shared;
    const shown = shareableReceipt(
      receipt,
      { maskNames },
      { masked: s.maskedName, maskedKilled: s.maskedKilled },
    );
    const body = formatReceiptShareText(tRef.current, shown.receipt, shown.render);
    // 앱의 공유 창은 주소 칸을 따로 넘기지 않으므로 글 끝에 링크를 적는다(절약 공유와 같다).
    const text = link.url ? `${body}\n\n${link.url}` : body;
    const shared = await shareText({
      title: v.paperLabel(formatReceiptPeriodText(tRef.current, period)),
      text,
      url: link.url ?? undefined,
    });
    if (shared) return;
    if (await copyText(text)) flash(tRef.current.receiptView.page.textCopied);
    else setCopyFallback(text);
  };

  // 보낸 링크는 취소할 수 없으므로 이 기기에서 처음 링크를 보낼 때 한 번 묻는다.
  const onShare = () => {
    if (link?.url && readLocal(SHARE_ACK_KEY) !== "1") setConfirmShare(true);
    else void shareAsText();
  };

  return (
    <div className="mx-auto max-w-md space-y-5 py-2">
      {message && (
        <div
          role="status"
          className="fixed top-16 right-[calc(1rem+env(safe-area-inset-right))] z-50 rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-2xl"
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

      <ReceiptThemePicker theme={theme} onChange={setTheme} />
      <ReceiptThemePreview receipt={receipt} issuedAt={now} theme={theme} />

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" disabled={busy} onClick={() => void saveAsImage()}>
          {busy ? <Spinner className="size-4" /> : <Download className="size-4" aria-hidden />}
          {v.page.saveImage}
        </Button>
        <Button disabled={!link || nothingToShare} onClick={onShare}>
          <Share2 className="size-4" aria-hidden />
          {v.page.share}
        </Button>
      </div>
      {nothingToShare && <p className="text-xs text-muted-foreground">{v.page.nothingToShare}</p>}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={maskNames}
          onChange={(event) => setMaskNames(event.target.checked)}
          className="size-4"
        />
        {v.page.maskNames}
      </label>
      {/* 가려도 구독이 하나면 합계가 곧 그 구독의 금액이다. */}
      {maskNames && receipt.lines.length === 1 && (
        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
          {v.page.maskSingleHint}
        </p>
      )}
      <p className="text-xs text-muted-foreground">{v.page.privacy}</p>

      <ConfirmDialog
        isOpen={confirmShare}
        onClose={() => setConfirmShare(false)}
        onConfirm={() => {
          writeLocal(SHARE_ACK_KEY, "1");
          void shareAsText();
        }}
        title={v.page.confirmTitle}
        description={v.page.confirmBody}
        confirmText={v.page.confirmOk}
        centered={IS_APP_BUILD}
      />

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
    <Suspense fallback={<PageSpinner />}>
      <ReceiptFromQuery />
    </Suspense>
  );
}
