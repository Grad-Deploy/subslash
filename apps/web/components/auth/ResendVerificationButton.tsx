"use client";

import React, { useState } from "react";
import { Button } from "@components/ui/button";
import { apiFetch } from "@lib/api";
import { useKnownText, useT } from "@lib/i18n";

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
  const t = useT().auth.resend;
  // 결과 문구는 서버가 한국어로 정한다. 보여 줄 때 화면 언어로 바꾼다.
  const known = useKnownText();

  const send = async () => {
    setSending(true);
    setStatus(null);
    try {
      const res = await apiFetch("/api/auth/verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email ? { email } : {}),
      });
      const data = await res.json().catch(() => ({}));
      setStatus({
        tone: data?.status === "sent" ? "ok" : "error",
        message: data?.message ?? data?.error ?? t.failed,
      });
    } catch {
      setStatus({
        tone: "error",
        message: t.network,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Button type="button" variant="outline" size="sm" onClick={send} disabled={sending}>
        {sending ? t.sending : label}
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
          {known(status.message)}
        </p>
      )}
    </div>
  );
}
