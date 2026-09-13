"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { AccountHubModal } from "../account/AccountHubModal";
import { NotifySettingsModal } from "../notify/NotifySettingsModal";
import { AccountMenu } from "./AccountMenu";
import { useStore } from "@lib/store";
import { useMirrorSync } from "@hooks/useMirrorSync";
import { useAuth } from "@hooks/useAuth";
import { cn } from "@lib/utils";

const navLinks = [
  { name: "대시보드", href: "/dashboard" },
  { name: "내 구독", href: "/subs" },
  { name: "절약 현황", href: "/savings" },
] as const;

/**
 * 상단 바는 탐색과 계정만 맡는다. 자동 불러오기처럼 무언가를 만드는 버튼은
 * 그 일을 하는 화면(대시보드·내 구독) 본문에 있다.
 *
 * 역할마다 모양을 다르게 한다 — 탭은 글자와 밑줄, 설정은 아이콘, 계정은
 * 아바타 하나. 모두 같은 알약 버튼이면 무엇이 자주 쓰는 메뉴인지 구분되지 않는다.
 */
export function Header() {
  const pathname = usePathname();
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  // Only the flags the dot needs, so sync timestamps do not re-render the root layout.
  const remindersOn = useStore((state) => state.notify.verified);
  const remindersPending = useStore((state) => !state.notify.verified && !!state.notify.email);

  // The header is mounted on every route, so the mirror stays in step wherever
  // the user edits their subscriptions.
  useMirrorSync();

  // 점은 '새 알림'이 아니라 알림 설정 상태다 — 읽지 않은 알림이라는 개념은 없다.
  const notifyLabel = remindersOn ? "켜짐" : remindersPending ? "확인 대기" : "꺼짐";

  // 결제 알림은 로그인한 사람에게만 보인다. 다만 로그인 없이 이미 켰거나 확인 메일을
  // 기다리는 브라우저에서는 계속 보인다 — 숨기면 끄거나 바꿀 곳이 사라진다.
  // 화면 규칙일 뿐이라 서버의 알림은 여전히 로그인과 무관하다(CLAUDE.md '데이터 위치').
  const { account } = useAuth();
  const showNotify = !!account || remindersOn || remindersPending;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex h-full items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-bold tracking-tight transition-opacity hover:opacity-80"
            >
              <span className="text-2xl">✂️</span>
              <span>SubSlash</span>
            </Link>

            {/* 좁은 화면에서는 하단 탭(BottomNav)이 같은 역할을 한다. */}
            <nav className="hidden h-full items-center gap-6 md:flex" aria-label="주요 메뉴">
              {navLinks.map((link) => {
                const isActive = pathname?.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "relative flex h-full items-center text-sm transition-colors",
                      "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors",
                      isActive
                        ? "font-semibold text-foreground after:bg-foreground"
                        : "font-medium text-muted-foreground after:bg-transparent hover:text-foreground",
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* 좁은 화면에서는 이 아이콘이 계정 메뉴 안으로 접힌다. */}
            {showNotify && (
              <div className="hidden items-center sm:flex">
                <button
                  type="button"
                  onClick={() => setIsNotifyOpen(true)}
                  aria-label={`결제 알림 (${notifyLabel})`}
                  className="group relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Bell className="h-5 w-5" aria-hidden="true" />
                  {(remindersOn || remindersPending) && (
                    <span
                      className={cn(
                        "absolute right-2 top-2 h-2 w-2 rounded-full ring-2 ring-background",
                        remindersOn ? "bg-emerald-500" : "bg-amber-500",
                      )}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                    aria-hidden="true"
                  >
                    결제 알림 · {notifyLabel}
                  </span>
                </button>
              </div>
            )}

            {showNotify && (
              <div className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
            )}

            <AccountMenu
              onOpenLinkedAccounts={() => setIsAccountsOpen(true)}
              onOpenNotify={() => setIsNotifyOpen(true)}
              notifyLabel={notifyLabel}
              showNotify={showNotify}
            />
          </div>
        </div>
      </header>

      <NotifySettingsModal isOpen={isNotifyOpen} onClose={() => setIsNotifyOpen(false)} />
      <AccountHubModal isOpen={isAccountsOpen} onClose={() => setIsAccountsOpen(false)} />
    </>
  );
}
