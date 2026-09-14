"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";

/**
 * 클립보드 복사가 막혔을 때 글을 보여주는 창. `text`가 null이면 닫혀 있다.
 *
 * 예전에는 브라우저 기본 입력창(prompt)을 띄웠는데, 앱 WebView에서는 뜨지 않거나
 * 모양이 제각각이다. 복사 버튼이 아무 일도 안 하는 것처럼 보이면 안 되므로 글을
 * 골라 둔 채로 보여준다.
 */
export function CopyFallbackDialog({
  text,
  title,
  onClose,
}: {
  text: string | null;
  title: string;
  onClose: () => void;
}) {
  return (
    <Dialog open={text !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            자동으로 복사하지 못했습니다. 아래 글을 길게 눌러 복사해주세요.
          </DialogDescription>
        </DialogHeader>
        <textarea
          readOnly
          autoFocus
          rows={5}
          value={text ?? ""}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={title}
          className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
