"use client";

import React, { useState } from "react";
import type { DiscoveredSubscription } from "@subslash/shared";
import { Badge } from "../ui/badge";
import { cn } from "@lib/utils";
import { useT } from "@lib/i18n";
import { DiscoveredRow } from "./DiscoveredRow";

type CategoryFilter = "all" | "ott" | "ai" | "other";

/** 분류 칩이 나누는 기준. OTT·AI가 아닌 것은 모두 '기타'다. */
function inFilter(item: DiscoveredSubscription, filter: CategoryFilter): boolean {
  if (filter === "all") return true;
  if (filter === "ott" || filter === "ai") return item.category === filter;
  return item.category !== "ott" && item.category !== "ai";
}

const FILTER_IDS: readonly CategoryFilter[] = ["all", "ott", "ai", "other"];

/** 찾은 후보 목록. 몇 건인지와 분류 칩으로 걸러 보기, 줄을 눌러 고르기. */
export function DiscoveredResults({
  items,
  note,
  onToggle,
}: {
  items: DiscoveredSubscription[];
  /** 개수 옆에 붙일 설명(예: "Gmail 메일 40통에서"). */
  note: string | null;
  onToggle: (id: string) => void;
}) {
  const r = useT().importing.results;
  const labels: Record<CategoryFilter, string> = {
    all: r.all,
    ott: "OTT",
    ai: "AI",
    other: r.other,
  };
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const shown = items.filter((item) => inFilter(item, filter));

  return (
    <div className="space-y-2.5 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/50">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <span>{r.title}</span>
            <Badge variant="secondary" className="text-xs font-bold">
              {r.count(items.length)}
            </Badge>
            {note && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {note}
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                "text-[11px] px-2.5 py-0.5 rounded-full border transition font-medium",
                filter === id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground border-border",
              )}
            >
              {labels[id]} ({items.filter((item) => inFilter(item, id)).length})
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {shown.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
            {r.none}
          </div>
        ) : (
          shown.map((item) => (
            <DiscoveredRow key={item.id} item={item} onToggle={() => onToggle(item.id)} />
          ))
        )}
      </div>
    </div>
  );
}
