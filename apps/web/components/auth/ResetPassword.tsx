"use client";

import React, { useEffect, useState } from "react";
import { AuthOutcome } from "./AuthOutcome";
import { useSearchParams } from "next/navigation";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { refreshAuth } from "@hooks/useAuth";
import { confirmStatusOf, passwordStatusOf, type LiveStatus } from "@lib/signup-status";
import { RESET_PASSWORD_TTL_MINUTES } from "@lib/verification-config";
import { apiFetch, apiUrl } from "@lib/api";
import { HydratedForm } from "@components/ui/hydrated-form";
import { StatusMessage, statusBorder } from "./LiveStatusMessage";
import { Spinner } from "../ui/spinner";
import { useKnownText, useLatestT, useT } from "@lib/i18n";

type View =
  | { kind: "loading" }
  | { kind: "form"; username: string; email: string }
  | { kind: "done"; username: string }
  | { kind: "invalid" }
  | { kind: "error"; message: string }
  /** 네트워크 오류. 문구는 그릴 때 지금 언어로 붙인다. */
  | { kind: "network" };

type FieldErrors = { password?: string; passwordConfirm?: string };

/**
 * 재설정 메일의 링크가 여는 화면.
 *
 * 페이지를 여는 것만으로는 아무것도 바뀌지 않는다. 메일 검사기가 링크를 먼저 열어보기
 * 때문이다. 어느 계정의 링크인지 보여주고, 새 비밀번호를 적어 제출해야 바뀐다.
 * 비밀번호 칸의 안내는 가입 폼과 같은 검증 함수에서 온다 — 여기서 초록이면 서버도 받는다.
 */
export function ResetPassword() {
  const a = useT().account;
  const r = a.reset;
  const tRef = useLatestT();
  const known = useKnownText();
  const token = useSearchParams().get("token");
  // 토큰이 없는 링크는 물어볼 것도 없이 올바르지 않은 링크다.
  const [view, setView] = useState<View>(() => (token ? { kind: "loading" } : { kind: "invalid" }));
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [submitErrors, setSubmitErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          apiUrl(`/api/auth/password-reset/confirm?token=${encodeURIComponent(token)}`),
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
              typeof data?.error === "string" ? data.error : tRef.current.account.reset.checkFailed,
          });
        }
      } catch {
        if (!cancelled) setView({ kind: "network" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tRef]);

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
      const res = await apiFetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
            typeof data?.error === "string" ? data.error : tRef.current.account.change.failed,
        });
      }
    } catch {
      setView({ kind: "network" });
    } finally {
      setBusy(false);
    }
  };

  switch (view.kind) {
    case "loading":
      return (
        <div className="flex items-center justify-center py-10">
          <Spinner className="size-7" />
        </div>
      );

    case "form":
      return (
        <HydratedForm onSubmit={submit} noValidate className="space-y-4">
          <dl className="grid grid-cols-[4.5rem_1fr] gap-y-1.5 rounded-xl bg-muted/50 p-3 text-sm">
            <dt className="text-muted-foreground">{a.username}</dt>
            <dd className="font-semibold">{view.username}</dd>
            <dt className="text-muted-foreground">{a.email}</dt>
            <dd className="font-semibold break-all">{view.email}</dd>
          </dl>

          <div className="space-y-1.5">
            <label htmlFor="new-password" className="text-xs font-bold text-foreground">
              {a.newPassword}
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
              className={statusBorder(passwordStatus)}
            />
            <StatusMessage id="new-password-status" status={passwordStatus} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="new-password-confirm" className="text-xs font-bold text-foreground">
              {a.newPasswordConfirm}
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
              className={statusBorder(confirmStatus)}
            />
            <StatusMessage id="new-password-confirm-status" status={confirmStatus} />
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">{r.logoutNote}</p>

          <Button type="submit" className="w-full h-11 font-bold rounded-xl" disabled={busy}>
            {busy ? a.changing : a.changePassword}
          </Button>
        </HydratedForm>
      );

    case "done":
      return (
        <AuthOutcome
          title={r.doneTitle}
          body={r.doneBody(view.username)}
          link={{ href: "/me", label: a.seeMe }}
        />
      );

    case "invalid":
      return (
        <AuthOutcome
          title={a.linkInvalidTitle}
          body={r.invalidBody(RESET_PASSWORD_TTL_MINUTES)}
          link={{ href: "/forgot-password", label: r.resend }}
        />
      );

    case "error":
    case "network":
      return (
        <AuthOutcome
          title={a.failedTitle}
          body={view.kind === "network" ? a.networkFailed : known(view.message)}
          link={{ href: "/login", label: r.toLogin }}
        />
      );
  }
}
