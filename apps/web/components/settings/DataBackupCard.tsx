"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { realRecords, useStore } from "../../lib/store";
import {
  backupFileName,
  createBackup,
  parseBackup,
  type BackupParseResult,
} from "../../lib/backup";
import { useAuth } from "../../hooks/useAuth";
import { requestAccountSync } from "../../hooks/useAccountSync";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { readApiError } from "@lib/api";
import {
  deleteSnapshot,
  fetchSnapshot,
  fetchSnapshotSummary,
  saveSnapshot,
  type SnapshotSummary,
} from "@lib/account-snapshot-client";
import { saveFile } from "@lib/native";
import { describeOverwrite, describeRestore, formatSavedAt, savedSummaryLine } from "./backupText";
import { useT, type Messages } from "@lib/i18n";

type ParsedBackup = Extract<BackupParseResult, { ok: true }>;
/** 어디서 가져온 기록인지에 따라 확인 창의 말이 달라진다. */
type PendingRestore = ParsedBackup & { source: "file" | "account" };

type AccountSnapshotState =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "saved"; summary: SnapshotSummary }
  | { kind: "error"; message: string };

interface DataBackupCardProps {
  onMessage: (message: string) => void;
}

/** 계정에 저장된 기록의 요약. 화면 상태는 바꾸지 않고 보여줄 결과만 돌려준다. */
async function loadSnapshotState(t: Messages["backup"]): Promise<AccountSnapshotState> {
  try {
    const result = await fetchSnapshotSummary();
    if (result.kind === "none") return { kind: "none" };
    if (result.kind === "failed") {
      return {
        kind: "error",
        message: await readApiError(result.res, t.errors.checkFailed),
      };
    }
    return { kind: "saved", summary: result.summary };
  } catch {
    return { kind: "error", message: t.errors.checkNetwork };
  }
}

/**
 * 이 기기의 데이터를 파일로 저장하고 되돌려 넣는 카드. 로그인했다면 계정과의 동기화도 여기서
 * 켜고 끈다.
 *
 * 구독과 해지·체크인 기록은 기기(localStorage)에 있어서, 브라우저 데이터를 지우거나 기기를
 * 바꾸면 사라진다. 그 사실을 먼저 알린다.
 *
 * 로그인하면 자동 동기화가 켜진다(hooks/useAccountSync) — 기록이 바뀌면 계정에 올리고 다른
 * 기기의 변경을 받아 온다. 기기마다 끌 수 있고, 끈 동안에는 예전처럼 사용자가 누를 때만 병합 없이
 * 통째로 저장·불러오기 한다. 바꾸기 전에 무엇이 무엇으로 바뀌는지 개수를 보여준다.
 */
