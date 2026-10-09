"use client";

import React, { useState } from "react";
import { ChevronRight, Smartphone } from "lucide-react";
import { useStore } from "@lib/store";
import { useT } from "@lib/i18n";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import { AppPhoneCheckInButton } from "../../usage/app/AppPhoneCheckInButton";
import { AppUsageAccessSheet } from "../../usage/app/AppUsageAccessSheet";
import { SettingsScreen } from "../SettingsScreen";

/**
 * 앱의 설정 탭(`/settings`). 웹과 같은 설정 화면(SettingsScreen)에 폰 사용 기록 체크인 칸을 더한다 — 폰 기록
 * 코드는 웹 번들에 들어가지 않게 이 파일에만 둔다.
 */
export function AppSettingsPage() {
  const { status: phoneStatus } = usePhoneUsage();
  const subscriptions = useStore((state) => state.subscriptions);
  const [accessOpen, setAccessOpen] = useState(false);
  const c = useT().settings.appCheckIn;
  const active = subscriptions.filter((sub) => sub.status === "active");

  return (
    <SettingsScreen storedOn="app">
      {/* 체크인 — 폰 기록 자동 체크인(예전 구독 관리 위쪽 카드) */}
      {phoneStatus !== "unsupported" && phoneStatus !== "loading" && (
        <section className="space-y-2">
          <h2 className="px-1 text-xs font-bold text-muted-foreground">{c.title}</h2>
          {phoneStatus === "off" ? (
            <button
              type="button"
              onClick={() => setAccessOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <Smartphone className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{c.connect}</span>
                <span className="block text-xs text-muted-foreground">{c.connectDetail}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          ) : (
            <AppPhoneCheckInButton subscriptions={active} batchButton={false} />
          )}
        </section>
      )}
      <AppUsageAccessSheet open={accessOpen} onClose={() => setAccessOpen(false)} />
    </SettingsScreen>
  );
}
