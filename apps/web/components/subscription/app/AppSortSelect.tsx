"use client";

import React, { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { APP_SUBS_SORT_LABEL, type AppSubsSort } from "@lib/subs-order";
import { cn } from "@lib/utils";

/**
 * 구독 관리 목록의 개수와 순서(앱). 순서를 둥근 칩 줄로 두면 바로 위 카테고리 칩 줄과 모양이 같아 칩이
 * 두 줄로 겹쳐 보였다. 그래서 순서는 오른쪽 글자 버튼 하나로 두고, 누르면 버튼 바로 아래에 작은 카드가
 * 뜬다(아래에서 올라오는 시트는 세 줄 고르기에 너무 크다). 개수도 같은 줄에 두어 칸이 늘지 않는다.
 *
 * 바깥을 누르거나 뒤로가기(Escape)로 닫힌다. 뒤로가기는 `aria-modal`인 창에 Escape를 보내므로 카드에 단다.
 */
export function AppSortSelect({
  count,
  value,
  onChange,
}: {
  count: number;
  value: AppSubsSort;
  onChange: (sort: AppSubsSort) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="flex items-center justify-between px-0.5 text-xs">
      <span className="text-muted-foreground">{count}개</span>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex items-center gap-0.5 py-1 pl-2 text-[13px] font-bold"
        >
          {APP_SUBS_SORT_LABEL[value]}
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="순서"
              className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border bg-popover py-1 shadow-lg animate-in fade-in zoom-in-95"
            >
              {(Object.keys(APP_SUBS_SORT_LABEL) as AppSubsSort[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={value === key}
                  onClick={() => {
                    onChange(key);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2.5 text-left text-[13px] hover:bg-muted/60",
                    value === key ? "font-black" : "font-medium text-muted-foreground",
                  )}
                >
                  {APP_SUBS_SORT_LABEL[key]}
                  {value === key && <Check className="size-4" aria-hidden />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
