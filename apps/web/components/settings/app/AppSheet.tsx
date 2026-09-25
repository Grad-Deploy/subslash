"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useIsClient } from "@hooks/useIsClient";
import { lockBodyScroll } from "@lib/scroll-lock";

interface AppSheetProps {
  open: boolean;
  onClose: () => void;
  /** 화면 읽기 프로그램이 읽을 시트 이름. 안의 카드가 제목을 따로 보여주므로 눈에는 보이지 않는다. */
  label: string;
  children: React.ReactNode;
}

/**
 * 설정 줄을 눌렀을 때 아래에서 올라오는 시트. 넓은 화면(웹)에서는 가운데 창으로 뜬다.
 *
 * 설명과 조작은 기존 카드를 그대로 안에 그린다. 휴대폰에서는 가운데 창보다 엄지가 닿는 아래쪽이
 * 편하고, 목록 화면에는 한 줄 요약만 남겨 글을 줄이려는 것이다. 창과 같은 이유로 body에 포털로
 * 그린다(components/ui/dialog.tsx).
 */
export function AppSheet({ open, onClose, label, children }: AppSheetProps) {
  const isClient = useIsClient();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const unlockScroll = lockBodyScroll();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      unlockScroll();
    };
  }, [open, onClose]);

  if (!open || !isClient) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex h-[100dvh] items-end md:items-center md:justify-center md:p-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative flex max-h-[85dvh] w-full flex-col rounded-t-3xl border-t bg-background shadow-2xl animate-in slide-in-from-bottom-8 fade-in md:max-w-lg md:rounded-3xl md:border"
      >
        <div className="relative flex h-9 shrink-0 items-center justify-center">
          <span className="h-1 w-9 rounded-full bg-border" aria-hidden />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-2 rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="size-4" />
            <span className="sr-only">닫기</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
