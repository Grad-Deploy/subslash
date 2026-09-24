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
import { apiFetch } from "@lib/api";

type ParsedBackup = Extract<BackupParseResult, { ok: true }>;
/** 어디서 가져온 기록인지에 따라 확인 창의 말이 달라진다. */
type PendingRestore = ParsedBackup & { source: "file" | "account" };

interface SnapshotSummary {
  savedAt: string;
  subscriptionCount: number;
  killedCount: number;
  usageLogCount: number;
  linkedAccountCount: number;
}

type AccountSnapshotState =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "saved"; summary: SnapshotSummary }
  | { kind: "error"; message: string };

interface DataBackupCardProps {
  onMessage: (message: string) => void;
}

function formatBackupDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "알 수 없는 시각";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${formatBackupDate(iso)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function readError(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => null);
  return typeof data?.error === "string" ? data.error : fallback;
}

/** 계정에 저장된 기록의 요약. 화면 상태는 바꾸지 않고 보여줄 결과만 돌려준다. */
async function fetchSnapshotSummary(): Promise<AccountSnapshotState> {
  try {
    const res = await apiFetch("/api/account/snapshot?summary=1", {});
    if (res.status === 404) return { kind: "none" };
    if (!res.ok) {
      return {
        kind: "error",
        message: await readError(res, "계정에 저장된 기록을 확인하지 못했습니다."),
      };
    }
    const data = await res.json();
    return { kind: "saved", summary: data.summary };
  } catch {
    return { kind: "error", message: "네트워크에 문제가 있어 확인하지 못했습니다." };
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
  const { accounts, exchangeRate, notify, replaceAllData, accountSync, setAccountSync } = store;
  // 샘플 체험 중이면 화면의 목록은 샘플이다. 백업·계정 저장과 개수 안내는 실제 기록으로 한다.
  const { subscriptions, usageLogs } = realRecords(store);
  const { account, loading: authLoading } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
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
    void fetchSnapshotSummary().then((next) => {
      if (!cancelled) setSnapshot(next);
    });
    return () => {
      cancelled = true;
    };
  }, [account]);

  // 이 기기가 이 계정과 자동으로 맞추는 중인지. 처음 로그인한 기기는 아직 계정이 적혀 있지 않다.
  const syncOn =
    !!account &&
    accountSync.enabled &&
    (accountSync.accountId === null || accountSync.accountId === account.id);
  const hasAccountRecord = snapshot.kind === "saved" || (syncOn && !!accountSync.baseSavedAt);

  const currentBackup = () =>
    createBackup({ subscriptions, usageLogs, accounts, exchangeRate }, new Date());

  const handleExport = () => {
    const now = new Date();
    const backup = createBackup({ subscriptions, usageLogs, accounts, exchangeRate }, now);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFileName(now);
    link.click();
    URL.revokeObjectURL(url);
    setError(null);
    onMessage(`백업 파일 저장 (구독 ${subscriptions.length}개)`);
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
    onMessage("자동 동기화 켜짐");
  };

  const turnSyncOff = () => {
    setAccountSync({ enabled: false });
    onMessage("자동 동기화 꺼짐 · 계정 기록은 그대로예요");
  };

  const saveToAccount = async () => {
    setBusy(true);
    setAccountError(null);
    try {
      const res = await apiFetch("/api/account/snapshot", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(currentBackup()),
      });
      if (!res.ok) {
        setAccountError(await readError(res, "계정에 저장하지 못했습니다."));
        return;
      }
      const data = await res.json();
      setSnapshot({ kind: "saved", summary: data.summary });
      onMessage(`계정에 저장 (구독 ${data.summary.subscriptionCount}개)`);
    } catch {
      setAccountError("네트워크에 문제가 있어 계정에 저장하지 못했습니다.");
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
      const res = await apiFetch("/api/account/snapshot");
      if (!res.ok) {
        setAccountError(await readError(res, "계정에 저장된 기록을 불러오지 못했습니다."));
        if (res.status === 404) setSnapshot({ kind: "none" });
        return;
      }
      const data = await res.json();
      // 서버가 검사한 기록이지만, 이 앱이 읽을 수 있는지 파일 복원과 같은 검사를 한 번 더 한다.
      const result = parseBackup(JSON.stringify(data.backup));
      if (!result.ok) {
        setAccountError(`계정에 저장된 기록을 읽을 수 없습니다. ${result.error}`);
        return;
      }
      setPending({ ...result, source: "account" });
    } catch {
      setAccountError("네트워크에 문제가 있어 불러오지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const deleteFromAccount = async () => {
    setBusy(true);
    setAccountError(null);
    try {
      const res = await apiFetch("/api/account/snapshot", {
        method: "DELETE",
      });
      if (!res.ok) {
        setAccountError(await readError(res, "계정에 저장된 기록을 지우지 못했습니다."));
        return;
      }
      setSnapshot({ kind: "none" });
      // 켜 둔 채면 다음 변경 때 다시 올라간다. 지운 뜻을 따라 이 기기의 동기화도 끈다.
      setAccountSync({ enabled: false, baseSavedAt: null, baseHash: null });
      onMessage("계정 기록을 지우고 자동 동기화를 껐어요. 이 기기의 기록은 그대로예요.");
    } catch {
      setAccountError("네트워크에 문제가 있어 지우지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const describePending = (restore: PendingRestore): string => {
    const subs = restore.data.subscriptions;
    const killed = subs.filter((sub) => sub.status === "killed").length;
    const date = formatBackupDate(restore.exportedAt);
    const label = restore.source === "account" ? "계정에 저장된 기록" : "백업";
    const lines = [
      `이 기기의 기록을 ${label} 내용으로 바꿔요.`,
      "",
      `${label}${date ? ` (${date})` : ""}: 구독 ${subs.length}개 (해지 ${killed}개), 체크인 ${restore.data.usageLogs.length}건, 연동 계정 ${restore.data.accounts.length}개`,
      `지금: 구독 ${subscriptions.length}개, 체크인 ${usageLogs.length}건, 연동 계정 ${accounts.length}개`,
      "",
      "지금 기록은 합쳐지지 않고 사라져요. 필요하면 먼저 '백업 파일 저장'을 누르세요.",
    ];
    if (syncOn) {
      lines.push("자동 동기화 중이라 다른 기기의 기록도 바뀌어요.");
    }
    if (notify.syncToken) {
      lines.push("결제 알림용 서버 사본도 바뀌어요.");
    }
    return lines.join("\n");
  };

  const describeOverwrite = (): string => {
    if (snapshot.kind !== "saved") return "";
    const saved = snapshot.summary;
    return [
      "계정 기록을 이 기기의 기록으로 바꿔요.",
      "",
      `계정 (${formatSavedAt(saved.savedAt)}): 구독 ${saved.subscriptionCount}개 (해지 ${saved.killedCount}개), 체크인 ${saved.usageLogCount}건, 연동 계정 ${saved.linkedAccountCount}개`,
      `지금: 구독 ${subscriptions.length}개, 체크인 ${usageLogs.length}건, 연동 계정 ${accounts.length}개`,
      "",
      "합쳐지지 않고 바뀌어요.",
    ].join("\n");
  };

  const snapshotLine = (): string => {
    switch (snapshot.kind) {
      case "loading":
        return "계정 기록 확인 중…";
      case "none":
        return "계정에 저장한 기록이 없어요.";
      case "error":
        return snapshot.message;
      case "saved": {
        const s = snapshot.summary;
        return `마지막 저장 ${formatSavedAt(s.savedAt)} · 구독 ${s.subscriptionCount}개 (해지 ${s.killedCount}개), 체크인 ${s.usageLogCount}건`;
      }
    }
  };

  const deleteButton = hasAccountRecord && (
    <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmDelete(true)}>
      계정에서 지우기
    </Button>
  );

  return (
    <section
      aria-labelledby="data-backup-heading"
      className="p-4 sm:p-5 border rounded-2xl bg-card space-y-3"
    >
      <div className="space-y-1">
        <h3 id="data-backup-heading" className="font-bold text-sm sm:text-base">
          데이터 백업
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          기록은 이 기기에만 있어요. 브라우저를 지우거나 기기를 바꾸기 전에 백업하거나 로그인하세요.
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          결제 알림 설정은 백업에 넣지 않아요.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={handleExport}>
          백업 파일 저장
        </Button>
        <Button size="sm" variant="outline" onClick={() => fileInput.current?.click()}>
          백업에서 복원
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          aria-label="백업 파일 선택"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {error && (
        <p role="alert" className="text-xs text-destructive leading-relaxed">
          {error} 지금 기록은 바뀌지 않았어요.
        </p>
      )}

      {!authLoading && (
        <div className="pt-3 border-t space-y-2">
          <p className="text-xs font-bold text-foreground">계정 동기화</p>
          {!account ? (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              로그인하면 기록이 계정에 저장되고 다른 기기와 자동으로 맞춰져요.{" "}
              <Link
                href="/login"
                className="font-semibold text-primary underline underline-offset-4"
              >
                로그인
              </Link>
            </p>
          ) : syncOn ? (
            <>
              <p className="text-[11px] text-muted-foreground" aria-live="polite">
                {accountSync.lastSyncedAt
                  ? `자동 동기화 켜짐 · 마지막으로 맞춘 시각 ${formatSavedAt(accountSync.lastSyncedAt)}`
                  : "자동 동기화 켜짐 · 계정과 맞추는 중…"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={busy} onClick={turnSyncOff}>
                  자동 동기화 끄기
                </Button>
                {deleteButton}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                로그인한 기기끼리 기록을 맞춰요. 양쪽이 따로 바뀌면 어느 쪽을 쓸지 물어요.
              </p>
            </>
          ) : (
            <>
              {accountSync.stoppedReason === "deleted-elsewhere" && (
                <p
                  role="status"
                  className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed"
                >
                  다른 기기에서 계정 기록을 지워 동기화를 멈췄어요. 다시 켜면 이 기기의 기록을
                  올려요.
                </p>
              )}
              <p className="text-[11px] text-muted-foreground" aria-live="polite">
                {snapshotLine()}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={busy} onClick={turnSyncOn}>
                  자동 동기화 켜기
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={handleSaveToAccount}>
                  계정에 저장
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy || snapshot.kind !== "saved"}
                  onClick={handleLoadFromAccount}
                >
                  계정에서 불러오기
                </Button>
                {deleteButton}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                자동 동기화가 꺼져 있어요. &lsquo;계정에 저장&rsquo;·&lsquo;계정에서
                불러오기&rsquo;로 옮기세요.
              </p>
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
                ? `계정에서 구독 ${pending.data.subscriptions.length}개를 불러왔어요`
                : `백업에서 구독 ${pending.data.subscriptions.length}개를 복원했어요`,
            );
            setPending(null);
          }}
          title={pending.source === "account" ? "계정에서 불러오기" : "백업에서 복원"}
          description={describePending(pending)}
          confirmText={pending.source === "account" ? "불러오기" : "복원"}
          cancelText="취소"
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
          title="계정에 저장"
          description={describeOverwrite()}
          confirmText="저장"
          cancelText="취소"
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
          title="계정에서 지우기"
          description="서버의 계정 기록을 지우고 이 기기의 자동 동기화를 꺼요. 이 기기의 기록은 남고, 다른 기기의 동기화는 멈춰요."
          confirmText="지우기"
          cancelText="취소"
          variant="destructive"
        />
      )}
    </section>
  );
}
