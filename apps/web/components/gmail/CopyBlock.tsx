"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";

/** 사용자가 Apps Script 편집기에 붙여 넣을 코드와 복사 버튼. */
export function CopyBlock({ label, code }: { label: string; code: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("failed");
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">{label}</span>
        <Button size="sm" variant="outline" onClick={copy}>
          {status === "copied" ? "복사됨" : `${label} 복사`}
        </Button>
      </div>
      <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-3 text-[11px] leading-snug">
        {code}
      </pre>
      {status === "failed" && (
        <p className="text-xs text-amber-700 dark:text-amber-300" role="status">
          자동으로 복사하지 못했습니다. 위 코드를 직접 선택해 복사해주세요.
        </p>
      )}
    </div>
  );
}
