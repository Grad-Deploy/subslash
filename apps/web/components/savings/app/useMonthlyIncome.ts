"use client";

import { localChannel, readLocal, removeLocal, writeLocal } from "@lib/local-storage";
import { useStore } from "@lib/store";
import { useCallback, useSyncExternalStore } from "react";

/**
 * 절약 현황의 '월 수입 대비 구독비'에 쓰는 월 수입(원). 사용자가 직접 넣는 값이고, 비율을
 * 계산하는 데만 쓴다. 이 기기에만 두고 구독 기록(스토어·백업·계정 동기화)에는 넣지 않는다.
 * 넣지 않았으면 null이다 — 비율을 지어내지 않고 입력 안내를 보여준다.
 *
 * 샘플 체험 중에 넣은 수입은 이 탭의 메모리에만 두고 체험이 끝나면 버린다. 체험은 '여기서 바꾼 내용은 저장되지
 * 않는다'고 안내하는데, 예전에는 체험 중에 넣은 수입이 기기에 남아 체험 뒤 실제 구독의 비율 계산에 쓰였다.
 */
const KEY = "subslash-monthly-income";
const channel = localChannel("subslash:monthly-income");

/** 체험 중에 넣은 수입. undefined면 체험 중에 손대지 않은 것이라 기기에 둔 값을 보여 준다. */
let demoIncome: number | null | undefined;

function normalize(value: number | null): number | null {
  return value !== null && Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
}

function read(): number | null {
  if (useStore.getState().demo && demoIncome !== undefined) return demoIncome;
  return normalize(Number(readLocal(KEY)));
}

function subscribe(onChange: () => void): () => void {
  const stopLocal = channel.subscribe(onChange);
  // 체험이 끝나면(새로고침 말고 '체험 끝내기'·30분) 체험 중의 값을 버리고 기기의 값으로 돌아간다.
  const stopDemo = useStore.subscribe((state, previous) => {
    if (state.demo === previous.demo) return;
    if (!state.demo) demoIncome = undefined;
    onChange();
  });
  return () => {
    stopLocal();
    stopDemo();
  };
}

export function useMonthlyIncome() {
  const income = useSyncExternalStore(subscribe, read, () => null);
  const setIncome = useCallback((next: number | null) => {
    const value = normalize(next);
    if (useStore.getState().demo) demoIncome = value;
    else if (value !== null) writeLocal(KEY, String(value));
    else removeLocal(KEY);
    channel.notify();
  }, []);
  return [income, setIncome] as const;
}
