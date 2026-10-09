"use client";

import React, { useState } from "react";
import { FolderOpen } from "lucide-react";
import type { CliTool, CliUsageSummary } from "@subslash/shared";
import { useT } from "@lib/i18n";
import { copyText } from "@lib/native";
import { picksFile } from "@lib/pc-usage-reader";
import type { ToolState } from "@hooks/usePcUsageReads";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

/** 도구 하나의 칸: 기록 폴더 경로, 고르기 버튼, 읽은 결과. */
export function ToolCard({
  tool,
  path,
  pathReady,
  state,
  summary,
  waitingAnswer,
  onPick,
  children,
}: {
  tool: CliTool;
  /** 보여 줄 기록 폴더 경로. */
  path: string;
  /** 경로가 다 채워졌는지(윈도우는 사용자 이름을 적어야 한다). 아니면 복사하지 않는다. */
  pathReady: boolean;
  state: ToolState;
  summary: CliUsageSummary | null;
  /** 계정을 묻는 도구가 아직 답을 받지 못했는지. 그동안은 세지 않으므로 숫자를 보이지 않는다. */
  waitingAnswer: boolean;
  onPick: () => void;
  children?: React.ReactNode;
}) {
  const t = useT().pcUsage.reader;
  const [copied, setCopied] = useState(false);
  const waiting = waitingAnswer && summary !== null && summary.days === 0;
  const used = (days: number, count: number) =>
    // Antigravity는 질문이 아니라 대화마다 마지막 입력 시각 하나만 남는다.
    tool === "antigravity" ? t.usedConversations(days, count) : t.used(days, count);

  return (
    <section className="space-y-2 rounded-2xl border p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold">{t[tool]}</h2>
        <Button
          type="button"
          size="sm"
          variant={state.status === "done" ? "outline" : "default"}
          disabled={state.status === "reading"}
          onClick={onPick}
        >
          <FolderOpen className="size-4" aria-hidden />
          {state.status === "done" ? t.pickAgain : picksFile(tool) ? t.pickFile : t.pick}
        </Button>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">{t.folder}</span>
        <code className="min-w-0 flex-1 truncate rounded bg-secondary px-1.5 py-0.5">{path}</code>
        <button
          type="button"
          className="shrink-0 font-semibold underline disabled:no-underline disabled:opacity-50"
          disabled={!pathReady}
          title={pathReady ? undefined : t.copyNeedsUser}
          onClick={async () => setCopied(await copyText(path))}
        >
          {copied ? t.copied : t.copy}
        </button>
      </div>
      {tool === "cursor" && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">{t.cursorNote}</p>
      )}
      {state.status === "idle" && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {picksFile(tool) ? t.cursorFileTip : t.hiddenTip}
        </p>
      )}
      {state.status === "reading" && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner className="size-3.5" /> {t.reading}
        </p>
      )}
      {state.status === "failed" && <p className="text-xs text-destructive">{t.readFailed}</p>}
      {state.status === "done" && state.read.files === 0 && (
        <p className="text-xs text-muted-foreground">
          {picksFile(tool) ? t.cursorNoFile : t.noFiles}
        </p>
      )}
      {state.status === "done" && state.read.files > 0 && summary && (
        <div className="space-y-0.5 text-xs">
          {!waiting && (
            <p className="font-semibold">
              {summary.days > 0 ? used(summary.days, summary.prompts) : t.noUse}
            </p>
          )}
          {summary.planType && <p className="text-muted-foreground">{t.plan(summary.planType)}</p>}
          {!waiting && summary.api.unpricedRequests > 0 && (
            <p className="text-muted-foreground">
              {t.unpriced(summary.api.unpricedRequests, summary.api.unpricedModels.join(", "))}
            </p>
          )}
          {summary.excludedSessions > 0 && (
            <p className="text-muted-foreground">{t.excluded(summary.excludedSessions)}</p>
          )}
          {!waiting && summary.unknownSessions > 0 && (
            <p className="text-muted-foreground">{t.unknown(summary.unknownSessions)}</p>
          )}
          {state.read.unrecognized > 0 && (
            <p className="text-muted-foreground">{t.unrecognized(state.read.unrecognized)}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
