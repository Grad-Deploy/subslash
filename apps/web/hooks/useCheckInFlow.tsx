"use client";

import React, { useState } from "react";
import type { CheckInResponse, Subscription } from "@subslash/shared";
import { useStore } from "@lib/store";
import { markReminderPrompted, shouldPromptReminder } from "@lib/reminder-prompt";
import { useLocalReminderSettings } from "./useLocalReminders";
import { CheckInModal } from "../components/subscription/CheckInModal";
import { ReminderPromptSheet } from "../components/app-start/ReminderPromptSheet";

/**
 * 대시보드와 내 구독이 함께 쓰는 체크인 창과 결제 알림 묻기. 두 화면에 같은 코드가 복사돼 있었고, 한쪽만
 * 다르게 고쳐져 있었다(내 구독은 '구독을 정하지 않고 묻기'를 '닫힘'과 같은 값으로 써서, 불러오기로 등록한
 * 뒤 구독 중인 것이 없으면 묻는 창이 뜨지 않았다).
 */

type Toast = (message: string) => void;

/**
 * 앱에서 결제 알림을 켜기 전에 먼저 묻는 시트(처음 한 번만). `subscription`이 undefined면 닫혀 있고, null이면
 * 특정 구독 없이 묻는다.
 */
export function useReminderPrompt(showToast: Toast) {
  const [reminderSettings] = useLocalReminderSettings();
  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);
  // 체크인·불러오기 창이 닫히면 물을 구독. false면 묻지 않는다(창 위에 겹쳐 띄우지 않으려고 미룬다).
  const [pending, setPending] = useState<Subscription | null | false>(false);

  const canAsk = () => shouldPromptReminder(reminderSettings.enabled);

  return {
    remindersOn: reminderSettings.enabled,
    /** 사용자가 직접 연다(시작하기 체크리스트). 이미 물었어도 연다. */
    open: (sub: Subscription | null) => setSubscription(sub),
    /** 지금 한 번 묻는다. 알림을 켰거나 이미 물었으면 묻지 않는다. */
    askNow: (sub: Subscription | null) => {
      if (!canAsk()) return;
      markReminderPrompted();
      setSubscription(sub);
    },
    /** 열린 창이 닫힐 때 묻도록 미뤄 둔다(`flush`). */
    askLater: (sub: Subscription | null) => {
      if (canAsk()) setPending(sub);
    },
    /** 불러오기로 구독을 등록했을 때도 창이 닫히면 한 번 묻는다. 대표로 가장 최근 구독을 보여준다. */
    askAfterImport: () => {
      if (!canAsk()) return;
      const latest = [...useStore.getState().subscriptions]
        .filter((sub) => sub.status === "active")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      setPending(latest ?? null);
    },
    /** 미뤄 둔 물음을 띄운다. 창이 닫힐 때 부른다. */
    flush: () => {
      if (pending === false) return;
      markReminderPrompted();
      setSubscription(pending);
      setPending(false);
    },
    sheet: (
      <ReminderPromptSheet
        open={subscription !== undefined}
        subscription={subscription ?? undefined}
        onClose={() => setSubscription(undefined)}
        onEnabled={() => {
          setSubscription(undefined);
          showToast("결제 알림을 켰어요. 몇 초 뒤 시험 알림이 떠요.");
        }}
      />
    ),
  };
}

export type ReminderPrompt = ReturnType<typeof useReminderPrompt>;

/**
 * 체크인 창. 이 사람의 첫 체크인이면 창을 닫을 때 결제 알림을 한 번 묻는다(결과 화면을 가리지 않게).
 * `onKill`은 결과 화면의 '해지하러 가기'다.
 */
export function useCheckInFlow({
  showToast,
  reminder,
  onKill,
}: {
  showToast: Toast;
  reminder: ReminderPrompt;
  onKill: (id: string) => void;
}) {
  const { subscriptions, usageLogs, checkIn } = useStore();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [result, setResult] = useState<CheckInResponse | undefined>(undefined);

  const open = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return;
    setSubscription(sub);
    setResult(undefined);
  };

  const submit = (count: number) => {
    if (!subscription) return;
    if (usageLogs.length === 0) reminder.askLater(subscription);
    try {
      setResult(checkIn(subscription.id, count));
      showToast(`${subscription.name} 체크인 완료`);
    } catch (error) {
      console.error(error);
      showToast("체크인하지 못했어요. 다시 시도해 주세요.");
    }
  };

  return {
    open,
    modal: subscription && (
      <CheckInModal
        subscription={subscription}
        isOpen
        onClose={() => {
          setSubscription(null);
          reminder.flush();
        }}
        onSubmit={submit}
        onKill={onKill}
        result={result}
      />
    ),
  };
}
