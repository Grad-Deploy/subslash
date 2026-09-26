"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ReceiptText, X } from "lucide-react";
import {
  CATEGORY_LABELS,
  type Subscription,
  type SubscriptionCategory,
  type UsageLog,
  type ValueReportItem,
  formatCurrency,
  formatKRW,
  getMonthlyValueSummary,
  isInTrial,
  isShared,
  sumMonthlyKRW,
  sumMyMonthlyKRW,
  describeCheckIn,
  metricOfLog,
} from "@subslash/shared";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { useIsClient } from "@hooks/useIsClient";
import { cn } from "@lib/utils";
import { ExchangeRateNote } from "../../settings/ExchangeRateNote";
import styles from "./AppValueReceipt.module.css";
import { lockBodyScroll } from "@lib/scroll-lock";
import { AppSavingsLink } from "../../savings/app/AppSavingsLink";

interface AppValueReceiptProps {
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

/** 줄이 이보다 많으면 구역마다 앞의 두 줄만 보이고 나머지는 접는다. 합계는 늘 전체 기준이다. */
const COLLAPSE_OVER = 6;
const PREVIEW_PER_SECTION = 2;

type SectionKey = "worth" | "wasted" | "unknown";

const SECTIONS: Record<SectionKey, { title: string; dot: string }> = {
  worth: { title: "뽕 뽑은 구독", dot: "bg-emerald-600 dark:bg-emerald-400" },
  wasted: { title: "쉬어가도 될 구독", dot: "bg-amber-600 dark:bg-amber-400" },
  unknown: { title: "체크인 필요", dot: "bg-zinc-400 dark:bg-zinc-500" },
};

/**
 * 영수증 금액은 통화 기호와 숫자 사이를 한 칸 띄운다(₩ 17,000). 고정폭 숫자와 함께 가게 영수증처럼
 * 자릿수가 정갈하게 보인다. 부호(−)는 기호 앞에 둔다.
 */
function won(amount: number): string {
  return spaced(formatKRW(amount));
}

function spaced(text: string): string {
  return text.replace(/^([−-]?)([₩$])\s*/, "$1$2 ");
}

/** 먼저 연 구독을 빼고, 남은 '쉬어가도 될 구독'을 금액이 큰 순서로. 이어서 해지할 차례다. */
function wasteOrder(items: ValueReportItem[], firstId: string): string[] {
  return items
    .filter((item) => item.sub.id !== firstId)
    .sort((a, b) => b.monthlyAmountKRW - a.monthlyAmountKRW)
    .map((item) => item.sub.id);
}

function detail(item: ValueReportItem): string {
  if (item.status === "unknown") return "얼마나 썼는지 몰라요";
  const count = item.log?.usageCount ?? 0;
  if (!item.log) return "얼마나 썼는지 몰라요";
  if (metricOfLog(item.log) !== "uses") return describeCheckIn(item.log, item.sub.currency);
  if (count === 0) return "이번 달 미사용";
  return `${count}회 · 회당 ${spaced(formatCurrency(item.costPerUse ?? 0, item.sub.currency))}`;
}

/**
 * 계산서에 쓰는 숫자를 한곳에서 만든다. 가성비 분류는 웹 리포트와 같은 getMonthlyValueSummary,
 * 월 고정지출은 웹의 '월 고정지출' 카드(TotalSpend)와 같은 기준이다 — 체험 중인 구독은 아직 카드에서
 * 나가지 않으므로 빼고, 공유 구독은 내 몫만 센다.
 */
function useReceipt(subscriptions: Subscription[], usageLogs: UsageLog[]) {
  const rate = useExchangeRate();
  const active = subscriptions.filter((s) => s.status === "active");
  const summary = getMonthlyValueSummary(subscriptions, usageLogs, rate);
  const inTrial = active.filter((sub) => isInTrial(sub));
  const trialKRW = sumMyMonthlyKRW(inTrial, rate);
  const fixedKRW = sumMyMonthlyKRW(
    active.filter((sub) => !isInTrial(sub)),
    rate,
  );
  const sharedCount = active.filter(isShared).length;
  const billedKRW = sumMonthlyKRW(active, rate);

  const byCategory = new Map<SubscriptionCategory, Subscription[]>();
  for (const sub of active) {
    byCategory.set(sub.category, [...(byCategory.get(sub.category) ?? []), sub]);
  }
  const categories = [...byCategory.entries()]
    .map(([category, subs]) => ({ category, amount: sumMyMonthlyKRW(subs, rate) }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  return {
    active,
    summary,
    inTrial,
    trialKRW,
    fixedKRW,
    sharedCount,
    billedKRW,
    categories,
  };
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
  const data = useReceipt(subscriptions, usageLogs);
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
            {now.getMonth() + 1}월 가성비 계산서
          </h3>
          <p className="text-[11px] text-muted-foreground">
            구독 {active.length}개 · 체크인 {checkedCount}개
          </p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-secondary px-2.5 py-2">
          <dt className="text-[10.5px] text-muted-foreground">월 고정지출</dt>
          <dd className="font-mono text-[17px] font-black tracking-tight tabular-nums">
            {won(data.fixedKRW)}
          </dd>
        </div>
        <div className="rounded-xl bg-secondary px-2.5 py-2">
          {summary.wastedKRW > 0 ? (
            <>
              <dt className="text-[10.5px] text-muted-foreground">아낄 수 있는 돈</dt>
              <dd className="font-mono text-[17px] font-black tracking-tight text-amber-700 tabular-nums dark:text-amber-400">
                {won(summary.wastedKRW)}
              </dd>
            </>
          ) : summary.unknownItems.length > 0 ? (
            <>
              <dt className="text-[10.5px] text-muted-foreground">체크인 필요</dt>
              <dd className="font-mono text-[17px] font-black tracking-tight tabular-nums">
                {summary.unknownItems.length}개
              </dd>
            </>
          ) : (
            <>
              <dt className="text-[10.5px] text-muted-foreground">뽕 뽑은 구독</dt>
              <dd className="font-mono text-[17px] font-black tracking-tight text-emerald-700 tabular-nums dark:text-emerald-400">
                {summary.worthItItems.length}개
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
        계산서 보기
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
  data: ReturnType<typeof useReceipt>;
  onCheckIn: (id: string) => void;
  onCancelGuide: (id: string, rest?: string[]) => void;
}) {
  const isClient = useIsClient();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const unlockScroll = lockBodyScroll();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      unlockScroll();
    };
  }, [open, onClose]);

  if (!open || !isClient) return null;
  const { summary } = data;
  // 아래 고정 버튼은 금액이 큰 것부터 연다. 나머지는 계산서의 각 줄을 눌러 연다.
  const byAmount = (a: ValueReportItem, b: ValueReportItem) =>
    b.monthlyAmountKRW - a.monthlyAmountKRW;
  const wasteTarget = [...summary.wastedItems].sort(byAmount)[0];
  const killOrder = (firstId: string) => wasteOrder(summary.wastedItems, firstId);
  const checkTarget = [...summary.unknownItems].sort(byAmount)[0];

  return createPortal(
    <div className="fixed inset-0 z-50 flex h-[100dvh] items-end">
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
            <span className="sr-only">닫기</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          <Receipt now={now} data={data} onCheckIn={onCheckIn} onCancelGuide={onCancelGuide} />
          <div className="mt-3">
            <ExchangeRateNote />
          </div>
        </div>
        {(summary.wastedItems.length > 0 || summary.unknownItems.length > 0) && (
          <div className="flex shrink-0 gap-2 border-t px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {wasteTarget && (
              <button
                type="button"
                onClick={() => onCancelGuide(wasteTarget.sub.id, killOrder(wasteTarget.sub.id))}
                className="h-11 min-w-0 flex-1 truncate rounded-xl bg-primary px-3 text-[13px] font-extrabold text-primary-foreground"
              >
                {summary.wastedItems.length > 1
                  ? `${wasteTarget.sub.name}부터 해지 안내`
                  : `${wasteTarget.sub.name} 해지 안내`}
              </button>
            )}
            {checkTarget && (
              <button
                type="button"
                onClick={() => onCheckIn(checkTarget.sub.id)}
                className={cn(
                  "h-11 min-w-0 flex-1 truncate rounded-xl px-3 text-[13px] font-extrabold",
                  wasteTarget ? "border bg-card" : "bg-primary text-primary-foreground",
                )}
              >
                {summary.unknownItems.length > 1
                  ? `${checkTarget.sub.name}부터 체크인`
                  : `${checkTarget.sub.name} 체크인`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

/**
 * 영수증 본문. 이름 ······ 금액을 고정폭 숫자로 맞추고, 구역마다 소계, 분류별 금액, 맨 아래에
 * 월 고정지출과 아낄 수 있는 돈을 둔다. 체크인이 없으면 '아낄 수 있는 돈'을 지어내지 않는다.
 */
function Receipt({
  now,
  data,
  onCheckIn,
  onCancelGuide,
}: {
  now: Date;
  data: ReturnType<typeof useReceipt>;
  onCheckIn: (id: string) => void;
  onCancelGuide: (id: string, rest?: string[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { active, summary, categories } = data;
  const killOrder = (firstId: string) => wasteOrder(summary.wastedItems, firstId);

  const sections: { key: SectionKey; items: ValueReportItem[]; subtotal: number }[] = [
    { key: "worth" as const, items: summary.worthItItems, subtotal: summary.worthItKRW },
    { key: "wasted" as const, items: summary.wastedItems, subtotal: summary.wastedKRW },
    { key: "unknown" as const, items: summary.unknownItems, subtotal: summary.unknownKRW },
  ].filter((s) => s.items.length > 0);

  const lineCount = sections.reduce((n, s) => n + s.items.length, 0);
  const collapsible = lineCount > COLLAPSE_OVER;
  const collapsed = collapsible && !expanded;
  const hiddenCount = collapsed
    ? sections.reduce((n, s) => n + Math.max(0, s.items.length - PREVIEW_PER_SECTION), 0)
    : 0;
  const date = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
  const topCategory = categories[0]?.amount ?? 0;
  const categoryTotal = categories.reduce((n, c) => n + c.amount, 0);

  return (
    <div className={cn(styles.paper, "px-5 pt-6 pb-5 text-foreground")}>
      <p className="text-center text-[10.5px] font-extrabold tracking-[0.32em] text-muted-foreground">
        SUBSLASH
      </p>
      <h2
        id="value-receipt-title"
        className="mt-1.5 text-center text-[19px] font-black tracking-tight"
      >
        {now.getMonth() + 1}월 가성비 계산서
      </h2>
      <p className="text-center font-mono text-[11px] text-muted-foreground tabular-nums">
        {date} 기준 · 구독 {active.length}개
      </p>

      {sections.map(({ key, items, subtotal }) => {
        const shown = collapsed ? items.slice(0, PREVIEW_PER_SECTION) : items;
        return (
          <div key={key}>
            <hr className="my-3.5 border-t-[1.5px] border-dashed" />
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-extrabold tracking-wide text-muted-foreground">
              <span className={cn("size-[7px] rounded-[2px]", SECTIONS[key].dot)} aria-hidden />
              {SECTIONS[key].title}
              <span className="ml-auto font-semibold tracking-normal">{items.length}개</span>
            </p>
            <ul>
              {shown.map((item) => {
                // 쉬어가도 될 구독은 해지 안내, 체크인 필요는 체크인을 줄 전체를 눌러 연다. 버튼을 줄마다
                // 달지 않고 오른쪽에 작은 글씨와 › 하나만 두어 영수증을 깔끔하게 둔다.
                const action =
                  key === "wasted"
                    ? {
                        label: "해지 안내",
                        run: () => onCancelGuide(item.sub.id, killOrder(item.sub.id)),
                      }
                    : key === "unknown"
                      ? { label: "체크인", run: () => onCheckIn(item.sub.id) }
                      : null;
                const body = (
                  <>
                    <span className="flex items-baseline gap-1.5 text-[13px] font-bold">
                      <span className="min-w-0 truncate">{item.sub.name}</span>
                      <span className={styles.leader} aria-hidden />
                      <span className="shrink-0 font-mono tabular-nums">
                        {won(item.monthlyAmountKRW)}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span>
                        {detail(item)}
                        {isInTrial(item.sub) && " · 체험 중"}
                      </span>
                      {action && <span className="shrink-0 font-semibold">{action.label} ›</span>}
                    </span>
                  </>
                );
                return (
                  <li key={item.sub.id}>
                    {action ? (
                      <button
                        type="button"
                        onClick={action.run}
                        aria-label={`${item.sub.name} ${action.label}`}
                        className="-mx-2 block w-[calc(100%+1rem)] rounded-lg px-2 py-1.5 text-left active:bg-secondary"
                      >
                        {body}
                      </button>
                    ) : (
                      <div className="py-1.5">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
            {collapsed && items.length > PREVIEW_PER_SECTION && (
              <p className="text-[11px] text-muted-foreground">
                외 {items.length - PREVIEW_PER_SECTION}개
              </p>
            )}
            {key !== "unknown" && (
              <p className="flex justify-between pt-1 text-[11.5px] text-muted-foreground">
                <span>소계</span>
                <b className="font-mono font-bold text-foreground tabular-nums">{won(subtotal)}</b>
              </p>
            )}
          </div>
        );
      })}

      {collapsible && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold text-muted-foreground hover:bg-secondary"
        >
          {expanded ? "접기" : `계산서 펼치기 · ${hiddenCount}줄 더`}
          <ChevronDown
            className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
            aria-hidden
          />
        </button>
      )}

      {categories.length > 0 && (
        <>
          <hr className="my-3.5 border-t-[1.5px] border-dashed" />
          <p className="mb-1.5 text-[11px] font-extrabold tracking-wide text-muted-foreground">
            분류별
          </p>
          <ul className="space-y-1">
            {categories.map(({ category, amount }) => (
              <li
                key={category}
                className="grid grid-cols-[56px_1fr_auto] items-center gap-2 text-xs"
              >
                <span className="truncate">{CATEGORY_LABELS[category] ?? category}</span>
                <span className="h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden>
                  <span
                    className="block h-full rounded-full bg-foreground/75"
                    style={{ width: `${(amount / topCategory) * 100}%` }}
                  />
                </span>
                <span className="font-mono tabular-nums">
                  {won(amount)}
                  <span className="ml-1.5 text-[10.5px] text-muted-foreground">
                    {Math.round((amount / categoryTotal) * 100)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <hr className="mt-3.5 mb-2.5 border-t-[3px] border-double border-foreground/80" />
      {data.trialKRW > 0 && (
        <>
          <p className="flex justify-between text-xs text-muted-foreground">
            <span>구독 합계</span>
            <span className="font-mono tabular-nums">{won(summary.totalSpendKRW)}</span>
          </p>
          <p className="mt-0.5 mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>체험 중 {data.inTrial.length}개 (끝나면 더해져요)</span>
            <span className="font-mono tabular-nums">−{won(data.trialKRW)}</span>
          </p>
        </>
      )}
      <p className="flex items-baseline justify-between">
        <span className="text-[13px] font-extrabold">월 고정지출</span>
        <b className="font-mono text-[22px] font-black tabular-nums">{won(data.fixedKRW)}</b>
      </p>
      {summary.wastedKRW > 0 && (
        <p className="mt-1.5 flex items-baseline justify-between text-amber-700 dark:text-amber-400">
          <span className="text-[12.5px] font-extrabold">아낄 수 있는 돈</span>
          <b className="font-mono text-[15px] font-black tabular-nums">−{won(summary.wastedKRW)}</b>
        </p>
      )}
      {data.sharedCount > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          공유 구독 {data.sharedCount}개는 내 몫으로 셌어요 · 카드 청구액 월 {won(data.billedKRW)}
        </p>
      )}

      {/* 위는 앞으로 아낄 돈, 점선 아래는 해지로 이미 지킨 돈. */}
      <AppSavingsLink variant="receipt" />

      <p className="mt-3 text-center text-[11.5px] leading-relaxed text-muted-foreground">
        {summary.wasteSuggestion ??
          (summary.worthItItems.length === 0 && summary.wastedItems.length === 0
            ? "이번 달에 몇 번 썼는지 알려주면 회당 단가를 계산해 드려요."
            : "체크인할수록 계산이 정확해져요.")}
      </p>
    </div>
  );
}
