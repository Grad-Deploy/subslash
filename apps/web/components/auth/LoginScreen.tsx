"use client";

import Link from "next/link";
import { useT } from "@lib/i18n";
import { LoginForm } from "./LoginForm";
import { SocialLoginButtons } from "./SocialLoginButtons";

/** 로그인 화면(`/login`). 페이지는 메타데이터를 위해 서버 컴포넌트로 두고, 문구가 있는 본문은 여기서 그린다. */
export function LoginScreen() {
  const t = useT().auth;
  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-black tracking-tight">{t.login.title}</h1>
        <p className="text-sm text-muted-foreground">{t.login.intro}</p>
      </div>

      <div className="p-5 sm:p-6 border rounded-2xl bg-card shadow-sm space-y-4">
        <LoginForm />
        <SocialLoginButtons mode="login" />
      </div>

      <p className="text-xs text-center text-muted-foreground">
        <Link href="/dashboard" className="font-semibold text-primary underline underline-offset-4">
          {t.browseWithoutLogin}
        </Link>
      </p>
    </div>
  );
}
