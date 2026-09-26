"use client";

import { type Subscription, findPresetForSubscription, serviceNameOf } from "@subslash/shared";
import { sharedServices } from "@lib/duplicate-subscription";
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
  const samePreset =
    !candidate ||
    findPresetForSubscription(candidate)?.id === findPresetForSubscription(existing)?.id;
  const shared = candidate && !samePreset ? sharedServices(existing, candidate) : [];
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle className="text-center text-lg font-black tracking-tight">
          {shared.length > 0 ? "결합 상품과 겹쳐요" : "이미 등록된 구독이에요"}
        </DialogTitle>
        <DialogDescription className="mt-1 text-center text-xs text-muted-foreground">
          {shared.length > 0
            ? `${shared.map(serviceNameOf).join(", ")}을(를) 이 구독으로 이미 받고 있어요. 따로 결제하면 두 번 내는 것일 수 있어요. 다른 계정으로 쓰고 있다면 등록해도 돼요.`
            : "다른 계정으로 따로 내고 있다면 또 등록해도 돼요."}
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
