import { DEMO_SUBSCRIPTIONS, type Subscription, type UsageLog } from "@subslash/shared";

/** 샘플 체험이 스스로 끝나기까지의 시간. 새로고침하거나 '체험 끝내기'를 누르면 그 전에 끝난다. */
export const DEMO_DURATION_MS = 30 * 60 * 1000;

/**
 * 샘플 체험.
 *
 * 체험하는 동안 화면의 `subscriptions`·`usageLogs`는 샘플이고, 실제 기록은 `saved`에 보관한다.
 * 예전에는 샘플을 실제 목록에 그대로 더해서, 쓰던 구독과 섞인 채 저장소에 남았다. 이제
 * 저장소(localStorage)에는 체험 중에도 실제 기록만 저장하므로(partialize) 새로고침하면 체험이
 * 끝나고 실제 기록으로 돌아온다. 체험 중에 누른 체크인·해지도 샘플에만 남는다.
 */
export interface DemoSession {
  startedAt: string;
  saved: { subscriptions: Subscription[]; usageLogs: UsageLog[] };
}

/** 체험이 정해진 시간을 넘겼는지. 시작 시각을 읽을 수 없으면 끝난 것으로 본다. */
export function isDemoExpired(demo: DemoSession, now: Date = new Date()): boolean {
  const started = Date.parse(demo.startedAt);
  return Number.isNaN(started) || now.getTime() - started >= DEMO_DURATION_MS;
}

/**
 * 실제 기록. 체험 중이면 보관해 둔 것이다. 서버로 나가는 것(알림 미러·계정 저장)과 백업은
 * 이것을 써야 한다 — 화면의 목록을 쓰면 샘플이 실제 기록처럼 내보내진다.
 */
export function realRecords(state: {
  subscriptions: Subscription[];
  usageLogs: UsageLog[];
  demo: DemoSession | null;
}): { subscriptions: Subscription[]; usageLogs: UsageLog[] } {
  return state.demo
    ? state.demo.saved
    : { subscriptions: state.subscriptions, usageLogs: state.usageLogs };
}

export function demoSubscriptions(now: string): Subscription[] {
  return DEMO_SUBSCRIPTIONS.map((item, index) => ({
    ...item,
    id: `demo-${index + 1}`,
    status: "active",
    createdAt: now,
  }));
}
