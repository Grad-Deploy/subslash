"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { AccountHubModal } from "../account/AccountHubModal";
import { AutoImportModal } from "../import/AutoImportModal";
import { NotifySettingsModal } from "../notify/NotifySettingsModal";
import { useStore } from "@lib/store";
import { useMirrorSync } from "@hooks/useMirrorSync";
import { cn } from "@lib/utils";

export function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isAutoImportOpen, setIsAutoImportOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  // Only the badge flag, so sync timestamps do not re-render the root layout.
  const remindersOn = useStore((state) => state.notify.verified);

  // The header is mounted on every route, so the mirror stays in step wherever
  // the user edits their subscriptions.
  useMirrorSync();

  const navLinks = [
    { name: "대시보드", href: "/dashboard" },
    { name: "내 구독", href: "/subs" },
    { name: "절약 현황", href: "/savings" },
  ] as const;

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-4xl mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
            >
              <span className="text-2xl">✂️</span>
              <span>SubSlash</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-secondary text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAutoImportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-all shadow-sm active:scale-95"
              title="결제 문자·영수증을 붙여넣어 구독 자동 등록"
            >
              <span>⚡</span>
              <span className="hidden sm:inline">자동 불러오기</span>
            </button>

            <button
              onClick={() => setIsNotifyOpen(true)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm active:scale-95",
                remindersOn
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-card hover:bg-muted",
              )}
              title="결제 임박 이메일 알림 설정"
            >
              <span>{remindersOn ? "🔔" : "🔕"}</span>
              <span className="hidden sm:inline">결제 알림</span>
            </button>

            <button
              onClick={() => setIsAccountsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-card hover:bg-muted text-xs font-semibold transition-all shadow-sm active:scale-95"
              title="사용하는 구독 계정 관리 허브"
            >
              <span>👤</span>
              <span className="hidden sm:inline">연동 계정</span>
            </button>

            <div className="hidden sm:inline-block text-xs font-medium text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
              구독, 끊을 용기
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border hover:bg-muted transition-colors text-base"
              title={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </header>

      <NotifySettingsModal isOpen={isNotifyOpen} onClose={() => setIsNotifyOpen(false)} />
      <AccountHubModal isOpen={isAccountsOpen} onClose={() => setIsAccountsOpen(false)} />
      <AutoImportModal isOpen={isAutoImportOpen} onClose={() => setIsAutoImportOpen(false)} />
    </>
  );
}
