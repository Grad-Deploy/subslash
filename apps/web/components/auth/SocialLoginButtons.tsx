"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MIN_AGE } from "@subslash/shared";
import { Button } from "@components/ui/button";
import { refreshAuth } from "@hooks/useAuth";
import { apiFetch, apiUrl } from "@lib/api";
import { appReturnScheme, leaveForExternal } from "@lib/native";
import { claimPendingLogin, clearPendingLogin, savePendingLogin } from "@lib/app-oauth";
import { IS_APP_BUILD } from "@lib/platform";
import { oauthErrorMessage, oauthErrorMessageFrom } from "@lib/oauth-messages";

interface Provider {
  id: "google" | "kakao" | "naver";
  label: string;
}

/**
 * 제공자 버튼의 모습. 세 회사 모두 로그인 버튼의 색·마크·문구를 가이드로 정해 두었고, 사람들은 글자보다
 * 노란 말풍선·초록 N·컬러 G로 먼저 알아본다. 그래서 앱 테마(라이트·다크)를 따르지 않고 두 모드에서 같은
 * 색으로 고정한다. 값은 모두 공식 배포 리소스에서 옮겼다(2026-09-29 확인).
 *
 * - 카카오: developers.kakao.com/tool/resource/login 의 'Kakao Login.zip'(SVG) — 바탕 #FEE500, 심볼·글자
 *   #191919. 심볼은 그 SVG의 path 그대로다. 디자인 가이드상 심볼 없이는 버튼을 만들 수 없고, 문구는
 *   '카카오 로그인'(또는 '로그인')만 쓴다.
 * - 네이버: developers.naver.com/docs/login/bi/bi.md 의 NAVER_login_KR.zip — 바탕 #03A94D, 로고·글자 흰색.
 *   벡터를 내주지 않아 공식 아이콘 버튼 PNG(green_icon_H56)에서 흰 N만 뽑아 `public/logos/login/naver-n.png`로 둔다.
 * - 구글: developers.google.com/identity/branding-guidelines 의 signin-assets.zip — Light 테마(바탕 #FFFFFF,
 *   테두리 #747775, 글자 #1F1F1F). G는 색·모양을 바꿀 수 없고 흰 바탕 위에만 둔다. 공식 SVG는 그라데이션을
 *   foreignObject로 그려 웹뷰마다 다르게 나올 수 있어, 같은 묶음의 PNG(@4x)에서 G 칸만 잘라 쓴다.
 */
const PROVIDER_LOOK: Record<
  Provider["id"],
  { label: string; className: string; mark: React.ReactNode }
> = {
  kakao: {
    label: "카카오 로그인",
    className:
      "border-transparent bg-[#FEE500] text-[#191919] hover:bg-[#FEE500] hover:text-[#191919]",
    mark: (
      <svg viewBox="13 14 22 21" className="h-[18px] w-[18px]" aria-hidden="true">
        <path
          d="M24.0014 14C17.9241 14 13 18.0219 13 22.9825C13 26.1711 15.0368 28.9728 18.1057 30.5656L17.0681 34.5677C17.0295 34.6871 17.0598 34.8151 17.1424 34.9033C17.2029 34.9659 17.2855 35 17.3653 35C17.4341 35 17.5029 34.9772 17.5607 34.9289L22.0196 31.8171C22.661 31.911 23.3215 31.9622 23.9986 31.9622C30.0732 31.9622 35 27.9403 35 22.9797C35 18.0191 30.0759 14 24.0014 14Z"
          fill="#191919"
        />
      </svg>
    ),
  },
  naver: {
    label: "네이버 로그인",
    className: "border-transparent bg-[#03A94D] text-white hover:bg-[#03A94D] hover:text-white",
    mark: (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/logos/login/naver-n.png" alt="" aria-hidden="true" className="h-4 w-4" />
    ),
  },
  google: {
    label: "Google 계정으로 로그인",
    className: "border-[#747775] bg-white text-[#1F1F1F] hover:bg-white hover:text-[#1F1F1F]",
    mark: (
      // eslint-disable-next-line @next/next/no-img-element
      <img src="/logos/login/google-g.png" alt="" aria-hidden="true" className="h-5 w-5" />
    ),
  },
};

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
 * 웹은 이 탭이 제공자로 갔다가 돌아온다. 앱은 인앱 브라우저로 열고, 끝 화면이 앱을 다시 열거나
 * (`<앱 ID>://oauth-done`) 창이 닫히면 앱이 만든 비밀값으로 세션을 받아 온다(api/auth/oauth/claim) —
 * 인앱 브라우저의 쿠키는 앱으로 오지 않는다.
 *
 * 아이디 로그인·가입 폼 **아래**에 둔다. 위의 구분선('또는')도 이 칸의 것이라, 제공자가 없으면 함께 사라진다.
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
    const returned = oauthErrorMessageFrom(new URLSearchParams(window.location.search));
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
    // 앱이 내려가도 돌아와서 받아 가도록 기기에 적어 둔다(lib/app-oauth).
    savePendingLogin(verifier);
    params.set("client", "app");
    params.set("challenge", challenge);
    // 끝 화면이 이 앱을 다시 열게 한다. 카카오톡으로 로그인하면 Chrome에서 끝나기 때문이다.
    const scheme = await appReturnScheme();
    if (scheme) params.set("return", scheme);
    leaveForExternal(apiUrl(`/api/auth/oauth/${provider.id}/start?${params}`), (result) => {
      void (async () => {
        try {
          const failed = result?.get("oauthError");
          if (result && failed) {
            clearPendingLogin();
            // 처음 온 사람은 나이 확인이 있는 가입 화면에서 다시 누르게 한다(웹과 같은 동작).
            if (failed === "need-age" && mode === "login") {
              router.push("/signup?oauthError=need-age");
              return;
            }
            setError(oauthErrorMessageFrom(result));
            return;
          }
          const claimed = await claimPendingLogin();
          // none: 창에서 취소했거나, 앱 복귀(NativeAppEffects)가 먼저 받아 갔다.
          if (claimed === "failed") setError(oauthErrorMessage("server"));
          if (claimed !== "ok") return;
          await refreshAuth();
          router.push("/dashboard");
          router.refresh();
        } finally {
          setBusy(false);
        }
      })();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        또는 간편 {mode === "signup" ? "가입" : "로그인"}
        <span className="h-px flex-1 bg-border" />
      </div>
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
        {providers.map((provider) => {
          const look = PROVIDER_LOOK[provider.id];
          // 모르는 제공자가 오면(서버가 앞서 배포된 경우) 예전처럼 테마 색 버튼으로 둔다.
          if (!look) {
            return (
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
            );
          }
          return (
            <Button
              key={provider.id}
              type="button"
              variant="outline"
              className={`relative w-full h-11 font-bold rounded-xl hover:brightness-95 ${look.className}`}
              disabled={busy}
              onClick={() => void start(provider)}
            >
              <span className="absolute left-4 flex items-center">{look.mark}</span>
              {look.label}
            </Button>
          );
        })}
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
    </div>
  );
}
