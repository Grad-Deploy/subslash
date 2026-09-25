"use client";

import React, { useState } from "react";
import { Smartphone } from "lucide-react";
import { type Subscription, isInTrial } from "@subslash/shared";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import { packagesFor } from "@lib/usage/packages";
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
  const { status } = usePhoneUsage();
  const [accessOpen, setAccessOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchKey, setBatchKey] = useState(0);

  const now = new Date();
  const paying = subscriptions.filter((sub) => sub.status === "active" && !isInTrial(sub, now));
  if (status === "loading" || status === "unsupported") return null;
  if (!paying.some((sub) => packagesFor(sub))) return null;

  return (
    <>
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
