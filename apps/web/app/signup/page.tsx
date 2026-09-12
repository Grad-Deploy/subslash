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
          계정에는 아이디·이메일과 선택 정보만 저장됩니다. 구독 기록은 이 브라우저에 남습니다.
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
            로그인해도 다른 기기에서 구독 목록이 보이지는 않습니다.
          </strong>{" "}
          계정에는 아직 구독 기록이 저장되지 않아요. 기기를 옮기려면 &lsquo;데이터 백업&rsquo;
          파일로 옮겨 주세요.
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
