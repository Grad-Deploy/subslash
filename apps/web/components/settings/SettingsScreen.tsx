"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight, LogIn, Monitor, Moon, Shield, Sun, User } from "lucide-react";
import { useStore } from "@lib/store";
import { useAuth } from "@hooks/useAuth";
import { cn } from "@lib/utils";
import { useTheme, type ThemePreference } from "../layout/ThemeProvider";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { ExchangeRateNote } from "./ExchangeRateNote";
import { SettingsList } from "./SettingsList";

const THEME_OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: "system", label: "기기 설정", Icon: Monitor },
  { value: "light", label: "라이트", Icon: Sun },
  { value: "dark", label: "다크", Icon: Moon },
];

/**
 * 설정 화면(`/settings`, 웹·앱). 켜고 끄고 연결하는 것을 여기에 모은다 — 예전에는 구독 관리 위쪽(자동 체크인
 * 스위치·환율)과 맨 아래(연동·측정·데이터)에 흩어져 있어 처음 쓰는 사람이 찾지 못했다. 앱에서 먼저 설정 탭으로
 * 모았고, 웹도 같은 화면을 상단 바의 설정 아이콘에서 연다.
 *
 * 상단의 계정 아이콘과 그 메뉴(로그인한 계정 확인, 내 정보, 로그아웃)는 그대로 둔다 — 어느 계정으로 들어와
 * 있는지는 어느 화면에서든 보여야 한다. 여기에는 같은 계정 줄을 맨 위에 둔다. 화면 모드는 여기에만 있다.
 */
export function SettingsScreen({
  storageNote,
  children,
}: {
  /** 로그인하지 않았을 때 기록이 어디 있는지(앱은 '이 폰', 웹은 '이 브라우저'). */
  storageNote: string;
  /** 계정 줄 아래에 끼울 기기 전용 칸(앱의 폰 사용 기록 체크인). */
  children?: React.ReactNode;
}) {
  const { account, loading } = useAuth();
  const { preference, setPreference } = useTheme();
  const subscriptions = useStore((state) => state.subscriptions);
  const demo = useStore((state) => state.demo);
  const clearSubscriptions = useStore((state) => state.clearSubscriptions);
  const accountSync = useStore((state) => state.accountSync);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const active = subscriptions.filter((sub) => sub.status === "active");
  const killed = subscriptions.filter((sub) => sub.status === "killed");
  const syncedWarning =
    accountSync.enabled && accountSync.baseSavedAt
      ? "\n자동 동기화가 켜져 있어 다른 기기의 기록도 지워져요."
      : "";

  return (
    <div className="mx-auto max-w-2xl space-y-5 py-2">
      <h1 className="text-2xl font-black tracking-tight">설정</h1>

      {/* 계정 — 로그인 여부를 아직 모르면 비워 둔다(틀린 상태를 먼저 보여주지 않는다). */}
      {!loading &&
        (account ? (
          <Link href="/me" className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-bold">{account.username}</span>
              <span className="block truncate text-xs text-muted-foreground">{account.email}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        ) : (
          <Link href="/login" className="flex items-center gap-3 rounded-2xl bg-secondary p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background">
              <LogIn className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base font-bold">로그인 / 회원가입</span>
              <span className="block text-xs text-muted-foreground">{storageNote}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        ))}

      {children}

      {/* 알림 · 연동 · 측정 · 데이터 */}
      <SettingsList onMessage={showToast} onClearAll={() => setConfirmClearAll(true)} />

      {/* 화면 */}
      <section className="space-y-2">
        <h2 className="px-1 text-xs font-bold text-muted-foreground">화면</h2>
        <div className="space-y-2.5 rounded-2xl border px-3 py-3">
          <p id="theme-mode-label" className="text-sm font-bold">
            화면 모드
          </p>
          {/* 기본은 기기 설정을 따른다. 한 번 라이트·다크를 골라도 다시 돌아올 수 있게 셋 중에서 고른다. */}
          <div
            role="radiogroup"
            aria-labelledby="theme-mode-label"
            className="grid grid-cols-3 gap-1 rounded-xl bg-secondary p-1"
          >
            {THEME_OPTIONS.map(({ value, label, Icon }) => {
              const selected = preference === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPreference(value)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors",
                    selected
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        {/* 달러 구독이 있을 때만 보인다(ExchangeRateNote가 스스로 가린다). */}
        <ExchangeRateNote />
      </section>

      {/* 정보 */}
      <section className="space-y-2">
        <h2 className="px-1 text-xs font-bold text-muted-foreground">정보</h2>
        <Link href="/privacy" className="flex items-center gap-3 rounded-2xl border px-3 py-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
            <Shield className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1 text-sm font-bold">개인정보처리방침</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      </section>

      {/* 활성 탭이 비어 있어도 해지한 구독이 남아 있을 수 있다. 무엇이 지워지는지 나눠 적는다. */}
      <ConfirmDialog
        isOpen={confirmClearAll}
        onClose={() => setConfirmClearAll(false)}
        onConfirm={() => {
          // 체험 중이면 샘플만 치우고 체험을 끝낸다(store의 clearSubscriptions).
          const wasDemo = Boolean(demo);
          clearSubscriptions();
          showToast(
            wasDemo ? "샘플 체험을 끝냈어요. 내 구독은 그대로예요." : "구독 기록을 모두 지웠어요",
          );
        }}
        centered
        title={demo ? "샘플 체험을 끝낼까요?" : "모두 지울까요?"}
        description={
          demo
            ? `샘플 ${subscriptions.length}건을 치워요.\n내 구독은 그대로예요.`
            : killed.length > 0
              ? `구독 ${subscriptions.length}건(구독 중 ${active.length}, 해지 ${killed.length})과\n절약 기록이 지워져요.${syncedWarning}`
              : `구독 ${subscriptions.length}건이 지워져요.${syncedWarning}`
        }
        confirmText={demo ? "체험 끝내기" : "모두 삭제"}
        variant="destructive"
      />

      {toast && (
        <div className="fixed left-1/2 top-16 z-50 -translate-x-1/2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}
