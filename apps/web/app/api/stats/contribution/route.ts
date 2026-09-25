import { NextRequest, NextResponse } from "next/server";
import { databaseUnavailableResponse } from "@lib/db";
import { isAnonymousStatsOpen } from "@lib/privacy";
import { parseContribution } from "@lib/stats";
import {
  createContribution,
  deleteContribution,
  readBearer,
  replaceContribution,
} from "@lib/stats-server";
import {
  clientIp,
  hit,
  retryAfterSeconds,
  tooManyRequestsMessage,
  type RateLimitRule,
} from "@lib/rate-limit";
import { logError } from "@lib/log";

/**
 * 익명 구독 통계에 참여한 기기가 요약을 보내는 곳. 토큰이 없으면 새 참여자로 만들고 토큰을 돌려주고,
 * 토큰이 있으면 그 기록을 통째로 바꾼다. 로그인과 묶지 않는다(lib/stats-server).
 */

/** 새 참여자는 IP당 한 시간에 5명까지 — 가짜 참여자를 쏟아 통계를 흔들지 못하게. */
const NEW_PER_IP: RateLimitRule = { limit: 5, windowMs: 60 * 60 * 1000 };
/** 갱신은 기록을 고칠 때마다 온다. 넉넉하게 두되 끝없이 받지는 않는다. */
const UPDATES_PER_IP: RateLimitRule = { limit: 120, windowMs: 60 * 60 * 1000 };

function closed() {
  return NextResponse.json({ error: "아직 시작하지 않은 기능입니다." }, { status: 403 });
}

function limited(seconds: number) {
  return NextResponse.json(
    { error: tooManyRequestsMessage(seconds) },
    { status: 429, headers: { "Retry-After": String(seconds) } },
  );
}

export async function POST(request: NextRequest) {
  if (!isAnonymousStatsOpen()) return closed();
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  try {
    const contribution = parseContribution(await request.json().catch(() => null));
    if (!contribution) {
      return NextResponse.json({ error: "보낸 요약을 읽지 못했습니다." }, { status: 400 });
    }

    const ip = clientIp(request.headers);
    const token = readBearer(request.headers.get("authorization"));
    if (token) {
      const key = `stats-update:ip:${ip}`;
      const wait = retryAfterSeconds(key, UPDATES_PER_IP);
      if (wait > 0) return limited(wait);
      hit(key, UPDATES_PER_IP);
      if (!(await replaceContribution(token, contribution))) {
        // 기록이 지워졌다(오래돼서 정리됐거나 다른 곳에서 그만뒀다). 기기가 새로 참여하게 한다.
        return NextResponse.json({ error: "참여 기록이 없습니다." }, { status: 401 });
      }
      return NextResponse.json({ ok: true });
    }

    const key = `stats-new:ip:${ip}`;
    const wait = retryAfterSeconds(key, NEW_PER_IP);
    if (wait > 0) return limited(wait);
    hit(key, NEW_PER_IP);
    return NextResponse.json({ token: await createContribution(contribution) }, { status: 201 });
  } catch (error) {
    logError("api/stats/contribution", error);
    return NextResponse.json({ error: "통계에 보내지 못했습니다." }, { status: 500 });
  }
}

/** 참여를 그만두면 그 기기의 기록을 지운다. 이미 없어도 성공으로 본다. */
export async function DELETE(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  const token = readBearer(request.headers.get("authorization"));
  if (!token) return NextResponse.json({ error: "토큰이 없습니다." }, { status: 401 });
  try {
    await deleteContribution(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    logError("api/stats/contribution", error);
    return NextResponse.json({ error: "기록을 지우지 못했습니다." }, { status: 500 });
  }
}
