"use client";

import React, { useState } from "react";
import { useDropdownMenu } from "@hooks/useDropdownMenu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, CircleHelp, LogIn, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@hooks/useAuth";
import { cn } from "@lib/utils";
import { IS_APP_BUILD } from "@lib/platform";

const itemClass =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none";

/**
 * 로그인·내 정보·로그아웃처럼 계정에 관한 항목과 도움말을 모은 메뉴. 상단 바에는 아바타 하나만 두고,
 * 나머지는 열었을 때만 보인다. 화면 모드(라이트/다크)는 상단 바의 화면 모드 버튼(ThemeMenu) 한 곳에만 둔다 —
 * 두 곳에 있으면 어느 쪽이 원래 자리인지 어색했다.
 */
export function AccountMenu() {
  const { open, setOpen, rootRef, triggerRef, menuRef } = useDropdownMenu({
    items: '[role="menuitem"]',
  });
  const pathname = usePathname();
  const { account, loading, logout } = useAuth();

  // 다른 화면으로 가면 닫는다. effect로 닫으면 렌더링이 한 번 더 일어나 렌더링 중에 맞춘다.
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

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
              로그인하면 여러 기기에서 같은 기록을 쓸 수 있어요.
            </p>
          )}

          {/*
            좁은 화면의 웹은 상단 바의 설정 아이콘이 여기로 접힌다. 앱은 하단 설정 탭이 있어 두지 않는다.
          */}
          {!IS_APP_BUILD && (
            <Link
              href="/settings"
              role="menuitem"
              className={cn(itemClass, "sm:hidden")}
              onClick={() => setOpen(false)}
            >
              <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              설정
            </Link>
          )}

          {/*
            도움말(웹·앱). 설정 맨 아래와 웹 하단에만 있을 때는 찾아보지 않으면 지나쳤다. 막혔을 때 가장 먼저
            열어 보는 메뉴라 여기에도 둔다.
          */}
          <Link href="/help" role="menuitem" className={itemClass} onClick={() => setOpen(false)}>
            <CircleHelp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            도움말 · 문의
          </Link>

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
