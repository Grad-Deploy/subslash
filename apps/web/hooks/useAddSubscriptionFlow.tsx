"use client";

import React, { useState } from "react";
import {
  POPULAR_SERVICES,
  presetFormData,
  type ServicePreset,
  type Subscription,
  type SubscriptionFormData,
} from "@subslash/shared";
import { useStore } from "@lib/store";
import { findDuplicateSubscription } from "@lib/duplicate-subscription";
import { AppAddCheckIn, AppDuplicateDialog } from "../components/subscription/app/appParts";
import { SubForm } from "../components/subscription/SubForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import type { ReminderPrompt } from "./useCheckInFlow";

/** 등록 창을 여는 방식. 서비스를 골라 열었는지, '직접 입력'으로 열었는지. */
export interface AddOptions {
  preset?: ServicePreset;
  custom?: boolean;
}

/**
 * 대시보드와 내 구독이 함께 쓰는 '구독 추가'. 두 화면에 등록 처리와 등록 창이 복사돼 있었다.
 *
 * - `open(options)`로 연다. 열 때마다 SubForm을 새로 그린다 — 앞서 연 창의 입력이 남지 않게.
 * - 앱은 같은 서비스를 또 등록하려 하면 한 번 묻는다(`duplicateDialog`).
 * - 앱은 등록 직후 등록 창이 사용 횟수 묻기로 바뀐다. 이 사람의 첫 체크인이면 결제 알림을 한 번 묻는다.
 *   웹은 등록하고 바로 닫는다.
 *
 * 화면은 `dialog`와 `duplicateDialog`를 그리기만 한다.
 */
export function useAddSubscriptionFlow({
  showToast,
  reminder,
}: {
  showToast: (message: string) => void;
  reminder: ReminderPrompt;
}) {
  const { subscriptions, usageLogs, addSubscription } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AddOptions>({});
  const [formKey, setFormKey] = useState(0);
  // 앱: 방금 등록한 구독. 있으면 등록 창이 사용 횟수 묻기로 바뀐다.
  const [addedSub, setAddedSub] = useState<Subscription | null>(null);
  // 앱: 같은 서비스를 또 등록하려 할 때 한 번 묻는다. data는 확인하면 그대로 등록할 폼 값이다.
  const [duplicate, setDuplicate] = useState<{
    data: SubscriptionFormData;
    existing: Subscription;
  } | null>(null);
  // 앱: 등록 직후 체크인이 이 사람의 첫 체크인인지. 맞으면 결제 알림을 한 번 묻는다.
  const [firstEverCheckIn, setFirstEverCheckIn] = useState(false);

  const open = (next: AddOptions = {}) => {
    setOptions(next);
    setFormKey((k) => k + 1);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setAddedSub(null);
  };

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
    close();
    showToast(`${data.name} 등록 완료`);
  };

  // 앱: 등록 직후 등록 창 자리에 그릴 사용 횟수 묻기.
  const checkInStep =
    addedSub && AppAddCheckIn ? (
      <AppAddCheckIn
        subscription={addedSub}
        onDone={(recorded) => {
          close();
          // 이 사람의 첫 체크인이면 결제 알림을 한 번만 묻는다(대시보드 첫 체크인과 같은 흐름).
          if (recorded !== undefined && firstEverCheckIn) reminder.askNow(addedSub);
          showToast(
            recorded === undefined
              ? `${addedSub.name} 등록 완료`
              : `${addedSub.name} 등록 · ${recorded}회 기록`,
          );
        }}
      />
    ) : null;

  const dialog = (
    <Dialog open={isOpen} onOpenChange={(next) => (next ? setIsOpen(true) : close())}>
      <DialogContent className="sm:max-w-md">
        {checkInStep ?? (
          <>
            <DialogHeader>
              <DialogTitle>
                {options.preset ? `${options.preset.nameKo} 등록` : "새 구독 등록"}
              </DialogTitle>
              <DialogDescription>서비스를 고르거나 직접 입력하세요.</DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <SubForm
                key={formKey}
                popularServices={POPULAR_SERVICES}
                initialData={options.preset ? presetFormData(options.preset) : undefined}
                openCustom={options.custom ?? false}
                onSubmit={(data) => submit(data)}
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  return {
    open,
    /** 등록 창. 화면 아무 곳에나 그린다(포털로 뜬다). */
    dialog,
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
