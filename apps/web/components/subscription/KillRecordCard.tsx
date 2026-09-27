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
    if (await copyText(refund)) onMessage("환불 요청 글을 복사했어요");
    else setCopyFallback(refund);
  };

  return (
    <section className="p-6 border rounded-2xl bg-card space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-lg font-bold">해지 기록</h2>
        <p className="text-xs text-muted-foreground">
          {killedDate(sub) ? `${killedDate(sub)}에 해지로 기록했어요.` : "해지한 날 기록이 없어요."}
        </p>
      </div>

      {refund && (
        <div className="space-y-2 p-4 rounded-xl border border-destructive bg-destructive/5">
          <h3 className="text-sm font-bold text-destructive">해지 뒤에 결제됐어요</h3>
          <p className="text-xs text-muted-foreground">
            고객센터에 보낼 글이에요. 앱에 있는 기록만 넣었어요 — 보내기 전에 읽어 보고 고치세요.
          </p>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed bg-background border rounded-lg p-3 font-sans">
            {refund}
          </pre>
          <Button size="sm" variant="destructive" onClick={() => void copyRefund()}>
            환불 요청 글 복사
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-bold">다시 살펴볼 날</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          새 시즌·경기 시즌처럼 다시 쓸 때가 있다면 날을 정해 두세요. 그날 &lsquo;지금 결정할
          것&rsquo;에 올리고{IS_APP_BUILD ? ", 앱 알림을 켰다면 알림도 보내요" : ""}.
        </p>
        {due && (
          <p className="text-xs font-semibold text-primary">
            {sub.resubscribeRemindOn}이 됐어요. 다시 쓸 때가 아니면 날을 지우거나 미루세요.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            aria-label="다시 살펴볼 날"
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
              onMessage(`${remindOn}에 다시 알려 드릴게요`);
            }}
          >
            저장
          </Button>
          {sub.resubscribeRemindOn && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setResubscribeReminder(sub.id, null);
                setRemindOn("");
                onMessage("다시 살펴볼 날을 지웠어요");
              }}
            >
              지우기
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-bold">해지했다는 근거</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          해지 확인 메일 제목이나 접수 번호를 적어 두면, 나중에 결제가 또 되었을 때 환불을 요청하는
          근거가 돼요. 이 기기와 백업·계정 동기화에만 저장돼요.
        </p>
        <Input
          aria-label="해지 확인 번호나 메일 제목"
          placeholder="예: 해지 접수번호, 해지 확인 메일 제목"
          maxLength={200}
          value={reference}
          onChange={(event) => setReference(event.target.value)}
        />
        <textarea
          aria-label="해지 메모"
          placeholder="예: 앱 설정 > 구독에서 해지, 상담원과 통화"
          maxLength={500}
          rows={2}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            {sub.killEvidence ? `${toDateOnly(new Date(sub.killEvidence.recordedAt))}에 적음` : ""}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={!evidenceChanged}
            onClick={() => {
              setKillEvidence(sub.id, { reference, memo });
              onMessage(
                reference.trim() || memo.trim() ? "해지 기록을 저장했어요" : "해지 기록을 지웠어요",
              );
            }}
          >
            저장
          </Button>
        </div>
      </div>

      <CopyFallbackDialog
        text={copyFallback}
        title="환불 요청 글"
        onClose={() => setCopyFallback(null)}
      />
    </section>
  );
}
