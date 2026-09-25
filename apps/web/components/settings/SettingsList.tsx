"use client";

import React, { useState } from "react";
import { Activity, Bell, CalendarDays, ChevronRight, HardDrive, Trash2 } from "lucide-react";
import { useStore } from "@lib/store";
import { isDeviceUsageOpen, isGmailAutoImportOpen } from "@lib/privacy";
import { useAuth } from "@hooks/useAuth";
import { isMeasuringFor, useDeviceUsage } from "@lib/device-usage-client";
import { useLocalReminderSettings } from "@hooks/useLocalReminders";
import { cn } from "@lib/utils";
import { IS_APP_BUILD } from "@lib/platform";
import { LocalReminderCard } from "./LocalReminderCard";
import { DataBackupCard } from "./DataBackupCard";
import { DeviceUsageCard } from "./DeviceUsageCard";
import { GoogleCalendarSync } from "../calendar/GoogleCalendarSync";
import { AppSheet } from "./app/AppSheet";

type SheetKey = "reminder" | "calendar" | "backup" | "usage";

interface SettingsListProps {
  onMessage: (message: string) => void;
  /** 전체 초기화 확인 창을 연다. 확인 창과 삭제는 구독 관리 화면이 그대로 맡는다. */
  onClearAll: () => void;
}

function reminderSummary(enabled: boolean, daysBefore: number) {
  if (!enabled) return "꺼짐";
  return `${daysBefore === 0 ? "당일" : `${daysBefore}일 전`} 오전 9시`;
}

/**
 * 구독 관리 화면 아래에 모은 설정 목록(웹·앱).
 *
 * 예전 웹은 캘린더·백업을 설명이 긴 카드로 늘어놓고, 전체 초기화를 위쪽 버튼 줄에 혼자 빨갛게
 * 두었다. 앱에서 먼저 바꾼 대로 알림 / 연동 / 데이터로 묶어 한 줄 제목과 지금 상태만 보여 주고,
 * 줄을 누르면 기존 카드를 시트에 그대로 연다. 기기 결제 알림은 앱에만 있다(웹의 결제 알림 메일은
 * 상단 종 아이콘에서 켠다).
 */
export function SettingsList({ onMessage, onClearAll }: SettingsListProps) {
  const [sheet, setSheet] = useState<SheetKey | null>(null);
  const [reminder] = useLocalReminderSettings();
  const subscriptionCount = useStore((state) => state.subscriptions.length);
  const demo = useStore((state) => Boolean(state.demo));
  const syncOn = useStore((state) => state.accountSync.enabled);
  const calendarOpen = isGmailAutoImportOpen();
  // 여러 기기 사용 측정은 로그인한 계정에 모으는 기능이라 로그인했을 때만 보인다.
  const { account } = useAuth();
  const usageOpen = isDeviceUsageOpen() && Boolean(account);
  const measuring = useDeviceUsage((state) => isMeasuringFor(state, account?.id ?? null));
  const close = () => setSheet(null);

  return (
    <div className="space-y-4">
      {IS_APP_BUILD && (
        <Group title="알림">
          <Row
            icon={<Bell className="size-4" />}
            title="이 기기 결제 알림"
            detail="결제일 전에 이 휴대폰으로 알려요"
            status={reminderSummary(reminder.enabled, reminder.daysBefore)}
            statusOn={reminder.enabled}
            onClick={() => setSheet("reminder")}
          />
        </Group>
      )}

      {calendarOpen && (
        <Group title="연동">
          <Row
            icon={<CalendarDays className="size-4" />}
            title="구글 캘린더 연동"
            detail="결제일을 반복 일정으로"
            onClick={() => setSheet("calendar")}
          />
        </Group>
      )}

      {usageOpen && (
        <Group title="측정">
          <Row
            icon={<Activity className="size-4" />}
            title="여러 기기 사용 측정"
            detail="기기를 오가며 쓴 구독을 이어서 세요"
            status={IS_APP_BUILD ? (measuring ? "켜짐" : "꺼짐") : undefined}
            statusOn={measuring}
            onClick={() => setSheet("usage")}
          />
        </Group>
      )}

      <Group title="데이터">
        <Row
          icon={<HardDrive className="size-4" />}
          title="백업 · 계정 저장"
          detail={syncOn ? "계정과 자동으로 맞추는 중" : "파일로 저장하거나 로그인해 두기"}
          onClick={() => setSheet("backup")}
        />
        {subscriptionCount > 0 && (
          <Row
            danger
            icon={<Trash2 className="size-4" />}
            title={demo ? "샘플 체험 끝내기" : "전체 초기화"}
            detail={
              demo
                ? `샘플 구독 ${subscriptionCount}건 치우기`
                : `구독 ${subscriptionCount}건과 기록 삭제`
            }
            onClick={onClearAll}
          />
        )}
      </Group>

      {IS_APP_BUILD && (
        <AppSheet open={sheet === "reminder"} onClose={close} label="이 기기 결제 알림">
          <LocalReminderCard onMessage={onMessage} />
        </AppSheet>
      )}
      {calendarOpen && (
        <AppSheet open={sheet === "calendar"} onClose={close} label="구글 캘린더 연동">
          <GoogleCalendarSync />
        </AppSheet>
      )}
      {usageOpen && (
        <AppSheet open={sheet === "usage"} onClose={close} label="여러 기기 사용 측정">
          <DeviceUsageCard onMessage={onMessage} />
        </AppSheet>
      )}
      <AppSheet open={sheet === "backup"} onClose={close} label="백업 · 계정 저장">
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
