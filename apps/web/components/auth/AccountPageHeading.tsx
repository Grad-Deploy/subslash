"use client";

import React from "react";
import { useT } from "@lib/i18n";

/** 계정 페이지 맨 위의 제목과 한 줄 설명. 페이지 파일은 서버 컴포넌트라 문구를 이 칸에서 고른다. */
export function AccountPageHeading({ page }: { page: "me" | "forgot" | "reset" | "verify" }) {
  const { title, body } = useT().accountPages[page];
  return (
    <div className="space-y-1.5 text-center">
      <h1 className="text-2xl font-black tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
