"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { getNextBillingDateFor, type Subscription } from "@subslash/shared";
import { REMINDER_DAY_CHOICES, useLocalReminderSettings } from "@hooks/useLocalReminders";
import {
  checkReminderPermission,
  ensureReminderPermission,
  sendTestReminder,
  type ReminderPermission,
} from "@lib/native-reminders";
import { subscriptionDetailHref } from "@lib/routes";
import { cn } from "@lib/utils";
import { useT } from "@lib/i18n";

interface ReminderPromptSheetProps {
  open: boolean;
  onClose: () => void;
  /** 방금 체크인한(또는 대표로 보여줄) 구독. 문구와 결제일 확인에 쓴다. */
  subscription?: Subscription;
  onEnabled: () => void;
}

/**
 * 앱에서 결제 알림을 켜기 전에 먼저 앱 안에서 묻는 시트.
 *
 * 안드로이드는 알림 권한 창을 한두 번 거절하면 더는 띄워 주지 않고 설정 앱으로 가야 한다.
 * 그래서 왜 알림이 필요한지 먼저 보여주고, "알림 받기"를 누른 사람에게만 시스템 권한 창을
 * 띄운다. 켜는 방식과 저장하는 설정은 구독 관리 화면의 LocalReminderCard와 같다.
 */
export function ReminderPromptSheet({
  open,
  onClose,
  subscription,
  onEnabled,
}: ReminderPromptSheetProps) {
  const t = useT();
  const p = t.reminders.prompt;
  const router = useRouter();
  const [settings, update] = useLocalReminderSettings();
  const [permission, setPermission] = useState<ReminderPermission | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    void checkReminderPermission().then(setPermission);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // 결제일을 모르는 구독에는 알림을 걸 수 없다(lib/local-reminders). 켜 두는 것은 막지 않되 알린다.
  const billingUnknown = subscription ? getNextBillingDateFor(subscription) === null : false;
  const days = settings.daysBefore;

  const turnOn = async () => {
    setBusy(true);
    try {
      const next = await ensureReminderPermission(permission);
      setPermission(next);
      if (next !== "granted") return;
      update({ enabled: true });
      // 실제 알림은 결제일 전 오전 9시에야 뜬다. 켜자마자 아무 일도 없으면 안 된 것처럼 보이므로,
      // 몇 초 뒤 시험 알림을 한 번 띄워 이렇게 온다는 것을 보여준다.
      void sendTestReminder(t.reminders.notify).catch(() => {});
      onEnabled();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label={p.close}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 animate-in fade-in"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="reminder-prompt-title"
        className="relative w-full max-w-md rounded-t-3xl border-t bg-card px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom sm:rounded-3xl sm:border"
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-border sm:hidden" aria-hidden />
        <button
          type="button"
          onClick={onClose}
          aria-label={p.close}
          className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" aria-hidden />
        </button>

        <div className="mb-3 grid size-11 place-items-center rounded-2xl bg-secondary">
          <Bell className="size-5" aria-hidden />
        </div>
        <h2 id="reminder-prompt-title" className="text-lg font-extrabold tracking-tight">
          {p.title}
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
          {p.body(subscription && !billingUnknown ? subscription.name : null, days)}
        </p>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={p.whenLabel}>
          {REMINDER_DAY_CHOICES.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={days === d}
              onClick={() => update({ daysBefore: d })}
              className={cn(
                "h-9 rounded-full border px-3.5 text-xs font-semibold transition-colors",
                days === d
                  ? "border-foreground bg-foreground text-background"
                  : "bg-background hover:bg-muted",
              )}
            >
              {p.choice(d)}
            </button>
          ))}
        </div>

        {billingUnknown && subscription && (
          <p className="mt-3 rounded-xl bg-secondary px-3 py-2 text-xs leading-relaxed">
            {p.unknownBilling(subscription.name)}{" "}
            <button
              type="button"
              className="font-bold underline underline-offset-2"
              onClick={() => {
                onClose();
                router.push(subscriptionDetailHref(subscription.id));
              }}
            >
              {p.addBilling}
            </button>
          </p>
        )}

        {permission === "denied" && (
          <p className="mt-3 rounded-xl bg-destructive/10 px-3 py-2 text-xs leading-relaxed text-destructive">
            {p.denied}
          </p>
        )}

        <button
          type="button"
          onClick={() => void turnOn()}
          disabled={busy || permission === "unsupported"}
          className="mt-5 h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {busy ? p.checking : p.turnOn}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 h-10 w-full text-[13px] font-semibold text-muted-foreground"
        >
          {p.later}
        </button>
      </section>
    </div>
  );
}
