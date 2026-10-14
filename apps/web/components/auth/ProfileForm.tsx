"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@hooks/useAuth";
import { ResendVerificationButton } from "./ResendVerificationButton";
import { Spinner } from "../ui/spinner";
import { useT } from "@lib/i18n";

/**
 * '내 정보'. 로그인한 계정의 아이디, 이메일, 확인 상태를 보여준다.
 */
export function ProfileForm() {
  const p = useT().account.profile;
  const a = useT().account;
  const { account, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner className="size-7" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="text-center space-y-3 py-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{p.guest}</p>
        <Link
          href="/login"
          className="inline-block text-sm font-semibold text-primary underline underline-offset-4"
        >
          {p.login}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-[4.5rem_1fr] gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">{a.username}</dt>
        <dd className="font-semibold">{account.username}</dd>
        <dt className="text-muted-foreground">{a.email}</dt>
        <dd className="font-semibold break-all">
          {account.email}{" "}
          {account.emailVerified ? (
            <span className="ml-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              {p.verified}
            </span>
          ) : (
            <span className="ml-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {p.unverified}
            </span>
          )}
        </dd>
      </dl>

      {/* 확인 전이라도 쓰는 데 막히는 것은 없다. 다만 주소가 본인 것인지는 아직
          모르는 상태라, 그렇게 표시하고 확인할 방법을 둔다. */}
      {!account.emailVerified && (
        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
            {p.unverifiedNote}
          </p>
          <ResendVerificationButton label={p.sendVerification} />
        </div>
      )}
    </div>
  );
}
