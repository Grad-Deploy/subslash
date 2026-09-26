"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, Smartphone } from "lucide-react";
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
  autoSwitch = true,
  batchButton = true,
  autoStatus = false,
}: {
  subscriptions: Subscription[];
  onDone?: (count: number) => void;
  /** 자동 체크인 켜기/끄기 카드. 설정 탭에 두고 구독 관리에서는 뺀다. */
  autoSwitch?: boolean;
  /** '폰 기록으로 체크인' 버튼. 구독 관리에 두고 설정 탭에서는 뺀다. */
  batchButton?: boolean;
  /**
   * 스위치 없이 자동 체크인이 켜졌는지만 보이는 한 줄(누르면 설정 탭). 구독 관리에 둔다 — 켜고 끄는 곳은
   * 설정 한 곳이지만, 여기서 "다 자동으로 되는 줄 알았다"가 생기지 않게 언제부터 자동인지 보여 준다.
   */
  autoStatus?: boolean;
}) {
  const { status, history } = usePhoneUsage();
  const [autoOn, setAutoOn] = useState(readAutoCheckIn);
  const [accessOpen, setAccessOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchKey, setBatchKey] = useState(0);

  const now = new Date();
  const paying = subscriptions.filter((sub) => sub.status === "active" && !isInTrial(sub, now));
  if (status === "loading" || status === "unsupported") return null;
  // 폰 기록으로 잴 수 있는 구독(횟수·쓴 날·시간으로 재고 연결표에 있는 것)이 없으면 두지 않는다.
  // '한 번에 체크인'도 자동 체크인과 같은 구독을 모두 다룬다(구독마다 자기 지표로).
  const mapped = paying.filter((sub) => packagesFor(sub));
  const autoable = mapped.some((sub) =>
    ["uses", "days", "hours"].includes(metricForSubscription(sub)),
  );
  if (!autoable) return null;

  const remaining = daysUntilAutoCheckIn(history, now);

  return (
    <>
      {autoSwitch && status === "on" && (
        <div className="flex w-full items-start gap-3 rounded-2xl border px-3 py-2.5 md:max-w-md">
          <div className="min-w-0 flex-1 text-xs leading-relaxed">
            <p className="font-bold">폰 기록으로 자동 체크인</p>
            <p className="text-muted-foreground">
              {!autoOn
                ? "꺼져 있어요. 체크인은 직접 해 주세요."
                : remaining === null || remaining > 0
                  ? `폰 기록이 ${AUTO_CHECKIN_DAYS}일 쌓이면 알아서 체크인해요.`
                  : "최근 30일 동안의 이 폰 기록으로 알아서 체크인해요. OTT는 연 횟수, AI·업무 도구는 5분 넘게 쓴 날, 음악·독서는 들은(읽은) 시간이에요. 이 폰에서 안 쓴 구독과 직접 센 숫자가 더 큰 구독은 그대로 둬요."}
            </p>
            {/* 남은 날은 문장 괄호에 넣으면 줄이 길어져서 따로 한 줄로 둔다. */}
            {autoOn && remaining !== null && remaining > 0 && (
              <>
                <p className="mt-0.5 font-bold text-foreground">{remaining}일 남았어요</p>
                <p className="text-muted-foreground">
                  지금 바로 하려면 {batchButton ? "아래" : "구독 관리의"} &lsquo;폰 기록으로
                  체크인&rsquo;을 눌러 주세요.
                </p>
              </>
            )}
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
            // 꺼짐은 빨간 동그라미가 왼쪽, 켜짐은 초록 동그라미가 오른쪽이다. 색만으로 말하지 않게 빈
            // 자리에 ON/OFF를 적는다.
            className="relative mt-0.5 h-7 w-[3.625rem] shrink-0 rounded-full border bg-secondary"
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-1/2 -translate-y-1/2 text-[10.5px] font-black transition-opacity",
                autoOn
                  ? "left-2 text-emerald-600 opacity-100 dark:text-emerald-400"
                  : "left-2 opacity-0",
              )}
            >
              ON
            </span>
            <span
              aria-hidden
              className={cn(
                "absolute right-1.5 top-1/2 -translate-y-1/2 text-[10.5px] font-black text-muted-foreground transition-opacity",
                autoOn ? "opacity-0" : "opacity-100",
              )}
            >
              OFF
            </span>
            <span
              className={cn(
                "absolute left-0 top-1/2 size-[1.375rem] -translate-y-1/2 rounded-full shadow transition-[transform,background-color]",
                autoOn
                  ? "translate-x-8 bg-emerald-500 dark:bg-emerald-400"
                  : "translate-x-0.5 bg-red-500 dark:bg-red-400",
              )}
            />
          </button>
        </div>
      )}
      {autoStatus && status === "on" && (
        <Link
          href="/settings"
          className="flex w-full items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-xs md:max-w-md"
        >
          <span
            aria-hidden
            className={cn(
              "size-1.5 shrink-0 rounded-full",
              autoOn ? "bg-emerald-500" : "bg-muted-foreground",
            )}
          />
          <span className="min-w-0 flex-1 break-keep">
            <b>자동 체크인 {autoOn ? "켜짐" : "꺼짐"}</b>
            <span className="text-muted-foreground">
              {" · "}
              {!autoOn
                ? "직접 체크인해 주세요"
                : remaining === null
                  ? `폰 기록이 ${AUTO_CHECKIN_DAYS}일 쌓이면 알아서 해요`
                  : remaining > 0
                    ? `${remaining}일 뒤부터 알아서 해요`
                    : "폰 기록으로 알아서 맞춰요"}
            </span>
          </span>
          <span className="flex shrink-0 items-center font-bold text-muted-foreground">
            {autoOn ? "설정" : "켜기"}
            <ChevronRight className="size-3.5" aria-hidden />
          </span>
        </Link>
      )}
      {batchButton && (
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
      )}
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
