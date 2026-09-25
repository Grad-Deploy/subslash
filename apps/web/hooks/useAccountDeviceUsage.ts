"use client";

import { useEffect } from "react";
import { useAuth } from "@hooks/useAuth";
import { isDeviceUsageOpen } from "@lib/privacy";
import { refreshDeviceUsageView, useDeviceUsageView } from "@lib/device-usage-client";
import type { DeviceUsageView } from "@lib/device-usage-server";

export interface AccountDeviceUsage {
  /** 기능이 열려 있고 로그인했는지. false면 화면은 이 기능을 말하지 않는다. */
  available: boolean;
  view: DeviceUsageView | null;
  loading: boolean;
  error: string | null;
}

/**
 * 로그인한 계정의 기기 간 사용(최근 30일). 여러 화면이 같은 결과를 쓰고, 받은 지 오래됐을 때만 다시
 * 받는다. 지금 계정의 결과가 아니면 돌려주지 않는다.
 */
export function useAccountDeviceUsage(): AccountDeviceUsage {
  const { account } = useAuth();
  const accountId = account?.id ?? null;
  const available = Boolean(accountId) && isDeviceUsageOpen();
  const state = useDeviceUsageView();

  useEffect(() => {
    if (!available || !accountId) return;
    void refreshDeviceUsageView(accountId);
  }, [available, accountId]);

  const mine = available && state.accountId === accountId;
  return {
    available,
    view: mine ? state.view : null,
    loading: mine ? state.loading : false,
    error: mine ? state.error : null,
  };
}
