"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@components/ui/button";
import { refreshAuth } from "@hooks/useAuth";
import { VERIFY_ACCOUNT_TTL_DAYS } from "@lib/verification-config";

type View =
  | { kind: "loading" }
  | { kind: "pending"; username: string; email: string }
  | { kind: "confirm-decline"; username: string; email: string }
  | { kind: "verified"; username?: string }
  | { kind: "declined" }
  | { kind: "invalid" }
  | { kind: "gone" }
  | { kind: "error"; message: string };

/**
 * 가입 확인 메일의 링크가 여는 화면.
 *
 * 페이지를 여는 것만으로는 아무것도 바뀌지 않는다. 메일 검사기가 링크를 사람보다
 * 먼저 열어보기 때문이다. 어떤 계정인지 보여주고, 사람이 버튼을 눌러야 확인하거나
 * 지운다. 지우기는 되돌릴 수 없으므로 한 번 더 묻는다.
 */
export function EmailVerification() {
  const token = useSearchParams().get("token");
  const [view, setView] = useState<View>({ kind: "loading" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setView({ kind: "invalid" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setView(viewFrom(res.ok, data));
      } catch {
        if (!cancelled) setView(NETWORK_ERROR);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const decide = async (decision: "confirm" | "decline") => {
    setBusy(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ token, decision }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.status === "verified" && data?.error) {
        // 지우려 했는데 그사이 확인된 계정이다.
        setView({ kind: "error", message: data.error });
      } else {
        setView(viewFrom(res.ok, data));
      }
      // 이 브라우저가 그 계정으로 로그인해 있었다면 헤더와 '내 정보'가 바로 바뀌어야 한다.
      await refreshAuth();
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

    case "pending":
      return (
        <div className="space-y-5">
          <AccountSummary username={view.username} email={view.email} />
          <p className="text-sm leading-relaxed text-center">이 계정을 직접 가입하셨나요?</p>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              className="w-full h-11 font-bold rounded-xl"
              disabled={busy}
              onClick={() => decide("confirm")}
            >
              맞아요, 제가 가입했어요
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 font-bold rounded-xl"
              disabled={busy}
              onClick={() => setView({ ...view, kind: "confirm-decline" })}
            >
              제가 가입하지 않았어요
            </Button>
          </div>
        </div>
      );

    case "confirm-decline":
      return (
        <div className="space-y-5">
          <AccountSummary username={view.username} email={view.email} />
          <p className="text-sm leading-relaxed">
            아이디 <strong>{view.username}</strong> 계정을 지웁니다. 되돌릴 수 없고, 이 주소로 다시
            가입할 수 있게 됩니다. 이 계정으로 로그인해 있던 기기는 모두 로그아웃됩니다.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="destructive"
              className="w-full h-11 font-bold rounded-xl"
              disabled={busy}
              onClick={() => decide("decline")}
            >
              계정 지우기
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full h-11 rounded-xl"
              disabled={busy}
              onClick={() => setView({ ...view, kind: "pending" })}
            >
              취소
            </Button>
          </div>
        </div>
      );

    case "verified":
      return (
        <Outcome
          title="이메일을 확인했습니다"
          body={
            view.username
              ? `아이디 ${view.username} 계정의 이메일이 확인되었습니다.`
              : "이 계정의 이메일은 확인된 상태입니다."
          }
          link={{ href: "/me", label: "내 정보 보기" }}
        />
      );

    case "declined":
      return (
        <Outcome
          title="계정을 지웠습니다"
          body="알려주셔서 고맙습니다. 이 주소로 가입된 계정이 없어졌고, 이 주소로 다시 가입할 수 있습니다."
          link={{ href: "/signup", label: "회원가입" }}
        />
      );

    case "gone":
      return (
        <Outcome
          title="이미 지워진 계정입니다"
          body="이 링크가 가리키는 계정은 더 이상 없습니다. 이 주소로 새로 가입할 수 있습니다."
          link={{ href: "/signup", label: "회원가입" }}
        />
      );

    case "invalid":
      return (
        <Outcome
          title="링크가 만료됐거나 올바르지 않습니다"
          body={`확인 링크는 보낸 뒤 ${VERIFY_ACCOUNT_TTL_DAYS}일 동안만 쓸 수 있습니다. 로그인한 뒤 '내 정보'에서 확인 메일을 다시 받을 수 있습니다.`}
          link={{ href: "/me", label: "내 정보로 가기" }}
        />
      );

    case "error":
      return (
        <Outcome
          title="처리하지 못했습니다"
          body={view.message}
          link={{ href: "/", label: "홈으로" }}
        />
      );
  }
}

const NETWORK_ERROR: View = {
  kind: "error",
  message: "네트워크에 문제가 있어 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
};

function viewFrom(ok: boolean, data: Record<string, unknown> | null): View {
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
          ? "알 수 없는 응답입니다."
          : "처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
  };
}

function AccountSummary({ username, email }: { username: string; email: string }) {
  return (
    <dl className="grid grid-cols-[4.5rem_1fr] gap-y-1.5 rounded-xl bg-muted/50 p-3 text-sm">
      <dt className="text-muted-foreground">아이디</dt>
      <dd className="font-semibold">{username}</dd>
      <dt className="text-muted-foreground">이메일</dt>
      <dd className="font-semibold break-all">{email}</dd>
    </dl>
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
