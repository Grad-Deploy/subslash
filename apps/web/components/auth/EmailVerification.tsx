"use client";

import React, { useEffect, useState } from "react";
import { AuthOutcome } from "./AuthOutcome";
import { useSearchParams } from "next/navigation";
import { Button } from "@components/ui/button";
import { refreshAuth } from "@hooks/useAuth";
import { VERIFY_ACCOUNT_TTL_DAYS } from "@lib/verification-config";
import { apiFetch, apiUrl } from "@lib/api";
import { Spinner } from "../ui/spinner";
import { useKnownText, useLatestT, useT, type Messages } from "@lib/i18n";

type View =
  | { kind: "loading" }
  | { kind: "pending"; username: string; email: string }
  | { kind: "confirm-decline"; username: string; email: string }
  | { kind: "verified"; username?: string }
  | { kind: "declined" }
  | { kind: "invalid" }
  | { kind: "gone" }
  | { kind: "error"; message: string }
  /** 네트워크 오류. 문구는 그릴 때 지금 언어로 붙인다. */
  | { kind: "network" };

/**
 * 가입 확인 메일의 링크가 여는 화면.
 *
 * 페이지를 여는 것만으로는 아무것도 바뀌지 않는다. 메일 검사기가 링크를 사람보다
 * 먼저 열어보기 때문이다. 어떤 계정인지 보여주고, 사람이 버튼을 눌러야 확인하거나
 * 지운다. 지우기는 되돌릴 수 없으므로 한 번 더 묻는다.
 */
export function EmailVerification() {
  const t = useT();
  const a = t.account;
  const v = a.verify;
  const known = useKnownText();
  const tRef = useLatestT();
  const token = useSearchParams().get("token");
  // 토큰이 없는 링크는 물어볼 것도 없이 올바르지 않은 링크다.
  const [view, setView] = useState<View>(() => (token ? { kind: "loading" } : { kind: "invalid" }));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          apiUrl(`/api/auth/verify-email?token=${encodeURIComponent(token)}`),
        );
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setView(viewFrom(res.ok, data, tRef.current));
      } catch {
        if (!cancelled) setView({ kind: "network" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, tRef]);

  const decide = async (decision: "confirm" | "decline") => {
    setBusy(true);
    try {
      const res = await apiFetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, decision }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.status === "verified" && data?.error) {
        // 지우려 했는데 그사이 확인된 계정이다.
        setView({ kind: "error", message: data.error });
      } else {
        setView(viewFrom(res.ok, data, tRef.current));
      }
      // 이 브라우저가 그 계정으로 로그인해 있었다면 헤더와 '내 정보'가 바로 바뀌어야 한다.
      await refreshAuth();
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

    case "pending":
      return (
        <div className="space-y-5">
          <AccountSummary username={view.username} email={view.email} />
          <p className="text-sm leading-relaxed text-center">{v.question}</p>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              className="w-full h-11 font-bold rounded-xl"
              disabled={busy}
              onClick={() => decide("confirm")}
            >
              {v.yes}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 font-bold rounded-xl"
              disabled={busy}
              onClick={() => setView({ ...view, kind: "confirm-decline" })}
            >
              {v.no}
            </Button>
          </div>
        </div>
      );

    case "confirm-decline":
      return (
        <div className="space-y-5">
          <AccountSummary username={view.username} email={view.email} />
          <p className="text-sm leading-relaxed">
            {v.declineBefore}
            <strong>{view.username}</strong>
            {v.declineAfter}
          </p>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="destructive"
              className="w-full h-11 font-bold rounded-xl"
              disabled={busy}
              onClick={() => decide("decline")}
            >
              {v.deleteAccount}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full h-11 rounded-xl"
              disabled={busy}
              onClick={() => setView({ ...view, kind: "pending" })}
            >
              {a.cancel}
            </Button>
          </div>
        </div>
      );

    case "verified":
      return (
        <AuthOutcome
          title={v.verifiedTitle}
          body={v.verifiedBody(view.username ?? null)}
          link={{ href: "/me", label: a.seeMe }}
        />
      );

    case "declined":
      return (
        <AuthOutcome
          title={v.declinedTitle}
          body={v.declinedBody}
          link={{ href: "/signup", label: v.signup }}
        />
      );

    case "gone":
      return (
        <AuthOutcome
          title={v.goneTitle}
          body={v.goneBody}
          link={{ href: "/signup", label: v.signup }}
        />
      );

    case "invalid":
      return (
        <AuthOutcome
          title={a.linkInvalidTitle}
          body={v.invalidBody(VERIFY_ACCOUNT_TTL_DAYS)}
          link={{ href: "/me", label: v.goMe }}
        />
      );

    case "error":
    case "network":
      return (
        <AuthOutcome
          title={a.failedTitle}
          body={view.kind === "network" ? a.networkFailed : known(view.message)}
          link={{ href: "/", label: a.home }}
        />
      );
  }
}

function viewFrom(ok: boolean, data: Record<string, unknown> | null, t: Messages): View {
  const status = data?.status;
  const username = typeof data?.username === "string" ? data.username : undefined;
  const email = typeof data?.email === "string" ? data.email : undefined;

  if (status === "pending" && username && email) return { kind: "pending", username, email };
  if (status === "verified") return { kind: "verified", username };
  if (status === "declined") return { kind: "declined" };
  if (status === "gone") return { kind: "gone" };
  if (status === "invalid") return { kind: "invalid" };
  return {
    kind: "error",
    message:
      typeof data?.error === "string"
        ? data.error
        : ok
          ? t.account.verify.unknownResponse
          : t.account.verify.failedRetry,
  };
}

function AccountSummary({ username, email }: { username: string; email: string }) {
  const a = useT().account;
  return (
    <dl className="grid grid-cols-[4.5rem_1fr] gap-y-1.5 rounded-xl bg-muted/50 p-3 text-sm">
      <dt className="text-muted-foreground">{a.username}</dt>
      <dd className="font-semibold">{username}</dd>
      <dt className="text-muted-foreground">{a.email}</dt>
      <dd className="font-semibold break-all">{email}</dd>
    </dl>
  );
}
