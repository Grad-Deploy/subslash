import React from "react";
import { ProfileForm } from "@components/auth/ProfileForm";

export const metadata = {
  title: "내 정보 · SubSlash",
};

export default function ProfilePage() {
  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-black tracking-tight">내 정보</h1>
        <p className="text-sm text-muted-foreground">로그인한 계정의 정보입니다.</p>
      </div>

      <div className="p-5 sm:p-6 border rounded-2xl bg-card shadow-sm">
        <ProfileForm />
      </div>
    </div>
  );
}
