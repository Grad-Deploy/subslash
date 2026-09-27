"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, House, Receipt, Settings } from "lucide-react";
import { cn } from "@lib/utils";
import { IS_APP_BUILD } from "@lib/platform";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "대시보드", href: "/dashboard", Icon: House },
    { name: "구독 관리", href: "/subs", Icon: Receipt },
    { name: "리포트", href: "/report", Icon: BarChart3 },
    // 앱은 켜고 끄는 것을 설정 탭 하나에 모은다(웹은 구독 관리 맨 아래와 계정 메뉴).
    ...(IS_APP_BUILD ? [{ name: "설정", href: "/settings", Icon: Settings }] : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 w-full border-t bg-background z-40 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          // 절약 기록(/savings)은 리포트에서 들어가는 화면이라 리포트 탭에 불을 켠다.
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
