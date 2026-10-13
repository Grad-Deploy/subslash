"use client";

import { useEffect, useState } from "react";
import {
  CLI_TOOLS,
  CLI_TOOL_SERVICE,
  claudeExportSession,
  summarizeCliUsage,
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
import {
  forgetEvidence,
  mergeEvidence,
  readEvidence,
  saveEvidence,
  type EvidencePart,
  type EvidenceSource,
} from "@lib/pc-usage-evidence";

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

/**
 * 체크인할 수 있는 결과: 구독마다 하나. 같은 구독을 여러 기록으로 셌으면 쓴 날을 합집합으로 합친다 — 이번에 읽은 것과
 * 이 기기에 남은 지난 근거(lib/pc-usage-evidence)를 함께.
 */
export interface PcUsageResult {
  serviceId: CliServiceId;
  days: number;
  /** 센 기록. claude.ai 내보내기(`claudeWeb`)는 PC 기록이 아니다. */
  sources: EvidenceSource[];
  /** 출처마다의 쓴 날과 덮는 때. */
  parts: EvidencePart[];
  /** 둘 이상의 출처에 함께 있던 날. */
  overlap: number;
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
  // 이 화면을 열기 전에 이 기기에 남은 근거. 이번에 읽은 것은 따로 합치고(같은 출처는 이번 것이 앞선다), 저장소에는
  // 아래 effect가 적는다.
  const [saved, setSaved] = useState(() => readEvidence());

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

  /**
   * 이번에 읽어 셀 수 있게 된 근거: 구독으로 쓴 것만(묻는 도구는 '구독'이라고 답한 것, 내보내기는 구독 계정이라고 답한
   * 것). 쓴 날이 0이어도 근거다 — 그 기간에 그 기록으로는 안 썼다는 것이다.
   */
  const freshOf = (serviceId: CliServiceId) => {
    const fresh: { source: EvidenceSource; summary: CliUsageSummary; at: number }[] = [];
    for (const tool of CLI_TOOLS) {
      if (CLI_TOOL_SERVICE[tool] !== serviceId) continue;
      const current = state[tool];
      const summary = summaryOf(tool);
      if (!summary || current.status !== "done" || current.read.files === 0) continue;
      if (isAsked(tool) ? answers[tool] !== true : summary.days === 0) continue;
      fresh.push({ source: tool, summary, at: current.at });
    }
    if (serviceId === "claude-pro" && exportSummary && exportState.status === "done" && webAnswer) {
      fresh.push({ source: "claudeWeb", summary: exportSummary, at: exportState.at });
    }
    return fresh;
  };

  const freshKey = CLI_TOOLS.map((tool) => CLI_TOOL_SERVICE[tool])
    .flatMap((serviceId) =>
      freshOf(serviceId).map(
        (item) => `${serviceId}:${item.source}:${item.at}:${item.summary.dayKeys.join()}`,
      ),
    )
    .join("|");

  /** 이번에 읽은 근거를 저장소에 적는다. */
  const persist = (serviceId: CliServiceId) => {
    for (const item of freshOf(serviceId)) {
      saveEvidence(serviceId, item.source, { days: item.summary.dayKeys, coveredUntil: item.at });
    }
  };

  // 셀 수 있게 된 근거를 이 기기에 남긴다 — 다음에 다른 기록만 읽어도 합칠 수 있게. 저장소(바깥)에만 쓴다.
  useEffect(() => {
    if (!freshKey) return;
    for (const serviceId of new Set(CLI_TOOLS.map((tool) => CLI_TOOL_SERVICE[tool])))
      persist(serviceId);
    // freshKey가 바뀔 때만 적는다(같은 읽기를 화면을 그릴 때마다 다시 적지 않는다).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freshKey]);

  /** 체크인할 수 있는 결과: 이번에 읽은 근거가 있는 구독마다, 남은 근거와 합쳐 쓴 날이 있는 것. */
  const results: PcUsageResult[] = [
    ...new Set(CLI_TOOLS.map((tool) => CLI_TOOL_SERVICE[tool])),
  ].flatMap((serviceId) => {
    const fresh = freshOf(serviceId);
    if (fresh.length === 0) return [];
    const merged = mergeEvidence(
      fresh.map((item) => ({ source: item.source, days: item.summary.dayKeys, at: item.at })),
      saved[serviceId],
      { now: Math.max(...fresh.map((item) => item.at)), windowDays: PC_USAGE_WINDOW_DAYS },
    );
    if (merged.days === 0) return [];
    // API 환산·토큰은 PC 기록에만 있다(내보내기에는 없다).
    const pc = fresh.find((item) => item.source !== "claudeWeb");
    return [
      {
        serviceId,
        days: merged.days,
        sources: merged.parts.filter((part) => part.days > 0).map((part) => part.source),
        parts: merged.parts,
        overlap: merged.overlap,
        summary: pc ? pc.summary : null,
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
    /** 한 구독의 이 기기에 남은 지난 근거를 지운다. 이번에 읽은 것은 그대로 센다. */
    forget: (serviceId: CliServiceId) => {
      forgetEvidence(serviceId);
      persist(serviceId);
      setSaved((prev) => {
        const next = { ...prev };
        delete next[serviceId];
        return next;
      });
    },
  };
}
