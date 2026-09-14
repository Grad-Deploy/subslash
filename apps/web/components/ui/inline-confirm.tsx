"use client";

import React from "react";
import { Button } from "./button";

/**
 * 이미 열린 창 안에서 한 번 더 묻는 확인 칸.
 *
 * 브라우저 기본 확인창(confirm)은 앱 WebView마다 모양과 동작이 달라 쓰지 않는다.
 * 창 위에 ConfirmDialog를 겹치면 두 창이 같은 Esc를 받아 함께 닫히므로, 창 안에서는
 * 이 칸을 쓴다. 창 밖에서는 ConfirmDialog를 쓴다.
 */
export function InlineConfirm({
  message,
  confirmText,
  onCancel,
  onConfirm,
  disabled = false,
}: {
  message: string;
  confirmText: string;
  onCancel: () => void;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="alertdialog"
      aria-label={confirmText}
      className="space-y-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs"
    >
      <p className="whitespace-pre-line leading-relaxed text-foreground">{message}</p>
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={disabled}
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </div>
  );
}
