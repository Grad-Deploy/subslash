import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { Subscription, UsageLog } from "@subslash/shared";
import { cn } from "@lib/utils";
import { SubCard } from "../SubCard";
import { SubTable } from "../SubTable";
import type { SubsView } from "./useSubsView";

/** 구독 중이면 체크인·해지, 해지 완료면 되살리기·삭제를 단다. */
export type SubsListHandlers =
  | { mode: "active"; onCheckIn: (id: string) => void; onKill: (id: string) => void }
  | { mode: "killed"; onRevive: (id: string) => void; onDelete: (id: string) => void };

/**
 * 내 구독의 목록 한 벌. 표 보기는 넓은 화면(md 이상)에만 있고, 좁은 화면은 표를 골라도 카드다.
 * 구독 중·해지 완료 탭이 같은 모양이라 한 곳에 둔다(예전에는 두 탭에 복사돼 있었다).
 */
export function SubsList({
  subscriptions,
  usageLogs,
  view,
  selectedId,
  onSelect,
  onOrderChange,
  handlers,
}: {
  subscriptions: Subscription[];
  usageLogs: UsageLog[];
  view: SubsView;
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** 표에 보이는 정렬 순서. ↑↓로 넘길 때 이 순서를 따른다. */
  onOrderChange: (ids: string[]) => void;
  handlers: SubsListHandlers;
}) {
  const { mode, ...actions } = handlers;
  return (
    <>
      {view === "table" && (
        <div className="hidden md:block">
          <SubTable
            subscriptions={subscriptions}
            usageLogs={usageLogs}
            mode={mode}
            {...actions}
            selectedId={selectedId}
            onSelect={onSelect}
            onOrderChange={onOrderChange}
            sidePanel
          />
        </div>
      )}
      <div
        className={cn(
          "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1",
          view === "table" && "md:hidden",
        )}
      >
        {subscriptions.map((sub) => (
          <SubCard
            key={sub.id}
            subscription={sub}
            {...actions}
            selected={selectedId === sub.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </>
  );
}

/** 목록이 비었을 때. 이 탭이 무엇을 기다리는지 아이콘과 두 줄로 말한다. */
export function SubsEmptyState({
  Icon,
  title,
  children,
  action,
}: {
  Icon: LucideIcon;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-dashed py-16 text-center">
      <Icon className="mx-auto size-9 text-muted-foreground" aria-hidden />
      <p className="font-bold">{title}</p>
      <p className="text-xs text-muted-foreground">{children}</p>
      {action}
    </div>
  );
}
