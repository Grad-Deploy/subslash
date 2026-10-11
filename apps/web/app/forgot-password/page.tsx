import React from "react";
import type { Metadata } from "next";
import { AccountPageHeading } from "@components/auth/AccountPageHeading";
import { ForgotPasswordForm } from "@components/auth/ForgotPasswordForm";
import { ko as PAGE_TITLES } from "@lib/i18n/messages/pageTitles";

export const metadata: Metadata = {
  title: PAGE_TITLES.paths["/forgot-password"],
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
