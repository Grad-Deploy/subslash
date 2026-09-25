import { and, eq, gte, inArray, lt } from "drizzle-orm";
import { summarizeUsage, type UsageWindowSummary } from "@subslash/shared";
import { getDb } from "./db";
import { usageDevices, usageIntervals } from "./schema";
import { USAGE_RETENTION_DAYS, type UsageUpload } from "./device-usage";

/**
 * 기기 간 사용 측정의 서버 쪽. 기기는 자기 구간만 올리고(기기마다 따로라 서로 충돌하지 않는다),
 * 읽을 때 계정의 모든 기기 구간을 모아 세션으로 잇는다. 서버가 기기로 먼저 보내지 않는다.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 한 기기가 잰 기간의 구간을 통째로 바꾼다. 같은 기간을 다시 올려도 결과가 같다 — 기기가 올리다
 * 끊겨 다시 보내도 두 번 세지 않는다.
 */
export async function replaceDeviceUsage(accountId: string, upload: UsageUpload): Promise<void> {
  const db = getDb();
  const now = new Date().toISOString();

  const [existing] = await db
    .select()
    .from(usageDevices)
    .where(and(eq(usageDevices.accountId, accountId), eq(usageDevices.deviceKey, upload.deviceKey)))
    .limit(1);

  let deviceId: string;
  if (existing) {
    deviceId = existing.id;
    await db
      .update(usageDevices)
      .set({
        label: upload.label ?? existing.label,
        // 지난번에 잰 끝과 이번 시작 사이가 비면 그 사이는 모른다. 측정 기간을 이어 붙이지 않고 이번
        // 것부터로 좁힌다 — 전에 잰 구간은 남지만 '이 기간 전체를 쟀다'고 말하지 않는다.
        measuredFrom:
          upload.from > existing.measuredUntil
            ? upload.from
            : Math.min(existing.measuredFrom, upload.from),
        measuredUntil: Math.max(existing.measuredUntil, upload.until),
        updatedAt: now,
      })
      .where(eq(usageDevices.id, deviceId));
  } else {
    const [created] = await db
      .insert(usageDevices)
      .values({
        accountId,
        deviceKey: upload.deviceKey,
        platform: upload.platform,
        label: upload.label,
        measuredFrom: upload.from,
        measuredUntil: upload.until,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: usageDevices.id });
    deviceId = created.id;
  }

  await db
    .delete(usageIntervals)
    .where(
      and(
        eq(usageIntervals.deviceId, deviceId),
        gte(usageIntervals.startedAt, upload.from),
        lt(usageIntervals.startedAt, upload.until),
      ),
    );
  if (upload.intervals.length > 0) {
    await db
      .insert(usageIntervals)
      .values(
        upload.intervals.map((interval) => ({
          accountId,
          deviceId,
          serviceId: interval.serviceId,
          startedAt: interval.start,
          endedAt: interval.end,
        })),
      )
      // 같은 기기·서비스·시작 시각은 한 구간이다. 기기가 같은 구간을 겹쳐 보내도 하나만 남긴다.
      .onConflictDoNothing();
  }
}

export interface DeviceUsageView {
  devices: {
    deviceKey: string;
    label: string | null;
    measuredFrom: number;
    measuredUntil: number;
  }[];
  summary: UsageWindowSummary;
}

/** 계정의 모든 기기를 모아 최근 `days`일을 센다. */
export async function loadDeviceUsage(
  accountId: string,
  days: number,
  now: number = Date.now(),
): Promise<DeviceUsageView> {
  const db = getDb();
  const window = { from: now - days * DAY_MS, to: now };
  const devices = await db.select().from(usageDevices).where(eq(usageDevices.accountId, accountId));
  const rows = await db
    .select()
    .from(usageIntervals)
    .where(
      and(
        eq(usageIntervals.accountId, accountId),
        // 기간 앞에서 시작해 기간 안으로 넘어온 구간도 잡는다(구간 길이 상한만큼 앞에서부터).
        gte(usageIntervals.startedAt, window.from - DAY_MS),
      ),
    );
  const keyById = new Map(devices.map((device) => [device.id, device.deviceKey]));

  return {
    devices: devices.map((device) => ({
      deviceKey: device.deviceKey,
      label: device.label,
      measuredFrom: device.measuredFrom,
      measuredUntil: device.measuredUntil,
    })),
    summary: summarizeUsage(
      rows.map((row) => ({
        deviceId: keyById.get(row.deviceId) ?? row.deviceId,
        serviceId: row.serviceId,
        start: row.startedAt,
        end: row.endedAt,
      })),
      devices.map((device) => ({
        deviceId: device.deviceKey,
        measuredFrom: device.measuredFrom,
        measuredUntil: device.measuredUntil,
      })),
      window,
    ),
  };
}

async function deleteDevices(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = getDb();
  // ON DELETE CASCADE는 PRAGMA foreign_keys가 켜져 있을 때만 동작하므로 구간을 직접 지운다.
  await db.delete(usageIntervals).where(inArray(usageIntervals.deviceId, ids));
  await db.delete(usageDevices).where(inArray(usageDevices.id, ids));
}

/** 한 기기의 측정을 지운다(그 기기에서 측정을 끌 때). 없었으면 false. */
export async function deleteDeviceUsage(accountId: string, deviceKey: string): Promise<boolean> {
  const rows = await getDb()
    .select({ id: usageDevices.id })
    .from(usageDevices)
    .where(and(eq(usageDevices.accountId, accountId), eq(usageDevices.deviceKey, deviceKey)));
  await deleteDevices(rows.map((row) => row.id));
  return rows.length > 0;
}

/** 계정의 측정을 모두 지운다. 회원 탈퇴와 '모든 기기 측정 지우기'가 쓴다. */
export async function deleteAllDeviceUsage(accountId: string): Promise<void> {
  const db = getDb();
  await db.delete(usageIntervals).where(eq(usageIntervals.accountId, accountId));
  await db.delete(usageDevices).where(eq(usageDevices.accountId, accountId));
}

/** 보관 기간이 지난 구간과, 그동안 한 번도 올리지 않은 기기를 지운다. 크론이 하루 한 번 부른다. */
export async function pruneDeviceUsage(now: number = Date.now()): Promise<number> {
  const db = getDb();
  const cutoff = now - USAGE_RETENTION_DAYS * DAY_MS;
  const pruned = await db
    .delete(usageIntervals)
    .where(lt(usageIntervals.endedAt, cutoff))
    .returning({ id: usageIntervals.id });
  const stale = await db
    .select({ id: usageDevices.id })
    .from(usageDevices)
    .where(lt(usageDevices.updatedAt, new Date(cutoff).toISOString()));
  await deleteDevices(stale.map((row) => row.id));
  // 남은 기기의 측정 시작도 보관 기간 안으로 당긴다 — 지운 기간을 '측정했다'고 말하지 않게.
  await db
    .update(usageDevices)
    .set({ measuredFrom: cutoff })
    .where(lt(usageDevices.measuredFrom, cutoff));
  return pruned.length;
}
