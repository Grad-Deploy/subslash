"use client";

import React from "react";
import { useToast } from "@hooks/useToast";
import { DataBackupCard } from "./DataBackupCard";

/**
 * '내 정보'의 기록 관리 칸. 백업 파일·계정 저장·자동 동기화는 한 번 정해 두면 다시 볼 일이 드물어,
 * 매일 여는 '내 구독'이 아니라 여기에 둔다. 로그인하지 않아도 백업 파일은 쓸 수 있어야 하므로
 * 로그인 여부와 상관없이 보인다. 자동 동기화는 기본으로 켜져 있다(lib/store의 DEFAULT_ACCOUNT_SYNC).
 */
export function DataSettings() {
  const { showToast, toast } = useToast();

  return (
    <>
      {toast}
      <DataBackupCard onMessage={showToast} />
    </>
  );
}
