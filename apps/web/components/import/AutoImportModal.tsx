"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import {
  DiscoveredSubscription,
  SubscriptionFormData,
  parsePaymentSms,
  formatCurrency,
} from "@subslash/shared";
import { useStore } from "../../lib/store";
import { SHOW_INBOX_PREVIEW } from "../../lib/flags";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select } from "../ui/select";
import { EmailDomainInput } from "../ui/email-domain-input";
import { InboxPreviewPanel } from "./InboxPreviewPanel";

interface AutoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAccountId?: string;
  /** Pre-filled receipt/SMS text, e.g. handed over by the PWA share target. */
  initialSmsText?: string;
}

const SAMPLE_SMS = `[Web발신] 신한카드 승인 17,000원 넷플릭스 09/15 14:30 일시불
[KB국민카드] 14,900원 구글페이먼트(유튜브) 승인 09/22 10:12
현대카드 승인 7,890원 쿠팡와우멤버십 08/28 일시불
카카오페이 4,900원 자동결제 완료 (카카오 이모티콘 플러스) 09/05
네이버페이 4,900원 결제 완료 (네이버플러스 멤버십) 09/03`;

const SAMPLE_NAVER_RECEIPT = `[네이버페이] 결제내역 안내 (정기/반복결제)
주문번호 : 2026090212345678
상품명 : 네이버 MYBOX 80GB 이용권 (정기결제)
결제금액 : 1,650원
결제일시 : 2026.09.02 14:30
결제수단 : 네이버페이 머니
다음 결제 예정일 : 2026.10.02
---------------------------------
[TVING] 티빙 방송 무제한 정기 결제 영수증
결제금액 : 13,900원
결제일시 : 2026.09.03 09:00
결제수단 : 네이버페이 간편결제
---------------------------------
[TVING] 티빙 방송 무제한 정기결제 해지 완료 안내
해지일시 : 2026.09.05 15:20
처리상태 : 해지 완료 (다음 회차 결제 취소)`;

