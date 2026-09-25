"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Smartphone } from "lucide-react";
import { type Subscription } from "@subslash/shared";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import { formatDuration } from "@lib/usage/history";
import { packagesFor } from "@lib/usage/packages";
import { recentOpens } from "@lib/usage/value";
import { AppUsageAccessSheet } from "./AppUsageAccessSheet";

/**
 * 체크인 막대 아래의 폰 기록 한 줄(안드로이드 앱). 최근 30일 동안 이 폰에서 연 횟수를 알려 주고
 * onOpens로 넘겨 막대를 미리 맞추게 한다. 기록을 켜지 않았으면 '폰 사용 기록으로 채우기'를 둔다.
 *
 * 체크인 막대(AppUsageCountPicker)는 웹의 첫 체크인 카드도 쓰므로, 폰 기록 코드는 이 파일로 떼어
 * 앱 빌드에서만 불러온다.
 */
export function AppPhoneHint({
  subscription,
  onOpens,
}: {
  subscription: Subscription;
  onOpens: (opens: number | null) => void;
}) {
  const rate = useExchangeRate();
  const { status, history, installed } = usePhoneUsage();
  const [accessOpen, setAccessOpen] = useState(false);
  const recent = useMemo(
    () =>
      status === "on" ? recentOpens(subscription, history, installed, new Date(), rate) : null,
    [status, history, installed, subscription, rate],
  );
  const opens = recent?.totals.opens ?? null;

  useEffect(() => {
    onOpens(opens);
  }, [opens, onOpens]);

  if (recent) {
    return (
      <div className="mt-3 rounded-2xl bg-secondary/60 px-3 py-2.5 text-xs leading-relaxed">
        {opens === 0 ? (
          <p>
            <b>이 폰에서는 안 열었어요.</b> TV·PC·태블릿에서 썼다면 막대로 골라 주세요.
          </p>
        ) : (
          <p>
            이 폰에서{" "}
            {recent.totals.coveredDays < 30
              ? `기록이 있는 ${recent.totals.coveredDays}일 동안`
              : "최근 30일 동안"}{" "}
            <b>
              {opens}번 · {formatDuration(recent.totals.ms)}
            </b>{" "}
            썼어요. 막대를 여기에 맞춰 뒀어요.
          </p>
        )}
        <p className="text-muted-foreground">TV·PC·태블릿에서 본 건 빠져 있어요.</p>
      </div>
    );
  }

  if (status !== "off" || !packagesFor(subscription)) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setAccessOpen(true)}
        className="mt-3 flex w-full items-center gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs"
      >
        <Smartphone className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block font-bold">폰 사용 기록으로 채우기</span>
          <span className="block text-muted-foreground">이 폰에서 몇 번 열었는지 불러와요</span>
        </span>
      </button>
      <AppUsageAccessSheet open={accessOpen} onClose={() => setAccessOpen(false)} />
    </>
  );
}
