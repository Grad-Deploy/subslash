"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatDday, type ActionItem } from "@subslash/shared";
import { cn } from "@lib/utils";

const FOLDED_KEY = "subslash-dashboard-queue-folded";

function readFolded(): boolean {
  try {
    return window.localStorage.getItem(FOLDED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeFolded(folded: boolean): void {
  try {
    window.localStorage.setItem(FOLDED_KEY, folded ? "1" : "0");
  } catch {
    // 저장하지 못해도 이번 화면에서는 접힌다.
  }
}

/**
 * 앱 대시보드의 '지금 결정할 것'을 접었다 펴는 껍데기. 할 일과 폰 사용 기록 알림이 길어지면 아래의
 * 결제 달력이 한참 밀려서, 접으면 가장 급한 한 줄만 남긴다. 접은 상태는 이 기기에 기억한다.
 *
 * 펼쳤을 때는 `children`에 접기 버튼을 넘겨 ActionQueue 제목 줄에 붙인다 — 제목을 두 번 쓰지 않게.
 */
export function AppDecisionFold({
  items,
  children,
}: {
  items: ActionItem[];
  children: (foldButton: React.ReactNode) => React.ReactNode;
}) {
  const [folded, setFolded] = useState(readFolded);

  const toggle = () => {
    writeFolded(!folded);
    setFolded(!folded);
  };

  const button = (
    <button
      type="button"
      onClick={toggle}
      aria-expanded={!folded}
      className="flex shrink-0 items-center gap-1 self-center rounded-full border px-2.5 py-1 text-xs font-bold text-muted-foreground hover:text-foreground"
    >
      <ChevronDown
        className={cn("size-3.5 transition-transform", folded && "-rotate-90")}
        aria-hidden
      />
      {folded ? "펼치기" : "접기"}
    </button>
  );

  if (!folded) return <>{children(button)}</>;

  const first = items[0];
  const urgent = first.daysUntilBilling !== null && first.daysUntilBilling <= 7;
  return (
    <section className="space-y-1">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold tracking-tight">지금 결정할 것 ({items.length})</h2>
        {button}
      </div>
      <p className="text-xs text-muted-foreground">
        가장 급한 것: <span className="font-bold text-foreground">{first.name}</span>
        {urgent && (
          <span className="ml-1 font-black text-destructive">
            {formatDday(first.daysUntilBilling as number)}
          </span>
        )}
        {items.length > 1 && ` 외 ${items.length - 1}건`}
      </p>
    </section>
  );
}
