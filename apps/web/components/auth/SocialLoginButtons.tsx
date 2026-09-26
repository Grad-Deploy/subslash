"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MIN_AGE } from "@subslash/shared";
import { Button } from "@components/ui/button";
import { refreshAuth } from "@hooks/useAuth";
import { apiFetch, apiUrl } from "@lib/api";
import { leaveForExternal } from "@lib/native";
import { IS_APP_BUILD } from "@lib/platform";
import { oauthErrorMessage } from "@lib/oauth-messages";

interface Provider {
  id: "google" | "kakao" | "naver";
  label: string;
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 앱 넘겨받기용 비밀값과 그 해시(서버의 s256과 같은 계산). */
async function makeVerifier(): Promise<{ verifier: string; challenge: string }> {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}

/**
 * 구글·카카오·네이버로 계속하기. 어떤 제공자를 둘지는 서버가 정한다(/api/auth/oauth/providers — 방침
 * 시행 전이거나 앱 키가 없으면 빈 목록이라 이 칸이 통째로 없다).
 *
 * 처음 쓰는 제공자 계정이면 그 자리에서 가입된다. 가입 화면(`mode="signup"`)에서는 만 14세 이상 확인을
 * 먼저 받고, 로그인 화면에서 처음 온 사람은 서버가 가입 화면으로 돌려보낸다(`need-age`).
 *
 * 웹은 이 탭이 제공자로 갔다가 돌아온다. 앱은 인앱 브라우저로 열고, 닫히면 앱이 만든 비밀값으로 세션을
 * 받아 온다(api/auth/oauth/claim) — 인앱 브라우저의 쿠키는 앱으로 오지 않는다.
 */
export function SocialLoginButtons({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isOver14, setIsOver14] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // 제공자에서 돌아온 실패 이유(서버가 ?oauthError=로 넘긴다). 목록과 함께 그린다.
    const returned = oauthErrorMessage(
      new URLSearchParams(window.location.search).get("oauthError"),
    );
    apiFetch("/api/auth/oauth/providers")
      .then((res) => (res.ok ? res.json() : { providers: [] }))
      .then((data: { providers?: Provider[] }) => {
        if (cancelled) return;
        setProviders(Array.isArray(data.providers) ? data.providers : []);
        setError(returned);
      })
      .catch(() => {
        // 목록을 못 받으면 버튼을 두지 않는다. 아이디 로그인은 그대로 된다.
        if (!cancelled) setError(returned);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (providers.length === 0) {
    return error ? (
      <p role="alert" className="text-sm font-medium text-destructive">
        {error}
      </p>
    ) : null;
  }

  const start = async (provider: Provider) => {
    setError(null);
    if (mode === "signup" && !isOver14) {
      setError(`만 ${MIN_AGE}세 이상인지 먼저 확인해 주세요.`);
      return;
    }
    const params = new URLSearchParams({ next: "/dashboard" });
    if (mode === "signup") params.set("over14", "1");

    if (!IS_APP_BUILD) {
      leaveForExternal(
        new URL(
          apiUrl(`/api/auth/oauth/${provider.id}/start?${params}`),
          window.location.href,
        ).toString(),
      );
      return;
    }

    setBusy(true);
    const { verifier, challenge } = await makeVerifier();
    params.set("client", "app");
    params.set("challenge", challenge);
    leaveForExternal(apiUrl(`/api/auth/oauth/${provider.id}/start?${params}`), () => {
      void (async () => {
        try {
          const res = await apiFetch("/api/auth/oauth/claim", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ verifier }),
          });
          if (!res.ok) {
            // 창에서 취소했거나 실패했다. 이유는 그 창에 이미 보였다.
            if (res.status !== 404) setError(oauthErrorMessage("server"));
            return;
          }
          await refreshAuth();
          router.push("/dashboard");
          router.refresh();
        } catch {
          setError("네트워크에 문제가 있어 로그인하지 못했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
          setBusy(false);
        }
      })();
    });
  };

  return (
    <div className="space-y-3">
      {mode === "signup" && (
        <label className="flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={isOver14}
            onChange={(e) => {
              setIsOver14(e.target.checked);
              setError(null);
            }}
          />
          <span>
            <strong>만 {MIN_AGE}세 이상입니다.</strong>{" "}
            <span className="text-muted-foreground">(간편 가입 필수)</span>
          </span>
        </label>
      )}
      <div className="space-y-2">
        {providers.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            className="w-full h-11 font-bold rounded-xl"
            disabled={busy}
            onClick={() => void start(provider)}
          >
            {provider.label}로 계속하기
          </Button>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      )}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        처음이면 그 계정으로 가입돼요. 받는 것은 이메일과 회원 번호(되돌릴 수 없는 형태로
        저장)뿐이에요.
      </p>
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        또는 아이디로
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
