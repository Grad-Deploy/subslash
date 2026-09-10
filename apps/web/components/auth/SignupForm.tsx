"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, X } from "lucide-react";
import {
  GENDER_OPTIONS,
  MIN_AGE,
  MAX_AGE,
  PASSWORD_MIN,
  USERNAME_MAX,
  USERNAME_MIN,
  validatePassword,
  validateSignup,
  type FieldErrors,
} from "@subslash/shared";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { Button } from "@components/ui/button";
import { refreshAuth } from "@hooks/useAuth";
import { cn } from "@lib/utils";

const EMPTY = {
  username: "",
  email: "",
  password: "",
  passwordConfirm: "",
  age: "",
  gender: "",
};

/**
 * 회원가입 폼.
 *
 * 여기서 하는 검사는 사용자에게 빨리 알려주기 위한 것이고, 실제 판단은
 * 서버가 다시 한다. 서버가 필드별 오류를 돌려주면 그걸 그대로 붙인다.
 */
export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 두 비밀번호 칸은 제출을 기다리지 않고 매 글자마다 상태를 보여준다.
  const passwordStatus = passwordStatusOf(form.password);
  const confirmStatus = confirmStatusOf(form.password, form.passwordConfirm);

  const update = (field: keyof typeof EMPTY) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // 고치는 중인 필드의 오류는 즉시 치운다. 계속 붉게 남아있으면 고쳐도 고친 것 같지 않다.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const { errors: localErrors, value } = validateSignup(form);
    if (!value) {
      setErrors(localErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        // 값은 JSON 본문으로 보낸다. 주소창(쿼리스트링)에 실으면 브라우저
        // 기록과 서버 접근 로그에 비밀번호가 그대로 남는다.
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
          passwordConfirm: form.passwordConfirm,
          age: form.age,
          gender: form.gender,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrors(data?.fieldErrors ?? {});
        setFormError(data?.error ?? "가입을 처리하지 못했습니다.");
        return;
      }

      // 헤더가 곧바로 로그인 상태로 바뀌도록, 이동하기 전에 공유 상태를 갱신한다.
      await refreshAuth();
      router.push("/dashboard");
      router.refresh();
    } catch {
      setFormError("네트워크에 문제가 있어 가입하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="아이디" htmlFor="username" error={errors.username}>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          placeholder={`영문 소문자·숫자·밑줄 ${USERNAME_MIN}~${USERNAME_MAX}자`}
          value={form.username}
          onChange={(e) => update("username")(e.target.value)}
          aria-invalid={Boolean(errors.username)}
        />
      </Field>

      <Field label="이메일" htmlFor="email" error={errors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => update("email")(e.target.value)}
          aria-invalid={Boolean(errors.email)}
        />
      </Field>

      {/* 두 비밀번호 칸은 입력이 있는 동안 제출 시 오류 대신 실시간 상태를 보여준다.
          둘 다 띄우면 고쳐서 조건을 맞춘 뒤에도 제출 때의 빨간 오류가 초록 문구
          옆에 남는다. 칸이 비어 있을 때만 제출 시 오류("입력해주세요")가 나온다. */}
      <Field
        label="비밀번호"
        htmlFor="password"
        error={passwordStatus ? undefined : errors.password}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder={`${PASSWORD_MIN}자 이상`}
          value={form.password}
          onChange={(e) => update("password")(e.target.value)}
          aria-invalid={passwordStatus ? !passwordStatus.ok : Boolean(errors.password)}
          aria-describedby="password-status"
          className={statusBorder(passwordStatus)}
        />
        <StatusMessage id="password-status" status={passwordStatus} />
      </Field>

      <Field
        label="비밀번호 확인"
        htmlFor="passwordConfirm"
        error={confirmStatus ? undefined : errors.passwordConfirm}
      >
        <Input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          placeholder="위와 같은 비밀번호를 한 번 더"
          value={form.passwordConfirm}
          onChange={(e) => update("passwordConfirm")(e.target.value)}
          aria-invalid={confirmStatus ? !confirmStatus.ok : Boolean(errors.passwordConfirm)}
          aria-describedby="passwordConfirm-status"
          className={statusBorder(confirmStatus)}
        />
        <StatusMessage id="passwordConfirm-status" status={confirmStatus} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="나이" htmlFor="age" error={errors.age}>
          <Input
            id="age"
            name="age"
            type="number"
            inputMode="numeric"
            min={MIN_AGE}
            max={MAX_AGE}
            placeholder="만 나이"
            value={form.age}
            onChange={(e) => update("age")(e.target.value)}
            aria-invalid={Boolean(errors.age)}
          />
        </Field>

        <Field label="성별" htmlFor="gender" error={errors.gender}>
          <Select
            id="gender"
            name="gender"
            value={form.gender}
            onChange={(e) => update("gender")(e.target.value)}
            aria-invalid={Boolean(errors.gender)}
          >
            <option value="">선택해주세요</option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {formError && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" className="w-full h-11 font-bold rounded-xl" disabled={submitting}>
        {submitting ? "가입하는 중..." : "회원가입"}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
          로그인
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-bold text-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[11px] font-medium text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** 입력 중인 칸의 상태. 칸이 비어 있으면 아직 판단할 게 없어 null이다. */
type LiveStatus = { ok: boolean; message: string } | null;

/** 문구는 서버와 같은 validatePassword에서 온다. 여기서 초록이면 서버도 통과시킨다. */
function passwordStatusOf(password: string): LiveStatus {
  if (!password) return null;
  const issue = validatePassword(password);
  return issue
    ? { ok: false, message: issue }
    : { ok: true, message: "사용할 수 있는 비밀번호입니다." };
}

function confirmStatusOf(password: string, confirm: string): LiveStatus {
  if (!confirm) return null;
  return password === confirm
    ? { ok: true, message: "비밀번호가 일치합니다." }
    : { ok: false, message: "비밀번호가 일치하지 않습니다." };
}

function statusBorder(status: LiveStatus): string | undefined {
  if (!status) return undefined;
  return status.ok
    ? "border-emerald-500 focus-visible:ring-emerald-500"
    : "border-destructive focus-visible:ring-destructive";
}

/** 색만으로 구분하지 않도록 아이콘을 함께 붙이고, 화면 낭독기가 바뀐 상태를 읽게 한다. */
function StatusMessage({ id, status }: { id: string; status: LiveStatus }) {
  return (
    <p id={id} aria-live="polite" className="text-[11px] font-medium">
      {status && (
        <span
          className={cn(
            "flex items-center gap-1",
            status.ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
          )}
        >
          {status.ok ? (
            <Check className="w-3.5 h-3.5 shrink-0" aria-hidden />
          ) : (
            <X className="w-3.5 h-3.5 shrink-0" aria-hidden />
          )}
          {status.message}
        </span>
      )}
    </p>
  );
}
