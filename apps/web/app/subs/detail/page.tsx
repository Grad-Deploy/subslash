"use client";

import React, { Suspense, useEffect } from "react";
import { useIsClient } from "@hooks/useIsClient";
import { useRouter, useSearchParams } from "next/navigation";
import { SubscriptionDetail } from "../../../components/subscription/SubscriptionDetail";

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin text-3xl">✂️</div>
    </div>
  );
}

/**
 * 구독 상세 페이지. 넓은 화면에서는 내 구독 목록 옆 칸(/subs?sub=)에 열리고, 좁은 화면에서는
 * 이 페이지로 온다. 구독 ID는 경로가 아니라 `?id=`로 받는다(lib/routes 참고).
 */
function DetailFromQuery() {
  const router = useRouter();
  const id = useSearchParams().get("id");
  const mounted = useIsClient();

  useEffect(() => {
    if (!id) router.replace("/subs");
  }, [id, router]);

  // 구독은 브라우저 저장소에 있어 서버에서는 그릴 수 없다.
  if (!mounted || !id) return <Spinner />;

  return (
    <SubscriptionDetail
      id={id}
      className="max-w-2xl mx-auto"
      onClose={() => router.back()}
      closeLabel="← 뒤로 가기"
      onLeave={() => router.push("/subs")}
    />
  );
}

export default function SubscriptionDetailPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <DetailFromQuery />
    </Suspense>
  );
}
