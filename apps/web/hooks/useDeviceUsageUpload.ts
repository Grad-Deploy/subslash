"use client";

import { useEffect } from "react";
import { useAuth } from "@hooks/useAuth";
import { IS_APP_BUILD } from "@lib/platform";
import { isDeviceUsageOpen } from "@lib/privacy";
import { refreshDeviceUsageView, uploadThisDevice } from "@lib/device-usage-client";

/** 올리는 최소 간격. 서버는 계정당 한 시간 60번까지 받는다(api/usage). */
const MIN_UPLOAD_GAP_MS = 15 * 60 * 1000;

/**
 * 이 기기에서 측정을 켰으면, 앱을 열 때와 앱으로 돌아올 때 잰 것을 계정에 올린다. 헤더에 붙어 모든
 * 화면에서 돈다. 측정을 켠 계정으로 로그인해 있을 때만 올린다(uploadThisDevice가 확인한다).
 *
 * 운영체제는 사용 이벤트를 며칠만 남기므로 앱을 오래 열지 않으면 그 사이는 잴 수 없다. 그 기간을
 * '안 썼다'로 올리지 않는 것은 collectUpload가 맡는다.
 */
export function useDeviceUsageUpload() {
  const { account } = useAuth();
  const accountId = account?.id ?? null;

  useEffect(() => {
    if (!IS_APP_BUILD || !accountId || !isDeviceUsageOpen()) return;

    let running = false;
    let lastTriedAt = 0;
    const run = async () => {
      if (running || document.visibilityState !== "visible") return;
      if (Date.now() - lastTriedAt < MIN_UPLOAD_GAP_MS) return;
      running = true;
      lastTriedAt = Date.now();
      try {
        if (await uploadThisDevice(accountId)) {
          await refreshDeviceUsageView(accountId, { force: true });
        }
      } catch (error) {
        // 급하지 않다. 다음에 앱으로 돌아올 때 지난번 끝에서 이어 잰다.
        console.warn("[device-usage] 사용 기록을 올리지 못했습니다", error);
      } finally {
        running = false;
      }
    };

    void run();
    const onVisible = () => void run();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [accountId]);
}
