import React from "react";
import { ProfileForm } from "@components/auth/ProfileForm";
import { ChangePasswordSection } from "@components/auth/ChangePasswordSection";
import { LoginMethodsSection } from "@components/auth/LoginMethodsSection";
import { DeleteAccountSection } from "@components/auth/DeleteAccountSection";
import { AccountPageHeading } from "@components/auth/AccountPageHeading";
import { DataSettings } from "@components/settings/DataSettings";

export const metadata = {
  title: "내 정보 · SubSlash",
};

export default function ProfilePage() {
  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      <AccountPageHeading page="me" />

      <div className="p-5 sm:p-6 border rounded-2xl bg-card shadow-sm">
        <ProfileForm />
      </div>

      <DataSettings />

      <LoginMethodsSection />

      <ChangePasswordSection />

      <DeleteAccountSection />
    </div>
  );
}
