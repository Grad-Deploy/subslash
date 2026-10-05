/**
 * 앱(Capacitor) 첫 실행 소개(AppOnboarding)를 본 적 있는지.
 *
 * localStorage가 아니라 Preferences(안드로이드 SharedPreferences, iOS UserDefaults)에 둔다.
 * 운영체제가 웹뷰 저장소를 비워도 "봤다"는 사실은 남아야, 그때마다 소개가 다시 뜨지 않는다.
 * 웹에서는 이 화면 자체를 렌더링하지 않으므로 두 함수 모두 부를 일이 없다.
 */
import { IS_APP_BUILD } from "./platform";

// 예전 환영 화면(AppWelcome)은 "subslash-welcome-seen"에 적었다. 소개 슬라이드로 바꾸면서 키를 새로 둬,
// 예전 화면을 이미 넘긴 사용자도 업데이트 뒤 소개를 한 번 본다. 소개를 크게 바꿔 다시 보여 줄 때도 키를 바꾼다.
const KEY = "subslash-onboarding-seen";

// 플러그인 객체(Preferences)를 Promise의 결과로 돌려주면 안 된다. Capacitor 플러그인은 없는
// 메서드도 호출할 수 있는 척하는 프록시라, Promise가 then을 찾아 부르면 "Preferences.then() is
// not implemented"로 실패한다. 모듈을 돌려주고 쓰는 곳에서 꺼낸다.
function preferencesModule() {
  return import("@capacitor/preferences");
}

// 소개 마지막 장에서 고른 서비스. 대시보드가 받아 등록 창을 차례로 연다(useAddSubscriptionFlow의 openQueue).
// 소개와 대시보드는 같은 화면 안에서 옮겨 가므로 메모리에만 둔다 — 앱을 껐다 켜면 고른 것은 남지 않는다.
let pendingPicks: string[] = [];

/** 소개에서 고른 서비스 id를 대시보드에 넘긴다. */
export function queueWelcomePicks(ids: string[]): void {
  pendingPicks = [...ids];
}

/** 넘겨받은 서비스 id. 한 번 받으면 비운다 — 대시보드를 다시 열 때마다 등록 창이 뜨지 않게. */
export function takeWelcomePicks(): string[] {
  const ids = pendingPicks;
  pendingPicks = [];
  return ids;
}

/** 읽기 실패 시 true를 돌려준다 — 오류로 매번 소개가 뜨는 것보다 안 뜨는 쪽이 낫다. */
export async function hasSeenWelcome(): Promise<boolean> {
  if (!IS_APP_BUILD) return true;
  try {
    const { Preferences } = await preferencesModule();
    const result = await Preferences.get({ key: KEY });
    return result.value === "1";
  } catch {
    return true;
  }
}

export async function markWelcomeSeen(): Promise<void> {
  if (!IS_APP_BUILD) return;
  try {
    const { Preferences } = await preferencesModule();
    await Preferences.set({ key: KEY, value: "1" });
  } catch (error) {
    console.warn("[welcome] 소개를 본 것으로 남기지 못했습니다", error);
  }
}
