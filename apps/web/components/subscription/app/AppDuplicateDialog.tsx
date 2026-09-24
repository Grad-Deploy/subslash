"use client";

import type { Subscription } from "@subslash/shared";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../ui/dialog";
import { AppSubRow } from "../../dashboard/app/AppSubRow";

/**
 * 같은 서비스를 또 등록하려 할 때 한 번 묻는 창. 가족·다른 계정처럼 일부러 두 번 넣을 수도 있어
 * 막지는 않는다. 이미 있는 구독을 계산서 줄처럼 보여준다.
 */
export function AppDuplicateDialog({
  existing,
  onAddAnyway,
  onCancel,
}: {
  existing: Subscription;
  onAddAnyway: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle className="text-center text-lg font-black tracking-tight">
          이미 등록된 구독이에요
        </DialogTitle>
        <DialogDescription className="mt-1 text-center text-xs text-muted-foreground">
          다른 계정으로 따로 내고 있다면 또 등록해도 돼요.
        </DialogDescription>
        <div className="mt-4">
          <AppSubRow subscription={existing} />
        </div>
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 rounded-xl bg-primary text-sm font-extrabold text-primary-foreground"
          >
            등록 안 할게요
          </button>
          <button
            type="button"
            onClick={onAddAnyway}
            className="h-11 rounded-xl border text-sm font-bold text-muted-foreground"
          >
            그래도 등록
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
