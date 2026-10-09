"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Mail, MessageSquareText, PenLine, Plus, Smartphone } from "lucide-react";
import type { ServicePreset } from "@subslash/shared";
import { usePhoneUsage } from "@hooks/usePhoneUsage";
import { useT } from "@lib/i18n";
import { AppUsageFindSheet } from "../../usage/app/AppUsageFindSheet";
import { AppSheet } from "../../settings/app/AppSheet";

/**
 * 앱의 구독 추가(떠 있는 + 버튼 하나). 예전에는 대시보드에 버튼 둘(자동 불러오기·새 구독 등록), 구독 관리에
 * 버튼 둘(결제 메일·문자)과 + 버튼이 따로 있어, 처음 쓰는 사람이 무엇이 추가 버튼인지 헷갈렸다. + 를 누르면
 * 세 가지 방법을 고른다.
 */
export function AppAddButton({
  onManual,
  onPaste,
  onPickPreset,
  menuOpen,
  onMenuOpenChange,
}: {
  /** 직접 등록(서비스 고르기·폼). */
  onManual: () => void;
  /** 결제 문자 붙여넣기. */
  onPaste: () => void;
  /** 폰 사용 기록에서 찾은 서비스로 등록 폼을 연다(안드로이드). */
  onPickPreset: (preset: ServicePreset) => void;
  /**
   * 화면의 다른 '구독 추가' 버튼도 같은 메뉴를 열게 할 때 넘긴다(구독 관리의 빈 목록). 주지 않으면 + 버튼만
   * 연다. 버튼마다 다르게 동작하면 같은 이름의 버튼이 한쪽은 폼, 한쪽은 방법 고르기가 된다.
   */
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const t = useT().shell.addMenu;
  const [ownOpen, setOwnOpen] = useState(false);
  const open = menuOpen ?? ownOpen;
  const setOpen = onMenuOpenChange ?? setOwnOpen;
  const [findOpen, setFindOpen] = useState(false);
  // iOS는 폰 사용 기록을 읽을 수 없어 이 방법을 두지 않는다.
  const { status } = usePhoneUsage();
  const pick = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  const options = [
    {
      icon: <PenLine className="size-5" aria-hidden />,
      title: t.manual,
      detail: t.manualDetail,
      onClick: pick(onManual),
    },
    {
      icon: <Mail className="size-5" aria-hidden />,
      title: t.mail,
      detail: t.mailDetail,
      onClick: pick(() => router.push("/import")),
    },
    {
      icon: <MessageSquareText className="size-5" aria-hidden />,
      title: t.paste,
      detail: t.pasteDetail,
      onClick: pick(onPaste),
    },
    ...(status === "unsupported"
      ? []
      : [
          {
            icon: <Smartphone className="size-5" aria-hidden />,
            title: t.phone,
            detail: t.phoneDetail,
            onClick: pick(() => setFindOpen(true)),
          },
        ]),
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.title}
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-5 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-transform active:scale-95"
      >
        <Plus className="size-7" aria-hidden />
      </button>
      <AppSheet open={open} onClose={() => setOpen(false)} label={t.title}>
        <div className="space-y-2 pt-1">
          <h2 className="text-lg font-black tracking-tight">{t.title}</h2>
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
      <AppUsageFindSheet open={findOpen} onClose={() => setFindOpen(false)} onPick={onPickPreset} />
    </>
  );
}
