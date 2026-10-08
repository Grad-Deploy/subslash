"use client";

import React, { useState } from "react";
import Link from "next/link";
import { normalizeEmailAddress, validateEmail } from "@subslash/shared";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { apiFetch } from "@lib/api";
import { HydratedForm } from "@components/ui/hydrated-form";
import { useKnownText, useLatestT, useT } from "@lib/i18n";

type Result = { tone: "ok" | "error"; message: string } | null;

/**
 * 비밀번호 재설정 메일 요청 폼.
 *
 * 서버가 돌려준 문장을 그대로 보여준다. 보내지 못했으면(설정 없음, 한도, 거절)
 * 보냈다고 하지 않는다 — 오지 않을 메일을 기다리게 된다.
 */
export function ForgotPasswordForm() {
  const f = useT().account.forgot;
  const tRef = useLatestT();
  const known = useKnownText();
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setResult(null);

    const normalized = normalizeEmailAddress(email);
    const formatError = validateEmail(normalized);
    if (formatError) {
      setFieldError(formatError);
      return;
    }
    setFieldError(null);

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      const data = await res.json().catch(() => ({}));
      const message =
        typeof data?.message === "string"
          ? data.message
          : typeof data?.error === "string"
            ? data.error
            : tRef.current.account.forgot.failed;
      setResult({ tone: data?.status === "sent" ? "ok" : "error", message });
    } catch {
      setResult({
        tone: "error",
        message: tRef.current.account.forgot.network,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HydratedForm onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-xs font-bold text-foreground">
          {f.email}
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldError(null);
          }}
          aria-invalid={Boolean(fieldError)}
        />
        {fieldError && (
          <p className="text-[11px] font-medium text-destructive" role="alert">
            {known(fieldError)}
          </p>
        )}
      </div>

      {result && (
        <p
          role={result.tone === "ok" ? "status" : "alert"}
          className={
            result.tone === "ok"
              ? "text-sm font-medium text-emerald-600 dark:text-emerald-400"
              : "text-sm font-medium text-destructive"
          }
        >
          {known(result.message)}
        </p>
      )}

      <Button type="submit" className="w-full h-11 font-bold rounded-xl" disabled={submitting}>
        {submitting ? f.sending : f.submit}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
          {f.back}
        </Link>
      </p>
    </HydratedForm>
  );
}
