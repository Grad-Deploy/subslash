import type { BackupData } from "@lib/store";
import type { SnapshotSummary } from "@lib/account-snapshot-client";
import type { Messages } from "@lib/i18n/messages";

/**
 * 데이터 백업 카드(DataBackupCard)의 안내 문구. 바꾸기 전에 무엇이 무엇으로 바뀌는지 개수로 보여 준다 —
 * 복원·계정 저장은 합치지 않고 통째로 바꾸므로, 사라지는 쪽의 개수를 모르면 확인을 눌러도 확인한 것이 아니다.
 *
 * 문구는 화면 언어의 것을 받는다(`useT().backup`). 기본값을 두지 않는다 — 넘기는 것을 잊으면 영어 화면에
 * 한국어가 섞여도 타입이 잡아 주지 못한다.
 */
type BackupMessages = Messages["backup"];

export function formatBackupDate(iso: string | null, t: BackupMessages): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return t.date(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function formatSavedAt(iso: string, t: BackupMessages): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return t.unknownTime;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${formatBackupDate(iso, t)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 이 기기의 지금 기록 개수. */
export interface LocalCounts {
  subscriptionCount: number;
  usageLogCount: number;
}

function savedLine(summary: SnapshotSummary, t: BackupMessages): string {
  return t.savedLine(summary.subscriptionCount, summary.killedCount, summary.usageLogCount);
}

/** 백업 파일·계정 기록으로 이 기기의 기록을 바꾸기 전에 묻는 말. */
export function describeRestore(
  restore: { data: BackupData; exportedAt: string | null; source: "file" | "account" },
  local: LocalCounts,
  syncOn: boolean,
  t: BackupMessages,
): string {
  const subs = restore.data.subscriptions;
  const killed = subs.filter((sub) => sub.status === "killed").length;
  const date = formatBackupDate(restore.exportedAt, t);
  const label = restore.source === "account" ? t.restore.accountLabel : t.restore.fileLabel;
  const lines = [
    t.restore.replaceWith(label),
    "",
    `${label}${date ? ` (${date})` : ""}: ${t.savedLine(subs.length, killed, restore.data.usageLogs.length)}`,
    t.localLine(local.subscriptionCount, local.usageLogCount),
    "",
    t.restore.notMerged,
  ];
  if (syncOn) {
    lines.push(t.restore.syncWarning);
  }
  return lines.join("\n");
}

/** 계정에 이미 있는 기록을 이 기기의 기록으로 덮기 전에 묻는 말. */
export function describeOverwrite(
  saved: SnapshotSummary,
  local: LocalCounts,
  t: BackupMessages,
): string {
  return [
    t.overwrite.intro,
    "",
    `${t.overwrite.accountAt(formatSavedAt(saved.savedAt, t))}: ${savedLine(saved, t)}`,
    t.localLine(local.subscriptionCount, local.usageLogCount),
    "",
    t.overwrite.notMerged,
  ].join("\n");
}

/** 계정에 마지막으로 저장한 기록 한 줄. */
export function savedSummaryLine(saved: SnapshotSummary, t: BackupMessages): string {
  return t.lastSaved(formatSavedAt(saved.savedAt, t), savedLine(saved, t));
}
