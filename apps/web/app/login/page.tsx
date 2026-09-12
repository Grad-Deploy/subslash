import React from "react";
import Link from "next/link";
import { LoginForm } from "@components/auth/LoginForm";

export const metadata = {
  title: "로그인 · SubSlash",
};

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-black tracking-tight">로그인</h1>
        <p className="text-sm text-muted-foreground">
          구독 기록은 이 브라우저에 저장됩니다. 로그인하면 원할 때 계정에 저장해 둘 수 있습니다.
        </p>
      </div>

      <div className="p-5 sm:p-6 border rounded-2xl bg-card shadow-sm">
        <LoginForm />
      </div>

      <p className="text-xs text-center text-muted-foreground">
        <Link href="/dashboard" className="font-semibold text-primary underline underline-offset-4">
          로그인 없이 계속 둘러보기 →
        </Link>
      </p>
    </div>
  );
}
