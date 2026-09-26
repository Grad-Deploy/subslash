import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { accountIdentities, oauthAppClaims } from "./schema";

/**
 * 계정을 지울 때 소셜 로그인 연결과 앱 넘겨받기를 지운다. 스키마의 ON DELETE CASCADE는 PRAGMA
 * foreign_keys가 켜져 있을 때만 동작하므로 직접 지운다. 계정을 지우는 경로(회원 탈퇴, '제가 가입하지
 * 않았어요')가 모두 부른다 — 그래서 다른 모듈을 끌어오지 않는 따로 된 파일이다.
 */
export async function deleteOAuthData(accountId: string): Promise<void> {
  const db = getDb();
  await db.delete(accountIdentities).where(eq(accountIdentities.accountId, accountId));
  await db.delete(oauthAppClaims).where(eq(oauthAppClaims.accountId, accountId));
}
