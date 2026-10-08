"use client";

import React, { useState } from "react";
import Link from "next/link";
import { refreshAuth, useAuth } from "@hooks/useAuth";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { ConfirmDialog } from "@components/ui/confirm-dialog";
import { apiFetch } from "@lib/api";
import { releaseRecordsToGuest } from "@lib/records-owner";
import { HydratedForm } from "@components/ui/hydrated-form";
import { useKnownText, useLatestT, useLocale, useT } from "@lib/i18n";

/** 비밀번호 없는 계정이 탈퇴할 때 입력하는 확인 글자. 서버는 두 글자를 모두 받는다(app/api/auth/account). */
const CONFIRM_WORDS = { ko: "탈퇴", en: "DELETE" } as const;

/**
 * 회원 탈퇴. 비밀번호를 한 번 더 받고, 확인 창을 거쳐 지운다.
 *
 * 무엇이 지워지고 무엇이 남는지 누르기 전에 적는다. 이 앱의 구독 기록은 브라우저에
 * 있어서 탈퇴해도 남는다 — 모두 지워진다고 적으면 사실이 아니다.
 */
export function DeleteAccountSection() {
  const a = useT().account;
  const r = a.remove;
  const tRef = useLatestT();
  const known = useKnownText();
  const CONFIRM_WORD = CONFIRM_WORDS[useLocale()];
  const { account, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  if (deleted) {
    return (
      <section
        className="p-5 sm:p-6 border rounded-2xl bg-card space-y-2 text-center"
        role="status"
      >
        <p className="font-semibold">{r.doneTitle}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{r.doneBody}</p>
        <Link
          href="/"
          className="inline-block text-sm font-semibold text-primary underline underline-offset-4"
        >
          {a.home}
        </Link>
      </section>
    );
  }

  if (loading || !account) return null;
  // 소셜 로그인으로만 가입한 계정은 비밀번호가 없어, 서버가 비밀번호 대신 확인 글자를 받는다.
  const noPassword = account.hasPassword === false;

  const submit = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await apiFetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noPassword ? { confirmText: password } : { password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data?.fieldErrors?.password ??
            data?.fieldErrors?.confirmText ??
            data?.error ??
            tRef.current.account.remove.failed,
        );
        return;
      }
      // 먼저 '탈퇴했습니다'로 바꾼 뒤 로그인 상태를 다시 묻는다. 순서가 바뀌면 계정이
      // 사라진 순간 이 칸이 통째로 없어져, 결과를 알려줄 곳이 없다.
      setDeleted(true);
      setPassword("");
      // 안내대로 이 기기의 기록은 지우지 않는다. 로그아웃처럼 로그인 전 기록으로 바꾸지 않고 남긴다.
      releaseRecordsToGuest();
      await refreshAuth();
    } catch {
      setError(tRef.current.account.remove.network);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  return (
    <section
      aria-labelledby="delete-account"
      className="p-5 sm:p-6 border border-destructive/30 rounded-2xl bg-card space-y-3"
    >
      <h2 id="delete-account" className="text-sm font-bold text-destructive">
        {r.title}
      </h2>
      <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-muted-foreground">
        <li>{r.what}</li>
        <li>{r.kept}</li>
      </ul>

      <HydratedForm
        noValidate
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!password) {
            setError(noPassword ? r.typeRequired(CONFIRM_WORD) : r.passwordRequired);
            return;
          }
          setConfirmOpen(true);
        }}
      >
        <label htmlFor="delete-password" className="text-xs font-bold text-foreground">
          {noPassword ? r.typeLabel(CONFIRM_WORD) : r.passwordLabel}
        </label>
        <Input
          id="delete-password"
          type={noPassword ? "text" : "password"}
          autoComplete={noPassword ? "off" : "current-password"}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          aria-invalid={Boolean(error)}
        />
        {error && (
          <p className="text-[11px] font-medium text-destructive" role="alert">
            {known(error)}
          </p>
        )}
        <Button type="submit" variant="destructive" className="w-full" disabled={deleting}>
          {deleting ? r.deleting : r.title}
        </Button>
      </HydratedForm>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submit}
        title={r.title}
        description={r.confirmDescription(account.username)}
        confirmText={r.confirm}
        cancelText={a.cancel}
        variant="destructive"
      />
    </section>
  );
}
