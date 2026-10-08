import React from "react";
import type { Metadata } from "next";
import { AccountPageHeading } from "@components/auth/AccountPageHeading";
import { ForgotPasswordForm } from "@components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "비밀번호 재설정 · SubSlash",
};

export default function ForgotPasswordPage() {
  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      <AccountPageHeading page="forgot" />

      <div className="p-5 sm:p-6 border rounded-2xl bg-card shadow-sm">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
