import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { getAccountBySessionToken, readSessionToken } from "@lib/auth-server";
import { isDeviceUsageOpen } from "@lib/privacy";
import { parseUsageUpload, USAGE_RETENTION_DAYS } from "@lib/device-usage";
import {
  deleteAllDeviceUsage,
  deleteDeviceUsage,
  loadDeviceUsage,
  replaceDeviceUsage,
} from "@lib/device-usage-server";
import {
  hit,
  retryAfterSeconds,
  tooManyRequestsMessage,
  type RateLimitRule,
} from "@lib/rate-limit";
import { logError } from "@lib/log";

/**
 * 기기 간 사용 측정 — 계정의 모든 기기를 모아 세기(GET), 이 기기가 잰 구간 올리기(POST), 지우기(DELETE).
 * 사용 기록은 로그인 계정에 묶여야 기기를 이을 수 있으므로 로그인이 필요하다(lib/device-usage).
 */

/** 기기는 앱을 열 때·하루 몇 번 올린다. 한 계정에 기기가 여럿이어도 넉넉한 값이다. */
const UPLOADS_PER_ACCOUNT: RateLimitRule = { limit: 60, windowMs: 60 * 60 * 1000 };

const LOGIN_REQUIRED = () => NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
const CLOSED = () =>
  NextResponse.json({ error: "아직 시작하지 않은 기능입니다." }, { status: 403 });

export async function GET(request: NextRequest) {
  if (!isDeviceUsageOpen()) return CLOSED();
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await getAccountBySessionToken(readSessionToken(request));
    if (!account) return LOGIN_REQUIRED();
    const requested = Number(request.nextUrl.searchParams.get("days") ?? 30);
    const days = Number.isInteger(requested)
      ? Math.min(Math.max(requested, 1), USAGE_RETENTION_DAYS)
      : 30;
    return NextResponse.json(await loadDeviceUsage(account.id, days));
  } catch (error) {
    logError("api/usage GET", error);
    return NextResponse.json({ error: "사용 기록을 읽지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isDeviceUsageOpen()) return CLOSED();
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await getAccountBySessionToken(readSessionToken(request));
    if (!account) return LOGIN_REQUIRED();

    const key = `usage-upload:account:${account.id}`;
    const wait = retryAfterSeconds(key, UPLOADS_PER_ACCOUNT);
    if (wait > 0) {
      return NextResponse.json(
        { error: tooManyRequestsMessage(wait) },
        { status: 429, headers: { "Retry-After": String(wait) } },
      );
    }
    hit(key, UPLOADS_PER_ACCOUNT);

    const upload = parseUsageUpload(await request.json().catch(() => null));
    if (!upload) {
      return NextResponse.json({ error: "보낸 사용 기록을 읽지 못했습니다." }, { status: 400 });
    }
    await replaceDeviceUsage(account.id, upload);
    return NextResponse.json({ ok: true, stored: upload.intervals.length });
  } catch (error) {
    logError("api/usage POST", error);
    return NextResponse.json({ error: "사용 기록을 저장하지 못했습니다." }, { status: 500 });
  }
}

/**
 * `{ deviceKey }`면 그 기기만, `{ all: true }`면 계정의 모든 기기를 지운다. 시작일 전에도 연다 —
 * 지우는 길은 언제나 열려 있어야 한다.
 */
export async function DELETE(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const account = await getAccountBySessionToken(readSessionToken(request));
    if (!account) return LOGIN_REQUIRED();
    const body = (await request.json().catch(() => null)) as {
      deviceKey?: unknown;
      all?: unknown;
    } | null;
    if (body?.all === true) {
      await deleteAllDeviceUsage(account.id);
      return NextResponse.json({ ok: true });
    }
    if (typeof body?.deviceKey !== "string" || body.deviceKey.length > 64) {
      return NextResponse.json({ error: "deviceKey 또는 all이 필요합니다." }, { status: 400 });
    }
    await deleteDeviceUsage(account.id, body.deviceKey);
    return NextResponse.json({ ok: true });
  } catch (error) {
    logError("api/usage DELETE", error);
    return NextResponse.json({ error: "사용 기록을 지우지 못했습니다." }, { status: 500 });
  }
}
