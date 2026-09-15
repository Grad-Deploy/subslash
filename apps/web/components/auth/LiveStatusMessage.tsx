import React from "react";
import { Check, X } from "lucide-react";
import type { LiveStatus } from "@lib/signup-status";

/**
 * 비밀번호·아이디 칸 아래에 붙는 상태 표시. 가입·재설정·비밀번호 변경이 함께 쓴다 — 칸마다
 * 모양이 다르면 같은 규칙을 다른 말로 하는 것처럼 보인다.
 */

/** 칸의 테두리 색. 상태가 없으면(아직 손대지 않은 칸) 기본 테두리다. */
export function statusBorder(status: LiveStatus): string | undefined {
  if (!status) return undefined;
  return status.tone === "ok"
    ? "border-emerald-500 focus-visible:ring-emerald-500"
    : "border-destructive focus-visible:ring-destructive";
}

const TONE_TEXT = {
  ok: "text-emerald-600 dark:text-emerald-400",
  error: "text-destructive",
} as const;

/** 색만으로 구분하지 않도록 아이콘을 함께 붙이고, 화면 낭독기가 바뀐 상태를 읽게 한다. */
export function StatusMessage({ id, status }: { id: string; status: LiveStatus }) {
  const iconClass = "w-3.5 h-3.5 shrink-0";
  return (
    <p id={id} aria-live="polite" className="text-[11px] font-medium">
      {status && status.message && (
        <span className={`flex items-center gap-1 ${TONE_TEXT[status.tone]}`}>
          {status.tone === "ok" ? (
            <Check className={iconClass} aria-hidden />
          ) : (
            <X className={iconClass} aria-hidden />
          )}
          {status.message}
        </span>
      )}
    </p>
  );
}
