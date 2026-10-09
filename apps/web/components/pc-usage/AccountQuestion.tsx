"use client";

import React from "react";
import { useT } from "@lib/i18n";
import type { AskedTool } from "@hooks/usePcUsageReads";
import { Button } from "../ui/button";

/**
 * 기록에 어떤 계정으로 썼는지가 없는 도구에 묻는 칸. Claude Code는 로그인 방식(구독·API 키), Antigravity는 Google AI
 * 구독 계정인지를 묻는다. 답하기 전에는 세지 않는다.
 */
export function AccountQuestion({
  tool,
  answer,
  onAnswer,
}: {
  tool: AskedTool;
  /** true면 구독 계정으로 쓴다. 아직 답하지 않았으면 null. */
  answer: boolean | null;
  onAnswer: (value: boolean) => void;
}) {
  const t = useT().pcUsage.reader;
  const copy =
    tool === "claude"
      ? {
          title: t.loginQuestion,
          hint: t.loginHint,
          yes: t.loginSubscription,
          no: t.loginApiKey,
        }
      : {
          title: t.antigravityQuestion,
          hint: t.antigravityHint,
          yes: t.antigravityYes,
          no: t.antigravityNo,
        };
  return (
    <fieldset className="space-y-1.5 rounded-xl bg-secondary/60 p-2.5">
      <legend className="sr-only">{copy.title}</legend>
      <p className="text-xs font-bold">{copy.title}</p>
      <div className="flex flex-wrap gap-2">
        {([true, false] as const).map((value) => (
          <Button
            key={String(value)}
            type="button"
            size="sm"
            variant={answer === value ? "default" : "outline"}
            aria-pressed={answer === value}
            onClick={() => onAnswer(value)}
          >
            {value ? copy.yes : copy.no}
          </Button>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{copy.hint}</p>
    </fieldset>
  );
}
