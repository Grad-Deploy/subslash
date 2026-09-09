"use client";

import React, { useState } from "react";
import { useStore } from "../../lib/store";
import {
  fetchNotifyStatus,
  requestReminders,
  pushMirror,
  stopReminders,
  enableCalendarFeed,
  disableCalendarFeed,
} from "../../lib/notify-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Select } from "../ui/select";
import { EmailDomainInput } from "../ui/email-domain-input";

interface NotifySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotifySettingsModal({ isOpen, onClose }: NotifySettingsModalProps) {
  const { notify, subscriptions, setNotify, clearNotify } = useStore();

  const [email, setEmail] = useState(notify.email ?? "");
  const [reminderDays, setReminderDays] = useState(notify.reminderDays);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSent, setJustSent] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState(false);

  const isOptedIn = Boolean(notify.syncToken);
  const activeCount = subscriptions.filter((sub) => sub.status === "active").length;

  const handleEnable = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await requestReminders(email.trim(), reminderDays);
      setNotify({
        email: result.email,
        syncToken: result.syncToken,
        verified: result.verified,
        reminderDays: result.reminderDays,
      });
      // Seed the mirror immediately so the first reminder can already fire.
      await pushMirror(result.syncToken, subscriptions);
      setNotify({ lastSyncedAt: new Date().toISOString() });
      setJustSent(!result.verified);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알림 신청에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!notify.syncToken) return;
    setBusy(true);
    setError(null);
    try {
      const status = await fetchNotifyStatus(notify.syncToken);
      if (!status) {
        clearNotify();
        return;
      }
      setNotify({ verified: status.verified, reminderDays: status.reminderDays });
    } catch (e) {
      setError(e instanceof Error ? e.message : "상태를 불러오지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const handleCalendar = async (mode: "create" | "rotate") => {
    if (!notify.syncToken) return;
    if (mode === "rotate" && !confirm("새 주소를 만들면 기존 주소로 구독한 캘린더는 끊깁니다.")) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const url = await enableCalendarFeed(notify.syncToken);
      setNotify({ calendarUrl: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "캘린더 주소를 만들지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const handleCalendarOff = async () => {
    if (!notify.syncToken) return;
    if (!confirm("캘린더 구독을 끊을까요? 이미 등록한 캘린더에서 결제일이 사라집니다.")) return;
    setBusy(true);
    setError(null);
    try {
      await disableCalendarFeed(notify.syncToken);
      setNotify({ calendarUrl: null });
    } catch (e) {
      setError(e instanceof Error ? e.message : "캘린더 구독 해제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const copyFeedUrl = async () => {
    if (!notify.calendarUrl) return;
    try {
      await navigator.clipboard.writeText(notify.calendarUrl);
      setCopiedFeed(true);
      setTimeout(() => setCopiedFeed(false), 2000);
    } catch {
      // Clipboard access can be refused; the URL is on screen either way, but
      // a button that silently does nothing would look broken.
      window.prompt("아래 주소를 복사해 캘린더 앱에 등록하세요", notify.calendarUrl);
    }
  };

  const handleDisable = async () => {
    if (!notify.syncToken) return;
    if (!confirm("알림을 끄고 서버에 저장된 구독 사본을 삭제할까요?")) return;
    setBusy(true);
    setError(null);
    try {
      await stopReminders(notify.syncToken);
      clearNotify();
      setEmail("");
      setJustSent(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알림 해제에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>🔔</span>
            <span>결제 임박 알림</span>
          </DialogTitle>
          <DialogDescription>
            결제일이 다가오면 &ldquo;지난 30일 동안 몇 번 쓰셨나요?&rdquo; 한 가지만 이메일로
            묻습니다. 답은 메일에서 바로 누르면 됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-left">
          {/* What actually leaves the browser */}
          <div className="p-3.5 rounded-xl bg-muted/40 border text-xs space-y-1.5">
            <div className="font-bold text-foreground">서버로 전송되는 정보</div>
            <p className="text-muted-foreground leading-relaxed">
              알림을 켜면 이메일 주소와{" "}
              <strong className="text-foreground">활성 구독의 이름 · 금액 · 결제일</strong>만 서버에
              보관됩니다. 체크인 기록, 절약 자산, 해지한 구독, 연동 계정은 전송되지 않고 이
              브라우저에만 남습니다.
            </p>
          </div>

          {!isOptedIn ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">알림 받을 이메일</label>
                <EmailDomainInput value={email} onChange={(full) => setEmail(full)} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">언제 알려드릴까요?</label>
                <Select
                  value={String(reminderDays)}
                  onChange={(e) => setReminderDays(Number(e.target.value))}
                >
                  <option value="1">결제 1일 전</option>
                  <option value="3">결제 3일 전 (권장)</option>
                  <option value="7">결제 7일 전</option>
                </Select>
              </div>

              <Button
                className="w-full h-11 font-bold"
                disabled={busy || !email.includes("@")}
                onClick={handleEnable}
              >
                {busy ? "신청 중..." : "확인 메일 받기"}
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                확인 메일의 버튼을 눌러야 알림이 시작됩니다.
              </p>
            </>
          ) : (
            <>
              <div className="p-4 border rounded-2xl bg-card space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{notify.email}</span>
                  {notify.verified ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      ✓ 알림 켜짐
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      확인 대기 중
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">
                  결제 {notify.reminderDays}일 전 알림 · 동기화된 활성 구독 {activeCount}건
                  {notify.lastSyncedAt && (
                    <> · 마지막 동기화 {new Date(notify.lastSyncedAt).toLocaleString("ko-KR")}</>
                  )}
                </p>
              </div>

              {!notify.verified && (
                <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  받은 메일함에서 확인 버튼을 눌러주세요. 확인 전에는 알림이 발송되지 않습니다. 이미
                  누르셨다면 아래 &lsquo;상태 새로고침&rsquo;을 눌러보세요.
                </div>
              )}

              <div className="p-3.5 rounded-xl border bg-card space-y-2 text-xs">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <span>📅</span>
                  <span>캘린더에 결제일 띄우기</span>
                </div>

                {notify.calendarUrl ? (
                  <>
                    <p className="text-muted-foreground leading-relaxed">
                      캘린더 앱의 &lsquo;URL로 구독&rsquo;에 아래 주소를 넣으면 결제{" "}
                      {notify.reminderDays}일 전에 폰 알림이 울립니다. 앱에서 구독을 고치면 캘린더도
                      따라 바뀝니다.
                    </p>
                    <code className="block break-all rounded-lg bg-muted px-2.5 py-2 text-[11px] text-foreground">
                      {notify.calendarUrl}
                    </code>
                    <p className="text-muted-foreground">
                      이 주소를 가진 사람은 구독 목록을 볼 수 있습니다. 공유했다면 새 주소를 만들어
                      이전 주소를 끊으세요.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      <Button size="sm" variant="outline" onClick={copyFeedUrl}>
                        {copiedFeed ? "✅ 복사됨" : "주소 복사"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => handleCalendar("rotate")}
                      >
                        새 주소 만들기
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        disabled={busy}
                        onClick={handleCalendarOff}
                      >
                        구독 끊기
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground leading-relaxed">
                      매월 결제되는 구독의 결제일을 캘린더 앱에 반복 일정으로 띄웁니다. 확인 메일을
                      누르지 않아도 동작합니다. 연간 결제 구독은 결제 &lsquo;월&rsquo; 정보를 앱이
                      아직 저장하지 않아 제외됩니다.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => handleCalendar("create")}
                    >
                      캘린더 주소 만들기
                    </Button>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={busy}
                  onClick={handleRefreshStatus}
                >
                  상태 새로고침
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                  disabled={busy}
                  onClick={handleDisable}
                >
                  알림 끄기
                </Button>
              </div>
            </>
          )}

          {justSent && !notify.verified && (
            <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 font-medium">
              확인 메일을 보냈습니다. 메일함을 확인해주세요 📬
            </p>
          )}
          {error && <p className="text-xs text-center text-destructive font-medium">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
