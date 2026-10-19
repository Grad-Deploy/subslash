import { eq, lt, sql } from "drizzle-orm";
import { getDb } from "@lib/db";
import { askDailyCounts } from "@lib/schema";

/**
 * 로그인한 계정의 하루 AI 질문 횟수(표 `ask_daily_counts`, 방침의 'AI 질문 횟수'). 질문 문장은 두지 않고 계정·날짜·기능·
 * 횟수만 둔다. 날짜는 한국 날짜다 — 서버(UTC)의 날짜로 세면 한국 아침 9시에 한도가 풀린다.
 * 열리는 날은 lib/privacy의 `AI_ASK_DAILY_COUNT_STARTS_ON`, 셈은 lib/ask/guard가 부른다.
 */

/** 한국 날짜(YYYY-MM-DD). */
export function koreaDay(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** 한국 날짜가 바뀔 때까지 남은 초(한도에 걸렸을 때 Retry-After). */
export function secondsUntilKoreaMidnight(now: Date = new Date()): number {
  const next = new Date(`${koreaDay(now)}T00:00:00+09:00`).getTime() + 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil((next - now.getTime()) / 1000));
}

/**
 * 한 번을 쓴다. 한도 아래면 센 뒤 남은 횟수를, 이미 한도면 세지 않고 `allowed: false`를 돌려준다. 확인과 셈을 한 문장
 * (`ON CONFLICT … DO UPDATE … WHERE count < limit`)으로 해 두 인스턴스가 동시에 마지막 한 번을 쓰지 못하고, 막힌
 * 요청은 행을 쓰지 않는다.
 */
export async function takeAskQuota(
  accountId: string,
  scope: string,
  limit: number,
  now: Date = new Date(),
): Promise<{ allowed: boolean; remaining: number }> {
  const rows = await getDb()
    .insert(askDailyCounts)
    .values({ accountId, day: koreaDay(now), scope, count: 1 })
    .onConflictDoUpdate({
      target: [askDailyCounts.accountId, askDailyCounts.day, askDailyCounts.scope],
      set: { count: sql`${askDailyCounts.count} + 1` },
      setWhere: sql`${askDailyCounts.count} < ${limit}`,
    })
    .returning({ count: askDailyCounts.count });
  const count = rows[0]?.count;
  return count === undefined
    ? { allowed: false, remaining: 0 }
    : { allowed: true, remaining: Math.max(0, limit - count) };
}

/** 지난 날의 횟수를 지운다(하루 크론). 오늘 것만 남는다. */
export async function pruneAskDailyCounts(now: Date = new Date()): Promise<void> {
  await getDb()
    .delete(askDailyCounts)
    .where(lt(askDailyCounts.day, koreaDay(now)));
}

/** 계정을 지울 때. ON DELETE CASCADE는 PRAGMA foreign_keys가 켜져 있을 때만 동작하므로 직접 지운다. */
export async function deleteAskDailyCounts(accountId: string): Promise<void> {
  await getDb().delete(askDailyCounts).where(eq(askDailyCounts.accountId, accountId));
}
