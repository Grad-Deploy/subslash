"use client";

import { useCallback, useEffect, useState } from "react";
import { create } from "zustand";
import { createBackup } from "@lib/backup";
import {
  fetchSnapshot,
  fetchSnapshotSummary,
  saveSnapshot,
  type SnapshotSummary,
} from "@lib/account-snapshot-client";
import {
  decideSync,
  isEmptyRecords,
  recordsHash,
  type SaveCondition,
  type ServerView,
} from "@lib/account-sync";
import { DEFAULT_ACCOUNT_SYNC, realRecords, useStore, type BackupData } from "@lib/store";
import { useAuth } from "./useAuth";

export type RecordCounts = Omit<SnapshotSummary, "savedAt">;

/** 합치지 않고 어느 쪽을 쓸지 사용자가 골라야 하는 상황. */
export interface SyncConflict {
  reason: "first" | "both-changed";
  server: SnapshotSummary;
  local: RecordCounts;
}

/**
 * `later`는 이 기기의 자동 동기화를 끈다. `dismiss`는 창을 닫기만 한 것이라 끄지 않고, 이번 실행 동안
 * 같은 판으로는 다시 묻지 않는다 — 예전에는 뒤로 가기로 창을 닫아도 동기화가 꺼져, 켜져 있는 줄 알던
 * 사람의 기록이 다른 기기에 끝내 오지 않았다.
 */
export type SyncChoice = "use-local" | "use-server" | "later" | "dismiss";

const DEBOUNCE_MS = 2000;

/** 이 기기의 실제 기록. 체험 중이어도 샘플이 아니라 보관해 둔 기록이다. */
function localData(): BackupData {
  const state = useStore.getState();
  return { ...realRecords(state), accounts: state.accounts, exchangeRate: state.exchangeRate };
}

/** 이번 실행에서 사용자가 창을 닫아 미뤄 둔 계정 판. 같은 판이면 다시 묻지 않는다. */
let dismissedServerSavedAt: string | null = null;

function isEmptySummary(summary: SnapshotSummary | null): boolean | undefined {
  if (!summary) return undefined;
  return (
    summary.subscriptionCount === 0 &&
    summary.usageLogCount === 0 &&
    summary.linkedAccountCount === 0
  );
}

function counts(data: BackupData): RecordCounts {
  return {
    subscriptionCount: data.subscriptions.length,
    killedCount: data.subscriptions.filter((sub) => sub.status === "killed").length,
    usageLogCount: data.usageLogs.length,
    linkedAccountCount: data.accounts.length,
  };
}

class Unauthorized extends Error {}

/** 실패한 응답을 던진다. 로그아웃(401)은 따로 가려 경고를 남기지 않는다. */
function fail(res: Response, what: string): never {
  if (res.status === 401) throw new Unauthorized();
  throw new Error(`${what} (${res.status})`);
}

async function fetchSummary(): Promise<SnapshotSummary | null> {
  const result = await fetchSnapshotSummary();
  if (result.kind === "failed") fail(result.res, "계정 기록 요약을 받지 못했습니다");
  return result.kind === "ok" ? result.summary : null;
}

async function fetchFull(): Promise<{ summary: SnapshotSummary; data: BackupData } | null> {
  const result = await fetchSnapshot();
  if (result.kind === "failed") fail(result.res, "계정 기록을 받지 못했습니다");
  if (result.kind === "none") return null;
  if (!result.backup.ok) throw new Error(`계정 기록을 읽을 수 없습니다: ${result.backup.error}`);
  return { summary: result.summary, data: result.backup.data };
}

type PushResult =
  { ok: true; summary: SnapshotSummary } | { ok: false; current: SnapshotSummary | null };

async function push(condition: SaveCondition): Promise<PushResult> {
  const result = await saveSnapshot(createBackup(localData()), condition);
  if (result.kind === "failed") fail(result.res, "계정에 올리지 못했습니다");
  return result.kind === "ok"
    ? { ok: true, summary: result.summary }
    : { ok: false, current: result.current };
}

/** 이 판과 지금 기록으로 맞췄다고 기억한다. */
function remember(savedAt: string, hash: string) {
  useStore.getState().setAccountSync({
    baseSavedAt: savedAt,
    baseHash: hash,
    lastSyncedAt: new Date().toISOString(),
    stoppedReason: null,
  });
}

/** 계정의 기록으로 이 기기의 기록을 바꾼다. */
async function pull(): Promise<void> {
  const full = await fetchFull();
  if (!full) return;
  useStore.getState().replaceAllData(full.data);
  // 불러오며 옛 해지 링크를 고치는 등 내용이 조금 달라질 수 있어, 바꾼 뒤의 기록으로 지문을 잰다.
  remember(full.summary.savedAt, recordsHash(localData()));
}

/**
 * 한 번 맞춘다. 사용자가 골라야 하면 그 상황을 돌려준다.
 *
 * 판단은 lib/account-sync의 decideSync가 한다. 올리다 다른 기기에 밀리면(409) 새 판으로 다시
 * 판단하므로 몇 번 되풀이할 수 있다.
 */
