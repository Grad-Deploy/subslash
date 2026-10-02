"use client";

import React, { useEffect, useRef, useState } from "react";

/** 토스트가 떠 있는 시간. */
const TOAST_MS = 3000;

/**
 * 화면 오른쪽 위에 잠깐 뜨는 알림. `toast`를 화면 어딘가에 그리고 `showToast`로 띄운다.
 *
 * 대시보드·내 구독·구독 상세·내 정보가 같은 토스트를 따로 들고 있었다. 셋은 앞 타이머를 지우지 않아,
 * 3초 안에 토스트가 두 번 뜨면 첫 타이머가 두 번째 메시지를 일찍 지웠다. 화면 읽기 프로그램이 읽도록
 * status 역할을 준다.
 */
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const showToast = (text: string) => {
    setMessage(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), TOAST_MS);
  };

  const toast = message && (
    <div
      role="status"
      className="fixed top-16 right-4 z-50 bg-foreground text-background px-4 py-2.5 rounded-xl shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-top-4"
    >
      {message}
    </div>
  );

  return { showToast, toast };
}
