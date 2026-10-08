"use client";

import { useEffect } from "react";
import { apiUrl } from "@lib/api";
import { isValidExchangeRate, realRecords, useStore } from "@lib/store";

/**
 * USD 구독의 환산 환율을 고시 환율로 저절로 맞춘다.
 *
 * 예전에는 설정의 '최신 환율 불러오기'를 눌러야 바뀌어, 누르지 않은 사람은 기본값(₩1,350)이나 몇 달 전 환율로 계산된
 * 합계를 봤다. 이제 앱을 열 때·화면으로 돌아올 때·켜 둔 동안 한 시간마다 `/api/fx`(ECB 고시 환율, 영업일마다 한 번
 * 바뀐다)를 묻고, 값이 달라졌을 때만 바꾼다. 실시간 시세는 아니다 — 고시가 하루 한 번이라 더 자주 물어도 같은 값이다.
 *
 * 사용자가 직접 적은 환율(`manual`)은 건드리지 않는다. 카드 명세서에서 역산해 넣은 값이라 고시 환율보다 정확할 수
 * 있다. 설정의 '자동으로 맞추기'를 누르면 다시 자동이 된다. USD 구독이 없으면 묻지 않는다(바뀌어도 화면에 없다).
 */

/** 이만큼 지나지 않았으면 다시 묻지 않는다. 서버도 한 시간 동안 같은 값을 준다(app/api/fx). */
const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const CHECKED_KEY = "subslash-fx-checked-at";

let inFlight: Promise<boolean> | null = null;

function readCheckedAt(): number {
  try {
    return Number(localStorage.getItem(CHECKED_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeCheckedAt(time: number) {
  try {
    localStorage.setItem(CHECKED_KEY, String(time));
  } catch {}
}

function wantsAutoRate(): boolean {
  const state = useStore.getState();
  if (state.exchangeRate.source === "manual") return false;
  return realRecords(state).subscriptions.some(
    (sub) => sub.currency === "USD" && sub.status === "active",
  );
}

/**
 * 고시 환율을 물어 자동 환율이면 바꾼다. `force`는 설정의 '자동으로 맞추기'다 — 마지막으로 물은 시각과 직접 적은
 * 환율과 상관없이 받아 온 고시 환율로 바꾼다. 성공하면 true. 실패하면 쓰던 환율(직접 적은 값이어도)을 그대로 둔다.
 */
export function refreshExchangeRate({ force = false } = {}): Promise<boolean> {
  if (!force && !wantsAutoRate()) return Promise.resolve(false);
  if (!force && Date.now() - readCheckedAt() < CHECK_INTERVAL_MS) return Promise.resolve(false);
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const response = await fetch(apiUrl("/api/fx"));
      if (!response.ok) return false;
      const body = (await response.json()) as { rate?: unknown };
      if (typeof body.rate !== "number" || !isValidExchangeRate(body.rate)) return false;
      writeCheckedAt(Date.now());
      const state = useStore.getState();
      // 묻는 사이에 사용자가 직접 적었으면 그 값을 덮지 않는다('자동으로 맞추기'를 누른 것은 예외).
      if (!force && state.exchangeRate.source === "manual") return false;
      // 같은 값이면 쓰지 않는다 — 기록이 바뀐 것으로 보여 저장·동기화가 돌지 않게.
      if (state.exchangeRate.source !== "ecb" || state.exchangeRate.rate !== body.rate) {
        state.setExchangeRate(body.rate, "ecb");
      }
      return true;
    } catch {
      return false;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}

/** 앱 전체에서 한 번 부른다(상단 바). */
export function useAutoExchangeRate() {
  // USD 구독을 처음 등록했거나 체험을 끝냈을 때처럼 기록이 바뀌면 다시 본다(묻는 간격은 그대로 지킨다).
  const hasUSD = useStore((state) =>
    realRecords(state).subscriptions.some(
      (sub) => sub.currency === "USD" && sub.status === "active",
    ),
  );
  const manual = useStore((state) => state.exchangeRate.source === "manual");

  useEffect(() => {
    if (!hasUSD || manual) return;
    void refreshExchangeRate();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshExchangeRate();
    };
    document.addEventListener("visibilitychange", onVisible);
    // 앱은 돌아올 때 'resume'을 받는다(Capacitor).
    document.addEventListener("resume", onVisible);
    const timer = window.setInterval(() => void refreshExchangeRate(), CHECK_INTERVAL_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      document.removeEventListener("resume", onVisible);
      window.clearInterval(timer);
    };
  }, [hasUSD, manual]);
}
