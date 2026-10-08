import { cn } from "@lib/utils";
import { useT } from "@lib/i18n";
import type { SubsView } from "./useSubsView";

export type SubsTab = "active" | "killed";

/** 구독 중 / 해지 완료 탭. */
export function SubsTabs({
  tab,
  onChange,
  activeCount,
  killedCount,
}: {
  tab: SubsTab;
  onChange: (tab: SubsTab) => void;
  activeCount: number;
  killedCount: number;
}) {
  const t = useT().subs;
  const tabClass = (on: boolean, color: string) =>
    cn(
      "flex-1 border-b-2 py-3 text-sm font-bold transition-colors",
      on ? color : "border-transparent text-muted-foreground hover:text-foreground",
    );
  return (
    <div className="flex border-b">
      <button
        className={tabClass(tab === "active", "border-primary text-primary")}
        onClick={() => onChange("active")}
      >
        {t.tabs.active(activeCount)}
      </button>
      <button
        className={tabClass(tab === "killed", "border-destructive text-destructive")}
        onClick={() => onChange("killed")}
      >
        {t.tabs.killed(killedCount)}
      </button>
    </div>
  );
}

// 분류 칩. '기타'가 없으면 노션·어도비처럼 기타로 등록된 구독을 분류로 걸러 볼 수 없다.
const CATEGORY_KEYS = ["ott", "music", "shopping", "cloud", "ai", "other"] as const;

/** 분류 칩과 보기 방식(카드/표). 보기 방식은 넓은 화면에만 보인다. */
export function SubsFilterBar({
  category,
  onCategoryChange,
  view,
  onViewChange,
}: {
  category: string;
  onCategoryChange: (category: string) => void;
  view: SubsView;
  onViewChange: (view: SubsView) => void;
}) {
  const t = useT();
  const categoryFilters = [
    { value: "all", label: t.subs.filter.all },
    ...CATEGORY_KEYS.map((value) => ({ value, label: t.value.category[value] })),
  ];
  const viewOptions = [
    { value: "cards", label: t.subs.filter.cards },
    { value: "table", label: t.subs.filter.table },
  ] as const;
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto pb-2 text-xs">
        {categoryFilters.map((c) => (
          <button
            key={c.value}
            onClick={() => onCategoryChange(c.value)}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 font-medium transition-all",
              category === c.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div
        role="group"
        aria-label={t.subs.filter.viewLabel}
        className="hidden shrink-0 items-center rounded-lg border p-0.5 text-xs md:inline-flex"
      >
        {viewOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={view === option.value}
            onClick={() => onViewChange(option.value)}
            className={cn(
              "rounded-md px-3 py-1 font-medium transition-colors",
              view === option.value
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
