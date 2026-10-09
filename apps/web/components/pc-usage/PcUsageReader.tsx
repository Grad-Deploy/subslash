"use client";

import React, { useState } from "react";
import { FolderOpen } from "lucide-react";
import { summarizeCliUsage, type CliUsageSummary, type Subscription } from "@subslash/shared";
import { useT } from "@lib/i18n";
import { copyText } from "@lib/native";
import { IS_APP_BUILD } from "@lib/platform";
import {
  folderPath,
  isWindowsUserName,
  pickSessionFolder,
  readSessionFiles,
  type CliTool,
  type FolderRead,
  type PcPlatform,
} from "@lib/pc-usage-reader";
import type { PcUsageServiceId } from "@lib/pc-usage";
import { PcUsageRow } from "./PcUsageRow";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";

const WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const TOOLS = ["claude", "codex", "cursor", "antigravity"] as const satisfies readonly CliTool[];

const SERVICE: Record<CliTool, PcUsageServiceId> = {
  claude: "claude-pro",
  codex: "chatgpt-plus",
  cursor: "cursor-pro",
  antigravity: "google-ai-pro",
};

/**
 * 기록에 어떤 계정으로 썼는지가 없어 사용자에게 묻는 도구. 답하기 전에는 세지 않는다 — 모르는 것을 구독 사용으로
 * 치지 않는다. Codex·Cursor는 기록에 요금제가 있어 묻지 않는다.
 */
type AskedTool = "claude" | "antigravity";
const isAsked = (tool: CliTool): tool is AskedTool => tool === "claude" || tool === "antigravity";

function detectPlatform(): PcPlatform {
  if (typeof navigator === "undefined") return "windows";
  if (/Windows/i.test(navigator.userAgent)) return "windows";
  if (/Mac/i.test(navigator.userAgent)) return "mac";
  return "linux";
}

/** 지금 시각. 화면을 그리는 중이 아니라 폴더를 고를 때 부른다. */
const currentTime = () => Date.now();

const WINDOWS_USER_KEY = "subslash-pc-usage-windows-user";

function loadWindowsUser(): string {
  try {
    return localStorage.getItem(WINDOWS_USER_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveWindowsUser(name: string) {
  try {
    if (name) localStorage.setItem(WINDOWS_USER_KEY, name);
    else localStorage.removeItem(WINDOWS_USER_KEY);
  } catch {
    // 저장소를 못 쓰면 이번만 쓴다.
  }
}

type ToolState =
  | { status: "idle" }
  | { status: "reading" }
  | { status: "failed" }
  | { status: "done"; read: FolderRead; at: number };

/**
 * 'PC 기록 읽기'. 사용자가 고른 AI 코딩 도구(Claude Code·Codex·Cursor·Antigravity)의 기록 폴더를 브라우저가 기기
 * 안에서 읽어 최근 30일 중 쓴 날을 센다(lib/pc-usage-reader).
 */
export function PcUsageReader({ subscriptions }: { subscriptions: readonly Subscription[] }) {
  const t = useT().pcUsage.reader;
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
  // 이 화면은 기기에서 그린 뒤에만 보이므로(페이지가 마운트를 기다린다) 처음 값에서 저장소를 읽어도 된다.
  const [platform] = useState(detectPlatform);
  const windows = platform === "windows";
  const [windowsUser, setWindowsUser] = useState(loadWindowsUser);
  const pathReady = !windows || isWindowsUserName(windowsUser);
  const pathOf = (tool: CliTool) => folderPath(tool, platform, windowsUser || t.windowsUserInPath);

  if (IS_APP_BUILD) {
    return <p className="rounded-xl border p-3 text-sm text-muted-foreground">{t.appOnly}</p>;
  }

  const pick = async (tool: CliTool) => {
    const now = currentTime();
    const since = now - (WINDOW_DAYS + 1) * DAY_MS;
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
      windowDays: WINDOW_DAYS,
      subscriptionDefault,
    });
  };

  const rows = TOOLS.map((tool) => ({ tool, summary: summaryOf(tool) })).filter(
    ({ tool, summary }) =>
      summary && summary.days > 0 && (!isAsked(tool) || answers[tool] !== null),
  );

  const question = (tool: AskedTool) => {
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
              variant={answers[tool] === value ? "default" : "outline"}
              aria-pressed={answers[tool] === value}
              onClick={() => setAnswers((prev) => ({ ...prev, [tool]: value }))}
            >
              {value ? copy.yes : copy.no}
            </Button>
          ))}
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">{copy.hint}</p>
      </fieldset>
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t.description}</p>
      {windows && (
        <label className="block space-y-1 rounded-2xl border p-3">
          <span className="text-xs font-bold">{t.windowsUser}</span>
          <Input
            value={windowsUser}
            placeholder={t.windowsUserPlaceholder}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => {
              const next = event.target.value.trim();
              if (next && !isWindowsUserName(next)) return;
              setWindowsUser(next);
              saveWindowsUser(next);
            }}
          />
          <span className="block text-[11px] leading-relaxed text-muted-foreground">
            {t.windowsUserHint}
          </span>
        </label>
      )}
      {TOOLS.map((tool) => {
        const current = state[tool];
        return (
          <ToolCard
            key={tool}
            tool={tool}
            path={pathOf(tool)}
            pathReady={pathReady}
            state={current}
            summary={summaryOf(tool)}
            waitingAnswer={isAsked(tool) && answers[tool] === null}
            onPick={() => void pick(tool)}
          >
            {isAsked(tool) && current.status === "done" && current.read.files > 0 && question(tool)}
          </ToolCard>
        );
      })}
      {rows.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-bold">{t.results}</h2>
          <ul className="space-y-2">
            {rows.map(({ tool, summary }) => (
              <PcUsageRow
                key={tool}
                serviceId={SERVICE[tool]}
                days={summary!.days}
                apiUsd={summary!.api.pricedRequests > 0 ? summary!.api.usd : null}
                tokens={summary!.api.tokens > 0 ? summary!.api.tokens : null}
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

function ToolCard({
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
          {state.status === "done" ? t.pickAgain : t.pick}
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
        <p className="text-[11px] leading-relaxed text-muted-foreground">{t.hiddenTip}</p>
      )}
      {state.status === "reading" && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner className="size-3.5" /> {t.reading}
        </p>
      )}
      {state.status === "failed" && <p className="text-xs text-destructive">{t.readFailed}</p>}
      {state.status === "done" && state.read.files === 0 && (
        <p className="text-xs text-muted-foreground">{t.noFiles}</p>
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
