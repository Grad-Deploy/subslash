"use client";

import { type Subscription, findPresetForSubscription, serviceNameOf } from "@subslash/shared";
import { sharedServices } from "@lib/duplicate-subscription";
import { useT } from "@lib/i18n";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../ui/dialog";
import { AppSubRow } from "../../dashboard/app/AppSubRow";

/**
 * 같은 서비스를 또 등록하려 할 때 한 번 묻는 창. 가족·다른 계정처럼 일부러 두 번 넣을 수도 있어
 * 막지는 않는다. 이미 있는 구독을 계산서 줄처럼 보여준다.
 */
export function AppDuplicateDialog({
  existing,
  candidate,
  onAddAnyway,
  onCancel,
}: {
  existing: Subscription;
  /** 등록하려는 구독. 결합 상품과 겹치는지 말하는 데 쓴다. */
  candidate?: { name: string; cancelUrl?: string };
  onAddAnyway: () => void;
  onCancel: () => void;
}) {
  // 같은 서비스가 아니라 결합 상품과 그 안의 서비스가 겹치는 경우(배민클럽 + 유튜브 프리미엄 ↔
  // 유튜브 프리미엄). 결합 상품을 결제하면서 원래 구독을 끊지 않아 두 번 내는 일이 실제로 있다.
  const d = useT().form.duplicate;
  const samePreset =
    !candidate ||
    findPresetForSubscription(candidate)?.id === findPresetForSubscription(existing)?.id;
  const shared = candidate && !samePreset ? sharedServices(existing, candidate) : [];
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle className="text-center text-lg font-black tracking-tight">
          {shared.length > 0 ? d.titleBundle : d.titleSame}
        </DialogTitle>
        <DialogDescription className="mt-1 text-center text-xs text-muted-foreground">
          {shared.length > 0 ? d.bodyBundle(shared.map(serviceNameOf).join(", ")) : d.bodySame}
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
            {d.cancel}
          </button>
          <button
            type="button"
            onClick={onAddAnyway}
            className="h-11 rounded-xl border text-sm font-bold text-muted-foreground"
          >
            {d.anyway}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
