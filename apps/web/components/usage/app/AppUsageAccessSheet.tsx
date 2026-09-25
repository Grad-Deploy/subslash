"use client";

import React, { useEffect, useState } from "react";
import { Check, Info, RotateCcw, Smartphone } from "lucide-react";
import { AppSheet } from "../../settings/app/AppSheet";
import { Button } from "../../ui/button";
import { openPhoneUsageSettings, usePhoneUsage } from "@hooks/usePhoneUsage";

const POINTS = [
  {
    icon: Check,
    title: "구독한 서비스 앱의 사용 시간과 연 횟수만 읽어요",
    body: "다른 앱의 기록과 화면 내용은 쓰지 않아요",
  },
  {
    icon: Smartphone,
    title: "이 폰 안에서만 계산해요",
    body: "서버나 계정으로 보내지 않아요",
  },
  {
    icon: Info,
    title: "TV·PC에서 본 건 빠져요",
    body: "불러온 숫자는 저장하기 전에 확인하고 고칠 수 있어요",
  },
  {
    icon: RotateCcw,
    title: "언제든 끌 수 있어요",
    body: "설정 › 사용 기록 액세스 › SubSlash",
  },
] as const;

/**
 * '사용 기록 액세스'를 켜기 전의 안내(구글 Play 정책의 '눈에 띄는 안내'). 무엇을, 왜, 어디서 쓰는지
 * 먼저 말하고 설정 화면을 연다. 앱은 설정을 열어 주기만 할 수 있어서, 사용자가 SubSlash를 켜고
 * 돌아오면 usePhoneUsage가 다시 확인하고 켜졌으면 이 창을 닫는다.
 */
export function AppUsageAccessSheet({
  open,
  onClose,
  onLater,
}: {
  open: boolean;
  onClose: () => void;
  /** '직접 입력할게요'. 주지 않으면 닫기와 같다. */
  onLater?: () => void;
}) {
  const { status } = usePhoneUsage();
  const [waiting, setWaiting] = useState(false);
  const [failed, setFailed] = useState(false);

  // 설정에서 켜고 돌아오면 닫는다. 렌더 중에 부모 상태를 바꾸지 않게 효과에서 닫는다.
  useEffect(() => {
    if (open && waiting && status === "on") onClose();
  }, [open, waiting, status, onClose]);

  const close = () => {
    setWaiting(false);
    onClose();
  };

  const openSettings = async () => {
    setFailed(false);
    const ok = await openPhoneUsageSettings();
    if (ok) setWaiting(true);
    else setFailed(true);
  };

  return (
    <AppSheet open={open} onClose={close} label="폰 사용 기록 연결">
      <div className="space-y-5 pt-1">
        <div className="space-y-2 text-center">
          <h2 className="text-lg font-black leading-snug tracking-tight">
            폰 사용 기록으로
            <br />
            체크인을 채울까요?
          </h2>
          <p className="text-sm text-muted-foreground">
            안드로이드 설정의 &lsquo;사용 기록 액세스&rsquo;를 켜면, 구독한 서비스 앱을 얼마나 열고
            썼는지 불러와요.
          </p>
        </div>

        <ul className="space-y-3 rounded-2xl bg-secondary/50 p-4">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-background text-foreground">
                <Icon className="size-3.5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">{title}</span>
                <span className="block text-xs text-muted-foreground">{body}</span>
              </span>
            </li>
          ))}
        </ul>

        {waiting && (
          <p className="text-center text-xs text-muted-foreground" role="status">
            설정에서 SubSlash를 켜고 돌아와 주세요.
          </p>
        )}
        {failed && (
          <p className="text-center text-xs text-destructive" role="alert">
            설정 화면을 열지 못했어요. 설정 › 사용 기록 액세스에서 직접 켜 주세요.
          </p>
        )}

        <div className="space-y-2">
          <Button className="w-full" size="lg" onClick={() => void openSettings()}>
            설정에서 켜기
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setWaiting(false);
              (onLater ?? onClose)();
            }}
          >
            직접 입력할게요
          </Button>
        </div>
      </div>
    </AppSheet>
  );
}
