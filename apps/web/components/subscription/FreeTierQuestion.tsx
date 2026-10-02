"use client";

import React, { useId } from "react";
import type { FreeTierAnswer } from "@subslash/shared";
import { useStore } from "@lib/store";
import { cn } from "@lib/utils";

const OPTIONS: ReadonlyArray<{ value: FreeTierAnswer; label: string }> = [
  { value: "needed", label: "아니요, 유료가 필요했어요" },
  { value: "enough", label: "네, 무료로도 됐을 거예요" },
  { value: "unsure", label: "잘 모르겠어요" },
];

/**
 * 체크인의 두 번째 질문: "무료 요금제로도 충분했을까요?" 무료 요금제가 있는 AI·업무 도구
 * (`asksFreeTier`)에만 보인다. 많이 써도 무료로 되는 일에만 썼다면 맞는 판단은 해지가 아니라 무료로
 * 내리는 것이라, 쓴 날만으로는 알 수 없는 것을 따로 묻는다.
 *
 * 답은 고르는 즉시 구독에 적는다(`setFreeTierAnswer`) — 폰 기록으로 적는 자동 체크인과 한꺼번에
 * 체크인도 같은 답을 쓴다. 부르는 쪽이 넘긴 구독은 창을 열 때의 사본일 수 있어 답은 스토어에서 읽는다.
 */
export function FreeTierQuestion({ subscriptionId }: { subscriptionId: string }) {
  const answer = useStore(
    (state) => state.subscriptions.find((sub) => sub.id === subscriptionId)?.freeTierAnswer,
  );
  const setFreeTierAnswer = useStore((state) => state.setFreeTierAnswer);
  const labelId = useId();

  return (
    <div className="space-y-2 rounded-xl border px-3 py-3">
      <p id={labelId} className="text-center text-sm font-bold">
        무료 요금제로도 충분했을까요?
      </p>
      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        사용 한도에 걸렸거나 유료 모델·기능을 썼다면 유료가 필요했던 거예요.
      </p>
      <div role="radiogroup" aria-labelledby={labelId} className="grid gap-1.5">
        {OPTIONS.map((option) => {
          const checked = answer === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={checked}
              onClick={() => setFreeTierAnswer(subscriptionId, option.value)}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-medium transition",
                checked
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
