"use client";

import React from "react";
import { CLI_TOOLS, type Subscription } from "@subslash/shared";
import { useT } from "@lib/i18n";
import { IS_APP_BUILD } from "@lib/platform";
import { usePcFolderPaths } from "@hooks/usePcFolderPaths";
import { isAsked, usePcUsageReads } from "@hooks/usePcUsageReads";
import { AccountQuestion } from "./AccountQuestion";
import { ExportCard } from "./ExportCard";
import { PcUsageRow } from "./PcUsageRow";
import { ToolCard } from "./ToolCard";
import { WindowsUserField } from "./WindowsUserField";

/**
 * 'PC 기록 읽기'. 사용자가 고른 AI 코딩 도구(Claude Code·Codex·Cursor·Antigravity)의 기록 폴더를 브라우저가 기기
 * 안에서 읽어 최근 30일 중 쓴 날을 센다(lib/pc-usage-reader). claude.ai 대화 내보내기 파일도 고를 수 있고, Claude
 * Code와 함께 고르면 같은 구독의 쓴 날로 합친다(겹치는 날은 한 번).
 */
export function PcUsageReader({ subscriptions }: { subscriptions: readonly Subscription[] }) {
  const t = useT().pcUsage.reader;
  const paths = usePcFolderPaths(t.windowsUserInPath);
  const reads = usePcUsageReads();

  if (IS_APP_BUILD) {
    return <p className="rounded-xl border p-3 text-sm text-muted-foreground">{t.appOnly}</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t.description}</p>
      {paths.windows && (
        <WindowsUserField value={paths.windowsUser} onChange={paths.setWindowsUser} />
      )}
      {CLI_TOOLS.map((tool) => {
        const current = reads.state[tool];
        return (
          <ToolCard
            key={tool}
            tool={tool}
            path={paths.pathOf(tool)}
            pathReady={paths.pathReady}
            state={current}
            summary={reads.summaryOf(tool)}
            waitingAnswer={reads.waitingAnswer(tool)}
            onPick={() => void reads.pick(tool)}
          >
            {isAsked(tool) && current.status === "done" && current.read.files > 0 && (
              <AccountQuestion
                tool={tool}
                answer={reads.answers[tool]}
                onAnswer={(value) => reads.answer(tool, value)}
              />
            )}
          </ToolCard>
        );
      })}
      <ExportCard
        state={reads.exportState}
        summary={reads.exportSummary}
        waitingAnswer={reads.webAnswer === null}
        onPick={() => void reads.pickExport()}
      >
        {reads.exportState.status === "done" && reads.exportState.session.prompts.length > 0 && (
          <AccountQuestion tool="claudeWeb" answer={reads.webAnswer} onAnswer={reads.answerWeb} />
        )}
      </ExportCard>
      {reads.results.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold">{t.results}</h2>
          <ul className="space-y-2">
            {reads.results.map(({ serviceId, days, sources, summary }) => (
              <PcUsageRow
                key={serviceId}
                serviceId={serviceId}
                days={days}
                sources={sources}
                apiUsd={summary && summary.api.pricedRequests > 0 ? summary.api.usd : null}
                tokens={summary && summary.api.tokens > 0 ? summary.api.tokens : null}
                subscriptions={subscriptions}
              />
            ))}
          </ul>
        </section>
      )}
      <p className="text-xs leading-relaxed text-muted-foreground">{t.privacy}</p>
    </div>
  );
}
