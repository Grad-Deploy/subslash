"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Info, Loader2, X } from "lucide-react";
import {
  MIN_AGE,
  PASSWORD_MIN,
  USERNAME_MAX,
  USERNAME_MIN,
  normalizeEmailAddress,
  validateEmail,
  validatePassword,
  validateSignup,
  type FieldErrors,
} from "@subslash/shared";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { refreshAuth } from "@hooks/useAuth";
import { cn } from "@lib/utils";

const EMPTY = {
  username: "",
  email: "",
  password: "",
  passwordConfirm: "",
};

/** 이메일 입력이 이만큼 멈추면 확인한다. 글자마다 물으면 입력 중인 주소마다 DNS를 두드린다. */
const EMAIL_CHECK_DELAY_MS = 500;

/**
 * 회원가입 폼.
 *
 * 여기서 하는 검사는 사용자에게 빨리 알려주기 위한 것이고, 실제 판단은
 * 서버가 다시 한다. 서버가 필드별 오류를 돌려주면 그걸 그대로 붙인다.
 */
export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [isOver14, setIsOver14] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [emailCheck, setEmailCheck] = useState<{ email: string; status: LiveStatus } | null>(null);

  // 두 비밀번호 칸은 제출을 기다리지 않고 매 글자마다 상태를 보여준다.
  const passwordStatus = passwordStatusOf(form.password);
  const confirmStatus = confirmStatusOf(form.password, form.passwordConfirm);

  // 이메일은 지금 칸에 있는 주소에 대한 결과만 보여준다. 고치는 순간 예전 결과는 사라진다.
  const normalizedEmail = normalizeEmailAddress(form.email);
  const emailStatus = emailCheck?.email === normalizedEmail ? emailCheck.status : null;
  // 제출 때 받은 오류(이미 가입된 이메일 등)는 도메인 확인과 다른 이야기라 그쪽을 우선한다.
  const emailShown = errors.email ? null : emailStatus;

  // 예전에는 도메인 확인이 가입 요청 안에서만 돌아서, 다른 칸을 전부 맞게 채우고
  // 제출해야만 "존재하지 않는 도메인"을 볼 수 있었다. 이제 입력이 멈추면 바로 묻는다.
  useEffect(() => {
    if (!normalizedEmail) return;
    const formatError = validateEmail(normalizedEmail);
    const controller = new AbortController();

    const timer = setTimeout(() => {
      if (formatError) {
        setEmailCheck({ email: normalizedEmail, status: { tone: "error", message: formatError } });
        return;
      }
      setEmailCheck({
        email: normalizedEmail,
        status: { tone: "neutral", pending: true, message: "도메인을 확인하는 중..." },
      });
      fetchDomainStatus(normalizedEmail, controller.signal)
        .then((status) => setEmailCheck({ email: normalizedEmail, status }))
        .catch(() => {
          // 미리 확인에 실패했을 뿐이다. 가입 요청이 다시 확인하므로 여기서는 단정하지 않는다.
          if (!controller.signal.aborted) setEmailCheck(null);
        });
    }, EMAIL_CHECK_DELAY_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [normalizedEmail]);

  const update = (field: keyof typeof EMPTY) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // 고치는 중인 필드의 오류는 즉시 치운다. 계속 붉게 남아있으면 고쳐도 고친 것 같지 않다.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleEmailBlur = () => {
    // 칸을 벗어나면 기다리지 않고 형식 오류를 보여준다. 형식이 맞으면 도메인 확인은 이미 진행 중이다.
    const formatError = normalizedEmail ? validateEmail(normalizedEmail) : undefined;
    if (formatError) {
      setEmailCheck({ email: normalizedEmail, status: { tone: "error", message: formatError } });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const { errors: localErrors, value } = validateSignup({ ...form, isOver14 });
    if (!value) {
      setErrors(localErrors);
      return;
    }

    // 미리 확인에서 이미 틀렸다고 나온 도메인은 서버까지 보내지 않는다.
    if (emailStatus?.tone === "error") {
      setErrors({ email: emailStatus.message });
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
          isOver14,
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
          onBlur={handleEmailBlur}
          aria-invalid={Boolean(errors.email) || emailShown?.tone === "error"}
          aria-describedby="email-status"
          className={statusBorder(errors.email ? ERROR_BORDER_ONLY : emailShown)}
        />
        <StatusMessage id="email-status" status={emailShown} />
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
          aria-invalid={passwordStatus ? passwordStatus.tone === "error" : Boolean(errors.password)}
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
          aria-invalid={
            confirmStatus ? confirmStatus.tone === "error" : Boolean(errors.passwordConfirm)
          }
          aria-describedby="passwordConfirm-status"
          className={statusBorder(confirmStatus)}
        />
        <StatusMessage id="passwordConfirm-status" status={confirmStatus} />
      </Field>

      {/* 나이·성별은 가입 때 묻지 않는다. 칸이 늘수록 가입을 포기하는 사람이 늘어서,
          가입 뒤 '내 정보'에서 원할 때만 적는다. 만 14세 확인만은 법정대리인
          동의 문제 때문에 필수로 남긴다. */}
      <div className="space-y-1.5">
        <label htmlFor="isOver14" className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            id="isOver14"
            name="isOver14"
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={isOver14}
            onChange={(e) => {
              setIsOver14(e.target.checked);
              setErrors((prev) => (prev.isOver14 ? { ...prev, isOver14: undefined } : prev));
            }}
            aria-invalid={Boolean(errors.isOver14)}
          />
          <span>
            <strong>만 {MIN_AGE}세 이상입니다.</strong>{" "}
            <span className="text-muted-foreground">(필수)</span>
          </span>
        </label>
        {errors.isOver14 && (
          <p className="text-[11px] font-medium text-destructive" role="alert">
            {errors.isOver14}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">
          나이·성별은 가입 때 묻지 않습니다. 가입 후 &lsquo;내 정보&rsquo;에서 원할 때만 적을 수
          있습니다.
        </p>
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

/**
 * 입력 중인 칸의 상태. 칸이 비어 있으면 아직 판단할 게 없어 null이다.
 * `neutral`은 맞다 틀리다를 말할 수 없는 상태(확인 중, 조회 실패)다 — 조회가
 * 실패한 것을 빨간색으로 칠하면 도메인이 틀렸다고 말하는 셈이 된다.
 */
type LiveStatus = {
  tone: "ok" | "error" | "neutral";
  message: string;
  pending?: boolean;
} | null;

/** 제출 오류가 따로 문구를 띄울 때, 테두리만 빨갛게 맞추기 위한 값. */
const ERROR_BORDER_ONLY: LiveStatus = { tone: "error", message: "" };

/** 문구는 서버와 같은 validatePassword에서 온다. 여기서 초록이면 서버도 통과시킨다. */
function passwordStatusOf(password: string): LiveStatus {
  if (!password) return null;
  const issue = validatePassword(password);
  return issue
    ? { tone: "error", message: issue }
    : { tone: "ok", message: "사용할 수 있는 비밀번호입니다." };
}

function confirmStatusOf(password: string, confirm: string): LiveStatus {
  if (!confirm) return null;
  return password === confirm
    ? { tone: "ok", message: "비밀번호가 일치합니다." }
    : { tone: "error", message: "비밀번호가 일치하지 않습니다." };
}

/**
 * 서버에 도메인이 메일을 받을 수 있는지 묻는다. 초록 문구는 "도메인"에 대한
 * 것이다 — 그 주소가 실제로 있는지까지는 확인 메일 없이 알 수 없다.
 */
async function fetchDomainStatus(email: string, signal: AbortSignal): Promise<LiveStatus> {
  const res = await fetch("/api/auth/check-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ email }),
    signal,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { ok?: boolean; reason?: string; message?: string };
  if (data.ok) return { tone: "ok", message: "메일을 받을 수 있는 도메인입니다." };
  if (!data.message) return null;
  return { tone: data.reason === "unverifiable" ? "neutral" : "error", message: data.message };
}

function statusBorder(status: LiveStatus): string | undefined {
  if (!status || status.tone === "neutral") return undefined;
  return status.tone === "ok"
    ? "border-emerald-500 focus-visible:ring-emerald-500"
    : "border-destructive focus-visible:ring-destructive";
}

const TONE_TEXT = {
  ok: "text-emerald-600 dark:text-emerald-400",
  error: "text-destructive",
  neutral: "text-muted-foreground",
} as const;

/** 색만으로 구분하지 않도록 아이콘을 함께 붙이고, 화면 낭독기가 바뀐 상태를 읽게 한다. */
function StatusMessage({ id, status }: { id: string; status: LiveStatus }) {
  const iconClass = "w-3.5 h-3.5 shrink-0";
  return (
    <p id={id} aria-live="polite" className="text-[11px] font-medium">
      {status && status.message && (
        <span className={cn("flex items-center gap-1", TONE_TEXT[status.tone])}>
          {status.tone === "ok" && <Check className={iconClass} aria-hidden />}
          {status.tone === "error" && <X className={iconClass} aria-hidden />}
          {status.tone === "neutral" &&
            (status.pending ? (
              <Loader2 className={cn(iconClass, "animate-spin")} aria-hidden />
            ) : (
              <Info className={iconClass} aria-hidden />
            ))}
          {status.message}
        </span>
      )}
    </p>
  );
}