export function DataBackupCard({ onMessage }: DataBackupCardProps) {
  const store = useStore();
  const { accounts, exchangeRate, replaceAllData, accountSync, setAccountSync } = store;
  // 샘플 체험 중이면 화면의 목록은 샘플이다. 백업·계정 저장과 개수 안내는 실제 기록으로 한다.
  const { subscriptions, usageLogs } = realRecords(store);
  const { account, loading: authLoading } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const t = useT().backup;
  const [pending, setPending] = useState<PendingRestore | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [snapshot, setSnapshot] = useState<AccountSnapshotState>({ kind: "loading" });
  const [accountError, setAccountError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // 로그인한 계정이 바뀌면(로그아웃·다른 계정) 이전 계정의 요약을 보여주지 않고 다시 확인한다.
  // 렌더링 중에 맞춘다 — effect 안에서 바로 상태를 바꾸면 렌더링이 한 번 더 일어난다.
  const accountId = account?.id ?? null;
  const [summaryFor, setSummaryFor] = useState(accountId);
  if (summaryFor !== accountId) {
    setSummaryFor(accountId);
    setSnapshot({ kind: "loading" });
  }

  // 응답이 오기 전에 계정이 바뀌면(로그아웃 등) 늦게 온 이전 계정의 요약은 버린다.
  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    void loadSnapshotState(t).then((next) => {
      if (!cancelled) setSnapshot(next);
    });
    return () => {
      cancelled = true;
    };
  }, [account, t]);

  // 이 기기가 이 계정과 자동으로 맞추는 중인지. 처음 로그인한 기기는 아직 계정이 적혀 있지 않다.
  const syncOn =
    !!account &&
    accountSync.enabled &&
    (accountSync.accountId === null || accountSync.accountId === account.id);
  const hasAccountRecord = snapshot.kind === "saved" || (syncOn && !!accountSync.baseSavedAt);

  const currentBackup = (now = new Date()) =>
    createBackup({ subscriptions, usageLogs, accounts, exchangeRate }, now);
  const localCounts = {
    subscriptionCount: subscriptions.length,
    usageLogCount: usageLogs.length,
  };

  const handleExport = async () => {
    const now = new Date();
    const backup = currentBackup(now);
    setError(null);
    try {
      // 앱에서는 공유 창이 열린다. 사용자가 닫았으면 저장하지 않은 것이니 저장했다고 말하지 않는다.
      const saved = await saveFile(
        backupFileName(now),
        JSON.stringify(backup, null, 2),
        "application/json",
      );
      if (saved) onMessage(t.exported(subscriptions.length));
    } catch (e) {
      console.error("[backup] 백업 파일을 만들지 못했습니다", e);
      setError(t.exportFailed);
    }
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // 같은 파일을 다시 골라도 change가 일어나도록 비운다.
    event.target.value = "";
    if (!file) return;

    const result = parseBackup(await file.text());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setPending({ ...result, source: "file" });
  };

  const turnSyncOn = () => {
    if (!account) return;
    // 처음부터 다시 맞춘다. 양쪽에 서로 다른 기록이 있으면 어느 쪽을 쓸지 묻는다.
    setAccountSync({
      accountId: account.id,
      enabled: true,
      baseSavedAt: null,
      baseHash: null,
      stoppedReason: null,
    });
    requestAccountSync();
    onMessage(t.sync.turnedOn);
  };

  const turnSyncOff = () => {
    setAccountSync({ enabled: false });
    onMessage(t.sync.turnedOff);
  };

  const saveToAccount = async () => {
    setBusy(true);
    setAccountError(null);
    try {
      // 자동 동기화를 끈 기기에서 누르는 것이라 판 조건 없이 덮는다. 덮기 전에 확인은 받았다.
      const result = await saveSnapshot(currentBackup());
      if (result.kind !== "ok") {
        // 조건 없이 올리므로 판이 어긋나는(409) 일은 없다.
        setAccountError(
          result.kind === "failed"
            ? await readApiError(result.res, t.errors.saveFailed)
            : t.errors.saveFailed,
        );
        return;
      }
      setSnapshot({ kind: "saved", summary: result.summary });
      onMessage(t.savedToAccount(result.summary.subscriptionCount));
    } catch {
      setAccountError(t.errors.saveNetwork);
    } finally {
      setBusy(false);
    }
  };

  // 계정에 이미 기록이 있으면 무엇을 덮는지 보여주고 확인받는다.
  const handleSaveToAccount = () => {
    if (snapshot.kind === "saved") setConfirmOverwrite(true);
    else void saveToAccount();
  };

  const handleLoadFromAccount = async () => {
    setBusy(true);
    setAccountError(null);
    try {
      const result = await fetchSnapshot();
      if (result.kind === "none") {
        setAccountError(t.errors.noRecord);
        setSnapshot({ kind: "none" });
        return;
      }
      if (result.kind === "failed") {
        setAccountError(await readApiError(result.res, t.errors.loadFailed));
        return;
      }
      if (!result.backup.ok) {
        setAccountError(t.errors.unreadable(result.backup.error));
        return;
      }
      setPending({ ...result.backup, source: "account" });
    } catch {
      setAccountError(t.errors.loadNetwork);
    } finally {
      setBusy(false);
    }
  };

  const deleteFromAccount = async () => {
    setBusy(true);
    setAccountError(null);
    try {
      const result = await deleteSnapshot();
      if (result.kind === "failed") {
        setAccountError(await readApiError(result.res, t.errors.deleteFailed));
        return;
      }
      setSnapshot({ kind: "none" });
      // 켜 둔 채면 다음 변경 때 다시 올라간다. 지운 뜻을 따라 이 기기의 동기화도 끈다.
      setAccountSync({ enabled: false, baseSavedAt: null, baseHash: null });
      onMessage(t.deleted);
    } catch {
      setAccountError(t.errors.deleteNetwork);
    } finally {
      setBusy(false);
    }
  };

  const snapshotLine = (): string => {
    switch (snapshot.kind) {
      case "loading":
        return t.sync.checking;
      case "none":
        return t.sync.none;
      case "error":
        return snapshot.message;
      case "saved":
        return savedSummaryLine(snapshot.summary, t);
    }
  };

  const deleteButton = hasAccountRecord && (
    <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmDelete(true)}>
      {t.sync.deleteFromAccount}
    </Button>
  );

  return (
    <section
      aria-labelledby="data-backup-heading"
      className="p-4 sm:p-5 border rounded-2xl bg-card space-y-3"
    >
      <div className="space-y-1">
        <h3 id="data-backup-heading" className="font-bold text-sm sm:text-base">
          {t.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{t.intro}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => void handleExport()}>
          {t.exportFile}
        </Button>
        <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()}>
          {t.restoreFile}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          aria-label={t.chooseFile}
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive leading-relaxed">
          {error} {t.unchanged}
        </p>
      )}

      {!authLoading && (
        <div className="pt-3 border-t space-y-2">
          <p className="text-xs font-bold text-foreground">{t.sync.title}</p>
          {!account ? (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t.sync.loginHint}{" "}
              <Link
                href="/login"
                className="font-semibold text-primary underline underline-offset-4"
              >
                {t.sync.login}
              </Link>
            </p>
          ) : syncOn ? (
            <>
              <p className="text-[11px] text-muted-foreground" aria-live="polite">
                {accountSync.lastSyncedAt
                  ? t.sync.onSince(formatSavedAt(accountSync.lastSyncedAt, t))
                  : t.sync.onSyncing}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={busy} onClick={turnSyncOff}>
                  {t.sync.turnOff}
                </Button>
                {deleteButton}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{t.sync.onNote}</p>
            </>
          ) : (
            <>
              {accountSync.stoppedReason === "deleted-elsewhere" && (
                <p
                  role="status"
                  className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed"
                >
                  {t.sync.deletedElsewhere}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground" aria-live="polite">
                {snapshotLine()}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={busy} onClick={turnSyncOn}>
                  {t.sync.turnOn}
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={handleSaveToAccount}>
                  {t.sync.saveToAccount}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || snapshot.kind !== "saved"}
                  onClick={handleLoadFromAccount}
                >
                  {t.sync.loadFromAccount}
                </Button>
                {deleteButton}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{t.sync.offNote}</p>
            </>
          )}
          {accountError && (
            <p className="text-xs text-destructive leading-relaxed">{accountError}</p>
          )}
        </div>
      )}

      {pending && (
        <ConfirmDialog
          isOpen={!!pending}
          onClose={() => setPending(null)}
          onConfirm={() => {
            replaceAllData(pending.data);
            onMessage(
              pending.source === "account"
                ? t.loadedFromAccount(pending.data.subscriptions.length)
                : t.restoredFromFile(pending.data.subscriptions.length),
            );
            setPending(null);
          }}
          title={pending.source === "account" ? t.dialog.loadTitle : t.dialog.restoreTitle}
          description={describeRestore(pending, localCounts, syncOn, t)}
          confirmText={pending.source === "account" ? t.dialog.load : t.dialog.restore}
          cancelText={t.dialog.cancel}
          variant="destructive"
        />
      )}

      {confirmOverwrite && (
        <ConfirmDialog
          isOpen={confirmOverwrite}
          onClose={() => setConfirmOverwrite(false)}
          onConfirm={() => {
            setConfirmOverwrite(false);
            void saveToAccount();
          }}
          title={t.dialog.saveTitle}
          description={
            snapshot.kind === "saved" ? describeOverwrite(snapshot.summary, localCounts, t) : ""
          }
          confirmText={t.dialog.save}
          cancelText={t.dialog.cancel}
          variant="destructive"
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          isOpen={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            void deleteFromAccount();
          }}
          title={t.dialog.deleteTitle}
          description={t.dialog.deleteDescription}
          confirmText={t.dialog.delete}
          cancelText={t.dialog.cancel}
          variant="destructive"
        />
      )}
    </section>
  );
}
