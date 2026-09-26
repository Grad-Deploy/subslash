"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import {
  formatKRW,
  getMyAnnualAmountKRW,
  getMyMonthlyAmountKRW,
  type Subscription,
} from "@subslash/shared";
import { cn } from "@lib/utils";
import { useStore } from "@lib/store";
import { subscriptionDetailHref } from "@lib/routes";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../../ui/dialog";
import { ServiceLogo } from "../ServiceLogo";
import { SubjectChip } from "../SubjectChip";

/** 'YYYY.MM.DD'. 해지일을 모르면 '—'. */
function killedDate(sub: Subscription): string {
  if (!sub.killedAt) return "—";
  const date = new Date(sub.killedAt);
  if (Number.isNaN(date.getTime())) return "—";
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}.${m}.${d}`;
}

/**
 * 구독 관리 › 해지 완료(앱). 해지한 구독을 정리한다.
 *
 * 예전에는 지우는 방법이 '삭제' 하나라, 목록을 비우려고 지우면 절약 현황의 지킨 돈까지 사라졌다. 그래서
 * 둘로 나눈다.
 * - 숨기기(`hiddenAt`): 목록에서만 빠지고 절약 현황에는 남는다. 아래 '숨긴 구독'에서 다시 보이게 한다.
 * - 삭제: 실수로 등록한 것. 절약 현황에서도 빠진다. 누르면 먼저 숨기기를 권한다.
 *
 * '선택'을 누르면 여러 개를(전체 선택으로 모두) 한 번에 숨기거나 지운다. 전체 삭제 버튼을 따로 두지
 * 않는다 — 한 번 눌러 모두 사라지는 버튼은 실수로 누르기 쉽다.
 */
export function AppKilledList({
  subscriptions,
  onRevive,
  onMessage,
}: {
  /** 해지 완료 탭에 들어갈 구독(숨긴 것 포함). */
  subscriptions: Subscription[];
  onRevive: (id: string) => void;
  onMessage: (message: string) => void;
}) {
  const rate = useExchangeRate();
  const hideSubscriptions = useStore((state) => state.hideSubscriptions);
  const unhideSubscriptions = useStore((state) => state.unhideSubscriptions);
  const deleteSubscriptions = useStore((state) => state.deleteSubscriptions);

  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);

  const shown = subscriptions.filter((sub) => !sub.hiddenAt);
  const hidden = subscriptions.filter((sub) => sub.hiddenAt);
  // 목록이 바뀌어(다른 곳에서 지움 등) 없는 구독은 고른 것에서 뺀다.
  const chosen = shown.filter((sub) => picked.has(sub.id)).map((sub) => sub.id);
  const allPicked = shown.length > 0 && chosen.length === shown.length;

  const stopSelecting = () => {
    setSelecting(false);
    setPicked(new Set());
  };
  const toggle = (id: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const hide = (ids: string[]) => {
    hideSubscriptions(ids);
    stopSelecting();
    setConfirmIds(null);
    onMessage(`${ids.length}개를 숨겼어요 · 절약 현황에는 남아요`);
  };
  const remove = (ids: string[]) => {
    deleteSubscriptions(ids);
    stopSelecting();
    setConfirmIds(null);
    onMessage(`${ids.length}개를 삭제했어요`);
  };

  const confirmSubs = (confirmIds ?? [])
    .map((id) => subscriptions.find((sub) => sub.id === id))
    .filter((sub): sub is Subscription => Boolean(sub));

  const card = (sub: Subscription, inHidden: boolean) => {
    const on = picked.has(sub.id);
    const pickable = selecting && !inHidden;
    return (
      <li
        key={sub.id}
        className={cn(
          "rounded-2xl border bg-card p-3",
          pickable && on && "border-foreground",
          inHidden && "opacity-80",
        )}
      >
        <div className="flex items-center gap-2.5">
          {pickable && (
            <button
              type="button"
              role="checkbox"
              aria-checked={on}
              aria-label={`${sub.name} 고르기`}
              onClick={() => toggle(sub.id)}
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-md border-2",
                on ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
            >
              {on && <Check className="size-4" aria-hidden />}
            </button>
          )}
          <ServiceLogo
            name={sub.name}
            cancelUrl={sub.cancelUrl}
            fallbackEmoji={sub.iconUrl}
            fallbackColor={sub.iconColor}
            size={32}
          />
          {pickable ? (
            <button
              type="button"
              onClick={() => toggle(sub.id)}
              className="min-w-0 flex-1 truncate text-left text-sm font-bold"
            >
              {sub.name}
            </button>
          ) : (
            <Link
              href={subscriptionDetailHref(sub.id)}
              className="min-w-0 flex-1 truncate text-sm font-bold"
            >
              {sub.name}
            </Link>
          )}
          {!selecting &&
            (inHidden ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 shrink-0 px-2.5 text-xs"
                onClick={() => {
                  unhideSubscriptions([sub.id]);
                  onMessage(`${sub.name}을(를) 다시 보이게 했어요`);
                }}
              >
                다시 보이기
              </Button>
            ) : (
              <span className="flex shrink-0 gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs"
                  onClick={() => onRevive(sub.id)}
                >
                  다시 살리기
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10"
                  onClick={() => setConfirmIds([sub.id])}
                >
                  삭제
                </Button>
              </span>
            ))}
        </div>
        {/* 해지일·월·연 아끼는 돈을 한 칸씩. 절약 현황의 '연 N원 아끼는 중'과 같은 계산이다. */}
        <dl className="mt-2.5 grid grid-cols-3 gap-1.5 border-t pt-2.5">
          <div>
            <dt className="text-[10.5px] text-muted-foreground">해지일</dt>
            <dd className="text-[13px] font-bold tabular-nums">{killedDate(sub)}</dd>
          </div>
          <div>
            <dt className="text-[10.5px] text-muted-foreground">월</dt>
            <dd className="text-[13px] font-bold tabular-nums">
              {formatKRW(getMyMonthlyAmountKRW(sub, rate))}
            </dd>
          </div>
          <div>
            <dt className="text-[10.5px] text-muted-foreground">연 아끼는 돈</dt>
            <dd className="text-[13px] font-bold tabular-nums">
              {formatKRW(getMyAnnualAmountKRW(sub, rate))}
            </dd>
          </div>
        </dl>
      </li>
    );
  };

  return (
    <div className={cn("space-y-3", selecting && "pb-20")}>
      <div className="flex items-center justify-between px-0.5 text-xs">
        {selecting ? (
          <>
            <button
              type="button"
              role="checkbox"
              aria-checked={allPicked}
              onClick={() => setPicked(allPicked ? new Set() : new Set(shown.map((s) => s.id)))}
              className="flex items-center gap-2 font-bold"
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-md border-2",
                  allPicked ? "border-primary bg-primary text-primary-foreground" : "border-border",
                )}
              >
                {allPicked && <Check className="size-4" aria-hidden />}
              </span>
              전체 선택
            </button>
            <span className="flex items-center gap-2">
              <b>{chosen.length}개</b> 선택됨
              <Button variant="outline" size="sm" className="h-8" onClick={stopSelecting}>
                취소
              </Button>
            </span>
          </>
        ) : (
          <>
            <span className="text-muted-foreground">목록 {shown.length}개</span>
            {shown.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => setSelecting(true)}
              >
                선택
              </Button>
            )}
          </>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-4 text-center text-xs text-muted-foreground">
          보이는 해지 구독이 없어요. 숨긴 구독은 아래에 있어요.
        </p>
      ) : (
        <ul className="space-y-2">{shown.map((sub) => card(sub, false))}</ul>
      )}

      {hidden.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            aria-expanded={showHidden}
            onClick={() => setShowHidden((open) => !open)}
            className="flex w-full items-center justify-between rounded-2xl border border-dashed px-3 py-2.5 text-xs font-semibold text-muted-foreground"
          >
            <span>숨긴 구독 {hidden.length}개 · 절약 현황에는 남아 있어요</span>
            <ChevronDown
              className={cn("size-4 transition-transform", !showHidden && "-rotate-90")}
              aria-hidden
            />
          </button>
          {showHidden && <ul className="space-y-2">{hidden.map((sub) => card(sub, true))}</ul>}
        </div>
      )}

      {selecting && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 flex gap-2 border-t bg-background px-4 py-3">
          <Button
            variant="outline"
            className="flex-1"
            disabled={chosen.length === 0}
            onClick={() => hide(chosen)}
          >
            숨기기{chosen.length > 0 && ` ${chosen.length}`}
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={chosen.length === 0}
            onClick={() => setConfirmIds(chosen)}
          >
            삭제{chosen.length > 0 && ` ${chosen.length}`}
          </Button>
        </div>
      )}

      <Dialog open={confirmSubs.length > 0} onOpenChange={(open) => !open && setConfirmIds(null)}>
        <DialogContent hideClose className="rounded-2xl sm:max-w-sm">
          <div className="break-keep text-center">
            <DialogTitle className="text-lg font-extrabold leading-snug">
              {confirmSubs.length === 1 ? "삭제할까요?" : `${confirmSubs.length}개를 삭제할까요?`}
            </DialogTitle>
            {confirmSubs.length === 1 && (
              <div className="mt-3 flex justify-center">
                <SubjectChip sub={confirmSubs[0]} />
              </div>
            )}
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
              절약 현황에서도 빠지고
              <br />
              되돌릴 수 없어요.
            </p>
            <p className="mt-3 rounded-xl bg-secondary px-3 py-2.5 text-sm leading-relaxed">
              실수로 넣은 게 아니면
              <br />
              <b>숨기기</b>를 추천해요.
            </p>
          </div>
          <div className="mt-5 flex gap-2">
            <Button
              variant="ghost"
              className="h-12 flex-1 rounded-xl bg-secondary text-base font-bold hover:bg-secondary/80"
              onClick={() => hide(confirmIds ?? [])}
            >
              숨기기
            </Button>
            <Button
              variant="destructive"
              className="h-12 flex-1 rounded-xl text-base font-bold"
              onClick={() => remove(confirmIds ?? [])}
            >
              삭제
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setConfirmIds(null)}
            className="mt-2 w-full py-2.5 text-sm font-semibold text-muted-foreground"
          >
            취소
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
