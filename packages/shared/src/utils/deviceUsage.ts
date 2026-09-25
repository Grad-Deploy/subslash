/**
 * 여러 기기에서 잰 앱 사용 시간을 계정 하나의 '사용 횟수'로 묶는다.
 *
 * 넷플릭스를 출근길 휴대폰에서 보다가 태블릿에서 이어 보면, 기기별로 세면 2번이지만 사용자에게는
 * 한 번 본 것이다. 그래서 기기를 가리지 않고 같은 서비스의 사용 구간을 시간순으로 늘어놓고, 앞 구간이
 * 끝난 뒤 `SESSION_GAP_MS` 안에 다음 구간이 시작하면 한 번의 사용(세션)으로 잇는다. 한 기기 안에서
 * 잠깐 다른 앱을 봤다가 돌아온 것도 같은 규칙으로 이어진다.
 *
 * 이 값은 **측정한 기기에서의 최소치**다. SubSlash는 재생기를 가진 서비스가 아니라 기기가 알려 주는
 * '앱이 화면 맨 앞에 있던 시간'만 안다 — TV·PC·측정을 켜지 않은 기기에서 본 것, 배속, 화면을 끈 채
 * 듣는 음악은 여기에 없다. 화면에는 "측정한 기기에서 N회"로 적고, 체크인 값(사용자가 센 횟수)을
 * 이것으로 덮어쓰지 않는다.
 */

/** 앞 사용이 끝난 뒤 이 시간 안에 다시 쓰면(기기가 달라도) 한 번으로 본다. */
export const SESSION_GAP_MS = 30 * 60 * 1000;

/** 이보다 짧은 세션은 사용으로 세지 않는다 — 알림을 눌러 잠깐 열린 앱까지 '한 번 봤다'가 되지 않게. */
export const MIN_SESSION_MS = 60 * 1000;

/** 한 기기에서 한 서비스의 앱이 화면 맨 앞에 있던 구간(epoch ms). */
export interface UsageInterval {
  deviceId: string;
  serviceId: string;
  start: number;
  end: number;
}

/** 한 기기가 측정한 기간. 이 밖의 시간은 '안 썼다'가 아니라 '모른다'다. */
export interface DeviceCoverage {
  deviceId: string;
  measuredFrom: number;
  measuredUntil: number;
}

export interface UsageSession {
  serviceId: string;
  start: number;
  end: number;
  /** 실제로 앱이 앞에 있던 시간. 두 기기가 겹친 구간은 한 번만 센다. */
  activeMs: number;
  deviceIds: string[];
  /** 세션 안에서 기기가 바뀐 횟수(휴대폰 → 태블릿이면 1). */
  handoffs: number;
}

export interface ServiceUsageSummary {
  serviceId: string;
  sessionCount: number;
  activeMinutes: number;
  handoffCount: number;
  deviceCount: number;
}

export interface UsageWindowSummary {
  from: number;
  to: number;
  services: ServiceUsageSummary[];
  /** 측정한 기기 수. 0이면 어떤 숫자도 '안 썼다'로 읽으면 안 된다. */
  measuredDeviceCount: number;
  /** 기간 전체를 측정한 기기가 하나도 없으면 true — 기간 일부의 값이다. */
  partial: boolean;
}

function clip(interval: UsageInterval, from: number, to: number): UsageInterval | null {
  const start = Math.max(interval.start, from);
  const end = Math.min(interval.end, to);
  return end > start ? { ...interval, start, end } : null;
}

/** 여러 기기의 구간을 서비스별로 이어 세션으로 만든다. 짧은 세션은 뺀다. */
export function linkSessions(
  intervals: UsageInterval[],
  options: { gapMs?: number; minSessionMs?: number } = {},
): UsageSession[] {
  const gapMs = options.gapMs ?? SESSION_GAP_MS;
  const minSessionMs = options.minSessionMs ?? MIN_SESSION_MS;

  const byService = new Map<string, UsageInterval[]>();
  for (const interval of intervals) {
    if (!(interval.end > interval.start)) continue;
    const list = byService.get(interval.serviceId) ?? [];
    list.push(interval);
    byService.set(interval.serviceId, list);
  }

  const sessions: UsageSession[] = [];
  for (const [serviceId, list] of byService) {
    list.sort((a, b) => a.start - b.start || a.end - b.end);

    let current: UsageSession | null = null;
    let devices = new Set<string>();
    let lastDevice = "";
    const close = () => {
      if (current && current.activeMs >= minSessionMs) {
        sessions.push({ ...current, deviceIds: [...devices].sort() });
      }
    };

    for (const interval of list) {
      if (current && interval.start - current.end <= gapMs) {
        // 겹친 부분은 이미 센 시간이다. 앞 세션의 끝 뒤로 넘어간 만큼만 더한다.
        current.activeMs += Math.max(0, interval.end - Math.max(interval.start, current.end));
        current.end = Math.max(current.end, interval.end);
        if (interval.deviceId !== lastDevice) current.handoffs += 1;
        devices.add(interval.deviceId);
        lastDevice = interval.deviceId;
        continue;
      }
      close();
      current = {
        serviceId,
        start: interval.start,
        end: interval.end,
        activeMs: interval.end - interval.start,
        deviceIds: [],
        handoffs: 0,
      };
      devices = new Set([interval.deviceId]);
      lastDevice = interval.deviceId;
    }
    close();
  }

  return sessions.sort((a, b) => a.start - b.start);
}

/**
 * 기간 안의 사용을 서비스별로 센다. 기간 경계에 걸친 구간은 잘라서 넣는다 — 경계 앞뒤 세션을
 * 잇지 않으므로, 기간을 나눠 센 합이 한 번에 센 값보다 클 수 있다.
 */
export function summarizeUsage(
  intervals: UsageInterval[],
  coverage: DeviceCoverage[],
  window: { from: number; to: number },
): UsageWindowSummary {
  const clipped = intervals
    .map((interval) => clip(interval, window.from, window.to))
    .filter((interval): interval is UsageInterval => interval !== null);

  const byService = new Map<string, ServiceUsageSummary & { devices: Set<string> }>();
  for (const session of linkSessions(clipped)) {
    const entry = byService.get(session.serviceId) ?? {
      serviceId: session.serviceId,
      sessionCount: 0,
      activeMinutes: 0,
      handoffCount: 0,
      deviceCount: 0,
      devices: new Set<string>(),
    };
    entry.sessionCount += 1;
    entry.activeMinutes += session.activeMs / 60000;
    entry.handoffCount += session.handoffs;
    for (const id of session.deviceIds) entry.devices.add(id);
    byService.set(session.serviceId, entry);
  }

  const measured = coverage.filter(
    (c) => c.measuredUntil > window.from && c.measuredFrom < window.to,
  );
  return {
    from: window.from,
    to: window.to,
    services: [...byService.values()]
      .map(({ devices, ...entry }) => ({
        ...entry,
        activeMinutes: Math.round(entry.activeMinutes),
        deviceCount: devices.size,
      }))
      .sort((a, b) => b.sessionCount - a.sessionCount || a.serviceId.localeCompare(b.serviceId)),
    measuredDeviceCount: measured.length,
    partial: !measured.some((c) => c.measuredFrom <= window.from && c.measuredUntil >= window.to),
  };
}
