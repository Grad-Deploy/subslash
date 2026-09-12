"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useStore } from "../../lib/store";
import {
  backupFileName,
  createBackup,
  parseBackup,
  type BackupParseResult,
} from "../../lib/backup";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../ui/confirm-dialog";

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

/**
 * 이 브라우저의 데이터를 파일로 저장하고 되돌려 넣는 카드. 로그인했다면 같은 내용을
 * 계정에 저장하고 다른 기기에서 불러올 수도 있다.
 *
 * 구독과 해지·체크인 기록은 localStorage에 있어서, 브라우저 데이터를 지우거나
 * 기기를 바꾸면 사라진다. 그 사실을 먼저 알린다. 계정 저장은 자동 동기화가 아니다 —
 * 저장도 불러오기도 사용자가 누를 때만, 병합 없이 통째로 바꾸고, 바꾸기 전에 무엇이
 * 무엇으로 바뀌는지 개수를 보여준다.
 */
export function DataBackupCard({ onMessage }: DataBackupCardProps) {
  const { subscriptions, usageLogs, accounts, exchangeRate, notify, replaceAllData } = useStore();
  const { account, loading: authLoading } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingRestore | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [snapshot, setSnapshot] = useState<AccountSnapshotState>({ kind: "loading" });
  const [accountError, setAccountError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadSummary = useCallback(async () => {
    setSnapshot({ kind: "loading" });
    try {
      const res = await fetch("/api/account/snapshot?summary=1", { credentials: "same-origin" });
      if (res.status === 404) {
        setSnapshot({ kind: "none" });
        return;
      }
      if (!res.ok) {
        setSnapshot({
          kind: "error",
          message: await readError(res, "계정에 저장된 기록을 확인하지 못했습니다."),
        });
        return;
      }
      const data = await res.json();
      setSnapshot({ kind: "saved", summary: data.summary });
    } catch {
      setSnapshot({ kind: "error", message: "네트워크에 문제가 있어 확인하지 못했습니다." });
    }
  }, []);

  useEffect(() => {
    if (account) void loadSummary();
  }, [account, loadSummary]);

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
    onMessage(`💾 백업 파일을 저장했습니다. (구독 ${subscriptions.length}개)`);
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

  const saveToAccount = async () => {
    setBusy(true);
    setAccountError(null);
    try {
      const res = await fetch("/api/account/snapshot", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(currentBackup()),
      });
      if (!res.ok) {
        setAccountError(await readError(res, "계정에 저장하지 못했습니다."));
        return;
      }
      const data = await res.json();
      setSnapshot({ kind: "saved", summary: data.summary });
      onMessage(`☁️ 계정에 저장했습니다. (구독 ${data.summary.subscriptionCount}개)`);
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
      const res = await fetch("/api/account/snapshot", { credentials: "same-origin" });
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
      const res = await fetch("/api/account/snapshot", {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) {
        setAccountError(await readError(res, "계정에 저장된 기록을 지우지 못했습니다."));
        return;
      }
      setSnapshot({ kind: "none" });
      onMessage("계정에 저장된 기록을 지웠습니다. 이 브라우저의 기록은 그대로입니다.");
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
      `지금 이 브라우저의 데이터를 ${label} 내용으로 바꿉니다.`,
      "",
      `${label}${date ? ` (${date})` : ""}: 구독 ${subs.length}개 (해지 ${killed}개), 체크인 ${restore.data.usageLogs.length}건, 연동 계정 ${restore.data.accounts.length}개`,
      `지금: 구독 ${subscriptions.length}개, 체크인 ${usageLogs.length}건, 연동 계정 ${accounts.length}개`,
      "",
      "지금 데이터는 합쳐지지 않고 사라집니다. 필요하면 먼저 '백업 파일 저장'을 눌러주세요.",
    ];
    if (notify.syncToken) {
      lines.push("결제 알림을 켜 두셨다면, 알림용 서버 사본도 가져온 목록으로 바뀝니다.");
    }
    return lines.join("\n");
  };

  const describeOverwrite = (): string => {
    if (snapshot.kind !== "saved") return "";
    const saved = snapshot.summary;
    return [
      "계정에 저장된 기록을 지금 이 브라우저의 기록으로 바꿉니다.",
      "",
      `계정 (${formatSavedAt(saved.savedAt)}): 구독 ${saved.subscriptionCount}개 (해지 ${saved.killedCount}개), 체크인 ${saved.usageLogCount}건, 연동 계정 ${saved.linkedAccountCount}개`,
      `지금: 구독 ${subscriptions.length}개, 체크인 ${usageLogs.length}건, 연동 계정 ${accounts.length}개`,
      "",
      "계정의 기록은 합쳐지지 않고 바뀝니다.",
    ].join("\n");
  };

  const snapshotLine = (): string => {
    switch (snapshot.kind) {
      case "loading":
        return "계정에 저장된 기록을 확인하는 중…";
      case "none":
        return "아직 계정에 저장한 기록이 없습니다.";
      case "error":
        return snapshot.message;
      case "saved": {
        const s = snapshot.summary;
        return `마지막 저장 ${formatSavedAt(s.savedAt)} · 구독 ${s.subscriptionCount}개 (해지 ${s.killedCount}개), 체크인 ${s.usageLogCount}건`;
      }
    }
  };

  return (
    <section
      aria-labelledby="data-backup-heading"
      className="p-4 sm:p-5 border rounded-2xl bg-card space-y-3"
    >
      <div className="space-y-1">
        <h3 id="data-backup-heading" className="font-bold text-sm sm:text-base">
          💾 데이터 백업
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          구독 목록과 해지·체크인 기록은 이 브라우저에 저장됩니다. 브라우저 데이터를 지우거나 기기를
          바꾸면 사라지므로, 백업 파일로 저장하거나 로그인해 계정에 저장해 두세요.
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          결제 알림 설정은 백업에 넣지 않습니다. 알림용 인증 정보가 파일로 퍼지지 않게 하기
          위해서입니다.
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
          {error} 지금 데이터는 바뀌지 않았습니다.
        </p>
      )}

      {!authLoading && (
        <div className="pt-3 border-t space-y-2">
          <p className="text-xs font-bold text-foreground">☁️ 계정에 저장</p>
          {!account ? (
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              로그인하면 이 기록을 계정에 저장하고, 다른 기기에서 불러올 수 있습니다.{" "}
              <Link
                href="/login"
                className="font-semibold text-primary underline underline-offset-4"
              >
                로그인
              </Link>
            </p>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground" aria-live="polite">
                {snapshotLine()}
              </p>
              <div className="flex flex-wrap gap-2">
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
                {snapshot.kind === "saved" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setConfirmDelete(true)}
                  >
                    계정에서 지우기
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                계정에 저장하면 구독·체크인·연동 계정·환율이 서버에 저장됩니다. 자동으로 맞춰지지
                않으니, 다른 기기에서는 &lsquo;계정에서 불러오기&rsquo;를 눌러 주세요. 결제 알림
                설정은 넣지 않습니다.
              </p>
              {accountError && (
                <p className="text-xs text-destructive leading-relaxed">{accountError}</p>
              )}
            </>
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
                ? `계정에서 구독 ${pending.data.subscriptions.length}개를 불러왔습니다.`
                : `백업에서 구독 ${pending.data.subscriptions.length}개를 복원했습니다.`,
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
          description="계정에 저장된 기록을 서버에서 지웁니다. 이 브라우저의 기록은 그대로 남습니다."
          confirmText="지우기"
          cancelText="취소"
          variant="destructive"
        />
      )}
    </section>
  );
}
