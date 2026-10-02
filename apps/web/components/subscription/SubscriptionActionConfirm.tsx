"use client";

import React from "react";
import type { Subscription } from "@subslash/shared";
import { IS_APP_BUILD } from "@lib/platform";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { SubjectChip } from "./SubjectChip";

export interface SubscriptionAction {
  type: "revive" | "delete";
  sub: Subscription;
}

/**
 * 내 구독의 '다시 살리기'·'영구 삭제' 확인 창. 앱은 제목을 짧게, 이름은 칩으로, 줄은 뜻이 끊기는 자리에서
 * 바꾼다(ConfirmDialog의 centered). 웹은 이름을 문장에 넣는다.
 */
export function SubscriptionActionConfirm({
  action,
  onClose,
  onConfirm,
}: {
  action: SubscriptionAction;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const revive = action.type === "revive";
  return (
    <ConfirmDialog
      isOpen
      onClose={onClose}
      onConfirm={onConfirm}
      centered={IS_APP_BUILD}
      subject={IS_APP_BUILD ? <SubjectChip sub={action.sub} /> : undefined}
      title={
        IS_APP_BUILD
          ? revive
            ? "다시 살릴까요?"
            : "삭제할까요?"
          : revive
            ? "구독 다시 살리기"
            : "구독 영구 삭제"
      }
      description={
        IS_APP_BUILD
          ? revive
            ? "구독 중으로 돌아가고,\n절약 기록에서는 빠져요."
            : "절약 현황에서도 빠지고\n되돌릴 수 없어요."
          : revive
            ? `'${action.sub.name}'을(를) 다시 구독 중으로 바꿀까요?\n절약 기록에서 빠져요.`
            : `'${action.sub.name}'을(를) 삭제할까요?\n되돌릴 수 없어요.`
      }
      confirmText={revive ? "다시 살리기" : "삭제"}
      cancelText="취소"
      variant={revive ? "default" : "destructive"}
    />
  );
}
