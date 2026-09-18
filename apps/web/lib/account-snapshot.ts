import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { accountSnapshots } from "./schema";
import { createBackup, parseBackup, type BackupFile } from "./backup";

/**
 * 계정에 저장한 기록 한 벌.
 *
 * 기본 경험은 여전히 기기 안에서 끝난다. 로그인한 기기는 기록이 바뀔 때마다 백업 파일과 같은
 * 내용(구독·체크인·연동 계정·환율)을 계정에 올리고, 다른 기기가 올린 것을 받아 온다
 * (lib/account-sync, hooks/useAccountSync). 기기마다 자동 동기화를 끄면 '계정에 저장'을 누를
 * 때만 올린다. 서버가 기기에 먼저 보내는 일은 없다 — 기기가 물어 가져간다.
 *
 * 병합하지 않는다. 두 기기의 기록을 합치는 규칙(같은 구독을 양쪽에서 고쳤다면?)은 사용자가
 * 알아채기 어려운 방식으로 무언가를 잃게 만든다. 그래서 저장 시각(savedAt)을 판 번호로 쓴다 —
 * 기기는 마지막으로 본 판을 조건으로 올리고(If-Match), 그사이 다른 기기가 올렸으면 서버가
 * 거절한다(409). 양쪽이 따로 바뀌었으면 기기가 사용자에게 어느 쪽을 쓸지 묻는다.
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

export type SaveCondition =
  /** 조건 없이 덮어쓴다 — 자동 동기화를 끈 기기에서 '계정에 저장'을 누를 때. */
  | { kind: "any" }
  /** 계정에 기록이 없을 때만 저장한다(If-None-Match: *). */
  | { kind: "none" }
  /** 계정의 기록이 이 판일 때만 바꾼다(If-Match). 그사이 다른 기기가 올렸으면 거절한다. */
  | { kind: "match"; savedAt: string };

export type SaveResult =
  | { ok: true; summary: SnapshotSummary }
  | { ok: false; status: 400 | 413; error: string }
  /** 조건이 맞지 않았다. `current`는 지금 계정에 있는 기록(없으면 null). */
  | { ok: false; status: 409; error: string; current: SnapshotSummary | null };

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

/** 브라우저가 보낸 백업 텍스트를 검사하고, 조건이 맞으면 계정의 기록을 통째로 바꾼다. */
export async function saveSnapshot(
  accountId: string,
  text: string,
  now: Date = new Date(),
  condition: SaveCondition = { kind: "any" },
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

  // 판 번호로 쓰는 시각이 이전 판과 겹치지 않게, 이전 판보다 늦은 시각으로 적는다. 서버가 여러
  // 대라 시계가 조금씩 달라도 새 판은 늘 다른 값이 된다.
  let savedAt = now;
  if (condition.kind === "match") {
    const previous = Date.parse(condition.savedAt);
    if (!Number.isNaN(previous) && savedAt.getTime() <= previous) savedAt = new Date(previous + 1);
  }

  // 검사를 통과한 값으로 다시 만든다. 브라우저가 붙여 보낸 모르는 최상위 칸은 버리고,
  // 저장 시각은 서버 시계로 적는다.
  const backup = createBackup(parsed.data, savedAt);
  const values = {
    payload: JSON.stringify(backup),
    subscriptionCount: backup.data.subscriptions.length,
    savedAt: backup.exportedAt,
  };

  // 조건은 읽고 나서 쓰는 두 단계가 아니라 쓰는 문장 하나로 건다. 두 기기가 동시에 올려도
  // 하나만 이긴다.
  const db = getDb();
  let written = 1;
  if (condition.kind === "any") {
    await db
      .insert(accountSnapshots)
      .values({ accountId, ...values })
      .onConflictDoUpdate({ target: accountSnapshots.accountId, set: values });
  } else if (condition.kind === "none") {
    const rows = await db
      .insert(accountSnapshots)
      .values({ accountId, ...values })
      .onConflictDoNothing()
      .returning({ accountId: accountSnapshots.accountId });
    written = rows.length;
  } else {
    const rows = await db
      .update(accountSnapshots)
      .set(values)
      .where(
        and(
          eq(accountSnapshots.accountId, accountId),
          eq(accountSnapshots.savedAt, condition.savedAt),
        ),
      )
      .returning({ accountId: accountSnapshots.accountId });
    written = rows.length;
  }

  if (written === 0) {
    const current = await readSnapshot(accountId);
    return {
      ok: false,
      status: 409,
      error: "다른 기기에서 먼저 계정의 기록을 바꿨습니다.",
      current: current?.summary ?? null,
    };
  }
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
