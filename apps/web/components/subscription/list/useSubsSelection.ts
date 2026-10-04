import { useState } from "react";
import { useRouter } from "next/navigation";
import { useArrowKeySelection } from "@hooks/useArrowKeySelection";

const hrefFor = (id: string) => `/subs?sub=${encodeURIComponent(id)}`;

/**
 * 넓은 화면에서 목록 옆 칸에 연 구독. 원본은 주소의 ?sub=이고(SelectedSubSync가 `setSelectedId`를 부른다),
 * 이 훅은 그 주소를 바꾸는 일을 모은다.
 *
 * 구독을 하나 고른 뒤에만 ↑↓로 넘긴다. 넘길 때는 기록을 쌓지 않는다(replace) — 뒤로 가기는 눌러서 고른
 * 구독으로 돌아간다.
 */
export function useSubsSelection(order: string[]) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useArrowKeySelection({
    order,
    selectedId,
    onSelect: (id) => router.replace(hrefFor(id), { scroll: false }),
  });

  return {
    selectedId,
    setSelectedId,
    select: (id: string) => router.push(hrefFor(id), { scroll: false }),
    clear: () => router.push("/subs", { scroll: false }),
    /** 옆 칸의 구독을 지웠을 때: 목록에서 그다음(없으면 앞) 구독으로 넘어가고, 없으면 비운다. */
    leave: () => {
      const index = selectedId ? order.indexOf(selectedId) : -1;
      const next = index < 0 ? undefined : (order[index + 1] ?? order[index - 1]);
      router.replace(next ? hrefFor(next) : "/subs", { scroll: false });
    },
  };
}
