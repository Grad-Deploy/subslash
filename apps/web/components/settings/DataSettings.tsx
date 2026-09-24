"use client";

import React, { useRef, useState } from "react";
import { DataBackupCard } from "./DataBackupCard";

/**
 * '내 정보'의 기록 관리 칸. 백업 파일·계정 저장·자동 동기화는 한 번 정해 두면 다시 볼 일이 드물어,
 * 매일 여는 '내 구독'이 아니라 여기에 둔다. 로그인하지 않아도 백업 파일은 쓸 수 있어야 하므로
 * 로그인 여부와 상관없이 보인다. 자동 동기화는 기본으로 켜져 있다(lib/store의 DEFAULT_ACCOUNT_SYNC).
 */
export function DataSettings() {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = (text: string) => {
    setMessage(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 3000);
  };

  return (
    <>
      {message && (
        <div
          role="status"
          className="fixed top-16 right-4 z-50 bg-foreground text-background px-4 py-2.5 rounded-xl shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-top-4"
        >
          {message}
        </div>
      )}
      <DataBackupCard onMessage={showMessage} />
    </>
  );
}
