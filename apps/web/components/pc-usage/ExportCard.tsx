"use client";

import React from "react";
import { FileText } from "lucide-react";
import type { CliUsageSummary } from "@subslash/shared";
import { useT } from "@lib/i18n";
import type { ExportState } from "@hooks/usePcUsageReads";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

/**
 * claude.ai 대화 내보내기 파일(`conversations.json`)의 칸. 웹·앱에서 나눈 대화라 PC 기록(Claude Code)에서 빠지는
 * 사용을 채운다. 파일에 요금제가 없어 구독 계정의 파일인지 답(`children`)을 받아야 숫자를 보인다.
 */
export function ExportCard({
  state,
  summary,
  waitingAnswer,
  onPick,
  children,
}: {
  state: ExportState;
  summary: CliUsageSummary | null;
  waitingAnswer: boolean;
  onPick: () => void;
  children?: React.ReactNode;
}) {
  const t = useT().pcUsage.reader;
  return (
    <section className="space-y-2 rounded-2xl border p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold">{t.claudeWeb}</h2>
        <Button
          type="button"
          size="sm"
          variant={state.status === "done" ? "outline" : "default"}
          disabled={state.status === "reading"}
          onClick={onPick}
        >
          <FileText className="size-4" aria-hidden />
          {state.status === "done" ? t.pickAgain : t.pickFile}
        </Button>
      </div>
      {state.status === "idle" && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">{t.webHelp}</p>
      )}
      {state.status === "reading" && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner className="size-3.5" /> {t.reading}
        </p>
      )}
      {state.status === "failed" && <p className="text-xs text-destructive">{t.webReadFailed}</p>}
      {state.status === "done" && summary && !waitingAnswer && (
        <p className="text-xs font-semibold">
          {summary.days > 0 ? t.used(summary.days, summary.prompts) : t.noUse}
        </p>
      )}
      {state.status === "done" && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">{t.webUntilExport}</p>
      )}
      {children}
    </section>
  );
}
