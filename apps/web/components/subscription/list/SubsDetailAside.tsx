import { useT } from "@lib/i18n";
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
  const t = useT().subs.aside;
  return (
    <aside
      aria-label={t.label}
      className="hidden xl:sticky xl:top-20 xl:block xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto xl:pr-1"
    >
      {selectedId ? (
        <div className="space-y-3">
          {outsideList && (
            <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">
              {t.outside}
            </p>
          )}
          <SubscriptionDetail
            key={selectedId}
            id={selectedId}
            headingLevel="h2"
            closeLabel={t.close}
            onClose={onClose}
            onLeave={onLeave}
            className="space-y-6"
          />
        </div>
      ) : (
        <div className="space-y-2 rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">{t.pickTitle}</p>
          <p className="text-xs">{t.pickHint}</p>
        </div>
      )}
    </aside>
  );
}
