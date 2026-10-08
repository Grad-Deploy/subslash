"use client";

import Link from "next/link";
import { useT } from "@lib/i18n";
import { SignupForm } from "./SignupForm";
import { SocialLoginButtons } from "./SocialLoginButtons";

/** 회원가입 화면(`/signup`). 페이지는 메타데이터를 위해 서버 컴포넌트로 두고, 문구가 있는 본문은 여기서 그린다. */
export function SignupScreen() {
  const t = useT().auth;
  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-black tracking-tight">{t.signup.title}</h1>
        <p className="text-sm text-muted-foreground">{t.signup.intro}</p>
      </div>

      <div className="p-5 sm:p-6 border rounded-2xl bg-card shadow-sm space-y-4">
        <SignupForm />
        <SocialLoginButtons mode="signup" />
      </div>

      <div className="p-4 border border-dashed rounded-2xl space-y-2 text-xs text-muted-foreground">
        <p>
          <strong className="text-foreground">{t.signup.optionalTitle}</strong>{" "}
          {t.signup.optionalBody}
        </p>
        <p>{t.signup.syncNote}</p>
        <p>{t.signup.passwordNote}</p>
        <p>
          <Link
            href="/dashboard"
            className="font-semibold text-primary underline underline-offset-4"
          >
            {t.browseWithoutLogin}
          </Link>
        </p>
      </div>
    </div>
  );
}
