"use client";

import type { Subscription } from "@subslash/shared";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../ui/dialog";
import { SubjectChip } from "../../subscription/SubjectChip";

/**
 * 앱의 '해지했나요?' 창. 다른 앱 확인 창(ConfirmDialog의 centered)과 같은 모양이다 — 짧은 제목, 구독 칩,
 * 안내 두 줄, 나란한 큰 버튼 두 개. 확인과 취소를 따로 알린다(웹 ConfirmDialog는 확인 뒤에도 onClose를 부른다).
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
      <DialogContent hideClose className="rounded-2xl sm:max-w-sm">
        <div className="break-keep text-center">
          <DialogTitle className="text-lg font-extrabold leading-snug">해지했나요?</DialogTitle>
          <div className="mt-3 flex justify-center">
            <SubjectChip sub={subscription} />
          </div>
          <DialogDescription className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
            해지 완료로 기록하면
            <br />
            결제일부터 지킨 돈으로 쌓여요.
          </DialogDescription>
        </div>
        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 flex-1 rounded-xl bg-secondary text-base font-bold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-12 flex-1 rounded-xl bg-destructive text-base font-bold text-destructive-foreground"
          >
            해지 완료
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
