"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validateLogin } from "@subslash/shared";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { refreshAuth } from "@hooks/useAuth";

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
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        // 비밀번호는 본문으로만 보낸다. 주소창에 실으면 브라우저 기록과
        // 서버 접근 로그에 그대로 남는다.
        body: JSON.stringify({ identifier: form.identifier, password: form.password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors(data?.fieldErrors ?? {});
        setFormError(data?.error ?? "로그인하지 못했습니다.");
        return;
      }

      // 헤더가 곧바로 로그인 상태로 바뀌도록, 이동하기 전에 공유 상태를 갱신한다.
      await refreshAuth();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setFormError("네트워크에 문제가 있어 로그인하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="identifier" className="text-xs font-bold text-foreground">
          아이디 또는 이메일
        </label>
        <Input
          id="identifier"
          name="identifier"
          autoComplete="username"
          placeholder="아이디 또는 you@example.com"
          value={form.identifier}
          onChange={(e) => update("identifier")(e.target.value)}
          aria-invalid={Boolean(errors.identifier)}
        />
        {errors.identifier && (
          <p className="text-[11px] font-medium text-destructive" role="alert">
            {errors.identifier}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-xs font-bold text-foreground">
          비밀번호
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
            {errors.password}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" className="w-full h-11 font-bold rounded-xl" disabled={submitting}>
        {submitting ? "로그인하는 중..." : "로그인"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        <Link
          href="/forgot-password"
          className="font-semibold text-primary underline underline-offset-4"
        >
          비밀번호를 잊으셨나요?
        </Link>
      </p>

      <p className="text-xs text-center text-muted-foreground">
        아직 계정이 없으신가요?{" "}
        <Link href="/signup" className="font-semibold text-primary underline underline-offset-4">
          회원가입
        </Link>
      </p>
    </form>
  );
}
