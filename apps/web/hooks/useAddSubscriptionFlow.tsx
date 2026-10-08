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
import { useLatestT, useServiceNames, useT } from "@lib/i18n";
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
  const t = useT();
  const names = useServiceNames();
  const tRef = useLatestT();
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

  // 차례로 열 서비스(앱 소개에서 여럿 고른 것). 창 하나를 닫으면(등록했든 닫았든) 다음 서비스로 연다.
  const [queue, setQueue] = useState<{ presets: ServicePreset[]; at: number } | null>(null);

  const open = (next: AddOptions = {}) => {
    setOptions(next);
    setFormKey((k) => k + 1);
    setIsOpen(true);
  };

  /** 여러 서비스의 등록 창을 하나씩 연다. 요금제·결제일은 창마다 사용자가 정한다. */
  const openQueue = (presets: ServicePreset[]) => {
    if (presets.length === 0) return;
    setQueue({ presets, at: 0 });
    open({ preset: presets[0] });
  };

  const close = () => {
    setIsOpen(false);
    setAddedSub(null);
    if (!queue) return;
    const at = queue.at + 1;
    if (at >= queue.presets.length) {
      setQueue(null);
      return;
    }
    setQueue({ ...queue, at });
    open({ preset: queue.presets[at] });
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
    showToast(tRef.current.form.dialog.added(data.name));
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
              ? tRef.current.form.dialog.added(addedSub.name)
              : tRef.current.form.dialog.addedWithCheckIn(addedSub.name, recorded),
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
                {options.preset
                  ? t.form.dialog.titlePreset(names.preset(options.preset))
                  : t.form.dialog.titleNew}
                {queue && queue.presets.length > 1 && (
                  <span className="ml-1.5 text-sm font-medium text-muted-foreground tabular-nums">
                    {queue.at + 1}/{queue.presets.length}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>{t.form.dialog.description}</DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <SubForm
                key={formKey}
                popularServices={POPULAR_SERVICES}
                initialData={
                  options.preset
                    ? { ...presetFormData(options.preset), name: names.preset(options.preset) }
                    : undefined
                }
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
    openQueue,
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
