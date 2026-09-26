"use client";

import React, { useState } from "react";
import { Smartphone } from "lucide-react";
import { type Subscription, isInTrial, metricForSubscription } from "@subslash/shared";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import { packagesFor } from "@lib/usage/packages";
import { AUTO_CHECKIN_DAYS, daysUntilAutoCheckIn } from "@lib/usage/auto-checkin";
import { readAutoCheckIn, writeAutoCheckIn } from "@lib/usage/storage";
import { cn } from "@lib/utils";
import { Button } from "../../ui/button";
import { AppBatchCheckIn } from "./AppBatchCheckIn";
import { AppUsageAccessSheet } from "./AppUsageAccessSheet";

/**
 * 구독 관리 위쪽의 '폰 기록으로 체크인'(안드로이드 앱). 대시보드 카드는 체크인이 밀렸을 때만 뜨고, 여기는
 * 언제든 전체 숫자를 폰 기록으로 다시 맞추는 입구다. 기록을 아직 켜지 않았으면 켜는 안내를 먼저 연다.
 * 폰 기록으로 잴 수 있는 구독이 하나도 없으면 두지 않는다.
 */
export function AppPhoneCheckInButton({
  subscriptions,
  onDone,
}: {
  subscriptions: Subscription[];
  onDone?: (count: number) => void;
}) {
  const { status, history } = usePhoneUsage();
  const [autoOn, setAutoOn] = useState(readAutoCheckIn);
  const [accessOpen, setAccessOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchKey, setBatchKey] = useState(0);

  const now = new Date();
  const paying = subscriptions.filter((sub) => sub.status === "active" && !isInTrial(sub, now));
  if (status === "loading" || status === "unsupported") return null;
  // 폰에서 연 횟수로 체크인하는 구독(횟수로 재는 것)이 없으면 두지 않는다.
  if (!paying.some((sub) => packagesFor(sub) && metricForSubscription(sub) === "uses")) return null;

  const remaining = daysUntilAutoCheckIn(history, now);

  return (
    <>
      {status === "on" && (
        <div className="flex w-full items-start gap-3 rounded-2xl border px-3 py-2.5 md:max-w-md">
          <div className="min-w-0 flex-1 text-xs leading-relaxed">
            <p className="font-bold">폰 기록으로 자동 체크인</p>
            <p className="text-muted-foreground">
              {!autoOn
                ? "꺼져 있어요. 체크인은 직접 해 주세요."
                : remaining === null || remaining > 0
                  ? `폰 기록이 ${AUTO_CHECKIN_DAYS}일 쌓이면 이 폰에서 연 횟수로 알아서 체크인해요${
                      remaining ? ` (${remaining}일 남음)` : ""
                    }.`
                  : "최근 30일 동안 이 폰에서 연 횟수로 알아서 체크인해요. 이 폰에서 안 연 구독과 직접 센 숫자가 더 큰 구독은 그대로 둬요."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoOn}
            aria-label="폰 기록으로 자동 체크인"
            onClick={() => {
              writeAutoCheckIn(!autoOn);
              setAutoOn(!autoOn);
            }}
            className={cn(
              "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors",
              autoOn ? "bg-primary" : "bg-secondary",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-background shadow transition-transform",
                autoOn ? "translate-x-5" : "translate-x-0.5",
              )}
            />
          </button>
        </div>
      )}
      <Button
        variant="outline"
        className="w-full font-semibold md:max-w-md"
        onClick={() => {
          if (status === "off") {
            setAccessOpen(true);
            return;
          }
          setBatchKey((k) => k + 1);
          setBatchOpen(true);
        }}
      >
        <Smartphone className="size-4" aria-hidden />폰 기록으로 체크인
      </Button>
      <AppUsageAccessSheet open={accessOpen} onClose={() => setAccessOpen(false)} />
      {batchOpen && (
        <AppBatchCheckIn
          key={batchKey}
          open={batchOpen}
          onClose={() => setBatchOpen(false)}
          subscriptions={paying}
          onDone={onDone}
        />
      )}
    </>
  );
}
