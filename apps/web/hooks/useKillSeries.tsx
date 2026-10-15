"use client";

import React, { useState } from "react";
import type { Subscription } from "@subslash/shared";
import { useStore } from "@lib/store";
import { useCelebrateKill } from "./useCelebrateKill";
import { AppNextKillDialog } from "../components/dashboard/app/appParts";

/**
 * 앱 계산서에서 '쉬어가도 될 구독'을 이어서 해지하는 흐름. 하나를 해지로 기록하면 다음 구독을 이어서 해지할지
 * 묻고, 마지막까지 해지하면 이번에 해지한 구독을 모아 축하 화면(`useCelebrateKill`)에 보여준다. 중간에 그만두면
 * 그때까지 해지한 것만 축하한다. 계산서가 아닌 곳에서 연 해지 안내에는 쓰지 않는다(`start`를 부르지 않으면
 * `advance`는 false를 돌려주고 아무 일도 하지 않는다 — 부른 쪽이 그 하나를 축하한다).
 *
 * `openGuide`는 다음 구독의 해지 안내를 여는 화면의 함수다.
 */
export function useKillSeries(openGuide: (sub: Subscription) => void) {
  const celebrateKill = useCelebrateKill();
  // current는 지금 해지 안내를 연 구독, rest는 그 뒤에 물어볼 구독, done은 이번에 해지한 구독들.
  const [series, setSeries] = useState<{
    current: string;
    rest: string[];
    done: Subscription[];
  } | null>(null);
  const [nextKill, setNextKill] = useState<Subscription | null>(null);

  const find = (id: string) => useStore.getState().subscriptions.find((s) => s.id === id);

  return {
    /** 계산서에서 해지 안내를 열 때. 뒤에 남은 구독을 기억해 둔다. */
    start: (id: string, rest: string[]) => setSeries({ current: id, rest, done: [] }),
    /**
     * 해지를 기록한 뒤 다음 구독을 묻는다. 그 사이 이미 해지했거나 지운 구독은 건너뛴다. 마지막 하나까지
     * 해지하면 축하 화면을 띄운다. 이어서 해지하는 중이 아니면 false다.
     */
    advance: (killed: Subscription): boolean => {
      if (!series || series.current !== killed.id) return false;
      const done = [...series.done, killed];
      const remaining = series.rest.filter((id) => find(id)?.status === "active");
      const next = remaining[0] ? find(remaining[0]) : undefined;
      if (next) {
        setSeries({ current: next.id, rest: remaining.slice(1), done });
        setNextKill(next);
      } else {
        setSeries(null);
        celebrateKill(done);
      }
      return true;
    },
    dialogs: (
      <>
        {nextKill && AppNextKillDialog && (
          <AppNextKillDialog
            subscription={nextKill}
            remaining={series?.rest.length ?? 0}
            onContinue={() => {
              setNextKill(null);
              openGuide(nextKill);
            }}
            onStop={() => {
              setNextKill(null);
              if (series) celebrateKill(series.done);
              setSeries(null);
            }}
          />
        )}
      </>
    ),
  };
}
