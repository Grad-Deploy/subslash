import React from "react";
import Link from "next/link";
import { SignupForm } from "@components/auth/SignupForm";

export const metadata = {
  title: "회원가입 · SubSlash",
};

export default function SignupPage() {
  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-black tracking-tight">회원가입</h1>
        <p className="text-sm text-muted-foreground">
          구독 기록은 이 브라우저에 저장되고, 원할 때만 계정에 저장할 수 있습니다.
        </p>
      </div>

      <div className="p-5 sm:p-6 border rounded-2xl bg-card shadow-sm">
        <SignupForm />
      </div>

      <div className="p-4 border border-dashed rounded-2xl space-y-2 text-xs text-muted-foreground">
        <p>
          <strong className="text-foreground">계정 없이도 그대로 쓸 수 있습니다.</strong> SubSlash의
          기본 경험은 브라우저 안에서 완결되며, 로그인은 선택 기능입니다.
        </p>
        <p>
          <strong className="text-foreground">
            로그인만으로 구독 목록이 다른 기기에 옮겨지지는 않습니다.
          </strong>{" "}
          &lsquo;데이터 백업&rsquo;에서 &lsquo;계정에 저장&rsquo;을 누르면 계정에 저장되고, 다른
          기기에서 &lsquo;계정에서 불러오기&rsquo;로 받을 수 있어요. 자동으로 맞춰지지 않으니 고친
          뒤에는 다시 저장해 주세요.
        </p>
        <p>
          비밀번호는 되돌릴 수 없는 형태(솔트 + scrypt 해시)로만 저장됩니다. 저희도 여러분의
          비밀번호를 볼 수 없습니다.
        </p>
        <p>
          <Link
            href="/dashboard"
            className="font-semibold text-primary underline underline-offset-4"
          >
            로그인 없이 계속 둘러보기 →
          </Link>
        </p>
      </div>
    </div>
  );
}
