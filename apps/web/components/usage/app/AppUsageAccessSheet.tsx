"use client";

import React, { useEffect, useState } from "react";
import { Check, Info, RotateCcw, Smartphone } from "lucide-react";
import { AppSheet } from "../../settings/app/AppSheet";
import { Button } from "../../ui/button";
import { openPhoneUsageSettings, usePhoneUsage } from "@hooks/usePhoneUsage";
import { useT } from "@lib/i18n";

/** 안내 항목의 아이콘. 글은 `usageMore.access.points`에 같은 순서로 있다. */
const POINT_ICONS = [Check, Smartphone, Info, RotateCcw] as const;

/**
 * '사용 기록 액세스'를 켜기 전의 안내(구글 Play 정책의 '눈에 띄는 안내'). 무엇을, 왜, 어디서 쓰는지
 * 먼저 말하고 설정 화면을 연다. 앱은 설정을 열어 주기만 할 수 있어서, 사용자가 SubSlash를 켜고
 * 돌아오면 usePhoneUsage가 다시 확인하고 켜졌으면 이 창을 닫는다.
 */
export function AppUsageAccessSheet({
  open,
  onClose,
  onLater,
  title,
  description,
}: {
  open: boolean;
  onClose: () => void;
  /** '직접 입력할게요'. 주지 않으면 닫기와 같다. */
  onLater?: () => void;
  /** 이 안내를 연 곳에 맞춘 제목·설명. 주지 않으면 체크인을 채우는 안내다. */
  title?: React.ReactNode;
  description?: React.ReactNode;
}) {
  const a = useT().usageMore.access;
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
    <AppSheet open={open} onClose={close} label={a.label}>
      <div className="space-y-5 pt-1">
        <div className="space-y-2 text-center">
          <h2 className="text-lg font-black leading-snug tracking-tight">
            {title ?? (
              <>
                {a.title1}
                <br />
                {a.title2}
              </>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">{description ?? a.body}</p>
        </div>

        <ul className="space-y-3 rounded-2xl bg-secondary/50 p-4">
          {a.points.map(({ title, body }, i) => {
            const Icon = POINT_ICONS[i];
            return (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-background text-foreground">
                  <Icon className="size-3.5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{title}</span>
                  <span className="block text-xs text-muted-foreground">{body}</span>
                </span>
              </li>
            );
          })}
        </ul>

        {waiting && (
          <p className="text-center text-xs text-muted-foreground" role="status">
            {a.waiting}
          </p>
        )}
        {failed && (
          <p className="text-center text-xs text-destructive" role="alert">
            {a.failed}
          </p>
        )}

        <div className="space-y-2">
          <Button className="w-full" size="lg" onClick={() => void openSettings()}>
            {a.openSettings}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setWaiting(false);
              (onLater ?? onClose)();
            }}
          >
            {a.later}
          </Button>
        </div>
      </div>
    </AppSheet>
  );
}
