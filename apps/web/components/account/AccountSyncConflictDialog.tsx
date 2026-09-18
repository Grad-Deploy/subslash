"use client";

import React from "react";
import type { RecordCounts, SyncChoice, SyncConflict } from "@hooks/useAccountSync";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button, WRAPPING_BUTTON } from "../ui/button";

interface AccountSyncConflictDialogProps {
  conflict: SyncConflict | null;
  onChoose: (choice: SyncChoice) => void;
}

function describe(counts: RecordCounts): string {
  return `구독 ${counts.subscriptionCount}개 (해지 ${counts.killedCount}개), 체크인 ${counts.usageLogCount}건, 연동 계정 ${counts.linkedAccountCount}개`;
}

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "알 수 없는 시각";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * 이 기기와 계정의 기록이 서로 달라 한쪽을 골라야 할 때. 합치지 않는다 — 고르지 않은 쪽은
 * 사라지므로 양쪽 개수를 보여준다. 창을 그냥 닫으면 '나중에'와 같다(이 기기의 자동 동기화를
 * 끈다). 닫을 때마다 다시 물으면 기록을 고칠 때마다 창이 뜬다.
 */
export function AccountSyncConflictDialog({ conflict, onChoose }: AccountSyncConflictDialogProps) {
  if (!conflict) return null;
  const lead =
    conflict.reason === "first"
      ? "이 기기와 계정에 서로 다른 기록이 있습니다."
      : "이 기기와 다른 기기에서 기록이 따로 바뀌었습니다.";

  return (
    <Dialog open onOpenChange={(open) => !open && onChoose("later")}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>어느 기록을 쓸까요?</DialogTitle>
          <DialogDescription>
            {lead} 두 기록을 합치지 않고 한쪽으로 맞춥니다. 고르지 않은 쪽의 기록은 사라집니다.
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-2 text-xs">
          <div className="rounded-xl border p-3">
            <dt className="font-bold text-foreground">이 기기</dt>
            <dd className="text-muted-foreground">{describe(conflict.local)}</dd>
          </div>
          <div className="rounded-xl border p-3">
            <dt className="font-bold text-foreground">
              계정 (마지막 저장 {formatSavedAt(conflict.server.savedAt)})
            </dt>
            <dd className="text-muted-foreground">{describe(conflict.server)}</dd>
          </div>
        </dl>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className={WRAPPING_BUTTON} onClick={() => onChoose("use-local")}>
            이 기기 기록 쓰기 (계정의 기록을 바꿈)
          </Button>
          <Button
            variant="outline"
            className={WRAPPING_BUTTON}
            onClick={() => onChoose("use-server")}
          >
            계정 기록 쓰기 (이 기기의 기록을 바꿈)
          </Button>
          <Button variant="ghost" className={WRAPPING_BUTTON} onClick={() => onChoose("later")}>
            나중에 — 이 기기의 자동 동기화 끄기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
