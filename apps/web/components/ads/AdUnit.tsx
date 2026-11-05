"use client";

import React, { useEffect, useRef } from "react";
import { AD_SLOTS, ADS_ENABLED, ADSENSE_CLIENT } from "@lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Google AdSense 광고 단위 하나. 자동 광고를 쓰지 않고, 사용자 기록이 없는 공개 화면(도움말 등)에만
 * 직접 놓는다 — 대시보드·내 구독처럼 금액이 보이는 화면에는 두지 않는다.
 *
 * 광고를 싣지 않는 곳(앱·검색 비노출 배포·시작일 전)이나 슬롯 ID를 아직 모르면 아무것도 그리지 않는다.
 */
export function AdUnit({ slot }: { slot: keyof typeof AD_SLOTS }) {
  const slotId = AD_SLOTS[slot];
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADS_ENABLED || !slotId || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // 광고 스크립트가 막혔다(광고 차단기 등). 광고가 없을 뿐 화면은 그대로다.
    }
  }, [slotId]);

  if (!ADS_ENABLED || !slotId) return null;
  return (
    <aside aria-label="광고" className="overflow-hidden">
      <ins
        className="adsbygoogle block"
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
