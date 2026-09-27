"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog";
import { Button } from "./button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  /**
   * 앱의 확인 창 모양(가운데 정렬, X 없음, 큰 버튼 두 개). 넘기지 않으면 웹 모양 그대로다.
   *
   * 예전 모양은 머리글이 닫기 버튼 자리로 오른쪽만 비워 가운데 글이 왼쪽으로 치우쳤고, 긴 서비스 이름이
   * 제목 안에서 꺾이고 한국어가 단어 중간에서 줄이 바뀌어('빠/져요') 지저분했다. 제목은 짧게, 이름은
   * `subject` 칩으로 따로, 줄은 단어 단위(keep-all)로 바꾼다. 설명의 줄바꿈은 부르는 쪽이 '\n'으로 정한다.
   */
  centered?: boolean;
  /** 무엇에 대한 확인인지(서비스 로고·이름 칩). centered일 때만 보인다. */
  subject?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  variant = "default",
  centered = false,
  subject,
}: ConfirmDialogProps) {
  const confirm = () => {
    onConfirm();
    onClose();
  };

  if (centered) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent hideClose className="rounded-2xl sm:max-w-sm">
          <div className="break-keep text-center">
            <DialogTitle className="text-lg font-extrabold leading-snug">{title}</DialogTitle>
            {subject && <div className="mt-3 flex justify-center">{subject}</div>}
            <DialogDescription className="mt-2.5 whitespace-pre-line leading-relaxed">
              {description}
            </DialogDescription>
          </div>
          <div className="mt-6 flex gap-2">
            <Button
              variant="ghost"
              className="h-12 flex-1 rounded-xl bg-secondary text-base font-bold hover:bg-secondary/80"
              onClick={onClose}
            >
              {cancelText}
            </Button>
            <Button
              variant={variant}
              className="h-12 flex-1 rounded-xl text-base font-bold"
              onClick={confirm}
            >
              {confirmText}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="pt-2 leading-relaxed whitespace-pre-line">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-6">
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={confirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
