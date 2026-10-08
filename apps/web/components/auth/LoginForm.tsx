"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateLogin } from "@subslash/shared";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { enterAfterLogin } from "@hooks/useAuth";
import { apiFetch } from "@lib/api";
import { HydratedForm } from "@components/ui/hydrated-form";
import { useKnownText, useT } from "@lib/i18n";

/**
 * 로그인 폼.
 *
 * 실패 메시지는 서버가 준 것을 그대로 쓴다. 서버는 아이디가 없는 경우와
 * 비밀번호가 틀린 경우를 구분해서 알려주지 않는데, 구분해주면 그것만으로
 * 어떤 아이디가 가입돼 있는지 훑어낼 수 있기 때문이다.
 */
export function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const t = useT().auth.login;
  // 검사·서버 문구는 한국어로 오므로 보여 줄 때 화면 언어로 바꾼다(lib/i18n/known-text).
  const known = useKnownText();

  const update = (field: "identifier" | "password") => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const { errors: localErrors, value } = validateLogin(form);
    if (!value) {
      setErrors(localErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 비밀번호는 본문으로만 보낸다. 주소창에 실으면 브라우저 기록과
        // 서버 접근 로그에 그대로 남는다.
        body: JSON.stringify({ identifier: form.identifier, password: form.password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors(data?.fieldErrors ?? {});
        setFormError(data?.error ?? t.failed);
        return;
      }

      // 헤더가 곧바로 로그인 상태로 바뀌도록, 이동하기 전에 공유 상태를 갱신한다.
      await enterAfterLogin(router);
    } catch {
      setFormError(t.network);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <HydratedForm onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="identifier" className="text-xs font-bold text-foreground">
          {t.identifier}
        </label>
        <Input
          id="identifier"
          name="identifier"
          autoComplete="username"
          placeholder={t.identifierPlaceholder}
          value={form.identifier}
          onChange={(e) => update("identifier")(e.target.value)}
          aria-invalid={Boolean(errors.identifier)}
        />
        {errors.identifier && (
          <p className="text-[11px] font-medium text-destructive" role="alert">
            {known(errors.identifier)}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-xs font-bold text-foreground">
          {t.password}
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => update("password")(e.target.value)}
          aria-invalid={Boolean(errors.password)}
        />
        {errors.password && (
          <p className="text-[11px] font-medium text-destructive" role="alert">
            {known(errors.password)}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {known(formError)}
        </p>
      )}

      <Button type="submit" className="w-full h-11 font-bold rounded-xl" disabled={submitting}>
        {submitting ? t.submitting : t.submit}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        <Link
          href="/forgot-password"
          className="font-semibold text-primary underline underline-offset-4"
        >
          {t.forgot}
        </Link>
      </p>

      <p className="text-xs text-center text-muted-foreground">
        {t.noAccount}{" "}
        <Link href="/signup" className="font-semibold text-primary underline underline-offset-4">
          {t.signup}
        </Link>
      </p>
    </HydratedForm>
  );
}
