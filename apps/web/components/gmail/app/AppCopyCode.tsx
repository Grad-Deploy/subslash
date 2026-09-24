"use client";

import { useState } from "react";
import { cn } from "@lib/utils";

/**
 * 앱의 가져오기 단계에서 붙여 넣을 코드. 코드는 늘어놓지 않고 이름과 복사 버튼만 보여준다.
 * 복사가 막힌 기기에서만 펼쳐서 직접 고를 수 있게 한다.
 */
export function AppCopyCode({ label, code }: { label: string; code: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [expanded, setExpanded] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 1800);
    } catch {
      setStatus("failed");
      setExpanded(true);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border bg-muted/40">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <span className="min-w-0 truncate font-mono text-xs font-bold">{label}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-bold transition-colors",
            status === "copied"
              ? "bg-emerald-500 text-white"
              : "bg-primary text-primary-foreground",
          )}
        >
          {status === "copied" ? "복사됨" : "복사"}
        </button>
      </div>
      {expanded && (
        <pre className="max-h-56 overflow-auto px-3 py-2 font-mono text-[10.5px] leading-relaxed break-all whitespace-pre-wrap text-muted-foreground select-all">
          {code}
        </pre>
      )}
      {status === "failed" && (
        <p className="px-3 pb-2 text-xs text-amber-700 dark:text-amber-300" role="status">
          자동으로 복사하지 못했어요. 위 코드를 길게 눌러 직접 복사해 주세요.
        </p>
      )}
    </div>
  );
}
