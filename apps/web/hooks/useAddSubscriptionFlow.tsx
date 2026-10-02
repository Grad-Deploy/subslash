"use client";

import React, { useState } from "react";
import type { Subscription, SubscriptionFormData } from "@subslash/shared";
import { useStore } from "@lib/store";
import { findDuplicateSubscription } from "@lib/duplicate-subscription";
import { AppAddCheckIn, AppDuplicateDialog } from "../components/subscription/app/appParts";
import type { ReminderPrompt } from "./useCheckInFlow";

/**
 * 대시보드와 내 구독이 함께 쓰는 '구독 추가'의 등록 처리. 두 화면에 같은 코드가 복사돼 있었다.
 *
 * - 앱은 같은 서비스를 또 등록하려 하면 한 번 묻는다(`duplicateDialog`).
 * - 앱은 등록 직후 등록 창이 사용 횟수 묻기로 바뀐다(`checkInStep`). 이 사람의 첫 체크인이면 결제 알림을
 *   한 번 묻는다. 웹은 등록하고 바로 닫는다.
 *
 * 폼을 어떻게 여는지(추천 서비스·직접 입력·고른 요금제)와 닫을 때 지울 상태는 화면마다 달라 `onClose`로
 * 받는다. 등록 창이 닫히면 화면이 `reset`을 부른다.
 */
export function useAddSubscriptionFlow({
  showToast,
  reminder,
  onClose,
}: {
  showToast: (message: string) => void;
  reminder: ReminderPrompt;
  onClose: () => void;
}) {
  const { subscriptions, usageLogs, addSubscription } = useStore();
  // 앱: 방금 등록한 구독. 있으면 등록 창이 사용 횟수 묻기로 바뀐다.
  const [addedSub, setAddedSub] = useState<Subscription | null>(null);
  // 앱: 같은 서비스를 또 등록하려 할 때 한 번 묻는다. data는 확인하면 그대로 등록할 폼 값이다.
  const [duplicate, setDuplicate] = useState<{
    data: SubscriptionFormData;
    existing: Subscription;
  } | null>(null);
  // 앱: 등록 직후 체크인이 이 사람의 첫 체크인인지. 맞으면 결제 알림을 한 번 묻는다.
  const [firstEverCheckIn, setFirstEverCheckIn] = useState(false);

  const submit = (data: SubscriptionFormData, allowDuplicate = false) => {
    if (AppDuplicateDialog && !allowDuplicate) {
      const existing = findDuplicateSubscription(subscriptions, data);
      if (existing) {
        setDuplicate({ data, existing });
        return;
      }
    }
    const added = addSubscription(data);
    if (AppAddCheckIn) {
      setFirstEverCheckIn(usageLogs.length === 0);
      setAddedSub(added);
      return;
    }
    onClose();
    showToast(`${data.name} 등록 완료`);
  };

  return {
    submit,
    reset: () => setAddedSub(null),
    /** 앱: 등록 직후 등록 창 자리에 그릴 사용 횟수 묻기. 아니면 null(폼을 그린다). */
    checkInStep:
      addedSub && AppAddCheckIn ? (
        <AppAddCheckIn
          subscription={addedSub}
          onDone={(recorded) => {
            onClose();
            setAddedSub(null);
            // 이 사람의 첫 체크인이면 결제 알림을 한 번만 묻는다(대시보드 첫 체크인과 같은 흐름).
            if (recorded !== undefined && firstEverCheckIn) reminder.askNow(addedSub);
            showToast(
              recorded === undefined
                ? `${addedSub.name} 등록 완료`
                : `${addedSub.name} 등록 · ${recorded}회 기록`,
            );
          }}
        />
      ) : null,
    duplicateDialog:
      duplicate && AppDuplicateDialog ? (
        <AppDuplicateDialog
          existing={duplicate.existing}
          candidate={duplicate.data}
          onCancel={() => setDuplicate(null)}
          onAddAnyway={() => {
            const data = duplicate.data;
            setDuplicate(null);
            submit(data, true);
          }}
        />
      ) : null,
  };
}
