import { afterEach, describe, expect, it, vi } from "vitest";
import { useStore } from "../../lib/store";
import {
  readMonthlyIncome,
  saveMonthlyIncome,
} from "../../components/savings/app/useMonthlyIncome";

describe("월 수입 대비 구독비의 월 수입", () => {
  afterEach(() => {
    if (useStore.getState().demo) useStore.getState().endDemo();
    vi.useRealTimers();
  });

  it("샘플 체험 중에 넣은 수입은 그 체험에서만 보이고 다음 체험에 남지 않는다", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-15T09:00:00"));
    useStore.getState().startDemo();
    saveMonthlyIncome(3_000_000);
    expect(readMonthlyIncome()).toBe(3_000_000);

    // 수입 화면이 닫힌 채로 체험을 끝내고 다시 시작해도 지난 체험의 값을 보이지 않는다.
    useStore.getState().endDemo();
    expect(readMonthlyIncome()).toBeNull();
    vi.setSystemTime(new Date("2026-10-15T09:05:00"));
    useStore.getState().startDemo();
    expect(readMonthlyIncome()).toBeNull();
  });
});
