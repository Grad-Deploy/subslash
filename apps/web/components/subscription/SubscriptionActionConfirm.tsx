"use client";

import React from "react";
import type { Subscription } from "@subslash/shared";
import { IS_APP_BUILD } from "@lib/platform";
import { useT } from "@lib/i18n";
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
  const t = useT().subs.confirm;
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
            ? t.reviveTitle
            : t.deleteTitle
          : revive
            ? t.reviveHeading
            : t.deleteHeading
      }
      description={
        IS_APP_BUILD
          ? revive
            ? t.reviveNote
            : t.deleteNote
          : revive
            ? t.reviveBody(action.sub.name)
            : t.deleteBody(action.sub.name)
      }
      confirmText={revive ? t.reviveConfirm : t.deleteConfirm}
      cancelText={t.cancel}
      variant={revive ? "default" : "destructive"}
    />
  );
}
