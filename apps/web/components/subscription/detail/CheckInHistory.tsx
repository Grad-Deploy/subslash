"use client";

import React from "react";
import type { Subscription, UsageLog } from "@subslash/shared";
import { formatUSD } from "@subslash/shared";
import { useLocale, useT, type Messages } from "@lib/i18n";
import { formatTokenCount } from "@lib/pc-usage";
import { isThisDevice } from "@lib/check-in-device";
import { useIsClient } from "@hooks/useIsClient";
import { describeCheckInText } from "@lib/i18n/check-in-text";
import { Button } from "../../ui/button";
import { RiskBadge } from "../../dashboard/RiskBadge";
import { MeasuredUsageLine } from "../../usage/MeasuredUsage";
import { CheckInEvidence } from "../CheckInEvidence";
import { CheckInMonthChart } from "./CheckInMonthChart";

/** 폰 기록으로 자동 체크인한 줄에 붙이는 한 마디. 무엇을 쟀는지와 빠진 것을 말한다. */
function phoneCheckInNote(t: Messages, metric: UsageLog["metric"]): string {
  const h = t.checkin.history;
  if (metric === "hours") return h.phoneHours;
  if (metric === "days") return h.phoneDays;
  return h.phoneOther;
}

/** 운영체제 이름은 상표라 언어마다 옮기지 않는다. 모르면 적지 않는다. */
const OS_NAMES: Record<NonNullable<UsageLog["device"]>["os"], string | null> = {
  windows: "Windows",
  mac: "Mac",
  linux: "Linux",
  chromeos: "ChromeOS",
  android: "Android",
  ios: "iOS",
  other: null,
};

/** 체크인한 기기의 이름(예: "Windows PC 웹", "Android 앱"). */
function deviceName(t: Messages, device: NonNullable<UsageLog["device"]>): string {
  const h = t.checkin.history;
  if (device.app !== "web") return h.deviceApp[device.app];
  return h.deviceWeb(OS_NAMES[device.os], device.mobile);
}

/** 구독 상세의 체크인 기록 — 근거 요약, 달별 막대, 여러 기기 측정, 달마다의 기록. */
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
  const t = useT();
  const locale = useLocale();
  const h = t.checkin.history;
  // '이 기기'는 이 브라우저에 남은 값과 견준다. 서버 렌더링에서는 모르므로 그리고 난 뒤에 붙인다.
  const mounted = useIsClient();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold">{h.title(logs.length)}</h3>
        {/* 체크인은 지금 돈을 내는 구독의 1회 단가를 묻는다. 해지한 구독에는 묻지 않는다. */}
        {!isKilled && (
          <Button size="sm" variant="outline" onClick={onCheckIn}>
            {h.add}
          </Button>
        )}
      </div>

      <CheckInEvidence logs={logs} currency={sub.currency} />

      <CheckInMonthChart sub={sub} logs={logs} />

      {!isKilled && <MeasuredUsageLine sub={sub} />}

      {logs.length === 0 ? (
        <div className="text-center py-10 border border-dashed rounded-xl text-xs text-muted-foreground">
          {h.empty}
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-4 border rounded-xl bg-card text-sm"
            >
              <div>
                <div className="font-bold">{h.monthRecord(log.month)}</div>
                <div className="text-xs text-muted-foreground">
                  {describeCheckInText(t, log, sub.currency)}
                </div>
                {log.tokens && (
                  <div className="text-[11px] text-muted-foreground">
                    {h.pcTokens(
                      formatTokenCount(log.tokens.count, locale),
                      log.tokens.apiUsd !== null ? formatUSD(log.tokens.apiUsd) : null,
                    )}
                  </div>
                )}
                {log.device && (
                  <div className="text-[11px] text-muted-foreground">
                    {h.deviceLine(deviceName(t, log.device), mounted && isThisDevice(log.device))}
                  </div>
                )}
                {log.source === "phone" && (
                  <div className="text-[11px] text-muted-foreground">
                    {phoneCheckInNote(t, log.metric)}
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
