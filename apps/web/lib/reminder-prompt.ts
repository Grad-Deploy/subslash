import { IS_APP_BUILD } from "@lib/platform";
import { ownerScopedKey, readOwnerScoped } from "@lib/owner-scoped";

/**
 * 앱의 '결제 알림 켤까요?'를 처음 한 번만 묻기 위한 기록. 첫 체크인(어디서 했든)이나 첫 불러오기가
 * 끝났을 때 묻고, 한 번 물었으면 켜지 않았어도 다시 묻지 않는다. 이 기기의 설정이라 localStorage에 두되,
 * 기록 주인(비로그인·계정)마다 따로 둔다(lib/owner-scoped).
 * (시작 체크리스트의 '결제 알림' 단계처럼 사용자가 직접 누른 경우는 이 기록과 상관없이 연다.)
 */
const KEY = "subslash-reminder-prompted";

export function shouldPromptReminder(remindersEnabled: boolean): boolean {
  if (!IS_APP_BUILD || remindersEnabled) return false;
  try {
    return readOwnerScoped(localStorage, KEY) !== "1";
  } catch {
    return false;
  }
}

export function markReminderPrompted(): void {
  try {
    localStorage.setItem(ownerScopedKey(KEY), "1");
  } catch {}
}
