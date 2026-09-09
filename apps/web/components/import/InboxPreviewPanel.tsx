"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  DiscoveredSubscription,
  EmailReceipt,
  LinkedAccount,
  formatCurrency,
  getSimulatedInboxReceipts,
  isDemoOrTestAccount,
  simulateEmailScan,
} from "@subslash/shared";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { EmailDomainInput } from "../ui/email-domain-input";

/**
 * The inbox-scan preview tab.
 *
 * Nothing here reads a real mailbox: it renders fixtures from
 * `inbox-simulation.ts` to show how the active-subscription filter behaves, and
 * it only appears when `NEXT_PUBLIC_SHOW_INBOX_PREVIEW` is on — off by default.
 *
 * It lives apart from AutoImportModal for the same reason the fixtures live
 * apart from the parser: when a real Gmail/Naver integration lands, this file
 * and the flag go together, and the modal that stays behind is the part that
 * always worked.
 */
/** Qualifier shown beside the result count while the 30-day filter is on. */
const THIRTY_DAY_NOTE = "(예시 · 최근 30일 기준)";

interface InboxPreviewPanelProps {
  accounts: LinkedAccount[];
  defaultAccountId?: string;
  /** The account the results will be filed under, owned by the modal. */
  targetAccountId: string;
  /** Whether any results are on screen, so editing the address can clear them. */
  hasResults: boolean;
  onResults: (items: DiscoveredSubscription[], note?: string) => void;
  /** Clears results and text the modal owns; the panel clears its own scan state. */
  onReset: () => void;
  onScanTargetChange: (next: {
    /** The panel's own scan selection, which registration reads back. */
    scanAccountId: string;
    scanCustomEmail: string;
    /** Set only when the panel is also changing what results get filed under. */
    target?: { accountId: string; customEmail: string };
  }) => void;
  onSwitchToPasteTab: () => void;
}

export function InboxPreviewPanel({
  accounts,
  defaultAccountId,
  targetAccountId,
  hasResults,
  onResults,
  onReset,
  onScanTargetChange,
  onSwitchToPasteTab,
}: InboxPreviewPanelProps) {
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

  const scanTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearScanTimers = () => {
    scanTimers.current.forEach(clearTimeout);
    scanTimers.current = [];
  };

  useEffect(() => clearScanTimers, []);

  /** Drops this panel's scan state, then whatever the modal is holding. */
  const resetScan = () => {
    clearScanTimers();
    setInboxEvidence([]);
    setScanStep("idle");
    setScanProgressText("");
    onReset();
  };

  // Switch scan account & keep target account in sync
  const handleAccountChange = (accId: string) => {
    setSelectedAccountId(accId);
    resetScan();
    onScanTargetChange({
      scanAccountId: accId,
      scanCustomEmail: customEmail,
      target:
        accId === "__custom__"
          ? { accountId: "__custom__", customEmail }
          : { accountId: accId, customEmail: "" },
    });
  };

  // Switch custom email & sync target mapping
  const handleCustomEmailChange = (fullEmail: string) => {
    setCustomEmail(fullEmail);
    onScanTargetChange({
      scanAccountId: selectedAccountId,
      scanCustomEmail: fullEmail,
      target:
        targetAccountId === "__custom__" || selectedAccountId === "__custom__"
          ? { accountId: targetAccountId, customEmail: fullEmail }
          : undefined,
    });
    if (scanStep === "done" || hasResults) {
      resetScan();
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

        onResults(results, filterLimit === 30 ? THIRTY_DAY_NOTE : undefined);
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
      onResults(results, newDays === 30 ? THIRTY_DAY_NOTE : undefined);
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

  return (
    <div className="space-y-4">
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
            Gmail · 네이버 메일 연동은 아직 준비 중입니다. 아래 결과는 해지·단발성 결제·30일 초과
            건을 걸러내는 판별 방식을 보여주기 위해 <strong>생성한 예시 영수증</strong>
            이며, 실제 결제 내역이 아닙니다. 내 구독을 실제로 불러오려면{" "}
            <button
              type="button"
              onClick={onSwitchToPasteTab}
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
                          resetScan();
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
              <span className="text-xs font-semibold text-foreground">📫 예시 영수증 공급자:</span>
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
              <span className="text-xs font-semibold text-foreground">📅 청구 메일 탐색 범위:</span>
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
                <span className="text-xs font-bold text-foreground">🧪 예시 영수증 판별 내역</span>
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
      {scanStep === "done" &&
        !hasResults &&
        (selectedAccountId === "__custom__" && !simulateSampleForCustom ? (
          <div className="p-8 text-center border border-dashed rounded-2xl space-y-3 bg-muted/10">
            <div className="text-3xl">📭</div>
            <p className="text-sm font-bold text-foreground">
              {customEmail.trim() || "입력된 이메일"} 계정으로 생성된 예시 영수증이 없습니다 (0건).
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-lg mx-auto">
              입력하신 이메일(<strong>{customEmail.trim() || "새 이메일"}</strong>)은 예시 데이터가
              없는 신규 주소이므로, 다른 계정의 예시 영수증을 재사용하지 않고 계정별로
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
                <span>💡</span> {customEmail.trim() || "이 계정"}으로 가상 샘플 영수증 생성 및 스캔
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
              예시 영수증 및 상태 메일 판별 결과, 해지 완료 메일이 있는 서비스와 일반 단발성 결제,
              30일 초과 만료 내역이 활성 구독에서 제외되었습니다.
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
  );
}
