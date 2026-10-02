"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@components/ui/button";
import { useAuth } from "@hooks/useAuth";
import { apiFetch, apiUrl } from "@lib/api";
import { appReturnScheme, leaveForExternal } from "@lib/native";
import { IS_APP_BUILD } from "@lib/platform";
import { oauthErrorMessageFrom } from "@lib/oauth-messages";

type ProviderId = "google" | "kakao" | "naver";

interface Methods {
  providers: Array<{ id: ProviderId; label: string }>;
  linked: string[];
  hasPassword: boolean;
}

type Notice = { tone: "ok" | "error"; message: string } | null;

const LABEL: Record<string, string> = { google: "구글", kakao: "카카오", naver: "네이버" };

function linkedMessage(provider: string): string {
  return `${LABEL[provider] ?? provider} 계정을 연결했어요. 다음부터 이것으로도 로그인할 수 있어요.`;
}

/** 못 받으면 null — 칸을 그리지 않는다. 다른 설정은 그대로 쓴다. */
async function fetchMethods(): Promise<Methods | null> {
  try {
    const res = await apiFetch("/api/auth/oauth/link");
    return res.ok ? ((await res.json()) as Methods) : null;
  } catch {
    return null;
  }
}

/**
 * '내 정보'의 로그인 방법: 구글·카카오·네이버를 이 계정에 잇고 끊는다.
 *
 * 같은 이메일로 간편 로그인을 하면 서버가 계정을 잇지 않고 거절하므로(`email-taken`), 여러 방법으로
 * 로그인하려는 사람은 처음 가입한 방법으로 로그인한 뒤 여기서 잇는다. 웹은 이 탭이 제공자로 갔다가
 * `/me?oauthLinked=…`로 돌아오고, 앱은 인앱 브라우저를 닫으면 목록을 다시 읽는다.
 *
 * 서버가 고를 제공자를 주지 않으면(소셜 로그인 시행 전·앱 키 없음) 이 칸을 그리지 않는다.
 */
export function LoginMethodsSection() {
  const { account, loading } = useAuth();
  const router = useRouter();
  const [methods, setMethods] = useState<Methods | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => setMethods(await fetchMethods());

  useEffect(() => {
    if (!account) return;
    // 웹에서 제공자에 다녀온 결과. 읽은 뒤 주소에서 지워 새로고침에 다시 뜨지 않게 한다.
    const search = new URLSearchParams(window.location.search);
    const linked = search.get("oauthLinked");
    const failed = oauthErrorMessageFrom(search);
    const returned: Notice = linked
      ? { tone: "ok", message: linkedMessage(linked) }
      : failed
        ? { tone: "error", message: failed }
        : null;
    if (returned) router.replace("/me");
    let cancelled = false;
    // 결과는 목록과 함께 그린다.
    void fetchMethods().then((next) => {
      if (cancelled) return;
      setMethods(next);
      if (returned) setNotice(returned);
    });
    return () => {
      cancelled = true;
    };
  }, [account, router]);

  if (loading || !account || !methods || methods.providers.length === 0) return null;

  const linkedCount = methods.linked.length + (methods.hasPassword ? 1 : 0);

  const connect = async (provider: ProviderId) => {
    setNotice(null);
    setBusy(provider);
    try {
      const res = await apiFetch("/api/auth/oauth/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        path?: `/api/${string}`;
        error?: string;
      };
      if (!res.ok || !data.path) {
        setNotice({ tone: "error", message: data.error ?? "연결을 시작하지 못했어요." });
        setBusy(null);
        return;
      }
      if (!IS_APP_BUILD) {
        leaveForExternal(new URL(apiUrl(data.path), window.location.href).toString());
        return;
      }
      const scheme = await appReturnScheme();
      const returnParam = scheme ? `&return=${encodeURIComponent(scheme)}` : "";
      leaveForExternal(apiUrl(`${data.path}&client=app${returnParam}`), (result) => {
        setBusy(null);
        const linked = result?.get("oauthLinked");
        const failed = result ? oauthErrorMessageFrom(result) : null;
        if (linked) setNotice({ tone: "ok", message: linkedMessage(linked) });
        else if (failed) setNotice({ tone: "error", message: failed });
        void load();
      });
    } catch {
      setNotice({ tone: "error", message: "네트워크에 문제가 있어 연결하지 못했어요." });
      setBusy(null);
    }
  };

  const disconnect = async (provider: ProviderId) => {
    setNotice(null);
    setBusy(provider);
    try {
      const res = await apiFetch("/api/auth/oauth/link", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setNotice({ tone: "error", message: data.error ?? "연결을 끊지 못했어요." });
      } else {
        setNotice({ tone: "ok", message: `${LABEL[provider]} 연결을 끊었어요.` });
        await load();
      }
    } catch {
      setNotice({ tone: "error", message: "네트워크에 문제가 있어 끊지 못했어요." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      aria-labelledby="login-methods"
      className="p-5 sm:p-6 border rounded-2xl bg-card shadow-sm space-y-3"
    >
      <div className="space-y-1">
        <h2 id="login-methods" className="text-sm font-bold">
          로그인 방법
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          연결해 두면 그 계정으로도 이 계정에 로그인해요. 연결한 계정의 이메일이 달라도 이 계정의
          이메일({account.email})은 바뀌지 않아요.
        </p>
      </div>

      <ul className="divide-y rounded-xl border">
        <li className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
          <span className="font-medium">이메일·비밀번호</span>
          <span className="text-xs text-muted-foreground">
            {methods.hasPassword ? "사용 중" : "비밀번호 없음"}
          </span>
        </li>
        {methods.providers.map((provider) => {
          const isLinked = methods.linked.includes(provider.id);
          // 하나뿐인 로그인 방법은 끊지 못한다(서버도 막는다). 버튼을 미리 막고 까닭을 적는다.
          const isLast = isLinked && linkedCount < 2;
          return (
            <li
              key={provider.id}
              className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
            >
              <span className="font-medium">
                {provider.label}
                {isLinked && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">연결됨</span>
                )}
              </span>
              {isLinked ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy !== null || isLast}
                  title={isLast ? "로그인할 방법이 하나뿐이라 끊을 수 없어요." : undefined}
                  onClick={() => void disconnect(provider.id)}
                >
                  연결 끊기
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => void connect(provider.id)}
                >
                  연결하기
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {linkedCount < 2 && methods.linked.length > 0 && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          지금은 로그인할 방법이 하나뿐이라 끊을 수 없어요. 비밀번호를 만들거나 다른 계정을 먼저
          연결하면 끊을 수 있어요.
        </p>
      )}

      {notice && (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={
            notice.tone === "error"
              ? "text-sm font-medium text-destructive"
              : "text-sm font-medium text-primary"
          }
        >
          {notice.message}
        </p>
      )}
    </section>
  );
}
