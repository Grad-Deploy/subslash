"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, House, Receipt, Settings } from "lucide-react";
import { cn } from "@lib/utils";
import { IS_APP_BUILD } from "@lib/platform";
import { useT } from "@lib/i18n";

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  const navItems = [
    { name: t.shell.nav.dashboard, href: "/dashboard", Icon: House },
    { name: t.shell.nav.subsTab, href: "/subs", Icon: Receipt },
    { name: t.shell.nav.report, href: "/report", Icon: BarChart3 },
    // 앱은 켜고 끄는 것을 설정 탭 하나에 모은다(웹은 상단 바의 설정 아이콘, 좁은 화면은 계정 메뉴).
    ...(IS_APP_BUILD ? [{ name: t.shell.nav.settings, href: "/settings", Icon: Settings }] : []),
  ];

  return (
    <nav
      aria-label={t.shell.nav.label}
      className="md:hidden fixed bottom-0 w-full border-t bg-background z-40 pb-safe px-safe"
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          // 절약 기록(/savings)은 따로 탭이 없어, 같은 결과를 보는 리포트 탭에 불을 켠다.
          const isActive =
            pathname?.startsWith(item.href) ||
            (item.href === "/report" && pathname?.startsWith("/savings"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <item.Icon
                className={cn("size-5 transition-transform", isActive && "scale-110")}
                aria-hidden
              />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
