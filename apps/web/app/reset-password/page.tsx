import React, { Suspense } from "react";
import type { Metadata } from "next";
import { AccountPageHeading } from "@components/auth/AccountPageHeading";
import { ResetPassword } from "@components/auth/ResetPassword";

export const metadata: Metadata = {
  title: "새 비밀번호 정하기 · SubSlash",
  // 주소창의 토큰이 이 페이지에서 나가는 요청의 Referer에 실려 새지 않게 한다.
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto py-6 space-y-6">
      <AccountPageHeading page="reset" />

      <div className="p-5 sm:p-6 border rounded-2xl bg-card shadow-sm">
        {/* useSearchParams를 쓰는 컴포넌트는 Suspense로 감싸야 빌드가 페이지 전체를
            클라이언트 렌더링으로 밀어내지 않는다. */}
        <Suspense fallback={null}>
          <ResetPassword />
        </Suspense>
      </div>
    </div>
  );
}
