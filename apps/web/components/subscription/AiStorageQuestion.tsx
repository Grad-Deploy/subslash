"use client";

import React, { useId, useState } from "react";
import { aiStorageFit } from "@subslash/shared";
import { useStore } from "@lib/store";
import { useServiceNames, useT } from "@lib/i18n";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { GoogleStorageCheck } from "./GoogleStorageCheck";

/**
 * 체크인의 두 번째 질문: 요금제 용량 중 얼마나 쓰고 있는지. 용량과 AI를 함께 주는 요금제(구글 원·Google AI Pro의
 * AI Plus·AI Pro, `isAiStoragePlan`)에만 보인다. Gemini를 적게 써도 드라이브·포토에 둔 것이 많으면 해지할 수 없으므로
 * 쓴 날과 함께 본다(utils/valueMetric의 `aiStorage`).
 *
 * 답은 적는 즉시 구독에 둔다(`setStoragePercent`) — `FreeTierQuestion`처럼 한꺼번에 체크인도 같은 값을 쓰고, 다음
 * 체크인에 지난번 값이 채워져 있다. 비워 두면(모름) 쓴 날로만 판단한다.
 */
export function AiStorageQuestion({ subscriptionId }: { subscriptionId: string }) {
  const sub = useStore((state) => state.subscriptions.find((s) => s.id === subscriptionId));
  const setStoragePercent = useStore((state) => state.setStoragePercent);
  const t = useT();
  const names = useServiceNames();
  const a = t.checkin.aiStorage;
  const labelId = useId();
  // 치는 중인 글자('0.')는 따로 둔다 — 저장한 숫자로만 그리면 '0.'이 곧바로 '0'이 되어 소수를 칠 수 없다.
  const [draft, setDraft] = useState<string | null>(null);
  if (!sub) return null;
  const percent = sub.storagePercent ?? null;
  const fit = percent === null ? null : aiStorageFit(sub, percent);
  const set = (next: number | null) => setStoragePercent(subscriptionId, next);

  return (
    <div className="space-y-2 rounded-xl border px-3 py-3">
      <p id={labelId} className="text-center text-sm font-bold">
        {a.question}
      </p>
      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">{a.hint}</p>
      <div className="flex items-center justify-center gap-2">
        <Input
          type="number"
          inputMode="decimal"
          min={0}
          max={100}
          step="any"
          aria-labelledby={labelId}
          placeholder={a.unknown}
          className="h-10 w-28 rounded-xl text-center font-bold"
          value={draft ?? (percent === null ? "" : String(percent))}
          onChange={(e) => {
            const raw = e.target.value.trim();
            const next = Number(raw);
            setDraft(raw);
            set(raw === "" || !Number.isFinite(next) ? null : next);
          }}
          onBlur={() => setDraft(null)}
        />
        <span className="text-sm font-bold">%</span>
        {percent !== null && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-lg text-xs"
            onClick={() => {
              setDraft(null);
              set(null);
            }}
          >
            {a.clear}
          </Button>
        )}
      </div>
      {fit && (
        <p className="text-center text-[11px] text-muted-foreground">
          {t.checkin.input.storageOf(
            names.plan(fit.planName),
            t.checkin.input.storageGB(fit.usedGB),
          )}
        </p>
      )}
      <GoogleStorageCheck
        subscription={sub}
        exact
        onMeasured={(_quantity, exact) => {
          setDraft(null);
          set(exact);
        }}
      />
    </div>
  );
}
