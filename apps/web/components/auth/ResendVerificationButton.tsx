"use client";

import React, { useState } from "react";
import { Button } from "@components/ui/button";

type SendStatus = { tone: "ok" | "error"; message: string } | null;

/**
 * 확인 메일 (다시) 보내기 버튼.
 *
 * `email`을 주지 않으면 로그인한 계정의 주소로 보낸다('내 정보'). 주면 그 주소로
 * 가입된 미확인 계정의 주소로 보낸다(가입 폼에서 주소가 겹쳤을 때). 결과 문구는
 * 서버가 정한다 — 가입 직후 안내와 같은 문장을 쓰기 위해서다.
 */
export function ResendVerificationButton({ email, label }: { email?: string; label: string }) {
  const [status, setStatus] = useState<SendStatus>(null);
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(email ? { email } : {}),
      });
      const data = await res.json().catch(() => ({}));
      setStatus({
        tone: data?.status === "sent" ? "ok" : "error",
        message: data?.message ?? data?.error ?? "확인 메일을 보내지 못했습니다.",
      });
    } catch {
      setStatus({
        tone: "error",
        message: "네트워크에 문제가 있어 보내지 못했습니다. 잠시 후 다시 시도해주세요.",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Button type="button" variant="outline" size="sm" onClick={send} disabled={sending}>
        {sending ? "보내는 중..." : label}
      </Button>
      {status && (
        <p
          role={status.tone === "error" ? "alert" : "status"}
          className={
            status.tone === "ok"
              ? "text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
              : "text-[11px] font-medium text-destructive"
          }
        >
          {status.message}
        </p>
      )}
    </div>
  );
}
