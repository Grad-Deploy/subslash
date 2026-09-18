"use client";

import React, { useEffect, useState } from "react";
import { needsBillingMonth } from "@subslash/shared";
import { realRecords, useStore } from "@lib/store";
import {
  checkReminderPermission,
  requestReminderPermission,
  sendTestReminder,
  type ReminderPermission,
} from "@lib/native-reminders";
import {
  REMINDER_DAY_CHOICES,
  currentPlan,
  useLocalReminderSettings,
} from "@hooks/useLocalReminders";
import { Button } from "../ui/button";
import { cn } from "@lib/utils";

interface LocalReminderCardProps {
  onMessage: (message: string) => void;
}

const DENIED_HELP =
  "알림 권한이 꺼져 있어요. 휴대폰 설정에서 SubSlash의 알림을 허용한 뒤 다시 켜 주세요" +
  "(안드로이드: 설정 › 애플리케이션 › SubSlash › 알림, iOS: 설정 › SubSlash › 알림).";

/**
 * 앱에서만 보이는 로컬 결제 알림 설정. 서버·이메일을 거치지 않으므로 로그인하지 않아도 쓴다.
 * 알림 권한은 여기서 '알림 켜기'를 누를 때 묻는다.
 */
export function LocalReminderCard({ onMessage }: LocalReminderCardProps) {
  const [settings, update] = useLocalReminderSettings();
  const [permission, setPermission] = useState<ReminderPermission | null>(null);
  const [busy, setBusy] = useState(false);
  const subscriptions = useStore((state) => realRecords(state).subscriptions);

  // 설정에서 권한을 바꾸고 돌아올 수 있으므로 화면에 돌아올 때마다 다시 확인한다.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible") return;
      void checkReminderPermission().then(setPermission);
    };
    refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => document.removeEventListener("visibilitychange", refresh);
  }, []);

  const on = settings.enabled && permission === "granted";
  const planned = on ? currentPlan(settings).length : 0;
  const unknownDates = subscriptions.filter(
    (sub) => sub.status === "active" && needsBillingMonth(sub),
  ).length;

  const turnOn = async () => {
    setBusy(true);
    try {
      let next = permission ?? (await checkReminderPermission());
      if (next === "prompt") next = await requestReminderPermission();
      setPermission(next);
      if (next !== "granted") return;
      update({ enabled: true });
      onMessage("🔔 이 기기에서 결제 알림을 켰습니다.");
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    try {
      await sendTestReminder();
      onMessage("몇 초 뒤 시험 알림이 뜹니다.");
    } catch {
      onMessage("시험 알림을 보내지 못했습니다.");
    }
  };

  return (
    <section
      aria-labelledby="local-reminder-heading"
      className="p-4 sm:p-5 border rounded-2xl bg-card space-y-3"
    >
      <div className="space-y-1">
        <h3 id="local-reminder-heading" className="font-bold text-sm sm:text-base">
          📱 이 기기 결제 알림
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          결제일 전 오전 9시에 이 휴대폰에 알림을 띄웁니다. 서버나 이메일을 거치지 않아 로그인하지
          않아도 됩니다.
        </p>
      </div>

      <p className="text-xs font-semibold text-foreground" aria-live="polite">
        {permission === null
          ? "알림 권한을 확인하는 중…"
          : on
            ? `켜짐 · 걸어 둔 알림 ${planned}개`
            : settings.enabled && permission === "denied"
              ? "켜 두었지만 알림 권한이 꺼져 있어 알림이 뜨지 않습니다."
              : "꺼짐"}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-muted-foreground">언제</span>
        {REMINDER_DAY_CHOICES.map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => update({ daysBefore: days })}
            aria-pressed={settings.daysBefore === days}
            className={cn(
              "h-8 rounded-full border px-3 text-xs font-medium transition-colors",
              settings.daysBefore === days
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-foreground hover:bg-muted",
            )}
          >
            {days === 0 ? "당일" : `${days}일 전`}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {on ? (
          <>
            <Button size="sm" variant="outline" onClick={() => update({ enabled: false })}>
              알림 끄기
            </Button>
            <Button size="sm" variant="ghost" onClick={sendTest}>
              시험 알림 보내기
            </Button>
          </>
        ) : (
          <Button size="sm" disabled={busy || permission === null} onClick={turnOn}>
            알림 켜기
          </Button>
        )}
      </div>

      {permission === "denied" && (
        <p role="alert" className="text-xs text-destructive leading-relaxed">
          {DENIED_HELP}
        </p>
      )}
      {unknownDates > 0 && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          결제 월을 적지 않은 연간 구독 {unknownDates}개는 결제일을 알 수 없어 알리지 않습니다.
        </p>
      )}
    </section>
  );
}
