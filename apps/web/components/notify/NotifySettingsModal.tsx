"use client";

import React, { useState } from "react";
import { realRecords, useStore } from "../../lib/store";
import {
  SyncTokenRejectedError,
  fetchNotifyStatus,
  requestReminders,
  pushMirror,
  stopReminders,
  enableCalendarFeed,
  disableCalendarFeed,
  calendarSubscribeLinks,
} from "../../lib/notify-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button, WRAPPING_BUTTON } from "../ui/button";
import { Select } from "../ui/select";
import { EmailDomainInput } from "../ui/email-domain-input";
import { InlineConfirm } from "../ui/inline-confirm";

/** 되돌리기 어려워 한 번 더 묻는 동작. */
type PendingConfirm = "rotate" | "calendar-off" | "disable";

const CONFIRM_COPY: Record<PendingConfirm, { message: string; action: string }> = {
  rotate: {
    message: "새 주소를 만들면 기존 주소의 캘린더는 끊겨요.",
    action: "새 주소 만들기",
  },
  "calendar-off": {
    message: "캘린더 구독을 끊을까요? 등록한 캘린더에서 결제일이 사라져요.",
    action: "구독 끊기",
  },
  disable: {
    message: "알림을 끄고 서버의 구독 사본을 지울까요?",
    action: "알림 끄기",
  },
};

interface NotifySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotifySettingsModal({ isOpen, onClose }: NotifySettingsModalProps) {
  const { notify, setNotify, clearNotify, markNotifyRejected } = useStore();
  // 샘플 체험 중이면 화면의 목록은 샘플이다. 서버로 보내는 목록과 그 개수는 실제 기록으로 한다 —
  // 샘플을 보내면 가짜 구독의 결제 알림이 간다.
  const subscriptions = useStore((state) => realRecords(state).subscriptions);

