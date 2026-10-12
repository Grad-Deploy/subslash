"use client";

import { useState } from "react";
import {
  CLI_TOOLS,
  CLI_TOOL_SERVICE,
  claudeExportSession,
  summarizeCliUsage,
  unionUsedDays,
  type CliServiceId,
  type CliSessionUsage,
  type CliTool,
  type CliUsageSummary,
} from "@subslash/shared";
import {
  pickExportFile,
  pickSessionFolder,
  readSessionFiles,
  type FolderRead,
} from "@lib/pc-usage-reader";

export const PC_USAGE_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 기록에 어떤 계정으로 썼는지가 없어 사용자에게 묻는 도구. 답하기 전에는 세지 않는다 — 모르는 것을 구독 사용으로
 * 치지 않는다. Codex·Cursor는 기록에 요금제가 있어 묻지 않는다.
 */
export type AskedTool = "claude" | "antigravity";
export const isAsked = (tool: CliTool): tool is AskedTool =>
  tool === "claude" || tool === "antigravity";

export type ToolState =
  | { status: "idle" }
  | { status: "reading" }
  | { status: "failed" }
  | { status: "done"; read: FolderRead; at: number };

/** claude.ai 대화 내보내기 파일(`conversations.json`)을 읽은 상태. */
export type ExportState =
  | { status: "idle" }
  | { status: "reading" }
  | { status: "failed" }
  | { status: "done"; session: CliSessionUsage; at: number };

/** 체크인할 수 있는 결과: 구독마다 하나. 같은 구독을 여러 기록으로 셌으면 쓴 날을 합집합으로 합친다. */
export interface PcUsageResult {
  serviceId: CliServiceId;
  days: number;
  /** 센 기록. claude.ai 내보내기(`claudeWeb`)는 PC 기록이 아니다. */
  sources: (CliTool | "claudeWeb")[];
  /** PC 기록에만 있는 값(API 환산·토큰). 내보내기에는 없다. */
  summary: CliUsageSummary | null;
}

/** 지금 시각. 화면을 그리는 중이 아니라 폴더를 고를 때 부른다. */
const currentTime = () => Date.now();

/**
 * 도구마다 고른 기록을 읽고 최근 30일로 요약한다. 계정을 묻는 도구는 답(`answers`)을 구독 여부로 쓴다.
 */
export function usePcUsageReads() {
  const [state, setState] = useState<Record<CliTool, ToolState>>({
    claude: { status: "idle" },
    codex: { status: "idle" },
    cursor: { status: "idle" },
    antigravity: { status: "idle" },
  });
  // 기록에 계정이 없는 도구의 답: true면 구독 계정으로 쓴다.
  const [answers, setAnswers] = useState<Record<AskedTool, boolean | null>>({
    claude: null,
    antigravity: null,
  });
  // claude.ai 내보내기. 파일에는 요금제가 없어, 구독 계정의 파일인지 답(`webAnswer`)을 받아야 센다.
  const [exportState, setExportState] = useState<ExportState>({ status: "idle" });
  const [webAnswer, setWebAnswer] = useState<boolean | null>(null);

  const pick = async (tool: CliTool) => {
    const now = currentTime();
    // 파일을 고친 시각이 기간보다 앞이면 그 안의 질문도 기간 밖이다. 하루 여유를 둔다.
    const since = now - (PC_USAGE_WINDOW_DAYS + 1) * DAY_MS;
    try {
      const files = await pickSessionFolder(tool, since);
      if (!files) return;
      setState((prev) => ({ ...prev, [tool]: { status: "reading" } }));
      const read = await readSessionFiles(files, tool, since);
      setState((prev) => ({ ...prev, [tool]: { status: "done", read, at: now } }));
    } catch (error) {
      console.error("[pc-usage] 기록 폴더를 읽지 못했습니다", error);
      setState((prev) => ({ ...prev, [tool]: { status: "failed" } }));
    }
  };

  const pickExport = async () => {
    const now = currentTime();
    try {
      const file = await pickExportFile();
      if (!file) return;
      setExportState({ status: "reading" });
      // 대화 내용이 든 큰 파일이다. 사람이 보낸 시각만 남기고 나머지는 이 함수가 끝나면 버려진다.
      const session = claudeExportSession(JSON.parse(await file.text()));
      setExportState(
        session.recognized ? { status: "done", session, at: now } : { status: "failed" },
      );
    } catch (error) {
      console.error("[pc-usage] 내보내기 파일을 읽지 못했습니다", error);
      setExportState({ status: "failed" });
    }
  };

  const exportSummary: CliUsageSummary | null =
    exportState.status === "done"
      ? summarizeCliUsage([exportState.session], {
          now: exportState.at,
          windowDays: PC_USAGE_WINDOW_DAYS,
          subscriptionDefault: webAnswer,
        })
      : null;

  const summaryOf = (tool: CliTool): CliUsageSummary | null => {
    const current = state[tool];
    if (current.status !== "done") return null;
    // Codex·Cursor는 기록에 요금제가 있다. Claude Code·Antigravity는 답한 대로 본다.
    const subscriptionDefault = isAsked(tool) ? answers[tool] : null;
    return summarizeCliUsage(current.read.sessions, {
      now: current.at,
      windowDays: PC_USAGE_WINDOW_DAYS,
      subscriptionDefault,
    });
  };

  /** 아직 답을 기다리는 도구인지. 그동안은 세지 않으므로 숫자를 보이지 않는다. */
  const waitingAnswer = (tool: CliTool) => isAsked(tool) && answers[tool] === null;

  /** 체크인할 수 있는 결과: 쓴 날이 있고, 묻는 도구는 답을 받은 것. 내보내기는 Claude 구독에 합친다. */
  const results: PcUsageResult[] = CLI_TOOLS.flatMap((tool) => {
    const summary = summaryOf(tool);
    const counted = summary && summary.days > 0 && !waitingAnswer(tool) ? summary : null;
    const serviceId = CLI_TOOL_SERVICE[tool];
    const web =
      serviceId === "claude-pro" && exportSummary && exportSummary.days > 0 ? exportSummary : null;
    const parts = [counted, web].filter((part): part is CliUsageSummary => part !== null);
    if (parts.length === 0) return [];
    return [
      {
        serviceId,
        days: unionUsedDays(parts),
        sources: [...(counted ? [tool] : []), ...(web ? ["claudeWeb" as const] : [])],
        summary: counted,
      },
    ];
  });

  return {
    state,
    answers,
    answer: (tool: AskedTool, value: boolean) => setAnswers((prev) => ({ ...prev, [tool]: value })),
    pick,
    summaryOf,
    exportState,
    exportSummary,
    webAnswer,
    answerWeb: setWebAnswer,
    pickExport,
    waitingAnswer,
    results,
  };
}
