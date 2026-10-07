"use client";

import React, { useState } from "react";
import { Activity, Bell, ChevronRight, HardDrive, Trash2 } from "lucide-react";
import { useStore } from "@lib/store";
import { isDeviceUsageOpen } from "@lib/privacy";
import { useAuth } from "@hooks/useAuth";
import { isMeasuringFor, useDeviceUsage } from "@lib/device-usage-client";
import { useLocalReminderSettings } from "@hooks/useLocalReminders";
import { cn } from "@lib/utils";
import { IS_APP_BUILD } from "@lib/platform";
import { LocalReminderCard } from "./LocalReminderCard";
import { DataBackupCard } from "./DataBackupCard";
import { DeviceUsageCard } from "./DeviceUsageCard";
import { AppSheet } from "./app/AppSheet";
import { useT } from "@lib/i18n";

type SheetKey = "reminder" | "backup" | "usage";

interface SettingsListProps {
  onMessage: (message: string) => void;
  /** 전체 초기화 확인 창을 연다. 확인 창과 삭제는 설정 화면(SettingsScreen)이 맡는다. */
  onClearAll: () => void;
}

/**
 * 설정 화면(SettingsScreen, 웹·앱)의 알림 / 측정 / 데이터 목록.
 *
 * 예전 웹은 캘린더·백업을 설명이 긴 카드로 늘어놓고, 전체 초기화를 위쪽 버튼 줄에 혼자 빨갛게
 * 두었다. 한 줄 제목과 지금 상태만 보여 주고, 줄을 누르면 기존 카드를 시트에 그대로 연다. 기기 결제
 * 알림은 앱에만 있다. 구글 캘린더 등록은 여기 두지 않고 '내 구독' 목록 아래에 둔다 — 구독을 확인한 그
 * 자리에서 누르는 것이고, 설정 안에 있으면 그런 기능이 있는지 찾기 어려웠다.
 */
export function SettingsList({ onMessage, onClearAll }: SettingsListProps) {
  const [sheet, setSheet] = useState<SheetKey | null>(null);
  const t = useT().settings.list;
  const [reminder] = useLocalReminderSettings();
  const subscriptionCount = useStore((state) => state.subscriptions.length);
  const demo = useStore((state) => Boolean(state.demo));
  const { account } = useAuth();
  // 동기화 설정의 기본값은 켜짐이라, 로그인하지 않았거나 멈춘 기기에 '맞추는 중'이라고 쓰면 사실이 아니다.
  const syncOn = useStore(
    (state) =>
      Boolean(account) &&
      state.accountSync.enabled &&
      state.accountSync.stoppedReason === null &&
      state.accountSync.accountId === account?.id,
  );
  // 여러 기기 사용 측정은 로그인한 계정에 모으는 기능이라 로그인했을 때만 보인다.
  const usageOpen = isDeviceUsageOpen() && Boolean(account);
  const measuring = useDeviceUsage((state) => isMeasuringFor(state, account?.id ?? null));
  const close = () => setSheet(null);

  return (
    <div className="space-y-4">
      {IS_APP_BUILD && (
        <Group title={t.reminders}>
          <Row
            icon={<Bell className="size-4" />}
            title={t.reminderTitle}
            detail={t.reminderDetail}
            status={reminder.enabled ? t.reminderAt(reminder.daysBefore) : t.off}
            statusOn={reminder.enabled}
            onClick={() => setSheet("reminder")}
          />
        </Group>
      )}

      {usageOpen && (
        <Group title={t.measurement}>
          <Row
            icon={<Activity className="size-4" />}
            title={t.usageTitle}
            detail={t.usageDetail}
            status={IS_APP_BUILD ? (measuring ? t.on : t.off) : undefined}
            statusOn={measuring}
            onClick={() => setSheet("usage")}
          />
        </Group>
      )}

      <Group title={t.data}>
        <Row
          icon={<HardDrive className="size-4" />}
          title={t.backupTitle}
          detail={syncOn ? t.backupSyncing : t.backupDetail}
          onClick={() => setSheet("backup")}
        />
        {subscriptionCount > 0 && (
          <Row
            danger
            icon={<Trash2 className="size-4" />}
            title={demo ? t.endDemo : t.clearAll}
            detail={demo ? t.endDemoDetail(subscriptionCount) : t.clearAllDetail(subscriptionCount)}
            onClick={onClearAll}
          />
        )}
      </Group>

      {IS_APP_BUILD && (
        <AppSheet open={sheet === "reminder"} onClose={close} label={t.reminderTitle}>
          <LocalReminderCard onMessage={onMessage} />
        </AppSheet>
      )}
      {usageOpen && (
        <AppSheet open={sheet === "usage"} onClose={close} label={t.usageTitle}>
          <DeviceUsageCard onMessage={onMessage} />
        </AppSheet>
      )}
      <AppSheet open={sheet === "backup"} onClose={close} label={t.backupTitle}>
        <DataBackupCard onMessage={onMessage} />
      </AppSheet>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5">
      <h2 className="px-1 text-xs font-bold text-muted-foreground">{title}</h2>
      <div className="divide-y overflow-hidden rounded-2xl border bg-card">{children}</div>
    </section>
  );
}

function Row({
  icon,
  title,
  detail,
  status,
  statusOn,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
  status?: string;
  statusOn?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-muted/60 active:bg-secondary"
    >
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-lg",
          danger ? "bg-destructive/10 text-destructive" : "bg-secondary text-foreground",
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm font-bold", danger && "text-destructive")}>{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{detail}</span>
      </span>
      {status && (
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
            statusOn
              ? "bg-green-500/15 text-green-700 dark:text-green-400"
              : "bg-secondary text-muted-foreground",
          )}
        >
          {status}
        </span>
      )}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  );
}
