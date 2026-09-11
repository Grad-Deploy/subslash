"use client";

import React, { useRef, useState } from "react";
import { useStore } from "../../lib/store";
import {
  backupFileName,
  createBackup,
  parseBackup,
  type BackupParseResult,
} from "../../lib/backup";
import { Button } from "../ui/button";
import { ConfirmDialog } from "../ui/confirm-dialog";

type ParsedBackup = Extract<BackupParseResult, { ok: true }>;

interface DataBackupCardProps {
  onMessage: (message: string) => void;
}

function formatBackupDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/**
 * 이 브라우저의 데이터를 파일로 저장하고 되돌려 넣는 카드.
 *
 * 구독과 해지·체크인 기록은 localStorage에만 있어서, 브라우저 데이터를
 * 지우거나 기기를 바꾸면 사라진다. 그 사실을 먼저 알리고, 서버 없이 지킬 수
 * 있는 방법으로 파일 백업을 둔다.
 */
export function DataBackupCard({ onMessage }: DataBackupCardProps) {
  const { subscriptions, usageLogs, accounts, exchangeRate, notify, replaceAllData } = useStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ParsedBackup | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    setPending(result);
  };

  const describePending = (backup: ParsedBackup): string => {
    const subs = backup.data.subscriptions;
    const killed = subs.filter((sub) => sub.status === "killed").length;
    const date = formatBackupDate(backup.exportedAt);
    const lines = [
      "지금 이 브라우저의 데이터를 백업 내용으로 바꿉니다.",
      "",
      `백업${date ? ` (${date})` : ""}: 구독 ${subs.length}개 (해지 ${killed}개), 체크인 ${backup.data.usageLogs.length}건, 연동 계정 ${backup.data.accounts.length}개`,
      `지금: 구독 ${subscriptions.length}개, 체크인 ${usageLogs.length}건, 연동 계정 ${accounts.length}개`,
      "",
      "지금 데이터는 합쳐지지 않고 사라집니다. 필요하면 먼저 '백업 파일 저장'을 눌러주세요.",
    ];
    if (notify.syncToken) {
      lines.push("결제 알림을 켜 두셨다면, 알림용 서버 사본도 복원한 목록으로 바뀝니다.");
    }
    return lines.join("\n");
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
          구독 목록과 해지·체크인 기록은 이 브라우저에만 저장됩니다. 브라우저 데이터를 지우거나
          기기를 바꾸면 사라지므로, 백업 파일로 저장해 두세요.
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

      {pending && (
        <ConfirmDialog
          isOpen={!!pending}
          onClose={() => setPending(null)}
          onConfirm={() => {
            replaceAllData(pending.data);
            onMessage(`백업에서 구독 ${pending.data.subscriptions.length}개를 복원했습니다.`);
            setPending(null);
          }}
          title="백업에서 복원"
          description={describePending(pending)}
          confirmText="복원"
          cancelText="취소"
          variant="destructive"
        />
      )}
    </section>
  );
}
