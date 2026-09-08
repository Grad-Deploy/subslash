"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import {
  DiscoveredSubscription,
  SubscriptionFormData,
  EmailReceipt,
  parsePaymentSms,
  simulateEmailScan,
  getSimulatedInboxReceipts,
  formatCurrency,
  isDemoOrTestAccount,
} from "@subslash/shared";
import { useStore } from "../../lib/store";
import { SHOW_INBOX_PREVIEW } from "../../lib/flags";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select } from "../ui/select";
import { EmailDomainInput } from "../ui/email-domain-input";

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

  // Email scan options (Google & Naver)
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    defaultAccountId || accounts[0]?.id || "__custom__",
  );
  const [customEmail, setCustomEmail] = useState<string>("");
  const [simulateSampleForCustom, setSimulateSampleForCustom] = useState<boolean>(false);
  const [mailboxProvider, setMailboxProvider] = useState<"auto" | "google" | "naver" | "all">(
    "auto",
  );
  const [scanStep, setScanStep] = useState<"idle" | "scanning" | "done">("idle");
  const [scanProgressText, setScanProgressText] = useState<string>("");
  const [daysFilter, setDaysFilter] = useState<number>(30); // 30 days default
  const [inboxEvidence, setInboxEvidence] = useState<EmailReceipt[]>([]);
  const [showEvidenceLogs, setShowEvidenceLogs] = useState<boolean>(true);

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
  const [, startTransition] = useTransition();

  const sharedTextParsed = useRef(false);
  const scanTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearScanTimers = () => {
    scanTimers.current.forEach(clearTimeout);
    scanTimers.current = [];
  };

  useEffect(() => clearScanTimers, []);

  const handleClearParsingRecords = () => {
    clearScanTimers();
    setSmsText("");
    setDiscoveredItems([]);
    setInboxEvidence([]);
    setScanStep("idle");
    setScanProgressText("");
  };

  const handleClose = () => {
    handleClearParsingRecords();
    onClose();
  };

  // Switch scan account & keep target account in sync
  const handleAccountChange = (accId: string) => {
    setSelectedAccountId(accId);
    handleClearParsingRecords();
    if (accId === "__custom__") {
      setTargetAccountId("__custom__");
      setCustomTargetEmail(customEmail);
    } else {
      setTargetAccountId(accId);
      setCustomTargetEmail("");
    }
  };

  // Switch custom email & sync target mapping
  const handleCustomEmailChange = (fullEmail: string) => {
    setCustomEmail(fullEmail);
    if (targetAccountId === "__custom__" || selectedAccountId === "__custom__") {
      setCustomTargetEmail(fullEmail);
    }
    if (scanStep === "done" || discoveredItems.length > 0) {
      handleClearParsingRecords();
    }
  };

  // Determine effective provider (google, naver, all)
  const getEffectiveProvider = (): "google" | "naver" | "all" => {
    if (mailboxProvider !== "auto") return mailboxProvider;
    const acc = accounts.find((a) => a.id === selectedAccountId);
    const email = (acc?.emailOrId || customEmail).toLowerCase();
    if (
      acc?.provider === "naver" ||
      email.endsWith("@naver.com") ||
      acc?.name?.includes("네이버")
    ) {
      return "naver";
    }
    if (
      acc?.provider === "google" ||
      email.endsWith("@gmail.com") ||
      acc?.name?.includes("Google")
    ) {
      return "google";
    }
    return "google";
  };

  // Run Email Scan with 30-day filter and provider detection
  const handleStartEmailScan = (
    overrideDays?: number,
    overrideProvider?: "google" | "naver" | "all",
    forceSample?: boolean,
  ) => {
    const filterLimit = overrideDays !== undefined ? overrideDays : daysFilter;
    const effectiveProvider = overrideProvider || getEffectiveProvider();
    const acc = accounts.find((a) => a.id === selectedAccountId);
    const isCustom = selectedAccountId === "__custom__";
    const emailToScan = isCustom
      ? customEmail.trim()
      : acc?.emailOrId ||
        customEmail.trim() ||
        (effectiveProvider === "naver" ? "myaccount@naver.com" : "myaccount@gmail.com");

    if (!emailToScan) {
      alert("스캔할 이메일 주소를 입력해주세요.");
      return;
    }

    const isDemo = isDemoOrTestAccount(emailToScan);
    const effectiveSampleMode =
      forceSample !== undefined ? forceSample : isCustom ? simulateSampleForCustom : isDemo;

    const accName = isCustom
      ? effectiveProvider === "naver"
        ? `네이버 (${emailToScan})`
        : `Google (${emailToScan})`
      : acc
        ? `${acc.name} (${acc.emailOrId})`
        : `Google (${emailToScan})`;

    setScanStep("scanning");
    const providerLabel =
      effectiveProvider === "naver"
        ? "네이버 메일함"
        : effectiveProvider === "all"
          ? "Google 및 네이버 메일함"
          : "Google 메일함";

    setScanProgressText(`${providerLabel} 형식으로 예시 영수증을 생성하는 중... (${emailToScan})`);

    clearScanTimers();

    scanTimers.current.push(
      setTimeout(() => {
        setScanProgressText(
          effectiveProvider === "naver"
            ? "네이버페이 영수증·해지 안내·단발성 결제 메일 형식을 구성하는 중..."
            : effectiveProvider === "all"
              ? "Google Play, Anthropic, 네이버페이 영수증 형식을 구성하는 중..."
              : "Google Play, Anthropic (YouTube, Google AI Pro) 영수증 형식을 구성하는 중...",
        );
      }, 500),
    );

    scanTimers.current.push(
      setTimeout(() => {
        setScanProgressText(
          filterLimit === 30
            ? "최근 30일 이내 청구 건만 남기는 판별 로직을 적용하는 중..."
            : "전체 기간 결제 이력에 판별 로직을 적용하는 중...",
        );
      }, 1000),
    );

    scanTimers.current.push(
      setTimeout(() => {
        const allReceipts = getSimulatedInboxReceipts(effectiveProvider, new Date(), emailToScan, {
          generateSampleData: effectiveSampleMode,
        });
        setInboxEvidence(allReceipts);

        const results = simulateEmailScan(emailToScan, {
          provider: effectiveProvider,
          linkedAccountId: acc?.id,
          linkedAccountName: accName,
          daysLimit: filterLimit,
          generateSampleData: effectiveSampleMode,
        });

        setDiscoveredItems(results);
        setScanStep("done");
      }, 1500),
    );
  };

  // Change date filter on the fly
  const handleFilterChange = (newDays: number) => {
    setDaysFilter(newDays);
    if (scanStep === "done") {
      const effectiveProvider = getEffectiveProvider();
      const acc = accounts.find((a) => a.id === selectedAccountId);
      const isCustom = selectedAccountId === "__custom__";
      const emailToScan = isCustom
        ? customEmail.trim()
        : acc?.emailOrId ||
          customEmail.trim() ||
          (effectiveProvider === "naver" ? "myaccount@naver.com" : "myaccount@gmail.com");
      const accName = isCustom
        ? effectiveProvider === "naver"
          ? `네이버 (${emailToScan})`
          : `Google (${emailToScan})`
        : acc
          ? `${acc.name} (${acc.emailOrId})`
          : `Google (${emailToScan})`;
      const isDemo = isDemoOrTestAccount(emailToScan);
      const effectiveSampleMode = isCustom ? simulateSampleForCustom : isDemo;

      const results = simulateEmailScan(emailToScan, {
        provider: effectiveProvider,
        linkedAccountId: acc?.id,
        linkedAccountName: accName,
        daysLimit: newDays,
        generateSampleData: effectiveSampleMode,
      });
      setDiscoveredItems(results);
    }
  };

  // Handle provider switch
  const handleProviderSwitch = (provider: "auto" | "google" | "naver" | "all") => {
    setMailboxProvider(provider);
    if (scanStep === "done") {
      const eff =
        provider === "auto"
          ? (() => {
              const acc = accounts.find((a) => a.id === selectedAccountId);
              const email = (acc?.emailOrId || customEmail).toLowerCase();
              return acc?.provider === "naver" || email.endsWith("@naver.com") ? "naver" : "google";
            })()
          : provider;
      handleStartEmailScan(daysFilter, eff);
    }
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
      customTargetEmail.trim() || (selectedAccountId === "__custom__" ? customEmail.trim() : "");

    if (
      (targetAccountId === "__custom__" ||
        selectedAccountId === "__custom__" ||
        !targetAccountId) &&
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
          {/* TAB 1: EMAIL SCAN (Google & Naver) — simulated preview */}
          {SHOW_INBOX_PREVIEW && activeTab === "email" && (
            <div className="space-y-4">
              {/*
                This tab does not read anyone's mail. It generates sample
                receipts to demonstrate the filtering logic, so it has to say so
                plainly rather than imply a live inbox connection.
              */}
              <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-1.5">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  🧪 미리보기 — 실제 메일함에 연결하지 않습니다
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
                  Gmail · 네이버 메일 연동은 아직 준비 중입니다. 아래 결과는 해지·단발성 결제·30일
                  초과 건을 걸러내는 판별 방식을 보여주기 위해 <strong>생성한 예시 영수증</strong>
                  이며, 실제 결제 내역이 아닙니다. 내 구독을 실제로 불러오려면{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("sms");
                      handleClearParsingRecords();
                    }}
                    className="underline font-semibold hover:opacity-80"
                  >
                    결제 문자 · 영수증 붙여넣기
                  </button>{" "}
                  탭을 이용하세요.
                </p>
              </div>
              {/* Scan Control Box */}
              <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-3">
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">스캔할 연동 계정:</span>
                    <Select
                      value={selectedAccountId}
                      onChange={(e) => handleAccountChange(e.target.value)}
                      className="text-sm py-1 max-w-xs"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.emailOrId})
                        </option>
                      ))}
                      <option value="__custom__">✏️ 새 이메일 계정 직접 입력</option>
                    </Select>
                  </div>

                  {(selectedAccountId === "__custom__" || accounts.length === 0) && (
                    <div className="pt-2 border-t border-border/40 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground font-medium">
                          스캔할 이메일 주소 (아이디 + 도메인 선택):
                        </label>
                        <span className="text-[10px] text-muted-foreground">
                          도메인 선택 시 공급자 자동 감지
                        </span>
                      </div>
                      <EmailDomainInput
                        value={customEmail}
                        onChange={handleCustomEmailChange}
                        onProviderChange={(prov) => {
                          if (mailboxProvider === "auto") {
                            if (prov === "naver") setMailboxProvider("auto");
                            else if (prov === "google") setMailboxProvider("auto");
                          }
                        }}
                        placeholderId="이메일 아이디 입력"
                        size="sm"
                      />
                      <div className="flex items-center gap-2 pt-0.5 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground select-none">
                          <input
                            type="checkbox"
                            checked={simulateSampleForCustom}
                            onChange={(e) => {
                              setSimulateSampleForCustom(e.target.checked);
                              if (scanStep === "done") {
                                handleClearParsingRecords();
                              }
                            }}
                            className="w-3.5 h-3.5 rounded border-border text-primary cursor-pointer"
                          />
                          <span>💡 가상 이메일 테스트용 샘플 영수증 수신 시뮬레이션 활성화</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mailbox Provider Selector */}
                <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-foreground">
                      📫 예시 영수증 공급자:
                    </span>
                    {mailboxProvider === "auto" && (
                      <Badge variant="outline" className="text-[10px] font-normal py-0">
                        {getEffectiveProvider() === "naver"
                          ? "🟢 네이버 자동 감지됨"
                          : "🌐 Google 자동 감지됨"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleProviderSwitch("auto")}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                        mailboxProvider === "auto"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      ✨ 자동 감지
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProviderSwitch("google")}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                        mailboxProvider === "google"
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-card text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      🌐 Google 메일
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProviderSwitch("naver")}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                        mailboxProvider === "naver"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-card text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      🟢 네이버 메일
                    </button>
                    <button
                      type="button"
                      onClick={() => handleProviderSwitch("all")}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                        mailboxProvider === "all"
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-card text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      🔄 통합 스캔
                    </button>
                  </div>
                </div>

                {/* Date Filter Selection */}
                <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-foreground">
                      📅 청구 메일 탐색 범위:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleFilterChange(30)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                          daysFilter === 30
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        ✓ 최근 30일 이내 (현재 활성 구독만 필터링)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFilterChange(0)}
                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                          daysFilter === 0
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-muted-foreground border-border hover:bg-muted"
                        }`}
                      >
                        전체 기간 (과거 영수증 포함)
                      </button>
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    disabled={scanStep === "scanning"}
                    onClick={() => handleStartEmailScan()}
                    className="shrink-0 font-medium self-end sm:self-auto"
                  >
                    {scanStep === "scanning" ? "생성 중..." : "🧪 예시 스캔 실행"}
                  </Button>
                </div>
              </div>

              {/* Scanning Animation */}
              {scanStep === "scanning" && (
                <div className="p-6 rounded-xl border border-primary/30 bg-primary/5 flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-semibold text-foreground">{scanProgressText}</p>
                  <p className="text-xs text-muted-foreground">
                    예시 영수증의 날짜를 대조하여 30일 이내 결제 여부를 판별합니다.
                  </p>
                </div>
              )}

              {/* Evidence Log Box (Transparency) */}
              {scanStep === "done" && inboxEvidence.length > 0 && (
                <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-foreground">
                        🧪 예시 영수증 판별 내역
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        예시 {inboxEvidence.length}건
                      </Badge>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowEvidenceLogs(!showEvidenceLogs)}
                      className="text-[11px] text-muted-foreground hover:text-foreground underline"
                    >
                      {showEvidenceLogs ? "내역 접기 ▲" : "분석 내역 펼치기 ▼"}
                    </button>
                  </div>

                  {showEvidenceLogs && (
                    <div className="space-y-1.5 pt-1">
                      {inboxEvidence.map((receipt) => {
                        const isCancellation =
                          receipt.emailType === "cancellation" ||
                          receipt.subject.includes("해지") ||
                          receipt.subject.includes("취소");
                        const isOnetime =
                          receipt.emailType === "onetime" || receipt.subject.includes("일반 상품");
                        const isRecent = receipt.daysAgo <= 30 && !isCancellation && !isOnetime;
                        return (
                          <div
                            key={receipt.id}
                            className={`p-2 rounded-lg text-xs border flex items-start justify-between gap-2 ${
                              isCancellation
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200"
                                : isOnetime
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                                  : isRecent
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                                    : "bg-muted/40 border-border text-muted-foreground opacity-70"
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-foreground">
                                  {receipt.serviceName}
                                </span>
                                {receipt.provider === "naver" ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] py-0 border-0">
                                    🟢 네이버 메일
                                  </Badge>
                                ) : (
                                  <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] py-0 border-0">
                                    🌐 Google 메일
                                  </Badge>
                                )}
                                <span className="font-mono text-[10px] text-muted-foreground">
                                  {receipt.senderEmail}
                                </span>
                                {receipt.recipientEmail && (
                                  <span className="font-mono text-[10px] text-muted-foreground/80">
                                    (수신: {receipt.recipientEmail})
                                  </span>
                                )}
                                {isCancellation ? (
                                  <Badge className="bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] py-0 border-0 font-semibold">
                                    🔴 해지 완료 메일 (활성 구독 제외)
                                  </Badge>
                                ) : isOnetime ? (
                                  <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] py-0 border-0 font-semibold">
                                    ⚪ 단발성 결제 (정기구독 아님)
                                  </Badge>
                                ) : isRecent ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] py-0 border-0">
                                    ✓ 최근 30일 내 결제 확인
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] py-0">
                                    ⚪ 30일 초과 미결제 (해지됨)
                                  </Badge>
                                )}
                              </div>
                              <p className="font-mono text-[11px] truncate">✉️ {receipt.subject}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="font-bold">
                                {isCancellation
                                  ? "해지 완료"
                                  : formatCurrency(receipt.amount, receipt.currency)}
                              </span>
                              <p className="text-[10px] text-muted-foreground">
                                {receipt.receivedDate} ({receipt.daysAgo}일 전)
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
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
                        {daysFilter === 30 && activeTab === "email" && (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            (예시 · 최근 30일 기준)
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

          {scanStep === "done" &&
            discoveredItems.length === 0 &&
            (selectedAccountId === "__custom__" && !simulateSampleForCustom ? (
              <div className="p-8 text-center border border-dashed rounded-2xl space-y-3 bg-muted/10">
                <div className="text-3xl">📭</div>
                <p className="text-sm font-bold text-foreground">
                  {customEmail.trim() || "입력된 이메일"} 계정으로 생성된 예시 영수증이 없습니다
                  (0건).
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-lg mx-auto">
                  입력하신 이메일(<strong>{customEmail.trim() || "새 이메일"}</strong>)은 예시
                  데이터가 없는 신규 주소이므로, 다른 계정의 예시 영수증을 재사용하지 않고 계정별로
                  분리·격리되었습니다.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setSimulateSampleForCustom(true);
                      handleStartEmailScan(daysFilter, undefined, true);
                    }}
                    className="text-xs font-semibold gap-1.5 shadow-sm"
                  >
                    <span>💡</span> {customEmail.trim() || "이 계정"}으로 가상 샘플 영수증 생성 및
                    스캔
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed rounded-2xl space-y-3 bg-muted/10">
                <div className="text-3xl">✅</div>
                <p className="text-sm font-bold text-foreground">
                  최근 30일 이내에 청구된 활성 정기구독 예시가 없습니다.
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-lg mx-auto">
                  예시 영수증 및 상태 메일 판별 결과, 해지 완료 메일이 있는 서비스와 일반 단발성
                  결제, 30일 초과 만료 내역이 활성 구독에서 제외되었습니다.
                </p>
                <div className="pt-1 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFilterChange(0)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted font-medium text-foreground transition"
                  >
                    📜 전체 기간 메일별 분석 사유 확인하기
                  </button>
                </div>
              </div>
            ))}
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
                  {customEmail.trim() || customTargetEmail.trim() || "새 이메일"}) 매핑
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
