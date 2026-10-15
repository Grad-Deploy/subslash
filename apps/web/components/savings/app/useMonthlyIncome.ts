"use client";

import { readLocal, removeLocal, writeLocal } from "@lib/local-storage";
import { useCallback, useSyncExternalStore } from "react";

/**
 * 절약 현황의 '월 수입 대비 구독비'에 쓰는 월 수입(원). 사용자가 직접 넣는 값이고, 비율을
 * 계산하는 데만 쓴다. 이 기기에만 두고 구독 기록(스토어·백업·계정 동기화)에는 넣지 않는다.
 * 넣지 않았으면 null이다 — 비율을 지어내지 않고 입력 안내를 보여준다.
 */
const KEY = "subslash-monthly-income";
const EVENT = "subslash:monthly-income";

function read(): number | null {
  const value = Number(readLocal(KEY));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useMonthlyIncome() {
  const income = useSyncExternalStore(subscribe, read, () => null);
  const setIncome = useCallback((next: number | null) => {
    if (next && next > 0) writeLocal(KEY, String(Math.floor(next)));
    else removeLocal(KEY);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return [income, setIncome] as const;
}
