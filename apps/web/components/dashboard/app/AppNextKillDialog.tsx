"use client";

import type { Subscription } from "@subslash/shared";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../ui/dialog";
import { useT } from "@lib/i18n";
import { AppSubRow } from "./AppSubRow";

/**
 * 앱 계산서에서 이어서 해지할 때, 하나를 해지한 뒤 다음 '쉬어가도 될 구독'을 묻는 창.
 * 문장 속에 금액을 섞지 않고, 계산서 줄처럼 로고 · 이름 ······ 금액을 한 줄로 따로 보여준다(AppSubRow).
 */
export function AppNextKillDialog({
  subscription,
  remaining,
  onContinue,
  onStop,
}: {
  subscription: Subscription;
  /** 이 구독 뒤에 더 남은 수. */
  remaining: number;
  onContinue: () => void;
  onStop: () => void;
}) {
  const s = useT().series;
  return (
    <Dialog open onOpenChange={(open) => !open && onStop()}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle className="text-center text-lg font-black tracking-tight">
          {s.nextTitle}
        </DialogTitle>
        <DialogDescription className="mt-1 text-center text-xs text-muted-foreground">
          {s.nextHint(remaining)}
        </DialogDescription>

        <div className="mt-4">
          <AppSubRow subscription={subscription} />
        </div>

        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={onContinue}
            className="h-11 rounded-xl bg-primary text-sm font-extrabold text-primary-foreground"
          >
            {s.next}
          </button>
          <button
            type="button"
            onClick={onStop}
            className="h-11 rounded-xl border text-sm font-bold text-muted-foreground"
          >
            {s.stop}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
