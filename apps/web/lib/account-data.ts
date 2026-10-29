import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { accountSnapshots, sessions } from "./schema";
import { deleteGmailImportData } from "./gmail-auto-import";
import { deleteCalendarSyncPlan } from "./calendar-sync";
import { deleteAllDeviceUsage } from "./device-usage-server";
import { deleteOAuthData } from "./oauth-cleanup";
import { deleteAskDailyCounts } from "./ask/daily-count";

/**
 * 계정에 딸린 서버 기록을 모두 지운다(계정 행은 부르는 곳이 지운다). 회원 탈퇴(`deleteAccount`)와 주인이 모르는 가입이라고
 * 한 계정 지우기(`deleteUnverifiedAccount`)가 함께 쓴다 — 따로 적으면 표를 더할 때 한쪽에만 넣게 되고, 그쪽 길로 지운
 * 계정의 기록이 서버에 남는다. 계정에 딸린 표를 새로 만들면 여기에 더한다.
 *
 * 스키마의 ON DELETE CASCADE는 PRAGMA foreign_keys가 켜져 있을 때만 동작하므로 직접 지운다. 계정 메일 발송
 * 기록(verification_mail_log)은 주소별 발송 한도라 남긴다 — 지우면 탈퇴와 재가입을 되풀이해 한도를 풀 수 있다. 그
 * 기록은 24시간이 지나면 다음 발송 때 지워진다.
 */
export async function deleteAccountRecords(accountId: string): Promise<void> {
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.accountId, accountId));
  await db.delete(accountSnapshots).where(eq(accountSnapshots.accountId, accountId));
  await deleteGmailImportData(accountId);
  await deleteCalendarSyncPlan(accountId);
  await deleteAllDeviceUsage(accountId);
  await deleteOAuthData(accountId);
  await deleteAskDailyCounts(accountId);
}
