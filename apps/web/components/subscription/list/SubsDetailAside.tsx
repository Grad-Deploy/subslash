import { SubscriptionDetail } from "../SubscriptionDetail";

/**
 * 넓은 화면(xl)에서 목록 오른쪽에 고른 구독의 상세를 두는 칸. 고른 구독은 주소의 ?sub=가 원본이다
 * (SelectedSubSync).
 */
export function SubsDetailAside({
  selectedId,
  outsideList,
  onClose,
  onLeave,
}: {
  selectedId: string | null;
  /** 고른 구독이 있지만 지금 탭·분류의 목록에는 없는지. */
  outsideList: boolean;
  onClose: () => void;
  /** 옆 칸의 구독을 지웠을 때. */
  onLeave: () => void;
}) {
  return (
    <aside
      aria-label="구독 상세"
      className="hidden xl:sticky xl:top-20 xl:block xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto xl:pr-1"
    >
      {selectedId ? (
        <div className="space-y-3">
          {outsideList && (
            <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
              지금 탭·분류의 목록에는 없는 구독이에요.
            </p>
          )}
          <SubscriptionDetail
            key={selectedId}
            id={selectedId}
            headingLevel="h2"
            closeLabel="닫기"
            onClose={onClose}
            onLeave={onLeave}
            className="space-y-6"
          />
        </div>
      ) : (
        <div className="space-y-2 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">구독을 고르면 여기에 자세히 보여요</p>
          <p className="text-xs">목록에서 이름을 누르세요. ↑↓ 키로 넘길 수 있어요.</p>
        </div>
      )}
    </aside>
  );
}
