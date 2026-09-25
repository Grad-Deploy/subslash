import { eq, inArray, lt } from "drizzle-orm";
import { getDb } from "./db";
import { statsContributors, statsItems } from "./schema";
import { generateSyncToken, hashSyncToken } from "./tokens";
import {
  STATS_RETENTION_DAYS,
  summarize,
  type ContributorRow,
  type StatsContribution,
  type StatsSummary,
} from "./stats";

/**
 * 익명 구독 통계의 서버 쪽. 참여 기록은 토큰 해시로만 찾고, 계정·알림 구독자·IP와 묶지 않는다.
 * 저장은 통째로 바꾼다 — 기기가 보낸 요약이 곧 그 기기의 기록이다.
 */

export function readBearer(header: string | null): string | null {
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  return /^[0-9a-f]{64}$/.test(token) ? token : null;
}

async function findContributor(token: string) {
  const rows = await getDb()
    .select({ id: statsContributors.id })
    .from(statsContributors)
    .where(eq(statsContributors.tokenHash, hashSyncToken(token)))
    .limit(1);
  return rows[0] ?? null;
}

async function writeItems(contributorId: string, contribution: StatsContribution) {
  const db = getDb();
  await db.delete(statsItems).where(eq(statsItems.contributorId, contributorId));
  if (contribution.items.length > 0) {
    await db.insert(statsItems).values(
      contribution.items.map((item) => ({
        contributorId,
        presetId: item.presetId,
        monthlyKrw: item.monthlyKRW,
        usageCount: item.usageCount,
      })),
    );
  }
}

/** 새 참여자를 만든다. 토큰은 이때만 돌려주고 서버에는 해시만 남는다. */
export async function createContribution(contribution: StatsContribution): Promise<string> {
  const token = generateSyncToken();
  const now = new Date().toISOString();
  const [row] = await getDb()
    .insert(statsContributors)
    .values({
      tokenHash: hashSyncToken(token),
      totalMonthlyKrw: contribution.totalMonthlyKRW,
      activeCount: contribution.activeCount,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: statsContributors.id });
  await writeItems(row.id, contribution);
  return token;
}

/** 이 토큰의 기록을 바꾼다. 토큰을 모르면 false. */
export async function replaceContribution(
  token: string,
  contribution: StatsContribution,
): Promise<boolean> {
  const contributor = await findContributor(token);
  if (!contributor) return false;
  await getDb()
    .update(statsContributors)
    .set({
      totalMonthlyKrw: contribution.totalMonthlyKRW,
      activeCount: contribution.activeCount,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(statsContributors.id, contributor.id));
  await writeItems(contributor.id, contribution);
  return true;
}

async function deleteContributors(ids: string[]) {
  if (ids.length === 0) return;
  const db = getDb();
  // ON DELETE CASCADE는 PRAGMA foreign_keys가 켜져 있을 때만 돈다. 항목을 직접 지운다.
  await db.delete(statsItems).where(inArray(statsItems.contributorId, ids));
  await db.delete(statsContributors).where(inArray(statsContributors.id, ids));
}

/** 참여를 그만두면 기록을 지운다. 토큰을 모르면 false. */
export async function deleteContribution(token: string): Promise<boolean> {
  const contributor = await findContributor(token);
  if (!contributor) return false;
  await deleteContributors([contributor.id]);
  return true;
}

/** 오래 갱신되지 않은 참여 기록을 지운다. 지운 참여자 수를 돌려준다. */
export async function pruneStaleContributions(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - STATS_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const stale = await getDb()
    .select({ id: statsContributors.id })
    .from(statsContributors)
    .where(lt(statsContributors.updatedAt, cutoff.toISOString()));
  await deleteContributors(stale.map((row) => row.id));
  return stale.length;
}

/** 보관 기간 안의 기록을 모아 요약한다. */
export async function loadSummary(now: Date = new Date()): Promise<StatsSummary> {
  const db = getDb();
  const cutoff = new Date(now.getTime() - STATS_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const contributors = await db.select().from(statsContributors);
  const fresh = contributors.filter((row) => row.updatedAt >= cutoff.toISOString());
  const items = await db.select().from(statsItems);

  const byContributor = new Map<string, ContributorRow>();
  for (const row of fresh) {
    byContributor.set(row.id, {
      totalMonthlyKRW: row.totalMonthlyKrw,
      activeCount: row.activeCount,
      items: [],
    });
  }
  for (const item of items) {
    byContributor.get(item.contributorId)?.items.push({
      presetId: item.presetId,
      monthlyKRW: item.monthlyKrw,
      usageCount: item.usageCount,
    });
  }
  return summarize([...byContributor.values()]);
}
