import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { accountSnapshots } from "./schema";
import { createBackup, parseBackup, type BackupFile } from "./backup";

/**
 * 계정에 저장한 기록 한 벌.
 *
 * 기본 경험은 여전히 브라우저 안에서 끝난다. 로그인한 사람이 '계정에 저장'을 직접
 * 눌렀을 때만, 백업 파일과 같은 내용(구독·체크인·연동 계정·환율)을 계정에 올린다.
 * 다른 기기에서는 '계정에서 불러오기'로 받아 통째로 바꾼다.
 *
 * 병합하지 않는다. 두 기기의 기록을 합치는 규칙(같은 구독을 양쪽에서 고쳤다면?)은
 * 사용자가 알아채기 어려운 방식으로 무언가를 잃게 만든다. 저장도 불러오기도 전체
 * 교체이고, 무엇이 무엇으로 바뀌는지 개수를 보여준 뒤 확인받는다.
 *
 * 서버는 받은 기록을 믿지 않는다. 파일 복원과 같은 검사(`parseBackup`)를 다시 거쳐,
 * 틀린 항목이 하나라도 있으면 저장하지 않는다 — 계정에 든 기록이 복원할 수 없는
 * 기록이 되면, 다른 기기에서 불러오는 순간 알게 된다.
 */

/**
 * 계정에 저장하는 기록의 크기 상한. 구독 수백 개와 몇 년치 체크인도 넉넉히 들어가고,
 * 누구나 로그인만 하면 부를 수 있는 입구가 DB를 채우는 통로가 되지는 않는다.
 */
export const MAX_SNAPSHOT_BYTES = 1_000_000;

export interface SnapshotSummary {
  savedAt: string;
  subscriptionCount: number;
  killedCount: number;
  usageLogCount: number;
  linkedAccountCount: number;
}

export type SaveResult =
  { ok: true; summary: SnapshotSummary } | { ok: false; status: 400 | 413; error: string };

function summarize(backup: BackupFile): SnapshotSummary {
  const { subscriptions, usageLogs, accounts } = backup.data;
  return {
    savedAt: backup.exportedAt,
    subscriptionCount: subscriptions.length,
    killedCount: subscriptions.filter((sub) => sub.status === "killed").length,
    usageLogCount: usageLogs.length,
    linkedAccountCount: accounts.length,
  };
}

/** 브라우저가 보낸 백업 텍스트를 검사하고 계정의 기록을 통째로 바꾼다. */
export async function saveSnapshot(
  accountId: string,
  text: string,
  now: Date = new Date(),
): Promise<SaveResult> {
  if (Buffer.byteLength(text, "utf8") > MAX_SNAPSHOT_BYTES) {
    return {
      ok: false,
      status: 413,
      error: "기록이 너무 커서 계정에 저장할 수 없습니다. 백업 파일로 저장해 주세요.",
    };
  }

  const parsed = parseBackup(text);
  if (!parsed.ok) return { ok: false, status: 400, error: parsed.error };

  // 검사를 통과한 값으로 다시 만든다. 브라우저가 붙여 보낸 모르는 최상위 칸은 버리고,
  // 저장 시각은 서버 시계로 적는다.
  const backup = createBackup(parsed.data, now);
  const payload = JSON.stringify(backup);
  const values = {
    payload,
    subscriptionCount: backup.data.subscriptions.length,
    savedAt: backup.exportedAt,
  };
  await getDb()
    .insert(accountSnapshots)
    .values({ accountId, ...values })
    .onConflictDoUpdate({ target: accountSnapshots.accountId, set: values });

  return { ok: true, summary: summarize(backup) };
}

/** 계정에 저장된 기록. 없거나, 저장된 내용이 검사를 통과하지 못하면 null. */
export async function readSnapshot(
  accountId: string,
): Promise<{ summary: SnapshotSummary; backup: BackupFile } | null> {
  const rows = await getDb()
    .select({ payload: accountSnapshots.payload })
    .from(accountSnapshots)
    .where(eq(accountSnapshots.accountId, accountId))
    .limit(1);
  const payload = rows[0]?.payload;
  if (!payload) return null;

  const parsed = parseBackup(payload);
  if (!parsed.ok) {
    // 저장할 때 검사했으므로 여기 오면 형식이 바뀐 것이다. 깨진 기록을 내려보내
    // 브라우저의 멀쩡한 기록을 덮게 두지 않는다.
    console.error("[account-snapshot] stored snapshot no longer parses:", parsed.error);
    return null;
  }
  const backup = createBackup(parsed.data, new Date(parsed.exportedAt ?? Date.now()));
  return { summary: summarize(backup), backup };
}

/** 계정에 저장된 기록을 지운다. 지운 것이 있었으면 true. */
export async function deleteSnapshot(accountId: string): Promise<boolean> {
  const deleted = await getDb()
    .delete(accountSnapshots)
    .where(eq(accountSnapshots.accountId, accountId))
    .returning({ accountId: accountSnapshots.accountId });
  return deleted.length > 0;
}
