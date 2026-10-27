"use client";

import React, { useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useIsClient } from "@hooks/useIsClient";
import { useOverlayLock } from "@hooks/useOverlayLock";
import { useT } from "@lib/i18n";
import { cn } from "@lib/utils";

type AppSheetName =
  /** 화면 읽기 프로그램이 읽을 시트 이름. 안의 카드가 제목을 따로 보여주므로 눈에는 보이지 않는다. */
  | { label: string; labelledBy?: never; title?: never }
  /** 안에 그린 내용의 제목 id(가성비 계산서처럼 종이에 제목이 있을 때). */
  | { labelledBy: string; label?: never; title?: never }
  /** 시트 머리에 보이는 제목. 이것으로 이름 붙인다. */
  | { title: React.ReactNode; label?: never; labelledBy?: never };

type AppSheetProps = AppSheetName & {
  open: boolean;
  onClose: () => void;
  /** 제목 아래 한 줄 설명. `title`과 함께 쓴다. */
  description?: React.ReactNode;
  /** 스크롤 밖 맨 아래에 고정하는 버튼 줄. 내용이 길어도 늘 보인다. */
  footer?: React.ReactNode;
  /** 시트 높이. 기본은 내용만큼(최대 85dvh). */
  heightClassName?: string;
  children: React.ReactNode;
};

/**
 * 아래에서 올라오는 시트. 넓은 화면(웹)에서는 가운데 창으로 뜬다.
 *
 * 휴대폰에서는 가운데 창보다 엄지가 닿는 아래쪽이 편하다. 창과 같은 이유로 body에 포털로 그린다
 * (components/ui/dialog.tsx). 앱 화면의 시트는 모두 이것을 쓴다 — 덮개·스크롤 잠금·닫기·안전 영역을
 * 화면마다 따로 만들었을 때는 시트마다 높이와 아래 여백이 조금씩 달랐다.
 */
export function AppSheet({
  open,
  onClose,
  label,
  labelledBy,
  title,
  description,
  footer,
  heightClassName = "max-h-[85dvh]",
  children,
}: AppSheetProps) {
  const isClient = useIsClient();
  const t = useT();
  const titleId = useId();

  useOverlayLock(open, onClose);

  if (!open || !isClient) return null;

  const closeButton = (className: string, iconClassName: string) => (
    <button
      type="button"
      onClick={onClose}
      className={cn("rounded-full p-1.5 text-muted-foreground hover:bg-secondary", className)}
    >
      <X className={iconClassName} />
      <span className="sr-only">{t.shell.app.sheetClose}</span>
    </button>
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex h-[100dvh] items-end px-safe md:items-center md:justify-center md:p-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-labelledby={title ? titleId : labelledBy}
        className={cn(
          "relative flex w-full flex-col rounded-t-3xl border-t bg-background shadow-2xl animate-in slide-in-from-bottom-8 fade-in md:max-w-lg md:rounded-3xl md:border",
          heightClassName,
        )}
      >
        {title ? (
          <>
            <div className="flex h-6 shrink-0 items-center justify-center">
              <span className="h-1 w-9 rounded-full bg-border" aria-hidden />
            </div>
            <header className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3">
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-black tracking-tight">
                  {title}
                </h2>
                {description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                )}
              </div>
              {closeButton("-mr-1.5", "size-5")}
            </header>
          </>
        ) : (
          <div className="relative flex h-9 shrink-0 items-center justify-center">
            <span className="h-1 w-9 rounded-full bg-border" aria-hidden />
            {closeButton("absolute right-3 top-2", "size-4")}
          </div>
        )}
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto overscroll-contain",
            title ? "px-5" : "px-4",
            footer ? "pb-3" : "pb-[calc(1.25rem+env(safe-area-inset-bottom))]",
          )}
        >
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
