"use client";

import type { ReactNode } from "react";
import { cn } from "@lib/utils";

export interface AppStep {
  title: string;
  body: ReactNode;
  /** 다음 버튼 문구. 사용자가 방금 한 일을 말하게 한다("붙여 넣었어요"). */
  next: string;
}

/**
 * 한 화면에 한 가지 일만 보여주는 단계 안내. 단계는 화면 안 상태로만 두고 주소는 바꾸지 않는다
 * (앱은 정적 내보내기라 새 경로를 만들지 않는다).
 */
export function AppStepper({
  steps,
  index,
  onIndex,
  onDone,
}: {
  steps: AppStep[];
  index: number;
  onIndex: (next: number) => void;
  onDone: () => void;
}) {
  const step = steps[index];
  const last = index === steps.length - 1;

  return (
    <div className="flex min-h-[calc(100dvh-14rem)] flex-col gap-4">
      <div className="flex gap-1" aria-hidden>
        {steps.map((s, i) => (
          <span
            key={s.title}
            className={cn("h-1 flex-1 rounded-full", i <= index ? "bg-primary" : "bg-secondary")}
          />
        ))}
      </div>

      <div>
        <p className="text-xs font-bold text-muted-foreground" aria-live="polite">
          {index + 1} / {steps.length}
        </p>
        <h2 className="mt-0.5 text-xl font-black tracking-tight">{step.title}</h2>
      </div>

      <div className="space-y-3 text-[13px] leading-relaxed text-muted-foreground">{step.body}</div>

      <div className="mt-auto flex gap-2 pt-2">
        <button
          type="button"
          onClick={() => onIndex(index - 1)}
          disabled={index === 0}
          className="h-11 w-24 shrink-0 rounded-xl border text-sm font-bold disabled:opacity-40"
        >
          이전
        </button>
        <button
          type="button"
          onClick={() => (last ? onDone() : onIndex(index + 1))}
          className="h-11 flex-1 rounded-xl bg-primary text-sm font-bold text-primary-foreground"
        >
          {step.next}
        </button>
      </div>
    </div>
  );
}

/** 사람들이 멈추는 단계(보안 경고 등)에 미리 두는 안내. */
export function StepTip({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-secondary px-3 py-2.5 text-xs leading-relaxed text-foreground">
      <p className="mb-0.5 font-bold">{title}</p>
      {children}
    </div>
  );
}
