"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DiscoveredSubscription, formatKRW } from "@subslash/shared";
import { useStore } from "../../lib/store";
import { useImportCandidates } from "../../hooks/useImportCandidates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { InlineConfirm } from "../ui/inline-confirm";
import { IS_APP_BUILD } from "@lib/platform";
import { useT } from "@lib/i18n";
import dynamic from "next/dynamic";
import { SAMPLE_NAVER_RECEIPT, SAMPLE_SMS } from "./samples";
import { DiscoveredResults } from "./DiscoveredResults";

export interface AutoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Pre-filled receipt/SMS text, e.g. handed over by the PWA share target. */
  initialSmsText?: string;
  /**
   * 이미 찾아 둔 후보(예: Gmail에서 가져온 결제 메일). 이때는 '이전 기록을 지우고 등록'을 꺼 둔 채
   * 연다 — 메일에서 찾은 몇 건을 더하러 온 사람의 기존 목록이 지워지면 안 된다.
   */
  initialDiscovered?: DiscoveredSubscription[];
  /** 후보 개수 옆에 붙일 설명(예: "Gmail 메일 40통에서"). */
  initialResultsNote?: string;
  /** 고른 후보를 등록한 뒤. 창을 닫기만 했을 때는 부르지 않는다. */
  onRegistered?: () => void;
}

// 앱에서는 아래에서 올라오는 짧은 시트를 쓴다. 웹 사용자가 이 코드를 받지 않도록 앱 빌드에서만 불러온다.
const AppAutoImportModal = IS_APP_BUILD
  ? dynamic(() => import("./app/AppAutoImportModal").then((m) => m.AppAutoImportModal), {
      ssr: false,
    })
  : null;

export function AutoImportModal(props: AutoImportModalProps) {
  if (AppAutoImportModal) return <AppAutoImportModal {...props} />;
  return <WebAutoImportModal {...props} />;
}

function WebAutoImportModal({
  isOpen,
  onClose,
  initialSmsText,
  initialDiscovered,
  initialResultsNote,
  onRegistered,
}: AutoImportModalProps) {
  const w = useT().importing.web;
  const { subscriptions, clearSubscriptions } = useStore();
  // '모두 지우고'는 해지한 구독과 그 절약 기록까지 지운다. 활성 목록만 보고 온
  // 사람이 모르고 지우지 않게 따로 적는다.
  const killedCount = subscriptions.filter((sub) => sub.status === "killed").length;
  const {
    smsText,
    changeText,
    items,
    resultsNote,
    clear,
    close,
    toggle,
    selected,
    monthlyKRW,
    replaceExisting,
    setReplaceExisting,
    willReplace,
    register,
  } = useImportCandidates({
    isOpen,
    onClose,
    initialSmsText,
    initialDiscovered,
    initialResultsNote,
    onRegistered,
    // 웹은 처음 등록하는 사람이 많아 문자로 새로 채우는 것을 기본으로 둔다. 메일 후보를 확인할 때는 끈다.
    replaceByDefault: !initialDiscovered,
  });
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-2xl bg-card text-foreground border-border">
        <DialogHeader className="pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl font-bold text-foreground">{w.title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            {w.description}
          </DialogDescription>
        </DialogHeader>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-medium text-muted-foreground">{w.pasteLabel}</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => changeText(SAMPLE_SMS)}
                  className="text-xs py-1 h-7 border-dashed"
                >
                  {w.sampleCard}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => changeText(SAMPLE_NAVER_RECEIPT)}
                  className="text-xs py-1 h-7 border-dashed text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10"
                >
                  {w.sampleNaver}
                </Button>
                {(smsText || items.length > 0) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clear}
                    className="text-xs py-1 h-7 border-dashed text-rose-600 dark:text-rose-400 border-rose-500/40 hover:bg-rose-500/10"
                  >
                    {w.clear}
                  </Button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              {w.gmailBefore}
              <Link
                href="/import"
                className="font-medium text-primary underline underline-offset-2"
              >
                {w.gmailLink}
              </Link>
              {w.gmailAfter}
            </p>

            <textarea
              rows={5}
              value={smsText}
              onChange={(e) => changeText(e.target.value)}
              placeholder={w.placeholder}
              className="w-full p-3 text-xs md:text-sm font-mono rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/*
            붙여넣었는데 아무것도 못 찾았으면 그렇다고 말한다. 화면이 조용하면 사용자는 앱이
            멈춘 줄 안다. 금액이 없으면 등록할 수 없다 — 지어낼 수 없는 값이라 그렇다고 적는다.
          */}
          {smsText.trim().length > 0 && items.length === 0 && (
            <div className="rounded-xl border border-dashed p-4 text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">{w.noneTitle}</p>
              <p className="mt-1.5">{w.noneAmount}</p>
              <p className="mt-1.5">{w.noneUnknown}</p>
            </div>
          )}

          {items.length > 0 && (
            <DiscoveredResults items={items} note={resultsNote} onToggle={toggle} />
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-border mt-auto flex flex-col gap-3">
          {/* Previous records replacement option & clear button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs py-2 px-3 bg-muted/30 rounded-xl border border-border/70">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary cursor-pointer shrink-0"
              />
              <span className="text-foreground font-medium">
                {subscriptions.length > 0 ? (
                  <>{w.replaceWith(subscriptions.length, killedCount)}</>
                ) : (
                  w.replaceNew
                )}
              </span>
            </label>

            <div className="flex items-center gap-2 shrink-0">
              {items.length > 0 && (
                <button
                  type="button"
                  onClick={clear}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  {w.clearResults}
                </button>
              )}
              {subscriptions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5 font-medium"
                >
                  {w.clearAll}
                </button>
              )}
            </div>
          </div>

          {/* 이 창 위에 확인창을 겹치지 않고 창 안에서 묻는다(InlineConfirm 참고). */}
          {confirmClear && subscriptions.length > 0 && (
            <InlineConfirm
              message={w.confirmClear(subscriptions.length, killedCount)}
              confirmText={w.confirmClearYes}
              onCancel={() => setConfirmClear(false)}
              onConfirm={() => {
                clearSubscriptions();
                setConfirmClear(false);
              }}
            />
          )}

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-end gap-3">
            <div className="flex shrink-0 items-center gap-2 w-full sm:w-auto justify-end">
              <Button type="button" variant="outline" size="sm" onClick={close}>
                {w.cancel}
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={selected.length === 0}
                onClick={register}
                className="font-medium gap-1.5 shadow-sm h-auto min-h-8 py-1.5 whitespace-normal text-left"
              >
                <span>
                  {willReplace ? w.registerReplace(selected.length) : w.register(selected.length)}
                </span>
                {monthlyKRW > 0 && (
                  <span className="text-xs opacity-90">{w.monthly(formatKRW(monthlyKRW))}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
