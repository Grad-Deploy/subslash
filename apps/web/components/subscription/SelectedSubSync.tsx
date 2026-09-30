"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isWideScreen } from "@lib/wide-screen";
import { subscriptionDetailHref } from "@lib/routes";

/**
 * 주소의 `?sub=`를 옆 칸에 열 구독으로 쓴다. 주소에 두면 새로고침·링크 공유·뒤로
 * 가기가 그대로 동작한다. useSearchParams는 Suspense 안에서만 쓸 수 있어 따로 뺐다.
 */
export function SelectedSubSync({ onChange }: { onChange: (id: string | null) => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selected = searchParams.get("sub");

  useEffect(() => {
    // 옆 칸은 넓은 화면에만 있다. 좁은 화면에서 이 주소로 오면 상세 페이지로 보낸다.
    if (selected && !isWideScreen()) {
      router.replace(subscriptionDetailHref(selected));
      return;
    }
    onChange(selected);
  }, [selected, onChange, router]);

  return null;
}
