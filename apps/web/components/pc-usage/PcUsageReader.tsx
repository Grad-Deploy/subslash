"use client";

import React from "react";
import { CLI_TOOLS, CLI_TOOL_SERVICE, type Subscription } from "@subslash/shared";
import { useT } from "@lib/i18n";
import { IS_APP_BUILD } from "@lib/platform";
import { usePcFolderPaths } from "@hooks/usePcFolderPaths";
import { isAsked, usePcUsageReads } from "@hooks/usePcUsageReads";
import { AccountQuestion } from "./AccountQuestion";
import { PcUsageRow } from "./PcUsageRow";
import { ToolCard } from "./ToolCard";
import { WindowsUserField } from "./WindowsUserField";

/**
 * 'PC 기록 읽기'. 사용자가 고른 AI 코딩 도구(Claude Code·Codex·Cursor·Antigravity)의 기록 폴더를 브라우저가 기기
 * 안에서 읽어 최근 30일 중 쓴 날을 센다(lib/pc-usage-reader).
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
      {reads.results.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold">{t.results}</h2>
          <ul className="space-y-2">
            {reads.results.map(({ tool, summary }) => (
              <PcUsageRow
                key={tool}
                serviceId={CLI_TOOL_SERVICE[tool]}
                days={summary.days}
                apiUsd={summary.api.pricedRequests > 0 ? summary.api.usd : null}
                tokens={summary.api.tokens > 0 ? summary.api.tokens : null}
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
