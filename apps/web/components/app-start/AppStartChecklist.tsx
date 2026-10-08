"use client";

import { Check, X } from "lucide-react";
import { useStoredFlag } from "@hooks/useStoredFlag";
import { ownerScopedKey, readOwnerScoped } from "@lib/owner-scoped";
import { useStore } from "@lib/store";
import { cn } from "@lib/utils";
import { useT } from "@lib/i18n";

const DISMISSED_KEY = "subslash_app_start_dismissed";

interface AppStartChecklistProps {
  hasSubscription: boolean;
  hasCheckIn: boolean;
  remindersOn: boolean;
  onAdd: () => void;
  onCheckIn: () => void;
  onReminders: () => void;
}

/**
 * 앱 대시보드의 '시작하기' 체크리스트. 설명 카드를 읽게 하는 대신 해야 할 일 세 가지와 진행만
 * 보여준다. 화면을 막지 않고, 닫으면 다시 나오지 않는다. 기기 알림이 앱에만 있어 웹에는 없다.
 *
 * 닫음은 기록 주인(비로그인·계정)마다 따로 둔다 — 로그아웃하면 비로그인의 시작하기가 처음부터 보이고, 다시
 * 로그인하면 그 계정에서 닫은 대로 돌아온다(lib/owner-scoped).
 */
export function AppStartChecklist({
  hasSubscription,
  hasCheckIn,
  remindersOn,
  onAdd,
  onCheckIn,
  onReminders,
}: AppStartChecklistProps) {
  const s = useT().reminders.start;
  const owner = useStore((state) => state.recordsOwner);
  const dismissedKey = ownerScopedKey(DISMISSED_KEY, owner);
  // 주인별로 나누기 전에 닫은 것은 지금 주인의 칸으로 옮긴다.
  if (typeof window !== "undefined") {
    try {
      readOwnerScoped(localStorage, DISMISSED_KEY, owner);
    } catch {}
  }
  // 하이드레이션 동안은 숨긴다. 닫은 사람에게 한 번 번쩍이지 않게.
  const [dismissed, dismiss] = useStoredFlag(dismissedKey, true);
  if (dismissed) return null;

  const steps = [
    { key: "add", label: s.stepAdd, done: hasSubscription, onGo: onAdd },
    { key: "check-in", label: s.stepCheckIn, done: hasCheckIn, onGo: onCheckIn },
    { key: "reminders", label: s.stepReminders, done: remindersOn, onGo: onReminders },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const current = steps.findIndex((s) => !s.done);
  const allDone = current === -1;

  return (
    <section className="rounded-2xl border bg-card px-4 py-3" aria-label={s.label}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold">
          {allDone ? s.done : s.label}
          <span className="ml-1 font-semibold text-muted-foreground">
            {doneCount}/{steps.length}
          </span>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label={s.close}
          className="-mr-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="mt-2 mb-1.5 h-1 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      {allDone ? (
        <p className="py-1 text-xs text-muted-foreground">{s.allDone}</p>
      ) : (
        <ol>
          {steps.map((step, i) => {
            const isNow = i === current;
            return (
              <li key={step.key}>
                <button
                  type="button"
                  onClick={step.done ? undefined : step.onGo}
                  disabled={step.done}
                  className={cn(
                    "flex w-full items-center gap-2.5 py-1.5 text-left text-[13px]",
                    step.done && "text-muted-foreground line-through",
                    isNow && "font-bold",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px]",
                      step.done
                        ? "border-primary bg-primary text-primary-foreground"
                        : isNow
                          ? "border-primary ring-[3px] ring-primary/10"
                          : "border-border",
                    )}
                  >
                    {step.done && <Check className="size-3" strokeWidth={3} aria-hidden />}
                  </span>
                  {step.label}
                  {isNow && (
                    <span className="ml-auto text-[11px] font-medium text-muted-foreground">
                      {s.now}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
