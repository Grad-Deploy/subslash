"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { HydratedForm } from "@components/ui/hydrated-form";
import { refreshAuth, useAuth } from "@hooks/useAuth";
import {
  confirmStatusOf,
  passwordStatusOf,
  shownStatus,
  type LiveStatus,
} from "@lib/signup-status";
import { apiFetch } from "@lib/api";
import { StatusMessage, statusBorder } from "./LiveStatusMessage";

type FieldErrors = { currentPassword?: string; password?: string; passwordConfirm?: string };
type Result = { tone: "ok" | "error"; message: string } | null;

const SAME_AS_CURRENT = "지금 비밀번호와 다른 비밀번호를 정해주세요.";

/** 새 비밀번호 칸의 상태. 규칙은 가입·재설정과 같고, 지금 비밀번호와 같으면 막는다. */
function newPasswordStatusOf(password: string, current: string): LiveStatus {
  const status = passwordStatusOf(password);
  if (status?.tone === "ok" && current && password === current) {
    return { tone: "error", message: SAME_AS_CURRENT };
  }
  return status;
}

/**
 * '내 정보'의 비밀번호 변경.
 *
 * 지금 비밀번호를 한 번 더 받는다 — 로그인한 채 자리를 비운 사이 다른 사람이 바꾸지 못하게.
 * 새 비밀번호 칸의 안내는 가입·재설정과 같은 검증 함수에서 온다. 지금 비밀번호를 잊었다면
 * 여기서는 바꿀 수 없으므로 재설정 메일로 안내한다.
 */
export function ChangePasswordSection() {
  const { account, loading } = useAuth();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [submitErrors, setSubmitErrors] = useState<FieldErrors>({});
  const [result, setResult] = useState<Result>(null);
  const [busy, setBusy] = useState(false);

  if (loading || !account) return null;

  // 소셜 로그인으로만 가입한 계정은 바꿀 비밀번호가 없다. 재설정 메일로 새로 만든다.
  if (account.hasPassword === false) {
    return (
      <section
        aria-labelledby="change-password"
        className="p-5 sm:p-6 border rounded-2xl bg-card shadow-sm space-y-2"
      >
        <h2 id="change-password" className="text-sm font-bold">
          비밀번호
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          간편 로그인으로 가입해 아직 비밀번호가 없어요. 아이디({account.username})로도 로그인하고
          싶다면{" "}
          <Link
            href="/forgot-password"
            className="font-semibold text-primary underline underline-offset-4"
          >
            비밀번호 찾기
          </Link>
          에서 {account.email}로 메일을 받아 비밀번호를 만드세요.
        </p>
      </section>
    );
  }

  const passwordStatus = shownStatus(
    submitErrors.password,
    touched.password ? newPasswordStatusOf(password, current) : null,
  );
  const confirmStatus = shownStatus(
    submitErrors.passwordConfirm,
    touched.confirm ? confirmStatusOf(password, confirm) : null,
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setResult(null);
    setTouched({ password: true, confirm: true });
    if (!current) {
      setSubmitErrors({ currentPassword: "지금 비밀번호를 입력해주세요." });
      return;
    }
    if (
      newPasswordStatusOf(password, current)?.tone === "error" ||
      confirmStatusOf(password, confirm)?.tone === "error"
    ) {
      return;
    }

    setBusy(true);
    setSubmitErrors({});
    try {
      const res = await apiFetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, password, passwordConfirm: confirm }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.status === "changed") {
        setCurrent("");
        setPassword("");
        setConfirm("");
        setTouched({ password: false, confirm: false });
        setResult({
          tone: "ok",
          message: "비밀번호를 바꿨습니다. 다른 기기에서는 새 비밀번호로 다시 로그인해주세요.",
        });
        // 서버가 새 세션 쿠키를 내렸다. 옛 세션은 지워졌으니 로그인 상태를 다시 묻는다.
        await refreshAuth();
      } else if (data?.fieldErrors) {
        setSubmitErrors(data.fieldErrors);
      } else {
        setResult({
          tone: "error",
          message:
            typeof data?.error === "string"
              ? data.error
              : "비밀번호를 바꾸지 못했습니다. 잠시 후 다시 시도해주세요.",
        });
        // 다른 곳에서 먼저 바꿨다면 이 기기의 로그인도 끊겼다. 화면이 그 상태를 따른다.
        if (res.status === 409) await refreshAuth();
      }
    } catch {
      setResult({
        tone: "error",
        message: "네트워크에 문제가 있어 바꾸지 못했습니다. 잠시 후 다시 시도해주세요.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="change-password"
      className="p-5 sm:p-6 border rounded-2xl bg-card shadow-sm space-y-3"
    >
      <h2 id="change-password" className="text-sm font-bold">
        비밀번호 변경
      </h2>

      <HydratedForm onSubmit={submit} noValidate className="space-y-4">
        {/* 아이디 칸이 없으면 비밀번호 관리자가 어느 계정의 새 비밀번호인지 모른다. */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={account.username}
          readOnly
          hidden
        />

        <div className="space-y-1.5">
          <label htmlFor="change-current-password" className="text-xs font-bold text-foreground">
            지금 비밀번호
          </label>
          <Input
            id="change-current-password"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value);
              setSubmitErrors((prev) => ({ ...prev, currentPassword: undefined }));
            }}
            aria-invalid={Boolean(submitErrors.currentPassword)}
          />
          {submitErrors.currentPassword && (
            <p className="text-[11px] font-medium text-destructive" role="alert">
              {submitErrors.currentPassword}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="change-new-password" className="text-xs font-bold text-foreground">
            새 비밀번호
          </label>
          <Input
            id="change-new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setTouched((prev) => ({ ...prev, password: true }));
              setSubmitErrors((prev) => ({ ...prev, password: undefined }));
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
            aria-invalid={passwordStatus?.tone === "error"}
            aria-describedby="change-new-password-status"
            className={statusBorder(passwordStatus)}
          />
          <StatusMessage id="change-new-password-status" status={passwordStatus} />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="change-new-password-confirm"
            className="text-xs font-bold text-foreground"
          >
            새 비밀번호 확인
          </label>
          <Input
            id="change-new-password-confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setTouched((prev) => ({ ...prev, confirm: true }));
              setSubmitErrors((prev) => ({ ...prev, passwordConfirm: undefined }));
            }}
            onBlur={() => setTouched((prev) => ({ ...prev, confirm: true }))}
            aria-invalid={confirmStatus?.tone === "error"}
            aria-describedby="change-new-password-confirm-status"
            className={statusBorder(confirmStatus)}
          />
          <StatusMessage id="change-new-password-confirm-status" status={confirmStatus} />
        </div>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          바꾸면 이 계정으로 로그인해 있던 다른 기기는 모두 로그아웃됩니다. 지금 비밀번호가 기억나지
          않으면{" "}
          <Link
            href="/forgot-password"
            className="font-semibold text-primary underline underline-offset-4"
          >
            재설정 메일
          </Link>
          로 바꿀 수 있습니다.
        </p>

        {result && (
          <p
            role={result.tone === "error" ? "alert" : "status"}
            className={
              result.tone === "ok"
                ? "text-sm font-medium text-emerald-600 dark:text-emerald-400"
                : "text-sm font-medium text-destructive"
            }
          >
            {result.message}
          </p>
        )}

        <Button
          type="submit"
          variant="outline"
          className="w-full h-11 font-bold rounded-xl"
          disabled={busy}
        >
          {busy ? "바꾸는 중..." : "비밀번호 바꾸기"}
        </Button>
      </HydratedForm>
    </section>
  );
}
