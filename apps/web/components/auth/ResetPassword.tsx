"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, X } from "lucide-react";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { refreshAuth } from "@hooks/useAuth";
import { confirmStatusOf, passwordStatusOf, type LiveStatus } from "@lib/signup-status";
import { RESET_PASSWORD_TTL_MINUTES } from "@lib/verification-config";

type View =
  | { kind: "loading" }
  | { kind: "form"; username: string; email: string }
  | { kind: "done"; username: string }
  | { kind: "invalid" }
  | { kind: "error"; message: string };

type FieldErrors = { password?: string; passwordConfirm?: string };

/**
 * 재설정 메일의 링크가 여는 화면.
 *
 * 페이지를 여는 것만으로는 아무것도 바뀌지 않는다. 메일 검사기가 링크를 먼저 열어보기
 * 때문이다. 어느 계정의 링크인지 보여주고, 새 비밀번호를 적어 제출해야 바뀐다.
 * 비밀번호 칸의 안내는 가입 폼과 같은 검증 함수에서 온다 — 여기서 초록이면 서버도 받는다.
 */
export function ResetPassword() {
  const token = useSearchParams().get("token");
  const [view, setView] = useState<View>({ kind: "loading" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [submitErrors, setSubmitErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setView({ kind: "invalid" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/auth/password-reset/confirm?token=${encodeURIComponent(token)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (
          data?.status === "valid" &&
          typeof data.username === "string" &&
          typeof data.email === "string"
        ) {
          setView({ kind: "form", username: data.username, email: data.email });
        } else if (data?.status === "invalid") {
          setView({ kind: "invalid" });
        } else {
          setView({
            kind: "error",
            message:
              typeof data?.error === "string"
                ? data.error
                : "링크를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
          });
        }
      } catch {
        if (!cancelled) setView(NETWORK_ERROR);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const passwordStatus: LiveStatus = submitErrors.password
    ? { tone: "error", message: submitErrors.password }
    : touched.password
      ? passwordStatusOf(password)
      : null;
  const confirmStatus: LiveStatus = submitErrors.passwordConfirm
    ? { tone: "error", message: submitErrors.passwordConfirm }
    : touched.confirm
      ? confirmStatusOf(password, confirm)
      : null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched({ password: true, confirm: true });
    if (
      passwordStatusOf(password)?.tone === "error" ||
      confirmStatusOf(password, confirm)?.tone === "error"
    ) {
      return;
    }

    setBusy(true);
    setSubmitErrors({});
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        // 비밀번호는 본문으로만 보낸다.
        body: JSON.stringify({ token, password, passwordConfirm: confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.status === "reset") {
        // 서버가 새 세션 쿠키를 내렸다. 헤더가 곧바로 로그인 상태로 바뀌어야 한다.
        await refreshAuth();
        setView({ kind: "done", username: typeof data.username === "string" ? data.username : "" });
      } else if (data?.status === "invalid") {
        setView({ kind: "invalid" });
      } else if (data?.fieldErrors) {
        setSubmitErrors(data.fieldErrors);
      } else {
        setView({
          kind: "error",
          message:
            typeof data?.error === "string"
              ? data.error
              : "비밀번호를 바꾸지 못했습니다. 잠시 후 다시 시도해주세요.",
        });
      }
    } catch {
      setView(NETWORK_ERROR);
    } finally {
      setBusy(false);
    }
  };

  switch (view.kind) {
    case "loading":
      return (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin text-2xl">✂️</div>
        </div>
      );

    case "form":
      return (
        <form onSubmit={submit} noValidate className="space-y-4">
          <dl className="grid grid-cols-[4.5rem_1fr] gap-y-1.5 rounded-xl bg-muted/50 p-3 text-sm">
            <dt className="text-muted-foreground">아이디</dt>
            <dd className="font-semibold">{view.username}</dd>
            <dt className="text-muted-foreground">이메일</dt>
            <dd className="font-semibold break-all">{view.email}</dd>
          </dl>

          <div className="space-y-1.5">
            <label htmlFor="new-password" className="text-xs font-bold text-foreground">
              새 비밀번호
            </label>
            <Input
              id="new-password"
              name="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setTouched((prev) => ({ ...prev, password: true }));
                setSubmitErrors({});
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              aria-invalid={passwordStatus?.tone === "error"}
              aria-describedby="new-password-status"
              className={borderFor(passwordStatus)}
            />
            <StatusMessage id="new-password-status" status={passwordStatus} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="new-password-confirm" className="text-xs font-bold text-foreground">
              새 비밀번호 확인
            </label>
            <Input
              id="new-password-confirm"
              name="new-password-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setTouched((prev) => ({ ...prev, confirm: true }));
                setSubmitErrors({});
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, confirm: true }))}
              aria-invalid={confirmStatus?.tone === "error"}
              aria-describedby="new-password-confirm-status"
              className={borderFor(confirmStatus)}
            />
            <StatusMessage id="new-password-confirm-status" status={confirmStatus} />
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            바꾸면 이 계정으로 로그인해 있던 다른 기기는 모두 로그아웃됩니다.
          </p>

          <Button type="submit" className="w-full h-11 font-bold rounded-xl" disabled={busy}>
            {busy ? "바꾸는 중..." : "비밀번호 바꾸기"}
          </Button>
        </form>
      );

    case "done":
      return (
        <Outcome
          title="비밀번호를 바꿨습니다"
          body={`${view.username ? `아이디 ${view.username} 계정에 ` : ""}새 비밀번호로 로그인했습니다. 다른 기기에서는 새 비밀번호로 다시 로그인해주세요.`}
          link={{ href: "/me", label: "내 정보 보기" }}
        />
      );

    case "invalid":
      return (
        <Outcome
          title="링크가 만료됐거나 올바르지 않습니다"
          body={`재설정 링크는 보낸 뒤 ${RESET_PASSWORD_TTL_MINUTES}분 동안, 한 번만 쓸 수 있습니다. 비밀번호를 이미 바꿨다면 새 비밀번호로 로그인하세요.`}
          link={{ href: "/forgot-password", label: "재설정 메일 다시 받기" }}
        />
      );

    case "error":
      return (
        <Outcome
          title="처리하지 못했습니다"
          body={view.message}
          link={{ href: "/login", label: "로그인으로" }}
        />
      );
  }
}

const NETWORK_ERROR: View = {
  kind: "error",
  message: "네트워크에 문제가 있어 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
};

function borderFor(status: LiveStatus): string | undefined {
  if (!status) return undefined;
  return status.tone === "ok"
    ? "border-emerald-500 focus-visible:ring-emerald-500"
    : "border-destructive focus-visible:ring-destructive";
}

/** 가입 폼과 같은 모양. 색만으로 구분하지 않도록 아이콘을 붙이고 바뀐 상태를 낭독한다. */
function StatusMessage({ id, status }: { id: string; status: LiveStatus }) {
  const iconClass = "w-3.5 h-3.5 shrink-0";
  return (
    <p id={id} aria-live="polite" className="text-[11px] font-medium">
      {status && status.message && (
        <span
          className={`flex items-center gap-1 ${
            status.tone === "ok" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
          }`}
        >
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

function Outcome({
  title,
  body,
  link,
}: {
  title: string;
  body: string;
  link: { href: string; label: string };
}) {
  return (
    <div className="space-y-3 text-center" role="status">
      <p className="text-lg font-black">{title}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Link
        href={link.href}
        className="inline-block text-sm font-semibold text-primary underline underline-offset-4"
      >
        {link.label}
      </Link>
    </div>
  );
}
