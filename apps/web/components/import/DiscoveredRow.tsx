"use client";

import React from "react";
import { formatCurrency, type DiscoveredSubscription } from "@subslash/shared";
import { useT, useServiceNames } from "@lib/i18n";
import { Badge } from "../ui/badge";
import { cn } from "@lib/utils";
import { cycleText } from "./cycleText";
import { describeStatus } from "./describeStatus";

/** 결제 문자·메일에서 찾은 후보 한 줄(웹의 결제 문자로 불러오기). 누르면 고르기·풀기가 바뀐다. */
export function DiscoveredRow({
  item,
  onToggle,
}: {
  item: DiscoveredSubscription;
  onToggle: () => void;
}) {
  const names = useServiceNames();
  const t = useT();
  const r = t.importing.row;
  return (
    <div
      onClick={onToggle}
      className={cn(
        "p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-3",
        item.isCanceled
          ? "border-rose-400/40 bg-rose-500/5 dark:bg-rose-950/15 opacity-70"
          : item.selected
            ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-sm"
            : "border-border bg-card opacity-50",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <input
          type="checkbox"
          checked={item.selected}
          onChange={() => {}}
          className="w-4 h-4 rounded text-primary border-border cursor-pointer shrink-0"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "font-bold text-sm text-foreground truncate",
                item.isCanceled && "line-through opacity-70",
              )}
            >
              {names.sub(item)}
            </span>
            {item.emailProvider === "naver" ? (
              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] py-0 border-0">
                {r.naver}
              </Badge>
            ) : item.emailProvider === "google" ? (
              <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] py-0 border-0">
                Google
              </Badge>
            ) : null}
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 shrink-0">
              {t.value.category[item.category] ?? item.category}
            </Badge>
            {item.isCanceled ? (
              <Badge className="bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] py-0 border-0 font-semibold">
                {r.canceledBadge}
              </Badge>
            ) : item.isWithin30Days ? (
              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] py-0 border-0 font-medium">
                {r.recentBadge}
              </Badge>
            ) : (
              // '만료'라고 쓰지 않는다. 앱이 아는 것은 마지막 결제 메일이
              // 오래됐다는 것뿐이고, 연간 구독은 원래 1년에 한 번 온다.
              <Badge variant="outline" className="text-[10px] py-0 text-muted-foreground">
                {r.staleBadge}
              </Badge>
            )}
          </div>
          {item.statusReason && (
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              {describeStatus(t, item.statusReason)}
            </p>
          )}
          {item.sourceSnippet && (
            <p className="text-[10px] text-muted-foreground truncate max-w-sm font-mono mt-0.5">
              {item.sourceSnippet}
            </p>
          )}
        </div>
      </div>

      <div className="text-right shrink-0">
        <div
          className={cn(
            "font-black text-sm text-foreground",
            item.isCanceled && "line-through opacity-60",
          )}
        >
          {formatCurrency(item.amount, item.currency)}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {item.isCanceled ? r.canceledCycle : cycleText(t, item)}
        </div>
      </div>
    </div>
  );
}
