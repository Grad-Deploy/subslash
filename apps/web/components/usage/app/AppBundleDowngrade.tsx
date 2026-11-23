"use client";

import React, { useMemo } from "react";
import { findBundleDowngrades } from "@subslash/shared";
import { useStore } from "@lib/store";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import { unusedBundleServices } from "@lib/usage/bundle-unused";
import { BundleDowngradeNotice } from "../../report/sections/SummarySections";

/**
 * 리포트의 '하나만 쓰면 따로 내는 게 싸요'(안드로이드 앱). 안 쓰는 서비스는 이 폰의 사용 기록으로만 판단하므로
 * 폰 기록 코드와 함께 앱 번들에만 둔다 — 웹에는 폰 기록이 없어 모른다.
 */
export function AppBundleDowngrade() {
  const { status, history } = usePhoneUsage();
  const subscriptions = useStore((state) => state.subscriptions);
  const rate = useExchangeRate();
  const downgrades = useMemo(() => {
    if (status !== "on") return [];
    const now = new Date();
    return findBundleDowngrades(subscriptions, rate, now, (sub) =>
      unusedBundleServices(sub, history, now),
    );
  }, [status, history, subscriptions, rate]);
  return <BundleDowngradeNotice downgrades={downgrades} />;
}
