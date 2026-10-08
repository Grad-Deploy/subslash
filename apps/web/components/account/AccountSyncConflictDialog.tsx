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
import { useT, type Messages } from "@lib/i18n";

interface AccountSyncConflictDialogProps {
  conflict: SyncConflict | null;
  onChoose: (choice: SyncChoice) => void;
}

function describe(t: Messages, counts: RecordCounts): string {
  return t.account.conflict.counts(
    counts.subscriptionCount,
    counts.killedCount,
    counts.usageLogCount,
  );
}

function formatSavedAt(t: Messages, iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return t.account.conflict.unknownTime;
  const pad = (n: number) => String(n).padStart(2, "0");
  return t.account.conflict.savedAt(
    date.getMonth() + 1,
    date.getDate(),
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  );
}

/**
 * 이 기기와 계정의 기록이 서로 달라 한쪽을 골라야 할 때. 합치지 않는다 — 고르지 않은 쪽은
 * 사라지므로 양쪽 개수를 보여준다. 창을 그냥 닫으면(뒤로 가기·바깥 누르기) 이번 실행 동안만 묻지 않고
 * 자동 동기화는 켜 둔다 — 예전에는 닫기가 '나중에'(동기화 끄기)와 같아서, 모르는 사이에 꺼졌다. 끄는
 * 것은 '나중에' 버튼뿐이다.
 */
export function AccountSyncConflictDialog({ conflict, onChoose }: AccountSyncConflictDialogProps) {
  const t = useT();
  const c = t.account.conflict;
  if (!conflict) return null;
  const lead = conflict.reason === "first" ? c.leadFirst : c.leadDiverged;

  return (
    <Dialog open onOpenChange={(open) => !open && onChoose("dismiss")}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>
            {lead} {c.description}
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-2 text-xs">
          <div className="rounded-xl border p-3">
            <dt className="font-bold text-foreground">{c.thisDevice}</dt>
            <dd className="text-muted-foreground">{describe(t, conflict.local)}</dd>
          </div>
          <div className="rounded-xl border p-3">
            <dt className="font-bold text-foreground">
              {c.accountSaved(formatSavedAt(t, conflict.server.savedAt))}
            </dt>
            <dd className="text-muted-foreground">{describe(t, conflict.server)}</dd>
          </div>
        </dl>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className={WRAPPING_BUTTON} onClick={() => onChoose("use-local")}>
            {c.useLocal}
          </Button>
          <Button
            variant="outline"
            className={WRAPPING_BUTTON}
            onClick={() => onChoose("use-server")}
          >
            {c.useServer}
          </Button>
          <Button variant="ghost" className={WRAPPING_BUTTON} onClick={() => onChoose("later")}>
            {c.later}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
