/**
 * 앱(Capacitor)의 로컬 결제 알림을 기기에 걸고 지운다. 무엇을 언제 알릴지는 lib/local-reminders가
 * 정한다. 웹에서는 모든 함수가 아무것도 하지 않는다.
 *
 * 안드로이드 13부터는 알림을 띄우려면 사용자에게 알림 권한을 받아야 한다. 권한은 앱을 켤 때가
 * 아니라 사용자가 알림을 켤 때 묻는다. 정확한 시각 알람(SCHEDULE_EXACT_ALARM)은 쓰지 않는다 —
 * 안드로이드 14부터 기본으로 막힌 별도 권한이고, 결제일 알림은 몇 분 늦어도 된다.
 */
import { IS_APP_BUILD } from "./platform";
import type { PlannedReminder } from "./local-reminders";

export type ReminderPermission = "granted" | "denied" | "prompt" | "unsupported";

const CHANNEL_ID = "billing";
/** 시험 알림의 id. 결제 알림 id(lib/local-reminders의 reminderId)와 겹칠 일이 사실상 없는 값. */
const TEST_NOTIFICATION_ID = 2_147_480_000;

// 플러그인 객체가 아니라 모듈을 돌려준다. 플러그인은 프록시라 Promise의 결과가 되면 then을
// 찾는 순간 실패한다(lib/session-token 참고).
function pluginModule() {
  return import("@capacitor/local-notifications");
}

type Plugin = Awaited<ReturnType<typeof pluginModule>>["LocalNotifications"];

function normalize(state: string): ReminderPermission {
  if (state === "granted") return "granted";
  if (state === "denied") return "denied";
  return "prompt";
}

export async function checkReminderPermission(): Promise<ReminderPermission> {
  if (!IS_APP_BUILD) return "unsupported";
  const { LocalNotifications } = await pluginModule();
  return normalize((await LocalNotifications.checkPermissions()).display);
}

/**
 * 알림 권한을 묻는다. 이미 거부했으면 안드로이드가 다시 묻지 않고 곧바로 "denied"를 준다 —
 * 그때는 휴대폰 설정에서 켜야 한다.
 */
export async function requestReminderPermission(): Promise<ReminderPermission> {
  if (!IS_APP_BUILD) return "unsupported";
  const { LocalNotifications } = await pluginModule();
  return normalize((await LocalNotifications.requestPermissions()).display);
}

let channelReady: Promise<void> | null = null;

/** 안드로이드 8부터 알림은 채널에 속한다. 사용자는 설정에서 이 채널만 따로 끌 수 있다. */
function ensureChannel(plugin: Plugin): Promise<void> {
  channelReady ??= plugin
    .createChannel({
      id: CHANNEL_ID,
      name: "결제 알림",
      description: "구독 결제일 전에 알려 드립니다.",
      importance: 3,
    })
    .catch((error) => {
      channelReady = null;
      throw error;
    });
  return channelReady;
}

/** 이 앱이 걸어 둔 결제 알림을 모두 지우고 `plan`으로 다시 건다. 빈 목록이면 지우기만 한다. */
export async function replaceScheduledReminders(plan: readonly PlannedReminder[]): Promise<void> {
  if (!IS_APP_BUILD) return;
  const { LocalNotifications } = await pluginModule();
  await ensureChannel(LocalNotifications);

  const { notifications: pending } = await LocalNotifications.getPending();
  const ours = pending.filter((n) => n.extra?.kind === "billing");
  if (ours.length > 0) {
    await LocalNotifications.cancel({ notifications: ours.map((n) => ({ id: n.id })) });
  }
  if (plan.length === 0) return;

  await LocalNotifications.schedule({
    notifications: plan.map((reminder) => ({
      id: reminder.id,
      title: reminder.title,
      body: reminder.body,
      channelId: CHANNEL_ID,
      schedule: { at: reminder.at, allowWhileIdle: true },
      isExactNotification: false,
      extra: { kind: "billing", subscriptionId: reminder.subscriptionId },
    })),
  });
}

/** 권한과 채널이 제대로 되었는지 사용자가 바로 확인하도록, 몇 초 뒤에 시험 알림을 띄운다. */
export async function sendTestReminder(): Promise<void> {
  if (!IS_APP_BUILD) return;
  const { LocalNotifications } = await pluginModule();
  await ensureChannel(LocalNotifications);
  await LocalNotifications.schedule({
    notifications: [
      {
        id: TEST_NOTIFICATION_ID,
        title: "SubSlash 결제 알림 시험",
        body: "알림이 이렇게 뜹니다. 결제일 전 오전 9시에 알려 드릴게요.",
        channelId: CHANNEL_ID,
        schedule: { at: new Date(Date.now() + 5_000), allowWhileIdle: true },
        isExactNotification: false,
        extra: { kind: "test" },
      },
    ],
  });
}

/** 결제 알림을 누르면 부른다. 돌려준 함수로 해제한다. */
export function onReminderTapped(handler: (subscriptionId: string) => void): () => void {
  if (!IS_APP_BUILD) return () => {};
  let disposed = false;
  let remove: (() => Promise<void>) | null = null;
  void pluginModule()
    .then(({ LocalNotifications }) =>
      LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
        const id = action.notification.extra?.subscriptionId;
        if (typeof id === "string") handler(id);
      }),
    )
    .then((handle) => {
      if (disposed) void handle.remove();
      else remove = () => handle.remove();
    })
    .catch((error) => console.warn("[native-reminders] 알림 누름을 받지 못합니다", error));
  return () => {
    disposed = true;
    void remove?.();
  };
}
