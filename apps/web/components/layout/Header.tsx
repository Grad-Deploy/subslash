"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountMenu } from "./AccountMenu";
import { useStatsContribution } from "@hooks/useStatsContribution";
import { useAccountSync } from "@hooks/useAccountSync";
import { useDeviceUsageUpload } from "@hooks/useDeviceUsageUpload";
import { AccountSyncConflictDialog } from "../account/AccountSyncConflictDialog";
import { cn } from "@lib/utils";
import { BrandLockup } from "../brand/Brand";
import { IS_APP_BUILD } from "@lib/platform";

// 폰 사용 기록으로 자동 체크인(안드로이드 앱 전용). 폰 기록 코드가 웹 번들에 들어가지 않게 떼어 부른다.
const AppAutoCheckIn = IS_APP_BUILD
  ? dynamic(() => import("../usage/app/AppAutoCheckIn").then((m) => m.AppAutoCheckIn), {
      ssr: false,
    })
  : null;

// 결제 달력 아이콘(앱 전용). 대시보드 가운데 있던 달력을 상단으로 옮겼다.
const AppCalendarButton = IS_APP_BUILD
  ? dynamic(() => import("../dashboard/app/AppBillingCalendar").then((m) => m.AppCalendarButton), {
      ssr: false,
    })
  : null;

const navLinks = [
  { name: "대시보드", href: "/dashboard" },
  { name: "내 구독", href: "/subs" },
  { name: "리포트", href: "/report" },
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

  // 익명 통계에 참여한 기기면 구독이 바뀔 때 요약을 다시 보낸다.
  useStatsContribution();
  // 이 기기에서 여러 기기 사용 측정을 켰으면 앱을 열 때·돌아올 때 잰 것을 계정에 올린다.
  useDeviceUsageUpload();
  // 로그인한 기기끼리 구독 기록을 자동으로 맞춘다. 양쪽이 따로 바뀌었으면 어느 쪽을 쓸지 묻는다.
  const accountSync = useAccountSync();

  return (
    <>
      {AppAutoCheckIn && <AppAutoCheckIn />}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 pt-safe backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex h-full items-center gap-8">
            {/*
              앱에서는 로고가 링크가 아니다. 앱의 첫 화면은 대시보드이고(app/page.tsx), 홈(소개 화면)으로
              가면 이미 쓰고 있는 사람에게 처음 보는 사람용 화면이 나와 등록한 구독이 사라진 것처럼 보였다.
            */}
            {IS_APP_BUILD ? (
              <div className="flex items-center">
                <BrandLockup />
              </div>
            ) : (
              <Link href="/" className="flex items-center transition-opacity hover:opacity-80">
                <BrandLockup />
              </Link>
            )}

            {/* 좁은 화면에서는 하단 탭(BottomNav)이 같은 역할을 한다. */}
            <nav className="hidden h-full items-center gap-6 md:flex" aria-label="주요 메뉴">
              {navLinks.map((link) => {
                // 절약 기록(/savings)은 따로 탭이 없어, 같은 결과를 보는 리포트 탭에 불을 켠다.
                const isActive =
                  pathname?.startsWith(link.href) ||
                  (link.href === "/report" && pathname?.startsWith("/savings"));
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
            {AppCalendarButton && <AppCalendarButton />}
            <AccountMenu />
          </div>
        </div>
      </header>

      <AccountSyncConflictDialog
        conflict={accountSync.conflict}
        onChoose={(choice) => void accountSync.resolve(choice)}
      />
    </>
  );
}
