/**
 * 앱(Capacitor)의 로컬 결제 알림에 넣을 목록을 만든다. 무엇을 언제 알릴지만 정하고, 알림을 거는
 * 일은 lib/native-reminders가 한다.
 *
 * 서버를 거치지 않는 알림이라 로그인·이메일이 필요 없다. 대신 앱이 떠 있을 때 목록을 다시
 * 건다 — 그래서 구독마다 앞으로 몇 번의 결제까지 미리 걸어 둔다.
 */
import {
  formatCurrency,
  getBilledAmount,
  getNextBillingDateFor,
  type Subscription,
} from "@subslash/shared";

/** 구독마다 미리 걸어 둘 결제 횟수. 앱을 한동안 열지 않아도 다음 몇 번은 알린다. */
export const OCCURRENCES_PER_SUBSCRIPTION = 3;

/** 한 번에 걸어 두는 알림의 상한. iOS는 앱마다 64개까지만 걸어 둔다. */
export const MAX_SCHEDULED = 60;

/** 알림을 보내는 시각(기기 시간대의 시). 결제일 새벽에 깨우지 않는다. */
export const REMINDER_HOUR = 9;

export interface PlannedReminder {
  /** 알림 id. 같은 구독의 같은 결제일이면 늘 같은 값이다(32비트 양의 정수). */
  id: number;
  subscriptionId: string;
  title: string;
  body: string;
  at: Date;
}

/**
 * 앞으로 보낼 결제 알림. 활성 구독만, 결제일 `daysBefore`일 전 오전 9시에.
 *
 * 결제 월을 모르는 연간 구독은 결제일을 알 수 없어 넣지 않는다 — 날짜를 지어내면 오지 않을
 * 결제를 알린다. 알릴 시각이 이미 지났으면 그 결제는 건너뛴다. 늦게라도 보내면, 앱을 열 때마다
 * 목록을 다시 걸면서 같은 알림이 되풀이된다.
 */
export function planReminders(
  subscriptions: readonly Subscription[],
  daysBefore: number,
  now: Date = new Date(),
): PlannedReminder[] {
  const planned: PlannedReminder[] = [];

  for (const sub of subscriptions) {
    if (sub.status !== "active") continue;

    let from = now;
    for (let i = 0; i < OCCURRENCES_PER_SUBSCRIPTION; i++) {
      const billing = getNextBillingDateFor(sub, from);
      if (!billing) break;
      // 결제일 당일은 지난 것으로 치므로(getNextBillingDateFor), 이 날로 물으면 그다음 결제가 나온다.
      from = billing;

      const at = new Date(
        billing.getFullYear(),
        billing.getMonth(),
        billing.getDate() - daysBefore,
        REMINDER_HOUR,
      );
      if (at.getTime() <= now.getTime()) continue;

      planned.push({
        id: reminderId(sub.id, billing),
        subscriptionId: sub.id,
        title: `${sub.name} 결제 ${daysBefore === 0 ? "오늘" : `${daysBefore}일 전`}`,
        body: `${billing.getMonth() + 1}월 ${billing.getDate()}일에 ${formatCurrency(
          getBilledAmount(sub),
          sub.currency,
        )}이 결제될 예정이에요. 계속 쓸지 확인해 보세요.`,
        at,
      });
    }
  }

  return planned.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, MAX_SCHEDULED);
}

/** 구독 id와 결제일로 정하는 알림 id(FNV-1a). 다시 걸어도 같은 알림은 같은 id라 겹치지 않는다. */
export function reminderId(subscriptionId: string, billing: Date): number {
  const key = `${subscriptionId}:${billing.getFullYear()}-${billing.getMonth() + 1}-${billing.getDate()}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  // 0은 피한다. 일부 플랫폼이 0을 '없음'으로 다룬다.
  return hash & 0x7fffffff || 1;
}
