"use client";

import type { Subscription } from "@subslash/shared";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../../ui/dialog";
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
  return (
    <Dialog open onOpenChange={(open) => !open && onStop()}>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle className="text-center text-lg font-black tracking-tight">
          다음 구독도 정리할까요?
        </DialogTitle>
        <DialogDescription className="mt-1 text-center text-xs text-muted-foreground">
          쉬어가도 될 구독{remaining > 0 ? ` · 이 다음에 ${remaining}개 더` : " · 마지막"}
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
            이어서 해지 안내 열기
          </button>
          <button
            type="button"
            onClick={onStop}
            className="h-11 rounded-xl border text-sm font-bold text-muted-foreground"
          >
            그만하기
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
