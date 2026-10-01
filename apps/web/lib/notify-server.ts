import { getDb } from "./db";
import { mirroredSubscriptions, notificationLog, notificationSubscribers } from "./schema";

/**
 * 결제 알림 메일(과 그 위의 캘린더 피드)을 그만두면서 남은 서버 기록을 지운다. 크론이 하루 한 번 부른다.
 *
 * 그만둔 뒤에는 이 표들에 새 줄이 생기지 않는다 — 쓰는 API가 없다. 남은 이메일·구독 사본은 쓸 목적이
 * 없으므로 보관하지 않는다(방침 '결제 알림'). 표 자체는 다음 마이그레이션에서 지운다. 자식 표를 먼저
 * 지운다 — `ON DELETE CASCADE`는 `PRAGMA foreign_keys`가 켜져 있을 때만 동작한다. 지운 알림 구독자
 * 수를 돌려준다.
 */
export async function purgeRetiredNotifyData(): Promise<number> {
  const db = getDb();
  await db.delete(notificationLog);
  await db.delete(mirroredSubscriptions);
  const deleted = await db
    .delete(notificationSubscribers)
    .returning({ id: notificationSubscribers.id });
  return deleted.length;
}
