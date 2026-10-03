"use client";

import React from "react";
import { describeCheckIn, type Subscription, type UsageLog } from "@subslash/shared";
import { Button } from "../../ui/button";
import { RiskBadge } from "../../dashboard/RiskBadge";
import { MeasuredUsageLine } from "../../usage/MeasuredUsage";
import { CheckInEvidence } from "../CheckInEvidence";

/** 폰 기록으로 자동 체크인한 줄에 붙이는 한 마디. 무엇을 쟀는지와 빠진 것을 말한다. */
function phoneCheckInNote(metric: UsageLog["metric"]): string {
  if (metric === "hours") {
    return "폰 기록으로 자동 체크인 · 앱을 쓴 시간과 재생 알림이 떠 있던 시간 중 긴 쪽이에요. 일시정지 시간이 섞일 수 있어요";
  }
  if (metric === "days")
    return "폰 기록으로 자동 체크인 · 이 폰에서 쓴 날이에요. PC에서 쓴 날은 빠져 있어요";
  return "폰 기록으로 자동 체크인 · 다른 기기에서 쓴 건 빠져 있어요";
}

/** 구독 상세의 체크인 기록 — 근거 요약, 여러 기기 측정, 달마다의 기록. */
export function CheckInHistory({
  sub,
  logs,
  onCheckIn,
}: {
  sub: Subscription;
  logs: UsageLog[];
  onCheckIn: () => void;
}) {
  const isKilled = sub.status === "killed";
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">체크인 기록 ({logs.length}건)</h3>
        {/* 체크인은 지금 돈을 내는 구독의 1회 단가를 묻는다. 해지한 구독에는 묻지 않는다. */}
        {!isKilled && (
          <Button size="sm" variant="outline" onClick={onCheckIn}>
            + 체크인 하기
          </Button>
        )}
      </div>

      <CheckInEvidence logs={logs} currency={sub.currency} />

      {!isKilled && <MeasuredUsageLine sub={sub} />}

      {logs.length === 0 ? (
        <div className="text-center py-10 border border-dashed rounded-xl text-xs text-muted-foreground">
          아직 체크인 기록이 없어요. 이번 달 이용 횟수를 넣어 보세요.
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-4 border rounded-xl bg-card text-sm"
            >
              <div>
                <div className="font-bold">{log.month} 사용 기록</div>
                <div className="text-xs text-muted-foreground">
                  {describeCheckIn(log, sub.currency)}
                </div>
                {log.source === "phone" && (
                  <div className="text-[11px] text-muted-foreground">
                    {phoneCheckInNote(log.metric)}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <RiskBadge level={log.riskLevel} size="sm" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
