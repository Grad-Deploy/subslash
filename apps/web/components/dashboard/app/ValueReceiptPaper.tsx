"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CATEGORY_LABELS, type ValueReportItem, isInTrial } from "@subslash/shared";
import { cn } from "@lib/utils";
import styles from "./AppValueReceipt.module.css";
import { AppSavingsLink } from "../../savings/app/AppSavingsLink";
import {
  PREVIEW_PER_SECTION,
  type SectionKey,
  type ValueReceipt,
  receiptDate,
  receiptDetail,
  receiptFooter,
  receiptSections,
  wasteOrder,
  won,
} from "./valueReceipt";

const SECTIONS: Record<SectionKey, { title: string; dot: string }> = {
  worth: { title: "뽕 뽑은 구독", dot: "bg-emerald-600 dark:bg-emerald-400" },
  wasted: { title: "쉬어가도 될 구독", dot: "bg-amber-600 dark:bg-amber-400" },
  unknown: { title: "체크인 필요", dot: "bg-zinc-400 dark:bg-zinc-500" },
};

/**
 * 영수증 본문. 이름 ······ 금액을 고정폭 숫자로 맞추고, 구역마다 소계, 분류별 금액, 맨 아래에
 * 월 고정지출과 아낄 수 있는 돈을 둔다. 체크인이 없으면 '아낄 수 있는 돈'을 지어내지 않는다.
 */
export function ValueReceiptPaper({
  now,
  data,
  onCheckIn,
  onCancelGuide,
}: {
  now: Date;
  data: ValueReceipt;
  onCheckIn: (id: string) => void;
  onCancelGuide: (id: string, rest?: string[]) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { active, summary, categories } = data;
  const { sections, collapsible, collapsed, hiddenCount } = receiptSections(data, expanded);
  const topCategory = categories[0]?.amount ?? 0;
  const categoryTotal = categories.reduce((n, c) => n + c.amount, 0);

  const actionFor = (key: SectionKey, item: ValueReportItem) =>
    key === "wasted"
      ? {
          label: "해지 안내",
          run: () => onCancelGuide(item.sub.id, wasteOrder(summary.wastedItems, item.sub.id)),
        }
      : key === "unknown"
        ? { label: "체크인", run: () => onCheckIn(item.sub.id) }
        : null;

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
        {receiptDate(now)} 기준 · 구독 {active.length}개
      </p>

      {sections.map(({ key, items, shown, subtotal }) => (
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
              const action = actionFor(key, item);
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
                      {receiptDetail(item)}
                      {isInTrial(item.sub, now) && " · 체험 중"}
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
      ))}

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
        {receiptFooter(summary)}
      </p>
    </div>
  );
}
