"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@lib/utils";
import { useTheme, type ThemePreference } from "./ThemeProvider";

const OPTIONS: { value: ThemePreference; label: string; detail?: string; Icon: typeof Sun }[] = [
  { value: "system", label: "자동", detail: "기기 설정 따라", Icon: Monitor },
  { value: "light", label: "라이트", Icon: Sun },
  { value: "dark", label: "다크", Icon: Moon },
];

/**
 * 상단 바의 화면 모드 버튼(웹·앱). 아이콘은 지금 고른 것(자동은 모니터, 라이트는 해, 다크는 달)이고, 누르면
 * 자동·라이트·다크 중에서 고른다.
 *
 * 화면 모드는 여기 한 곳에만 둔다 — 계정 메뉴와 설정 화면에 함께 있을 때 어느 쪽이 원래 자리인지 어색했다.
 * 해·달을 오가는 버튼 하나로 두지 않는 것은 '자동'으로 돌아갈 길이 있어야 해서다. 예전 버튼은 한 번 누르면
 * 기기 설정으로 돌아갈 수 없었다.
 */
export function ThemeMenu() {
  const { preference, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = OPTIONS.find((option) => option.value === preference) ?? OPTIONS[0];

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
        menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [],
      );
      if (items.length === 0) return;
      e.preventDefault();
      const index = items.indexOf(document.activeElement as HTMLElement);
      const step = e.key === "ArrowDown" ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    menuRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`화면 모드 (${current.label})`}
        className="group relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <current.Icon className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="화면 모드"
          className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border bg-card p-1.5 text-card-foreground shadow-lg"
        >
          {/* 바뀐 모습을 바로 보도록 고른 뒤에도 메뉴를 열어 둔다. */}
          {OPTIONS.map(({ value, label, detail, Icon }) => {
            const selected = preference === value;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => setPreference(value)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                  selected ? "font-semibold text-foreground" : "text-foreground",
                )}
              >
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="flex-1">
                  {label}
                  {detail && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      {detail}
                    </span>
                  )}
                </span>
                {selected && <Check className="h-4 w-4" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
