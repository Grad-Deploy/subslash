"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { copyText } from "@lib/native";
import { useT } from "@lib/i18n";

/** 사용자가 Apps Script 편집기에 붙여 넣을 코드와 복사 버튼. */
export function CopyBlock({ label, code }: { label: string; code: string }) {
  const c = useT().importing.copy;
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");

  const copy = async () => {
    if (await copyText(code)) {
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } else {
      setStatus("failed");
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">{label}</span>
        <Button size="sm" variant="outline" onClick={copy}>
          {status === "copied" ? c.copied : c.copy(label)}
        </Button>
      </div>
      <pre className="max-h-48 overflow-auto rounded-lg bg-muted p-3 text-[11px] leading-snug">
        {code}
      </pre>
      {status === "failed" && (
        <p className="text-xs text-amber-700 dark:text-amber-300" role="status">
          {c.failed}
        </p>
      )}
    </div>
  );
}
