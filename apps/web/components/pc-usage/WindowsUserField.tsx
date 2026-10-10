"use client";

import React from "react";
import { useT } from "@lib/i18n";
import { isWindowsUserName } from "@lib/pc-usage-reader";
import { Input } from "../ui/input";

/** Windows 사용자 이름 칸. 기록 폴더 경로(`C:\Users\<이름>\…`)를 채우는 데만 쓴다. */
export function WindowsUserField({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const t = useT().pcUsage.reader;
  return (
    <label className="block space-y-1 rounded-2xl border p-3">
      <span className="text-xs font-bold">{t.windowsUser}</span>
      <Input
        value={value}
        placeholder={t.windowsUserPlaceholder}
        autoComplete="off"
        spellCheck={false}
        onChange={(event) => {
          const next = event.target.value.trim();
          if (next && !isWindowsUserName(next)) return;
          onChange(next);
        }}
      />
      <span className="block text-[11px] leading-relaxed text-muted-foreground">
        {t.windowsUserHint}
      </span>
    </label>
  );
}