export function AutoImportModal({
  isOpen,
  onClose,
  defaultAccountId,
  initialSmsText,
}: AutoImportModalProps) {
  const { accounts, addAccount, addBatchSubscriptions, subscriptions, clearSubscriptions } =
    useStore();
  const [activeTab, setActiveTab] = useState<"email" | "sms">("sms");

  // SMS parse state
  const [smsText, setSmsText] = useState<string>(initialSmsText ?? "");

  // Discovered items
  const [discoveredItems, setDiscoveredItems] = useState<DiscoveredSubscription[]>([]);
  const [targetAccountId, setTargetAccountId] = useState<string>(
    defaultAccountId || accounts[0]?.id || "",
  );
  const [customTargetEmail, setCustomTargetEmail] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "ott" | "ai" | "other">("all");
  const [replaceExisting, setReplaceExisting] = useState<boolean>(true);
  const [scanAccountId, setScanAccountId] = useState<string>(
    defaultAccountId || accounts[0]?.id || "__custom__",
  );
  const [scanCustomEmail, setScanCustomEmail] = useState<string>("");
  /** Qualifier the preview attaches to its result count, e.g. the 30-day filter. */
  const [resultsNote, setResultsNote] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sharedTextParsed = useRef(false);

  const handleClearParsingRecords = () => {
    setSmsText("");
    setDiscoveredItems([]);
    setResultsNote(null);
  };

  /**
   * Mirrors the preview panel's own scan selection.
   *
   * Registration falls back to the scanned address when no target account was
   * chosen, so the modal has to know what the panel is pointed at even though
   * the panel owns that state.
   */
  const handleScanTargetChange = ({
    scanAccountId,
    scanCustomEmail,
    target,
  }: {
    scanAccountId: string;
    scanCustomEmail: string;
    target?: { accountId: string; customEmail: string };
  }) => {
    setScanAccountId(scanAccountId);
    setScanCustomEmail(scanCustomEmail);
    if (target) {
      setTargetAccountId(target.accountId);
      setCustomTargetEmail(target.customEmail);
    }
  };

  const handleClose = () => {
    handleClearParsingRecords();
    onClose();
  };

  // Run SMS parse
  const handleParseSms = (textToParse: string) => {
    const acc = accounts.find((a) => a.id === targetAccountId);
    const accName = acc ? `${acc.name} (${acc.emailOrId})` : undefined;

    const results = parsePaymentSms(textToParse, {
      linkedAccountId: acc?.id,
      linkedAccountName: accName,
    });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialSmsText]);

  const handleToggleSelect = (id: string) => {
    setDiscoveredItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)),
    );
  };

  const handleBatchRegister = () => {
    const selected = discoveredItems.filter((item) => item.selected);
    if (selected.length === 0) return;

    let accId: string | undefined = undefined;
    let accName: string | undefined = undefined;

    const effectiveCustomEmail =
      customTargetEmail.trim() || (scanAccountId === "__custom__" ? scanCustomEmail.trim() : "");

    if (
      (targetAccountId === "__custom__" || scanAccountId === "__custom__" || !targetAccountId) &&
      effectiveCustomEmail
    ) {
      const email = effectiveCustomEmail;
      const existingAcc = accounts.find((a) => a.emailOrId.toLowerCase() === email.toLowerCase());
      if (existingAcc) {
        accId = existingAcc.id;
        accName = `${existingAcc.name} (${existingAcc.emailOrId})`;
      } else {
        const localPart = email.split("@")[0] || "직접 입력 계정";
        const provider = email.includes("naver")
          ? "naver"
          : email.includes("gmail")
            ? "google"
            : email.includes("kakao")
              ? "kakao"
              : email.includes("icloud") || email.includes("apple")
                ? "apple"
                : "email";
        const newAcc = addAccount({
          name: localPart,
          emailOrId: email,
          provider,
        });
        accId = newAcc.id;
        accName = `${newAcc.name} (${newAcc.emailOrId})`;
      }
    } else if (targetAccountId && targetAccountId !== "__custom__") {
      const acc = accounts.find((a) => a.id === targetAccountId);
      if (acc) {
        accId = acc.id;
        accName = `${acc.name} (${acc.emailOrId})`;
      }
    }

    const dataList: SubscriptionFormData[] = selected.map((item) => ({
      name: item.name,
      amount: item.amount,
      currency: item.currency,
      billingDay: item.billingDay,
      billingCycle: item.billingCycle,
      billingMonth: item.billingMonth,
      category: item.category,
      cancelUrl: item.cancelUrl,
      cancelGuide: item.cancelGuide,
      paymentMethod: item.paymentMethod,
      linkedAccountId: accId || item.linkedAccountId,
      linkedAccountName: accName || item.linkedAccountName,
    }));

    startTransition(() => {
      addBatchSubscriptions(dataList, { clearPrevious: replaceExisting });
      handleClose();
    });
  };

  const selectedCount = discoveredItems.filter((i) => i.selected).length;
  const totalSelectedMonthly = discoveredItems
    .filter((i) => i.selected && i.currency === "KRW")
    .reduce((sum, i) => sum + i.amount, 0);
  const totalSelectedMonthlyUSD = discoveredItems
    .filter((i) => i.selected && i.currency === "USD")
    .reduce((sum, i) => sum + i.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col overflow-y-hidden bg-card text-foreground border-border">
        <DialogHeader className="pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <DialogTitle className="text-xl font-bold text-foreground">
              스마트 구독 자동 불러오기
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            카드 결제 문자나 영수증 메일 본문을 붙여넣으면 현재 실제로 결제 중인 구독만 추출합니다.
          </DialogDescription>
        </DialogHeader>

        {/*
          Tab Selector — only meaningful while the simulated inbox preview is
          enabled. With it off there is a single real input mode, so the modal
          shows no tabs at all.
        */}
        {SHOW_INBOX_PREVIEW && (
          <div className="flex gap-2 border-b border-border pt-2 pb-3">
            <Button
              type="button"
              variant={activeTab === "email" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setActiveTab("email");
                handleClearParsingRecords();
              }}
              className="flex-1 text-sm font-medium gap-1.5"
            >
              <span>🧪</span> 메일함 스캔 (미리보기)
            </Button>
            <Button
              type="button"
              variant={activeTab === "sms" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setActiveTab("sms");
                handleClearParsingRecords();
              }}
              className="flex-1 text-sm font-medium gap-1.5"
            >
              <span>💬</span> 결제 문자 · 영수증 붙여넣기
            </Button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
          {SHOW_INBOX_PREVIEW && activeTab === "email" && (
            <InboxPreviewPanel
              accounts={accounts}
              defaultAccountId={defaultAccountId}
              targetAccountId={targetAccountId}
              hasResults={discoveredItems.length > 0}
              onResults={(items, note) => {
                setDiscoveredItems(items);
                setResultsNote(note ?? null);
              }}
              onReset={handleClearParsingRecords}
              onScanTargetChange={handleScanTargetChange}
              onSwitchToPasteTab={() => {
                setActiveTab("sms");
                handleClearParsingRecords();
              }}
            />
          )}

          {/* TAB 2: SMS & EMAIL RECEIPT PARSE */}
          {activeTab === "sms" && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-medium text-muted-foreground">
                  카드 승인 문자 또는 네이버페이 결제 영수증 메일 본문 붙여넣기
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFillSample}
                    className="text-xs py-1 h-7 border-dashed"
                  >
                    ✨ 카드 문자 예시
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleFillSampleNaver}
                    className="text-xs py-1 h-7 border-dashed text-emerald-600 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10"
                  >
                    🟢 네이버페이 영수증 예시
                  </Button>
                  {(smsText || discoveredItems.length > 0) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearParsingRecords}
                      className="text-xs py-1 h-7 border-dashed text-rose-600 dark:text-rose-400 border-rose-500/40 hover:bg-rose-500/10"
                    >
                      🗑️ 파싱 내용 비우기
                    </Button>
                  )}
                </div>
              </div>

              <textarea
                rows={5}
                value={smsText}
                onChange={(e) => {
                  setSmsText(e.target.value);
                  handleParseSms(e.target.value);
                }}
                placeholder="결제 문자 또는 네이버 결제 영수증 이메일 내용을 그대로 붙여넣으세요.&#10;&#10;[예시]&#10;[네이버페이] 결제내역 안내 (정기/반복결제)&#10;상품명 : 네이버 MYBOX 80GB 이용권 (정기결제)&#10;결제금액 : 1,650원&#10;결제일시 : 2026.09.02 14:30&#10;결제수단 : 네이버페이 머니"
                className="w-full p-3 text-xs md:text-sm font-mono rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* DISCOVERED SUBSCRIPTIONS RESULT */}
          {discoveredItems.length > 0 &&
            (() => {
              const ottCount = discoveredItems.filter((i) => i.category === "ott").length;
              const aiCount = discoveredItems.filter((i) => i.category === "ai").length;
              const otherCount = discoveredItems.filter(
                (i) => i.category !== "ott" && i.category !== "ai",
              ).length;
              const filteredDiscoveredItems = discoveredItems.filter((item) => {
                if (categoryFilter === "all") return true;
                if (categoryFilter === "ott") return item.category === "ott";
                if (categoryFilter === "ai") return item.category === "ai";
                return item.category !== "ott" && item.category !== "ai";
              });

              return (
                <div className="space-y-2.5 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/50">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <span>
                          {activeTab === "email" ? "예시 구독 서비스" : "검색된 구독 서비스"}
                        </span>
                        <Badge variant="secondary" className="text-xs font-bold">
                          {discoveredItems.length}건
                        </Badge>
                        {resultsNote && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {resultsNote}
                          </span>
                        )}
                      </span>
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setCategoryFilter("all")}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full border transition font-medium ${
                          categoryFilter === "all"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        전체 ({discoveredItems.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryFilter("ott")}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full border transition font-medium ${
                          categoryFilter === "ott"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        🎬 OTT ({ottCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryFilter("ai")}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full border transition font-medium ${
                          categoryFilter === "ai"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        🤖 AI ({aiCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryFilter("other")}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full border transition font-medium ${
                          categoryFilter === "other"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/40 hover:bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        기타 ({otherCount})
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {filteredDiscoveredItems.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                        선택한 카테고리에 해당하는 구독 서비스가 없습니다.
                      </div>
                    ) : (
                      filteredDiscoveredItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleSelect(item.id)}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3 ${
                            item.isCanceled
                              ? "border-rose-400/40 bg-rose-500/5 dark:bg-rose-950/15 opacity-70"
                              : item.selected
                                ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
                                : "border-border bg-card opacity-50"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-primary border-border cursor-pointer shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`font-bold text-sm text-foreground truncate ${
                                    item.isCanceled ? "line-through opacity-70" : ""
                                  }`}
                                >
                                  {item.name}
                                </span>
                                {item.emailProvider === "naver" ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] py-0 border-0">
                                    🟢 네이버
                                  </Badge>
                                ) : item.emailProvider === "google" ? (
                                  <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] py-0 border-0">
                                    🌐 Google
                                  </Badge>
                                ) : null}
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0 px-1.5 shrink-0"
                                >
                                  {item.category.toUpperCase()}
                                </Badge>
                                {item.isCanceled ? (
                                  <Badge className="bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] py-0 border-0 font-semibold">
                                    🔴 해지 완료 메일 감지 (비활성)
                                  </Badge>
                                ) : item.isWithin30Days ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] py-0 border-0 font-medium">
                                    🟢 30일 내 결제 확인 (활성)
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] py-0 text-muted-foreground"
                                  >
                                    ⚪ 30일 초과 미결제 (만료)
                                  </Badge>
                                )}
                              </div>
                              {item.statusReason && (
                                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                                  {item.statusReason}
                                </p>
                              )}
                              {item.sourceSnippet && (
                                <p className="text-[10px] text-muted-foreground truncate max-w-sm font-mono mt-0.5">
                                  {item.sourceSnippet}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div
                              className={`font-black text-sm text-foreground ${
                                item.isCanceled ? "line-through opacity-60" : ""
                              }`}
                            >
                              {formatCurrency(item.amount, item.currency)}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {item.isCanceled ? "해지 완료됨" : `매월 ${item.billingDay}일 결제`}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })()}
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-3 border-t border-border mt-auto flex flex-col gap-3">
          {/* Registering preview results writes sample data into the real list. */}
          {activeTab === "email" && discoveredItems.length > 0 && (
            <div className="px-3 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
              지금 등록하면 <strong>예시 데이터</strong>가 내 구독 목록에 그대로 저장됩니다. 실제
              결제 내역을 등록하려면 <strong>결제 문자 · 영수증 붙여넣기</strong> 탭을 이용하세요.
            </div>
          )}

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
                  파싱 결과 비우기
                </button>
              )}
              {subscriptions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      confirm(
                        `현재 등록된 모든 구독(${subscriptions.length}건)을 초기화하시겠습니까?`,
                      )
                    ) {
                      clearSubscriptions();
                    }
                  }}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5 font-medium"
                >
                  <span>🗑️</span> 이전 기록 전체 삭제
                </button>
              )}
            </div>
          </div>

          {targetAccountId === "__custom__" && (
            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/80 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-xs font-semibold text-foreground shrink-0">
                ✏️ 직접 매핑할 이메일:
              </span>
              <div className="flex-1">
                <EmailDomainInput
                  value={customTargetEmail}
                  onChange={(full) => setCustomTargetEmail(full)}
                  placeholderId="매핑할 계정 아이디"
                  size="sm"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">연동 계정 매핑:</span>
              <Select
                value={targetAccountId}
                onChange={(e) => setTargetAccountId(e.target.value)}
                className="text-xs py-1 w-full min-w-0 sm:max-w-56"
              >
                <option value="">계정 매핑 안함</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.emailOrId})
                  </option>
                ))}
                <option value="__custom__">
                  ✏️ 직접 입력한 계정 (
                  {scanCustomEmail.trim() || customTargetEmail.trim() || "새 이메일"}) 매핑
                </option>
              </Select>
            </div>

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
                {(totalSelectedMonthly > 0 || totalSelectedMonthlyUSD > 0) && (
                  <span className="text-xs opacity-90">
                    (
                    {[
                      totalSelectedMonthly > 0
                        ? `${totalSelectedMonthly.toLocaleString()}원`
                        : null,
                      totalSelectedMonthlyUSD > 0 ? `$${totalSelectedMonthlyUSD.toFixed(0)}` : null,
                    ]
                      .filter(Boolean)
                      .join(" + ")}
                    /월)
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
