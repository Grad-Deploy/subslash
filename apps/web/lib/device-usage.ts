/**
 * 기기 간 사용 측정 — 브라우저·서버가 함께 쓰는 규칙(서버 전용 코드는 device-usage-server).
 *
 * 앱이 있는 안드로이드 기기가 '사용 정보 접근'으로 서비스 앱이 화면 맨 앞에 있던 구간을 재고, 로그인한
 * 계정으로 올린다. 서버는 같은 계정의 모든 기기 구간을 모아 `summarizeUsage`로 센다 — 휴대폰에서
 * 보다가 태블릿에서 이어 보면 한 번이다(@subslash/shared의 deviceUsage).
 *
 * 잴 수 있는 것은 '그 앱이 앞에 있었다'뿐이다. TV·PC·iPhone·측정을 켜지 않은 기기, 화면을 끈 채 듣는
 * 음악, 배속은 없다. 그래서 결과는 "측정한 기기에서 최소 N회"이고 체크인을 대신하지 않는다.
 */

import { USAGE_PACKAGES } from "./usage/packages";

/** 서버에 두는 기간. 체크인이 묻는 '지난 30일'에 경계 여유를 더했다. 지난 것은 크론이 지운다. */
export const USAGE_RETENTION_DAYS = 40;

/** 한 번에 올리는 구간 수 상한. 40일 동안 서비스마다 하루 수십 번 열어도 넘지 않는다. */
export const MAX_INTERVALS_PER_UPLOAD = 5000;

/** 한 구간의 최대 길이. 이보다 길면 기기가 닫힘 이벤트를 놓친 것이다. */
export const MAX_INTERVAL_MS = 12 * 60 * 60 * 1000;

/**
 * 서비스 목록 id → 안드로이드 패키지 이름. 폰 사용 기록(lib/usage)과 **같은 표**를 쓴다 — 표가 둘이면
 * 같은 서비스가 이 폰 기록에는 있고 여러 기기 측정에는 없는 식으로 어긋난다. 무엇을 넣고 빼는지의
 * 기준은 그 파일에 있다(Play 스토어에서 공식 앱임을 확인한 것만, 앱을 여는 것이 곧 그 구독을 쓰는
 * 것인 서비스만).
 */
export const ANDROID_PACKAGES: Readonly<Record<string, readonly string[]>> = USAGE_PACKAGES;

const PACKAGE_TO_SERVICE = new Map(
  Object.entries(ANDROID_PACKAGES).flatMap(([serviceId, packages]) =>
    packages.map((pkg) => [pkg, serviceId] as const),
  ),
);

export function serviceIdForPackage(packageName: string): string | null {
  return PACKAGE_TO_SERVICE.get(packageName) ?? null;
}

export function isMeasurableService(serviceId: string): boolean {
  return Object.hasOwn(ANDROID_PACKAGES, serviceId);
}

export interface UsageUpload {
  /** 기기가 처음 만든 무작위 값(하드웨어 식별자가 아님). */
  deviceKey: string;
  platform: "android";
  label: string | null;
  /** 이번에 잰 기간(epoch ms). 서버는 이 기간의 이 기기 구간을 통째로 바꾼다. */
  from: number;
  until: number;
  intervals: { serviceId: string; start: number; end: number }[];
}

const isFiniteInt = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value);

/**
 * 기기가 올린 것을 검사한다. 틀린 구간 하나 때문에 전부 버리지 않고 그 구간만 뺀다 — 단, 기간과
 * 기기 정보가 틀리면 무엇을 바꿀지 알 수 없으므로 통째로 거절한다.
 */
export function parseUsageUpload(body: unknown, now: number = Date.now()): UsageUpload | null {
  if (!body || typeof body !== "object") return null;
  const raw = body as Record<string, unknown>;

  const deviceKey = raw.deviceKey;
  if (typeof deviceKey !== "string" || !/^[0-9a-f-]{16,64}$/i.test(deviceKey)) return null;
  if (raw.platform !== "android") return null;
  const label =
    typeof raw.label === "string" && raw.label.trim() ? raw.label.trim().slice(0, 40) : null;

  const { from, until } = raw;
  if (!isFiniteInt(from) || !isFiniteInt(until) || until <= from) return null;
  // 미래는 받지 않고(기기 시계가 조금 빠른 것만 봐준다), 보관 기간보다 오래된 것도 받지 않는다.
  if (until > now + 5 * 60 * 1000) return null;
  if (from < now - USAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000) return null;

  if (!Array.isArray(raw.intervals) || raw.intervals.length > MAX_INTERVALS_PER_UPLOAD) return null;
  const intervals: UsageUpload["intervals"] = [];
  for (const item of raw.intervals as unknown[]) {
    if (!item || typeof item !== "object") continue;
    const { serviceId, start, end } = item as Record<string, unknown>;
    if (typeof serviceId !== "string" || !isMeasurableService(serviceId)) continue;
    if (!isFiniteInt(start) || !isFiniteInt(end)) continue;
    if (end <= start || end - start > MAX_INTERVAL_MS) continue;
    if (start < from || end > until) continue;
    intervals.push({ serviceId, start, end });
  }

  return { deviceKey, platform: "android", label, from, until, intervals };
}
