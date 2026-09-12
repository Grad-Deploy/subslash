import React from "react";
import type { Metadata } from "next";
import { ForgotPasswordForm } from "@components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "비밀번호 재설정 · SubSlash",
};

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-black tracking-tight">비밀번호 재설정</h1>
        <p className="text-sm text-muted-foreground">
          가입한 이메일로 새 비밀번호를 정할 수 있는 링크를 보내드립니다.
        </p>
      </div>

      <div className="p-5 sm:p-6 border rounded-2xl bg-card shadow-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
