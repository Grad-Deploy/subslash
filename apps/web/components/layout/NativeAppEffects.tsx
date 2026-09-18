"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { IS_APP_BUILD } from "@lib/platform";
import { restoreRecords } from "@lib/mirrored-storage";
import { onReminderTapped } from "@lib/native-reminders";
import { subscriptionDetailHref } from "@lib/routes";
import { useStore } from "@lib/store";
import { useLocalReminderSync } from "@hooks/useLocalReminders";

/**
 * 앱(Capacitor)에서만 하는 작업. 웹에서는 아무것도 하지 않는다.
 *
 * - 운영체제가 웹뷰 저장소를 비웠으면 기기 저장소의 사본으로 기록을 되살리고 스토어가 다시 읽게
 *   한다(lib/mirrored-storage).
 * - 로컬 결제 알림을 켜 두었으면 구독이 바뀔 때마다 다시 걸고, 알림을 누르면 그 구독을 연다.
 */
export function NativeAppEffects() {
  const router = useRouter();

  useEffect(() => {
    if (!IS_APP_BUILD) return;
    void restoreRecords(useStore.persist.getOptions().name ?? "").then((restored) => {
      if (restored) return useStore.persist.rehydrate();
    });
  }, []);

  useLocalReminderSync();

  useEffect(
    () => onReminderTapped((subscriptionId) => router.push(subscriptionDetailHref(subscriptionId))),
    [router],
  );

  return null;
}
