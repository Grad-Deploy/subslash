"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Mail, MessageSquareText, PenLine, Plus } from "lucide-react";
import { AppSheet } from "../../settings/app/AppSheet";

/**
 * 앱의 구독 추가(떠 있는 + 버튼 하나). 예전에는 대시보드에 버튼 둘(자동 불러오기·새 구독 등록), 구독 관리에
 * 버튼 둘(결제 메일·문자)과 + 버튼이 따로 있어, 처음 쓰는 사람이 무엇이 추가 버튼인지 헷갈렸다. + 를 누르면
 * 세 가지 방법을 고른다.
 */
export function AppAddButton({
  onManual,
  onPaste,
}: {
  /** 직접 등록(서비스 고르기·폼). */
  onManual: () => void;
  /** 결제 문자 붙여넣기. */
  onPaste: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const pick = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  const options = [
    {
      icon: <PenLine className="size-5" aria-hidden />,
      title: "직접 등록",
      detail: "서비스를 골라 금액·결제일을 넣어요",
      onClick: pick(onManual),
    },
    {
      icon: <Mail className="size-5" aria-hidden />,
      title: "결제 메일에서 찾기",
      detail: "Gmail의 결제 메일로 구독을 찾아요",
      onClick: pick(() => router.push("/import")),
    },
    {
      icon: <MessageSquareText className="size-5" aria-hidden />,
      title: "결제 문자 붙여넣기",
      detail: "카드 결제 문자를 붙여 넣어요",
      onClick: pick(onPaste),
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="구독 추가"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform active:scale-95"
      >
        <Plus className="size-7" aria-hidden />
      </button>
      <AppSheet open={open} onClose={() => setOpen(false)} label="구독 추가">
        <div className="space-y-2 pt-1">
          <h2 className="text-lg font-black tracking-tight">구독 추가</h2>
          {options.map((option) => (
            <button
              key={option.title}
              type="button"
              onClick={option.onClick}
              className="flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left hover:bg-muted/50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                {option.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">{option.title}</span>
                <span className="block text-xs text-muted-foreground">{option.detail}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          ))}
        </div>
      </AppSheet>
    </>
  );
}
