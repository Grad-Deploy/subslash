"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@components/ui/button";
import { useAuth } from "@hooks/useAuth";
import { apiFetch, apiUrl } from "@lib/api";
import { appReturnScheme, leaveForExternal } from "@lib/native";
import { IS_APP_BUILD } from "@lib/platform";
import { oauthErrorMessageFrom } from "@lib/oauth-messages";
import { useKnownText, useLatestT, useT, type Messages } from "@lib/i18n";
import { providerLabel } from "@lib/oauth-providers";
import { isKakaoNativeAvailable, kakaoNativeLogin } from "@lib/kakao-native";

type ProviderId = "google" | "kakao" | "naver";

interface Methods {
  providers: Array<{ id: ProviderId; label: string }>;
  /** 앱이 SDK(카카오톡)로 이을 수 있는 제공자. 서버가 토큰을 확인할 수 있을 때만 있다. */
  native?: string[];
  linked: string[];
  hasPassword: boolean;
}

type Notice = { tone: "ok" | "error"; message: string } | null;

function linkedMessage(t: Messages, provider: string): string {
  return t.account.methods.linked(providerLabel(provider));
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
  const latest = useLatestT();
  const m = useT().account.methods;
  const known = useKnownText();

  const load = async () => setMethods(await fetchMethods());

  useEffect(() => {
    if (!account) return;
    // 웹에서 제공자에 다녀온 결과. 읽은 뒤 주소에서 지워 새로고침에 다시 뜨지 않게 한다.
    const search = new URLSearchParams(window.location.search);
    const linked = search.get("oauthLinked");
    const returnedFailure = search.has("oauthError");
    if (linked || returnedFailure) router.replace("/me");
    let cancelled = false;
    // 결과는 목록과 함께 그린다.
    void fetchMethods().then((next) => {
      if (cancelled) return;
      setMethods(next);
      // 응답을 받은 뒤에 문구를 붙인다 — 그때는 화면 언어가 정해져 있다.
      const failed = oauthErrorMessageFrom(search, latest.current.oauth);
      if (linked) setNotice({ tone: "ok", message: linkedMessage(latest.current, linked) });
      else if (failed) setNotice({ tone: "error", message: failed });
    });
    return () => {
      cancelled = true;
    };
  }, [account, router, latest]);

  if (loading || !account || !methods || methods.providers.length === 0) return null;

  const linkedCount = methods.linked.length + (methods.hasPassword ? 1 : 0);

  const connect = async (provider: ProviderId) => {
    setNotice(null);
    setBusy(provider);
    if (
      IS_APP_BUILD &&
      provider === "kakao" &&
      methods.native?.includes("kakao") &&
      (await isKakaoNativeAvailable())
    ) {
      const outcome = await kakaoNativeLogin({ link: true });
      setBusy(null);
      if (outcome.status === "ok")
        setNotice({ tone: "ok", message: linkedMessage(latest.current, "kakao") });
      if (outcome.status === "error") {
        setNotice({
          tone: "error",
          message: oauthErrorMessageFrom(outcome.result, latest.current.oauth) ?? "",
        });
      }
      await load();
      return;
    }
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
        setNotice({
          tone: "error",
          message: data.error ?? latest.current.account.methods.startFailed,
        });
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
        const failed = result ? oauthErrorMessageFrom(result, latest.current.oauth) : null;
        if (linked) setNotice({ tone: "ok", message: linkedMessage(latest.current, linked) });
        else if (failed) setNotice({ tone: "error", message: failed });
        void load();
      });
    } catch {
      setNotice({ tone: "error", message: latest.current.account.methods.connectNetwork });
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
        setNotice({
          tone: "error",
          message: data.error ?? latest.current.account.methods.disconnectFailed,
        });
      } else {
        setNotice({
          tone: "ok",
          message: latest.current.account.methods.disconnected(providerLabel(provider)),
        });
        await load();
      }
    } catch {
      setNotice({ tone: "error", message: latest.current.account.methods.disconnectNetwork });
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
          {m.title}
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">{m.body(account.email)}</p>
      </div>

      <ul className="divide-y rounded-xl border">
        <li className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
          <span className="font-medium">{m.password}</span>
          <span className="text-xs text-muted-foreground">
            {methods.hasPassword ? m.inUse : m.noPassword}
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
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {m.linkedBadge}
                  </span>
                )}
              </span>
              {isLinked ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy !== null || isLast}
                  title={isLast ? m.lastOne : undefined}
                  onClick={() => void disconnect(provider.id)}
                >
                  {m.disconnect}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => void connect(provider.id)}
                >
                  {m.connect}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {linkedCount < 2 && methods.linked.length > 0 && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">{m.lastOneNote}</p>
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
          {known(notice.message)}
        </p>
      )}
    </section>
  );
}
