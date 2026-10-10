"use client";

import { useState } from "react";
import { CLI_TOOLS, summarizeCliUsage, type CliTool, type CliUsageSummary } from "@subslash/shared";
import { pickSessionFolder, readSessionFiles, type FolderRead } from "@lib/pc-usage-reader";

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

  /** 체크인할 수 있는 결과: 쓴 날이 있고, 묻는 도구는 답을 받은 것. */
  const results = CLI_TOOLS.flatMap((tool) => {
    const summary = summaryOf(tool);
    return summary && summary.days > 0 && !waitingAnswer(tool) ? [{ tool, summary }] : [];
  });

  return {
    state,
    answers,
    answer: (tool: AskedTool, value: boolean) => setAnswers((prev) => ({ ...prev, [tool]: value })),
    pick,
    summaryOf,
    waitingAnswer,
    results,
  };
}
