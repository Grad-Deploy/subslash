import type { BackupData } from "@lib/store";
import type { SnapshotSummary } from "@lib/account-snapshot-client";

/**
 * 데이터 백업 카드(DataBackupCard)의 안내 문구. 바꾸기 전에 무엇이 무엇으로 바뀌는지 개수로 보여 준다 —
 * 복원·계정 저장은 합치지 않고 통째로 바꾸므로, 사라지는 쪽의 개수를 모르면 확인을 눌러도 확인한 것이 아니다.
 */

export function formatBackupDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "알 수 없는 시각";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${formatBackupDate(iso)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** 이 기기의 지금 기록 개수. */
export interface LocalCounts {
  subscriptionCount: number;
  usageLogCount: number;
}

function localLine(local: LocalCounts): string {
  return `지금: 구독 ${local.subscriptionCount}개, 체크인 ${local.usageLogCount}건`;
}

function savedLine(summary: SnapshotSummary): string {
  return `구독 ${summary.subscriptionCount}개 (해지 ${summary.killedCount}개), 체크인 ${summary.usageLogCount}건`;
}

/** 백업 파일·계정 기록으로 이 기기의 기록을 바꾸기 전에 묻는 말. */
export function describeRestore(
  restore: { data: BackupData; exportedAt: string | null; source: "file" | "account" },
  local: LocalCounts,
  syncOn: boolean,
): string {
  const subs = restore.data.subscriptions;
  const killed = subs.filter((sub) => sub.status === "killed").length;
  const date = formatBackupDate(restore.exportedAt);
  const label = restore.source === "account" ? "계정에 저장된 기록" : "백업";
  const lines = [
    `이 기기의 기록을 ${label} 내용으로 바꿔요.`,
    "",
    `${label}${date ? ` (${date})` : ""}: 구독 ${subs.length}개 (해지 ${killed}개), 체크인 ${restore.data.usageLogs.length}건`,
    localLine(local),
    "",
    "지금 기록은 합쳐지지 않고 사라져요. 필요하면 먼저 '백업 파일 저장'을 누르세요.",
  ];
  if (syncOn) {
    lines.push("자동 동기화 중이라 다른 기기의 기록도 바뀌어요.");
  }
  return lines.join("\n");
}

/** 계정에 이미 있는 기록을 이 기기의 기록으로 덮기 전에 묻는 말. */
export function describeOverwrite(saved: SnapshotSummary, local: LocalCounts): string {
  return [
    "계정 기록을 이 기기의 기록으로 바꿔요.",
    "",
    `계정 (${formatSavedAt(saved.savedAt)}): ${savedLine(saved)}`,
    localLine(local),
    "",
    "합쳐지지 않고 바뀌어요.",
  ].join("\n");
}

/** 계정에 마지막으로 저장한 기록 한 줄. */
export function savedSummaryLine(saved: SnapshotSummary): string {
  return `마지막 저장 ${formatSavedAt(saved.savedAt)} · ${savedLine(saved)}`;
}
