"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  DiscoveredSubscription,
  parsePaymentSms,
  formatKRW,
  sumMonthlyKRW,
} from "@subslash/shared";
import { useStore } from "../../lib/store";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { InlineConfirm } from "../ui/inline-confirm";
import { IS_APP_BUILD } from "@lib/platform";
import { discoveredFormData } from "@lib/discovered-form";
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
  const { addBatchSubscriptions, subscriptions, clearSubscriptions } = useStore();
  // '모두 지우고'는 해지한 구독과 그 절약 기록까지 지운다. 활성 목록만 보고 온
  // 사람이 모르고 지우지 않게 따로 적는다.
  const killedCount = subscriptions.filter((sub) => sub.status === "killed").length;
  const rate = useExchangeRate();

  // SMS parse state
  const [smsText, setSmsText] = useState<string>(initialSmsText ?? "");

  // Discovered items
  const [discoveredItems, setDiscoveredItems] = useState<DiscoveredSubscription[]>(
    initialDiscovered ?? [],
  );
  const [replaceExisting, setReplaceExisting] = useState<boolean>(!initialDiscovered);
  /** 후보 개수 옆에 붙일 설명(예: "Gmail 메일 40통에서"). */
  const [resultsNote, setResultsNote] = useState<string | null>(initialResultsNote ?? null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [, startTransition] = useTransition();

  const sharedTextParsed = useRef(false);

  const handleClearParsingRecords = () => {
    setSmsText("");
    setDiscoveredItems([]);
    setResultsNote(null);
  };

  const handleClose = () => {
    handleClearParsingRecords();
    onClose();
  };

  // Run SMS parse
  const handleParseSms = (textToParse: string) => {
    const results = parsePaymentSms(textToParse);
    setDiscoveredItems(results);
    setResultsNote(null);
  };

  const handleFillSample = () => {
    setSmsText(SAMPLE_SMS);
    handleParseSms(SAMPLE_SMS);
  };

  const handleFillSampleNaver = () => {
    setSmsText(SAMPLE_NAVER_RECEIPT);
    handleParseSms(SAMPLE_NAVER_RECEIPT);
  };

  // Text arriving from the share target is parsed as soon as the modal opens.
  useEffect(() => {
    if (!isOpen || !initialSmsText || sharedTextParsed.current) return;
    sharedTextParsed.current = true;
    handleParseSms(initialSmsText);
  }, [isOpen, initialSmsText]);

  const handleToggleSelect = (id: string) => {
    setDiscoveredItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)),
    );
  };

  const handleBatchRegister = () => {
    const selected = discoveredItems.filter((item) => item.selected);
    if (selected.length === 0) return;

    const dataList = selected.map(discoveredFormData);

    startTransition(() => {
      addBatchSubscriptions(dataList, { clearPrevious: replaceExisting });
      // 결제 메일에서 찾은 후보는 이전 결제 메일들을 방금 등록한 구독에 적는다. 앱이 적는 사실이라
      // 폼 데이터(SubscriptionFormData)로 넘기지 않는다.
      useStore.getState().recordChargeHistory(selected);
      onRegistered?.();
      handleClose();
    });
  };

  const selectedItems = discoveredItems.filter((i) => i.selected);
  const selectedCount = selectedItems.length;
  // 연간 영수증도 섞여 들어오므로 금액을 그대로 더하면 '/월' 합계가 부풀려진다.
  const selectedMonthlyKRW = sumMonthlyKRW(selectedItems, rate);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl bg-card text-foreground border-border">
        <DialogHeader className="pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl font-bold text-foreground">
              결제 문자로 불러오기
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            카드 결제 문자나 영수증을 붙여 넣으면 구독을 찾아 줘요.
          </DialogDescription>
        </DialogHeader>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-medium text-muted-foreground">
                결제 문자·영수증 붙여 넣기
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFillSample}
                  className="text-xs py-1 h-7 border-dashed"
                >
                  카드 문자 예시
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFillSampleNaver}
                  className="text-xs py-1 h-7 border-dashed text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10"
                >
                  네이버페이 영수증 예시
                </Button>
                {(smsText || discoveredItems.length > 0) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearParsingRecords}
                    className="text-xs py-1 h-7 border-dashed text-rose-600 dark:text-rose-400 border-rose-500/40 hover:bg-rose-500/10"
                  >
                    비우기
                  </Button>
                )}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Gmail이라면{" "}
              <Link
                href="/import"
                className="font-medium text-primary underline underline-offset-2"
              >
                메일에서 한 번에 찾기
              </Link>
              도 돼요.
            </p>

            <textarea
              rows={5}
              value={smsText}
              onChange={(e) => {
                setSmsText(e.target.value);
                handleParseSms(e.target.value);
              }}
              placeholder="결제 문자나 영수증을 그대로 붙여 넣으세요.&#10;&#10;[예시]&#10;[네이버페이] 결제내역 안내 (정기/반복결제)&#10;상품명 : 네이버 MYBOX 80GB 이용권 (정기결제)&#10;결제금액 : 1,650원&#10;결제일시 : 2026.09.02 14:30&#10;결제수단 : 네이버페이 머니"
              className="w-full p-3 text-xs md:text-sm font-mono rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/*
            붙여넣었는데 아무것도 못 찾았으면 그렇다고 말한다. 화면이 조용하면 사용자는 앱이
            멈춘 줄 안다. 금액이 없으면 등록할 수 없다 — 지어낼 수 없는 값이라 그렇다고 적는다.
          */}
          {smsText.trim().length > 0 && discoveredItems.length === 0 && (
            <div className="rounded-xl border border-dashed p-4 text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">결제를 찾지 못했어요</p>
              <p className="mt-1.5">
                <strong>결제금액</strong>이 적힌 줄이 들어갔는지 확인하세요. 금액이 없으면 등록할 수
                없어요.
              </p>
              <p className="mt-1.5">
                서비스 이름이 없으면 &lsquo;알 수 없는 결제&rsquo;로, 결제일이 없으면 오늘로 둬요.
              </p>
            </div>
          )}

          {discoveredItems.length > 0 && (
            <DiscoveredResults
              items={discoveredItems}
              note={resultsNote}
              onToggle={handleToggleSelect}
            />
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
                  <>
                    이전에 등록된 구독(
                    <span className="text-rose-600 dark:text-rose-400 font-bold">
                      {subscriptions.length}건
                    </span>
                    {killedCount > 0 && `, 해지한 구독 ${killedCount}건 포함`}
                    )을 모두 지우고 이번 결과로 새로 등록
                  </>
                ) : (
                  "새로운 구독으로 등록"
                )}
              </span>
            </label>

            <div className="flex items-center gap-2 shrink-0">
              {discoveredItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearParsingRecords}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  결과 비우기
                </button>
              )}
              {subscriptions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5 font-medium"
                >
                  이전 기록 전체 삭제
                </button>
              )}
            </div>
          </div>

          {/* 이 창 위에 확인창을 겹치지 않고 창 안에서 묻는다(InlineConfirm 참고). */}
          {confirmClear && subscriptions.length > 0 && (
            <InlineConfirm
              message={
                `현재 등록된 모든 구독(${subscriptions.length}건)을 초기화하시겠습니까?` +
                (killedCount > 0
                  ? `\n해지한 구독 ${killedCount}건의 절약 기록도 함께 지워집니다.`
                  : "")
              }
              confirmText="모두 삭제"
              onCancel={() => setConfirmClear(false)}
              onConfirm={() => {
                clearSubscriptions();
                setConfirmClear(false);
              }}
            />
          )}

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-end gap-3">
            <div className="flex shrink-0 items-center gap-2 w-full sm:w-auto justify-end">
              <Button type="button" variant="outline" size="sm" onClick={handleClose}>
                취소
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={selectedCount === 0}
                onClick={handleBatchRegister}
                className="font-medium gap-1.5 shadow-sm h-auto min-h-8 py-1.5 whitespace-normal text-left"
              >
                <span>
                  {replaceExisting && subscriptions.length > 0
                    ? `이전 기록 삭제 후 ${selectedCount}개 새로 등록`
                    : `${selectedCount}개 구독 일괄 등록`}
                </span>
                {selectedMonthlyKRW > 0 && (
                  <span className="text-xs opacity-90">(월 {formatKRW(selectedMonthlyKRW)})</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
