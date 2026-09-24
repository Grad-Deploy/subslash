"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AtSign, Bell, ChevronDown, LogIn, LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@hooks/useAuth";
import { cn } from "@lib/utils";

interface AccountMenuProps {
  onOpenLinkedAccounts: () => void;
  onOpenNotify: () => void;
  /** 좁은 화면에서는 상단 바의 알림 아이콘이 이 메뉴 안으로 접힌다. */
  notifyLabel: string;
  /** 결제 알림 항목을 보일지. 상단 바의 종 아이콘과 같은 조건이다(Header). */
  showNotify: boolean;
}

const itemClass =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none";

/**
 * 로그인·연동 계정·테마처럼 가끔 쓰는 항목을 한 곳에 모은 메뉴.
 * 상단 바에는 아바타 하나만 두고, 나머지는 열었을 때만 보인다.
 */
export function AccountMenu({
  onOpenLinkedAccounts,
  onOpenNotify,
  notifyLabel,
  showNotify,
}: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { account, loading, logout } = useAuth();

  // 다른 화면으로 가면 닫는다. effect로 닫으면 렌더링이 한 번 더 일어나 렌더링 중에 맞춘다.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const items = Array.from(
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
      ).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      e.preventDefault();
      const current = items.indexOf(document.activeElement as HTMLElement);
      const step = e.key === "ArrowDown" ? 1 : -1;
      items[(current + step + items.length) % items.length]?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const run = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={account ? `계정 메뉴 (${account.username})` : "계정 메뉴"}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/*
          로그인 여부를 서버에 묻는 동안에도 같은 자리에 같은 모양을 그려,
          '로그인'이 잠깐 보였다가 아이디로 바뀌는 깜빡임을 막는다.
        */}
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
            account ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
          )}
          aria-hidden="true"
        >
          {account ? account.username.slice(0, 1).toUpperCase() : <User className="h-4 w-4" />}
        </span>
        {account && (
          <span className="hidden max-w-[8rem] truncate text-sm font-medium sm:inline">
            {account.username}
          </span>
        )}
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="계정 메뉴"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border bg-card p-1.5 text-card-foreground shadow-lg"
        >
          {/* 로그인 여부를 아직 모르면 머리글을 비워 둔다 — 틀린 상태를 먼저 보여주지 않는다. */}
          {(account || !loading) && (
            <>
              <div className="px-2.5 pb-2 pt-1.5">
                <p className="truncate text-sm font-semibold">
                  {account ? account.username : "로그인하지 않음"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {account ? account.email : "기록은 이 브라우저에 저장돼요."}
                </p>
              </div>
              <div className="my-1 h-px bg-border" role="separator" />
            </>
          )}

          {account ? (
            // 나이·성별을 가입에서 뺐으므로, 적고 싶은 사람이 찾아갈 곳이 필요하다.
            <Link href="/me" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
              <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />내 정보
            </Link>
          ) : (
            !loading && (
              <Link
                href="/login"
                role="menuitem"
                className={itemClass}
                onClick={() => setOpen(false)}
              >
                <LogIn className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                로그인 / 회원가입
              </Link>
            )
          )}
          {/* 로그인하지 않아도 백업 파일은 쓸 수 있다. 내 정보의 '데이터 백업'으로 보낸다. */}
          {!account && !loading && (
            <Link href="/me" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
              <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              데이터 백업
            </Link>
          )}
          {!account && !loading && (
            <p className="px-2.5 pb-1.5 text-[11px] leading-relaxed text-muted-foreground">
              로그인하면 결제 알림과 연동 계정을 쓸 수 있어요.
            </p>
          )}

          {/* 연동 계정은 로그인한 사람에게만 보인다. 기록 자체는 여전히 이 브라우저에 있다. */}
          {account && (
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={run(onOpenLinkedAccounts)}
            >
              <AtSign className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              연동 계정 관리
            </button>
          )}

          {showNotify && (
            <button
              type="button"
              role="menuitem"
              className={cn(itemClass, "sm:hidden")}
              onClick={run(onOpenNotify)}
            >
              <Bell className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="flex-1">결제 알림</span>
              <span className="text-xs text-muted-foreground">{notifyLabel}</span>
            </button>
          )}

          {/* 테마는 바뀐 모습을 바로 보도록 메뉴를 닫지 않는다. */}
          <button type="button" role="menuitem" className={itemClass} onClick={toggleTheme}>
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
            {theme === "dark" ? "라이트 모드" : "다크 모드"}
          </button>

          {account && (
            <>
              <div className="my-1 h-px bg-border" role="separator" />
              <button type="button" role="menuitem" className={itemClass} onClick={run(logout)}>
                <LogOut className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                로그아웃
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
