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
} from "@lib/pc-usage-reader";
import type { PcUsageServiceId } from "@lib/pc-usage";
import { PcUsageRow } from "./PcUsageRow";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Spinner } from "../ui/spinner";

const WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const SERVICE: Record<CliTool, PcUsageServiceId> = { claude: "claude-pro", codex: "chatgpt-plus" };

const isWindows = () => typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent);

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
 * 'PC 기록 읽기'. 사용자가 고른 Claude Code·Codex 기록 폴더를 브라우저가 기기 안에서 읽어 최근 30일 중 쓴 날을
 * 센다(lib/pc-usage-reader). Claude Code는 기록에 어떤 계정으로 썼는지가 없어 로그인 방식을 묻고, 답하기 전에는
 * 세지 않는다 — 모르는 것을 구독 사용으로 치지 않는다.
 */
export function PcUsageReader({ subscriptions }: { subscriptions: readonly Subscription[] }) {
  const t = useT().pcUsage.reader;
  const [state, setState] = useState<Record<CliTool, ToolState>>({
    claude: { status: "idle" },
    codex: { status: "idle" },
  });
  const [claudeLogin, setClaudeLogin] = useState<"subscription" | "apiKey" | null>(null);
  // 이 화면은 기기에서 그린 뒤에만 보이므로(페이지가 마운트를 기다린다) 처음 값에서 저장소를 읽어도 된다.
  const [windows] = useState(isWindows);
  const [windowsUser, setWindowsUser] = useState(loadWindowsUser);
  const pathReady = !windows || isWindowsUserName(windowsUser);
  const pathOf = (tool: CliTool) => folderPath(tool, windows, windowsUser || t.windowsUserInPath);

  if (IS_APP_BUILD) {
    return <p className="rounded-xl border p-3 text-sm text-muted-foreground">{t.appOnly}</p>;
  }

  const pick = async (tool: CliTool) => {
    const now = Date.now();
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
    // Codex는 세션마다 요금제가 적혀 있다. Claude Code는 기록에 계정이 없어 답한 로그인 방식으로 본다.
    const subscriptionDefault =
      tool === "codex" ? null : claudeLogin === null ? null : claudeLogin === "subscription";
    return summarizeCliUsage(current.read.sessions, {
      now: current.at,
      windowDays: WINDOW_DAYS,
      subscriptionDefault,
    });
  };

  const rows = (["claude", "codex"] as const)
    .map((tool) => ({ tool, summary: summaryOf(tool) }))
    .filter(
      ({ tool, summary }) => summary && summary.days > 0 && (tool !== "claude" || claudeLogin),
    );

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
      <ToolCard
        tool="claude"
        path={pathOf("claude")}
        pathReady={pathReady}
        state={state.claude}
        summary={summaryOf("claude")}
        onPick={() => void pick("claude")}
      >
        {state.claude.status === "done" && state.claude.read.files > 0 && (
          <fieldset className="space-y-1.5 rounded-xl bg-secondary/60 p-2.5">
            <legend className="sr-only">{t.loginQuestion}</legend>
            <p className="text-xs font-bold">{t.loginQuestion}</p>
            <div className="flex flex-wrap gap-2">
              {(["subscription", "apiKey"] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={claudeLogin === value ? "default" : "outline"}
                  aria-pressed={claudeLogin === value}
                  onClick={() => setClaudeLogin(value)}
                >
                  {value === "subscription" ? t.loginSubscription : t.loginApiKey}
                </Button>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{t.loginHint}</p>
          </fieldset>
        )}
      </ToolCard>
      <ToolCard
        tool="codex"
        path={pathOf("codex")}
        pathReady={pathReady}
        state={state.codex}
        summary={summaryOf("codex")}
        onPick={() => void pick("codex")}
      />
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
  onPick: () => void;
  children?: React.ReactNode;
}) {
  const t = useT().pcUsage.reader;
  const [copied, setCopied] = useState(false);
  // Claude Code는 로그인 방식을 답하기 전에는 세지 않으므로 숫자를 보이지 않는다.
  const waitingLogin =
    tool === "claude" && summary !== null && summary.days === 0 && summary.unknownSessions > 0;

  return (
    <section className="space-y-2 rounded-2xl border p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold">{tool === "claude" ? t.claude : t.codex}</h2>
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
          {!waitingLogin && (
            <p className="font-semibold">
              {summary.days > 0 ? t.used(summary.days, summary.prompts) : t.noUse}
            </p>
          )}
          {summary.planType && <p className="text-muted-foreground">{t.plan(summary.planType)}</p>}
          {!waitingLogin && summary.api.unpricedRequests > 0 && (
            <p className="text-muted-foreground">
              {t.unpriced(summary.api.unpricedRequests, summary.api.unpricedModels.join(", "))}
            </p>
          )}
          {summary.excludedSessions > 0 && (
            <p className="text-muted-foreground">{t.excluded(summary.excludedSessions)}</p>
          )}
          {!waitingLogin && summary.unknownSessions > 0 && (
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
