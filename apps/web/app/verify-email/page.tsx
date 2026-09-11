import React, { Suspense } from "react";
import type { Metadata } from "next";
import { EmailVerification } from "@components/auth/EmailVerification";

export const metadata: Metadata = {
  title: "이메일 확인 · SubSlash",
  // 주소창의 토큰이 이 페이지에서 나가는 요청의 Referer에 실려 새지 않게 한다.
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function VerifyEmailPage() {
  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-black tracking-tight">가입 이메일 확인</h1>
        <p className="text-sm text-muted-foreground">
          이 주소로 가입한 계정이 본인 것인지 알려주세요.
        </p>
      </div>

      <div className="p-5 sm:p-6 border rounded-2xl bg-card shadow-sm">
        {/* useSearchParams를 쓰는 컴포넌트는 Suspense로 감싸야 빌드가 페이지 전체를
            클라이언트 렌더링으로 밀어내지 않는다. */}
        <Suspense fallback={null}>
          <EmailVerification />
        </Suspense>
      </div>
    </div>
  );
}
