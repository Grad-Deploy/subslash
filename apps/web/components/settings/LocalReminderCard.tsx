"use client";

import React, { useEffect, useState } from "react";
import { needsBillingMonth } from "@subslash/shared";
import { realRecords, useStore } from "@lib/store";
import {
  checkReminderPermission,
  ensureReminderPermission,
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
import { useT } from "@lib/i18n";

interface LocalReminderCardProps {
  onMessage: (message: string) => void;
}

/**
 * 앱에서만 보이는 로컬 결제 알림 설정. 서버·이메일을 거치지 않으므로 로그인하지 않아도 쓴다.
 * 알림 권한은 여기서 '알림 켜기'를 누를 때 묻는다.
 */
export function LocalReminderCard({ onMessage }: LocalReminderCardProps) {
  const [settings, update] = useLocalReminderSettings();
  const [permission, setPermission] = useState<ReminderPermission | null>(null);
  const [busy, setBusy] = useState(false);
  const t = useT().settings.reminder;
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
      const next = await ensureReminderPermission(permission);
      setPermission(next);
      if (next !== "granted") return;
      update({ enabled: true });
      onMessage(t.turnedOn);
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    try {
      await sendTestReminder();
      onMessage(t.testSent);
    } catch {
      onMessage(t.testFailed);
    }
  };

  return (
    <section
      aria-labelledby="local-reminder-heading"
      className="p-4 sm:p-5 border rounded-2xl bg-card space-y-3"
    >
      <div className="space-y-1">
        <h3 id="local-reminder-heading" className="font-bold text-sm sm:text-base">
          {t.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{t.intro}</p>
      </div>

      <p className="text-xs font-semibold text-foreground" aria-live="polite">
        {permission === null
          ? t.checking
          : on
            ? t.onWith(planned)
            : settings.enabled && permission === "denied"
              ? t.blocked
              : t.off}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-muted-foreground">{t.when}</span>
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
            {days === 0 ? t.sameDay : t.daysBefore(days)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {on ? (
          <>
            <Button size="sm" variant="outline" onClick={() => update({ enabled: false })}>
              {t.turnOff}
            </Button>
            <Button size="sm" variant="ghost" onClick={sendTest}>
              {t.sendTest}
            </Button>
          </>
        ) : (
          <Button size="sm" disabled={busy || permission === null} onClick={turnOn}>
            {t.turnOn}
          </Button>
        )}
      </div>

      {permission === "denied" && (
        <p role="alert" className="text-xs text-destructive leading-relaxed">
          {t.deniedHelp}
        </p>
      )}
      {unknownDates > 0 && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t.unknownDates(unknownDates)}
        </p>
      )}
    </section>
  );
}
