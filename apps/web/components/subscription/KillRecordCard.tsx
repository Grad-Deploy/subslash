"use client";

import React, { useState } from "react";
import {
  formatRefundRequest,
  isResubscribeReminderDue,
  toDateOnly,
  type Subscription,
} from "@subslash/shared";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { CopyFallbackDialog } from "../ui/copy-fallback-dialog";
import { useStore } from "@lib/store";
import { copyText } from "@lib/native";
import { IS_APP_BUILD } from "@lib/platform";
import { useT } from "@lib/i18n";

interface KillRecordCardProps {
  subscription: Subscription;
  onMessage: (message: string) => void;
}

/** 이 구독을 해지한 날(기기 시간대). 기록이 없거나 깨졌으면 null. */
function killedDate(sub: Subscription): string | null {
  const killed = sub.killedAt ? new Date(sub.killedAt) : null;
  return killed && !Number.isNaN(killed.getTime()) ? toDateOnly(killed) : null;
}

/**
 * 해지한 구독의 기록 — 다시 살펴볼 날, 해지 근거, (해지 뒤 결제됐으면) 환불 요청 글.
 *
 * 다시 살펴볼 날은 사용자가 고른다. 앱이 "3개월 뒤" 같은 날을 미리 채우지 않는다 — 그 서비스를 언제
 * 다시 쓸지는 앱이 모른다. 해지 근거도 사용자가 적은 글 그대로다.
 */
export function KillRecordCard({ subscription: sub, onMessage }: KillRecordCardProps) {
  const t = useT().detail.record;
  const setResubscribeReminder = useStore((state) => state.setResubscribeReminder);
  const setKillEvidence = useStore((state) => state.setKillEvidence);

  const [remindOn, setRemindOn] = useState(sub.resubscribeRemindOn ?? "");
  const [reference, setReference] = useState(sub.killEvidence?.reference ?? "");
  const [memo, setMemo] = useState(sub.killEvidence?.memo ?? "");
  const [copyFallback, setCopyFallback] = useState<string | null>(null);

  // 날짜 칸의 최솟값. 화면을 여는 동안 날이 바뀌어도 하루 차이라 처음 값으로 둔다.
  const [tomorrow] = useState(() => {
    const now = new Date();
    return toDateOnly(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  });
  const due = isResubscribeReminderDue(sub);
  const refund = formatRefundRequest(sub);
  const evidenceChanged =
    reference.trim() !== (sub.killEvidence?.reference ?? "") ||
    memo.trim() !== (sub.killEvidence?.memo ?? "");

  const copyRefund = async () => {
    if (!refund) return;
    if (await copyText(refund)) onMessage(t.refundCopied);
    else setCopyFallback(refund);
  };

  return (
    <section className="p-6 border rounded-2xl bg-card space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-lg font-bold">{t.title}</h2>
        <p className="text-xs text-muted-foreground">
          {killedDate(sub) ? t.killedOn(killedDate(sub)!) : t.noDate}
        </p>
      </div>

      {refund && (
        <div className="space-y-2 p-4 rounded-xl border border-destructive bg-destructive/5">
          <h3 className="text-sm font-bold text-destructive">{t.chargedAfter}</h3>
          <p className="text-xs text-muted-foreground">{t.chargedNote}</p>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed bg-background border rounded-lg p-3 font-sans">
            {refund}
          </pre>
          <Button size="sm" variant="destructive" onClick={() => void copyRefund()}>
            {t.copyRefund}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-bold">{t.lookAgain}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t.lookAgainNote(IS_APP_BUILD)}
        </p>
        {due && (
          <p className="text-xs font-semibold text-primary">
            {t.due(sub.resubscribeRemindOn ?? "")}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            aria-label={t.lookAgain}
            className="w-auto"
            min={tomorrow}
            value={remindOn}
            onChange={(event) => setRemindOn(event.target.value)}
          />
          <Button
            size="sm"
            disabled={!remindOn || remindOn === sub.resubscribeRemindOn}
            onClick={() => {
              setResubscribeReminder(sub.id, remindOn);
              onMessage(t.saveReminder(remindOn));
            }}
          >
            {t.save}
          </Button>
          {sub.resubscribeRemindOn && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setResubscribeReminder(sub.id, null);
                setRemindOn("");
                onMessage(t.cleared);
              }}
            >
              {t.clear}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold">{t.evidence}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{t.evidenceNote}</p>
        <Input
          aria-label={t.referenceLabel}
          placeholder={t.referencePlaceholder}
          maxLength={200}
          value={reference}
          onChange={(event) => setReference(event.target.value)}
        />
        <textarea
          aria-label={t.memoLabel}
          placeholder={t.memoPlaceholder}
          maxLength={500}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            {sub.killEvidence
              ? t.recordedOn(toDateOnly(new Date(sub.killEvidence.recordedAt)))
              : ""}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={!evidenceChanged}
            onClick={() => {
              setKillEvidence(sub.id, { reference, memo });
              onMessage(reference.trim() || memo.trim() ? t.evidenceSaved : t.evidenceCleared);
            }}
          >
            {t.save}
          </Button>
        </div>
      </div>

      <CopyFallbackDialog
        text={copyFallback}
        title={t.refundTitle}
        onClose={() => setCopyFallback(null)}
      />
    </section>
  );
}