  const [email, setEmail] = useState(notify.email ?? "");
  const [reminderDays, setReminderDays] = useState(notify.reminderDays);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSent, setJustSent] = useState(false);
  const [copiedFeed, setCopiedFeed] = useState(false);
  const [copyFeedFailed, setCopyFeedFailed] = useState(false);
  // 이 창 안에서 한 번 더 묻는다. 브라우저 기본 확인창은 앱 WebView마다 달라 쓰지 않는다.
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

  const isOptedIn = Boolean(notify.syncToken);
  const activeCount = subscriptions.filter((sub) => sub.status === "active").length;
  const calendarLinks = notify.calendarUrl ? calendarSubscribeLinks(notify.calendarUrl) : null;

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
        rejectedAt: undefined,
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
        // 사용자가 끈 것이 아니다. 조용히 비우지 않고 끊겼다는 것을 알린다.
        markNotifyRejected(notify.syncToken);
        return;
      }
      setNotify({ verified: status.verified, reminderDays: status.reminderDays });
    } catch (e) {
      setError(e instanceof Error ? e.message : "상태를 불러오지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  // 처음 만들기와 새로 만들기가 같은 요청이다. 새로 만들 때 기존 주소가 끊긴다는 확인은
  // 버튼 쪽(pendingConfirm)에서 받는다.
  const handleCalendar = async () => {
    if (!notify.syncToken) return;
    setBusy(true);
    setError(null);
    try {
      const url = await enableCalendarFeed(notify.syncToken);
      setNotify({ calendarUrl: url });
    } catch (e) {
      if (e instanceof SyncTokenRejectedError) {
        markNotifyRejected(notify.syncToken);
        return;
      }
      setError(e instanceof Error ? e.message : "캘린더 주소를 만들지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const handleCalendarOff = async () => {
    if (!notify.syncToken) return;
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
      setCopyFeedFailed(false);
      setCopiedFeed(true);
      setTimeout(() => setCopiedFeed(false), 2000);
    } catch {
      // Clipboard access can be refused; the URL is on screen either way, but
      // a button that silently does nothing would look broken.
      setCopyFeedFailed(true);
    }
  };

  const handleDisable = async () => {
    if (!notify.syncToken) return;
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

  const runPendingConfirm = () => {
    const kind = pendingConfirm;
    setPendingConfirm(null);
    if (kind === "rotate") void handleCalendar();
    else if (kind === "calendar-off") void handleCalendarOff();
    else if (kind === "disable") void handleDisable();
  };

  const confirmFor = (kinds: PendingConfirm[]) =>
    pendingConfirm && kinds.includes(pendingConfirm) ? (
      <InlineConfirm
        message={CONFIRM_COPY[pendingConfirm].message}
        confirmText={CONFIRM_COPY[pendingConfirm].action}
        disabled={busy}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={runPendingConfirm}
      />
    ) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>결제 임박 알림</span>
          </DialogTitle>
          <DialogDescription>
            결제일 전에 &ldquo;지난 30일 동안 몇 번 썼나요?&rdquo;를 메일로 물어요. 메일에서 바로
            답하면 돼요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-left">
          {/* What actually leaves the browser */}
          <div className="p-3.5 rounded-xl bg-muted/40 border text-xs space-y-1.5">
            <div className="font-bold text-foreground">서버로 전송되는 정보</div>
            <p className="text-muted-foreground leading-relaxed">
              이메일과{" "}
              <strong className="text-foreground">구독 중인 서비스의 이름 · 금액 · 결제일</strong>만
              서버에 보관해요. 나머지 기록은 이 브라우저에만 있어요.
            </p>
          </div>

          {!isOptedIn ? (
            <>
              {notify.rejectedAt && (
                <div
                  role="status"
                  className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs text-rose-900 dark:text-rose-200 leading-relaxed"
                >
                  <strong>이 브라우저의 결제 알림이 꺼졌습니다.</strong> 수신 거부를 눌렀거나 다른
                  기기에서 다시 신청하면 이렇게 돼요. 계속 받으려면 다시 신청하세요.
                </div>
              )}

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
                확인 메일의 버튼을 눌러야 시작돼요.
              </p>
            </>
          ) : (
            <>
              <div className="p-4 border rounded-2xl bg-card space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{notify.email}</span>
                  {notify.verified ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      알림 켜짐
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
                  메일함에서 확인 버튼을 누르세요. 이미 눌렀다면 &lsquo;상태 새로고침&rsquo;을
                  누르세요.
                </div>
              )}

              <div className="p-3.5 rounded-xl border bg-card space-y-2 text-xs">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <span>캘린더에 결제일 띄우기</span>
                </div>

                {calendarLinks ? (
                  <>
                    <p className="text-muted-foreground leading-relaxed">
                      버튼으로 추가하거나 캘린더 앱의 &lsquo;URL로 구독&rsquo;에 주소를 넣으세요.
                      구독을 고치면 캘린더도 바뀌어요.
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Button
                        size="sm"
                        className={WRAPPING_BUTTON}
                        onClick={() => {
                          // webcal:// 은 새 창이 아니라 운영체제가 캘린더 앱으로 넘긴다.
                          window.location.href = calendarLinks.webcal;
                        }}
                      >
                        iPhone·Mac 캘린더에 추가
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={WRAPPING_BUTTON}
                        onClick={() =>
                          window.open(calendarLinks.google, "_blank", "noopener,noreferrer")
                        }
                      >
                        Google 캘린더에 추가 (새 창)
                      </Button>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      Google 캘린더는 늦게 반영될 수 있어요. 알림이 안 오면 그 캘린더의 알림을
                      켜세요.
                    </p>
                    <code className="block break-all rounded-lg bg-muted px-2.5 py-2 text-[11px] text-foreground">
                      {notify.calendarUrl}
                    </code>
                    <p className="text-muted-foreground">
                      주소를 가진 사람은 구독 목록을 볼 수 있어요. 공유했다면 새 주소를 만드세요.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      <Button size="sm" variant="outline" onClick={copyFeedUrl}>
                        {copiedFeed ? "복사됨" : "주소 복사"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => setPendingConfirm("rotate")}
                      >
                        새 주소 만들기
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        disabled={busy}
                        onClick={() => setPendingConfirm("calendar-off")}
                      >
                        구독 끊기
                      </Button>
                    </div>
                    {copyFeedFailed && (
                      <p className="text-amber-700 dark:text-amber-300" role="status">
                        복사하지 못했어요. 주소를 길게 눌러 복사하세요.
                      </p>
                    )}
                    {confirmFor(["rotate", "calendar-off"])}
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground leading-relaxed">
                      결제일을 캘린더에 반복 일정으로 띄워요. 결제 월이 없는 연간 구독은 빠져요.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => handleCalendar()}
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
                  onClick={() => setPendingConfirm("disable")}
                >
                  알림 끄기
                </Button>
              </div>
              {confirmFor(["disable"])}
            </>
          )}

          {justSent && !notify.verified && (
            <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 font-medium">
              확인 메일을 보냈어요. 메일함을 확인하세요
            </p>
          )}
          {error && <p className="text-xs text-center text-destructive font-medium">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
