"use client";

import React, { useState } from "react";
import Link from "next/link";
import { refreshAuth, useAuth } from "@hooks/useAuth";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { ConfirmDialog } from "@components/ui/confirm-dialog";
import { apiUrl } from "@lib/api";
import { HydratedForm } from "@components/ui/hydrated-form";

/**
 * 회원 탈퇴. 비밀번호를 한 번 더 받고, 확인 창을 거쳐 지운다.
 *
 * 무엇이 지워지고 무엇이 남는지 누르기 전에 적는다. 이 앱의 구독 기록은 브라우저에
 * 있어서 탈퇴해도 남는다 — 모두 지워진다고 적으면 사실이 아니다.
 */
export function DeleteAccountSection() {
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
        <p className="font-semibold">탈퇴했습니다.</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          계정과 계정에 저장한 기록을 서버에서 지웠습니다. 이 브라우저의 구독 기록은 그대로 있어
          로그인 없이 계속 쓸 수 있습니다.
        </p>
        <Link
          href="/"
          className="inline-block text-sm font-semibold text-primary underline underline-offset-4"
        >
          홈으로
        </Link>
      </section>
    );
  }

  if (loading || !account) return null;

  const submit = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/api/auth/account"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.fieldErrors?.password ?? data?.error ?? "탈퇴를 처리하지 못했습니다.");
        return;
      }
      // 먼저 '탈퇴했습니다'로 바꾼 뒤 로그인 상태를 다시 묻는다. 순서가 바뀌면 계정이
      // 사라진 순간 이 칸이 통째로 없어져, 결과를 알려줄 곳이 없다.
      setDeleted(true);
      setPassword("");
      await refreshAuth();
    } catch {
      setError("네트워크에 문제가 있어 탈퇴하지 못했습니다. 잠시 후 다시 시도해주세요.");
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
        회원 탈퇴
      </h2>
      <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-muted-foreground">
        <li>
          계정(아이디·이메일·비밀번호 해시·나이·성별), 로그인 세션, 계정에 저장한 기록을 서버에서
          바로 지웁니다. 되돌릴 수 없습니다.
        </li>
        <li>
          이 브라우저에 있는 구독·체크인 기록은 지워지지 않습니다. 지우려면 내 구독의 &lsquo;전체
          초기화&rsquo;나 브라우저 데이터 삭제를 쓰세요.
        </li>
        <li>
          결제 알림은 계정과 따로 저장됩니다. 켜 두셨다면 탈퇴 전에 결제 알림 설정에서 끄세요.
        </li>
      </ul>

      <HydratedForm
        noValidate
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!password) {
            setError("비밀번호를 입력해주세요.");
            return;
          }
          setConfirmOpen(true);
        }}
      >
        <label htmlFor="delete-password" className="text-xs font-bold text-foreground">
          비밀번호 확인
        </label>
        <Input
          id="delete-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          aria-invalid={Boolean(error)}
        />
        {error && (
          <p className="text-[11px] font-medium text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" variant="destructive" className="w-full" disabled={deleting}>
          {deleting ? "지우는 중..." : "회원 탈퇴"}
        </Button>
      </HydratedForm>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={submit}
        title="회원 탈퇴"
        description={`'${account.username}' 계정을 지우시겠습니까?\n계정과 계정에 저장한 기록은 되돌릴 수 없습니다.`}
        confirmText="탈퇴"
        cancelText="취소"
        variant="destructive"
      />
    </section>
  );
}
