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
import { getAccountBySessionToken, readSessionToken, SESSION_COOKIE } from "@lib/auth-server";

/**
 * 익명 구독 통계에 참여한 기기가 요약을 보내는 곳. 토큰이 없으면 새 참여자로 만들고 토큰을 돌려주고,
 * 토큰이 있으면 그 기록을 통째로 바꾼다.
 *
 * 로그인한 사람만 보낼 수 있다. 예전에는 로그인하지 않은 기기도 받아, 샘플을 넣어 보거나 잠깐 써 본
 * 사람의 요약이 '다른 사용자'의 가운데 값에 섞였다. 계정은 여기서 확인만 하고 기록에 적지 않는다 —
 * 저장은 여전히 계정과 묶지 않는다(lib/stats-server).
 *
 * 통계 토큰은 `X-Stats-Token`으로 받는다. 앱은 `Authorization`에 세션 토큰을 싣기 때문이다.
 */
const STATS_TOKEN_HEADER = "x-stats-token";

/**
 * 요청의 통계 토큰. 이 헤더가 생기기 전의 웹 화면은 통계 토큰을 `Authorization`에 실었다 — 세션이
 * 쿠키로 온 요청이면 그 자리의 값은 세션이 아니라 통계 토큰이다.
 */
function readStatsToken(request: NextRequest): string | null {
  const token = request.headers.get(STATS_TOKEN_HEADER)?.trim() ?? "";
  if (/^[0-9a-f]{64}$/.test(token)) return token;
  const legacy = readBearer(request.headers.get("authorization"));
  if (!legacy) return null;
  if (request.method === "DELETE" || request.cookies.get(SESSION_COOKIE)) return legacy;
  return null;
}

function loginRequired() {
  return NextResponse.json(
    { error: "로그인해야 통계에 참여할 수 있습니다.", code: "login-required" },
    { status: 403 },
  );
}

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

    if (!(await getAccountBySessionToken(readSessionToken(request)))) return loginRequired();

    const ip = clientIp(request.headers);
    const token = readStatsToken(request);
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

/**
 * 참여를 그만두면 그 기기의 기록을 지운다. 이미 없어도 성공으로 본다. 지우기에는 로그인이 필요 없다 —
 * 로그아웃한 기기와 로그인 없이 참여했던 기기도 자기 기록을 지울 수 있어야 한다.
 */
export async function DELETE(request: NextRequest) {
  const unavailable = databaseUnavailableResponse();
  if (unavailable) return unavailable;
  const token = readStatsToken(request);
  if (!token) return NextResponse.json({ error: "토큰이 없습니다." }, { status: 401 });
  try {
    await deleteContribution(token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    logError("api/stats/contribution", error);
    return NextResponse.json({ error: "기록을 지우지 못했습니다." }, { status: 500 });
  }
}
