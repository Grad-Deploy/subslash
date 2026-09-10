import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient, type Client } from "@libsql/client";
import * as schema from "./schema";

/**
 * The database backs email reminders only. Everything else in the app runs
 * against localStorage, so most requests never touch it — the connection is
 * created lazily on first use rather than at import time.
 *
 * Without TURSO_DATABASE_URL it falls back to a local SQLite file, which is
 * what `pnpm dev` uses.
 */

let cached: LibSQLDatabase<typeof schema> | null = null;
let client: Client | null = null;

/**
 * DB가 설정되지 않아 생긴 실패. 코드 버그와 구분하려고 따로 둔다.
 *
 * 이 둘을 같은 500으로 묶으면, 배포에 환경 변수를 안 넣은 것뿐인데
 * 서버 로그에는 SQLite 내부 오류가 찍혀 원인을 엉뚱한 데서 찾게 된다.
 */
export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "TURSO_DATABASE_URL is not set. Email reminders and accounts need a database in production; " +
        "set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) in the deployment environment.",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

export function getDb(): LibSQLDatabase<typeof schema> {
  if (cached) return cached;

  const url = process.env.TURSO_DATABASE_URL;

  // 배포 환경에서 로컬 SQLite 파일로 조용히 넘어가지 않는다. 서버리스
  // 파일시스템은 읽기 전용이라 결국 실패하는데, 그때 나오는 것은
  // `Unable to open connection to local database local.db: 14` 같은
  // 속을 알 수 없는 메시지뿐이라 설정 누락이라는 사실이 드러나지 않는다.
  if (!url) {
    if (process.env.NODE_ENV === "production") throw new DatabaseNotConfiguredError();
    return connect("file:local.db", undefined);
  }

  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (url.startsWith("libsql://") && !authToken) {
    throw new Error("TURSO_AUTH_TOKEN is required when TURSO_DATABASE_URL points at Turso.");
  }

  return connect(url, authToken);
}

function connect(url: string, authToken: string | undefined): LibSQLDatabase<typeof schema> {
  client = createClient({ url, authToken });
  cached = drizzle(client, { schema });
  return cached;
}

/**
 * Releases the underlying connection. Serverless functions never need this;
 * tests do, because an open SQLite handle keeps the file locked on Windows.
 */
export function closeDb(): void {
  client?.close();
  client = null;
  cached = null;
}

/** True when reminders can work at all; routes use this to fail with a clear message. */
export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL) || process.env.NODE_ENV !== "production";
}

/**
 * DB가 없으면 곧바로 503을 돌려주고, 있으면 `null`을 준다.
 *
 * DB를 쓰는 라우트는 첫 줄에서 이걸 부른다. 503은 "지금 이 서버에서는 못
 * 한다"는 뜻이라, 코드가 잘못됐다는 500과 달리 설정을 보라고 가리킨다.
 */
export function databaseUnavailableResponse(): Response | null {
  if (isDatabaseConfigured()) return null;
  return Response.json(
    {
      error:
        "이 서버에는 데이터베이스가 설정되어 있지 않아 알림·계정 기능을 사용할 수 없습니다. " +
        "구독 목록은 브라우저에 그대로 남아 있습니다.",
    },
    { status: 503 },
  );
}

export type Database = LibSQLDatabase<typeof schema>;