async function syncOnce(accountId: string): Promise<SyncConflict | null> {
  const store = useStore.getState();
  if (store.accountSync.accountId !== accountId) {
    // 이 기기에서 처음 맞추는 계정이다. 다른 계정의 판을 이어 쓰지 않는다.
    store.setAccountSync({ ...DEFAULT_ACCOUNT_SYNC, accountId });
  }
  const sync = useStore.getState().accountSync;
  // 체험 중이면 쉰다. 받아 오면 체험이 끝나고, 올릴 실제 기록은 체험 중에 바뀌지 않는다.
  if (!sync.enabled || useStore.getState().demo) return null;

  const data = localData();
  const local = { hash: recordsHash(data), empty: isEmptyRecords(data) };
  let summary = await fetchSummary();
  let server: ServerView = { savedAt: summary?.savedAt ?? null, empty: isEmptySummary(summary) };

  for (let attempt = 0; attempt < 4; attempt++) {
    const decision = decideSync(sync, local, server);
    switch (decision.kind) {
      case "idle":
        return null;
      case "adopt":
        remember(decision.savedAt, local.hash);
        return null;
      case "pull":
        await pull();
        return null;
      case "stop":
        useStore.getState().setAccountSync({
          enabled: false,
          stoppedReason: "deleted-elsewhere",
          baseSavedAt: null,
          baseHash: null,
        });
        return null;
      case "ask":
        if (decision.savedAt === dismissedServerSavedAt) return null;
        return summary ? { reason: decision.reason, server: summary, local: counts(data) } : null;
      case "need-server-hash": {
        const full = await fetchFull();
        summary = full?.summary ?? null;
        server = full
          ? {
              savedAt: full.summary.savedAt,
              hash: recordsHash(full.data),
              empty: isEmptyRecords(full.data),
            }
          : { savedAt: null };
        continue;
      }
      case "push": {
        const result = await push(decision.condition);
        if (result.ok) {
          remember(result.summary.savedAt, local.hash);
          return null;
        }
        summary = result.current;
        server = { savedAt: result.current?.savedAt ?? null, empty: isEmptySummary(summary) };
        continue;
      }
    }
  }
  return null;
}

let requestRun: (() => void) | null = null;

/**
 * 이번에 앱을 연 뒤 계정과 마지막으로 맞춘 시각(물을 것 없이 끝났을 때만). 기기가 스스로 기록을 바꾸는
 * 일(폰 기록 자동 체크인)은 이것을 기다린다 — 받아 오기 전에 바꾸면 다른 기기의 변경과 부딪친다.
 */
export const useAccountSyncRound = create<{ settledAt: number | null }>(() => ({
  settledAt: null,
}));

/** 화면에서 동기화를 켜거나 끈 뒤 곧바로 한 번 맞추게 한다. */
export function requestAccountSync() {
  requestRun?.();
}

/**
 * 로그인한 기기끼리 구독 기록을 자동으로 맞춘다. 헤더에 붙여 모든 화면에서 돈다.
 *
 * 로그인했을 때, 기록이 바뀌었을 때(2초 모아서), 이 화면으로 돌아왔을 때 맞춘다. 서버가 기기에
 * 먼저 보내지 않으므로, 다른 기기의 변경은 돌아왔을 때 가져온다. 사용자가 골라야 하면 `conflict`를
 * 돌려주고, `resolve`로 고른 쪽을 쓴다.
 */
export function useAccountSync() {
  const { account } = useAuth();
  const accountId = account?.id ?? null;
  const [conflict, setConflict] = useState<SyncConflict | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let running = false;
    let again = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastHash: string | null = null;

    const run = async () => {
      if (running) {
        again = true;
        return;
      }
      running = true;
      try {
        const next = await syncOnce(accountId);
        if (next) setConflict(next);
        else useAccountSyncRound.setState({ settledAt: Date.now() });
      } catch (error) {
        // 로그아웃됐거나 네트워크가 끊겼다. 다음 변경이나 화면 복귀 때 다시 맞춘다.
        if (!(error instanceof Unauthorized)) console.warn("[account-sync]", error);
      } finally {
        running = false;
        if (again) {
          again = false;
          void run();
        }
      }
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void run(), DEBOUNCE_MS);
    };

    // 기록이 아닌 것(알림 설정, 동기화 상태 자신)이 바뀔 때는 맞추지 않는다.
    const onStoreChange = () => {
      const hash = recordsHash(localData());
      if (hash === lastHash) return;
      lastHash = hash;
      schedule();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void run();
    };

    requestRun = () => void run();
    lastHash = recordsHash(localData());
    void run();
    const unsubscribe = useStore.subscribe(onStoreChange);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      requestRun = null;
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
      if (timer) clearTimeout(timer);
    };
  }, [accountId]);

  const resolve = useCallback(
    async (choice: SyncChoice) => {
      const current = conflict;
      setConflict(null);
      if (!current) return;
      try {
        if (choice === "dismiss") {
          dismissedServerSavedAt = current.server.savedAt;
        } else if (choice === "later") {
          useStore.getState().setAccountSync({ enabled: false });
        } else if (choice === "use-server") {
          await pull();
        } else {
          const result = await push({ kind: "match", savedAt: current.server.savedAt });
          if (result.ok) remember(result.summary.savedAt, recordsHash(localData()));
          else requestAccountSync(); // 고르는 사이 또 바뀌었다. 새 판으로 다시 판단한다.
        }
      } catch (error) {
        console.warn("[account-sync] 고른 쪽으로 맞추지 못했습니다", error);
      }
    },
    [conflict],
  );

  return { conflict, resolve };
}
