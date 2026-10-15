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

/**
 * 체험 중에 넣은 수입과 그 체험의 시작 시각. 지금 체험의 것이 아니면(체험 중에 손대지 않았거나 지난 체험의 값) 기기에 둔
 * 값을 보여 준다. 체험이 끝날 때 지우지 않고 시작 시각으로 가린다 — 끝날 때 이 화면이 열려 있지 않으면 지울 리스너가
 * 없어, 같은 탭에서 다시 시작한 체험에 지난 체험의 수입이 보였다.
 */
let demoIncome: { startedAt: string; value: number | null } | null = null;

function normalize(value: number | null): number | null {
  return value !== null && Number.isFinite(value) && value > 0 ? Math.floor(value) : null;
}

/** 지금 보여 줄 월 수입. */
export function readMonthlyIncome(): number | null {
  const demo = useStore.getState().demo;
  if (demo && demoIncome?.startedAt === demo.startedAt) return demoIncome.value;
  return normalize(Number(readLocal(KEY)));
}

function subscribe(onChange: () => void): () => void {
  const stopLocal = channel.subscribe(onChange);
  // 체험이 시작·끝나면(새로고침 말고 '체험 끝내기'·30분) 보여 줄 값이 바뀐다.
  const stopDemo = useStore.subscribe((state, previous) => {
    if (state.demo !== previous.demo) onChange();
  });
  return () => {
    stopLocal();
    stopDemo();
  };
}

/** 월 수입을 남긴다. 체험 중이면 이 탭의 메모리에만 둔다. null이면 지운다. */
export function saveMonthlyIncome(next: number | null): void {
  const value = normalize(next);
  const demo = useStore.getState().demo;
  if (demo) demoIncome = { startedAt: demo.startedAt, value };
  else if (value !== null) writeLocal(KEY, String(value));
  else removeLocal(KEY);
}

export function useMonthlyIncome() {
  const income = useSyncExternalStore(subscribe, readMonthlyIncome, () => null);
  const setIncome = useCallback((next: number | null) => {
    saveMonthlyIncome(next);
    channel.notify();
  }, []);
  return [income, setIncome] as const;
}
