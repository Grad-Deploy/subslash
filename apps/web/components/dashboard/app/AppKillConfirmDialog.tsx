"use client";

import type { Subscription } from "@subslash/shared";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../ui/dialog";
import { AppSubRow } from "./AppSubRow";

/**
 * 앱의 '해지 완료로 기록할까요?' 창. 웹의 ConfirmDialog 문장 대신 제목 · 구독 한 줄 · 안내 한 줄로
 * 가운데 정렬해 정리한다. 확인과 취소를 따로 알린다(웹 ConfirmDialog는 확인 뒤에도 onClose를 부른다).
 */
export function AppKillConfirmDialog({
  subscription,
  onConfirm,
  onCancel,
}: {
  subscription: Subscription;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle className="text-center text-lg font-black tracking-tight">
          해지 완료로 기록할까요?
        </DialogTitle>
        <DialogDescription className="mt-1 text-center text-xs text-muted-foreground">
          결제일이 지나면 지킨 돈으로 쌓여요.
        </DialogDescription>
        <div className="mt-4">
          <AppSubRow subscription={subscription} />
        </div>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 rounded-xl bg-destructive text-sm font-extrabold text-destructive-foreground"
          >
            해지 완료
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-xl border text-sm font-bold text-muted-foreground"
          >
            취소
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
