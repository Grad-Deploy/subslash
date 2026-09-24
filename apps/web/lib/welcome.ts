/**
 * 앱(Capacitor) 첫 실행 환영 화면을 본 적 있는지.
 *
 * localStorage가 아니라 Preferences(안드로이드 SharedPreferences, iOS UserDefaults)에 둔다.
 * 운영체제가 웹뷰 저장소를 비워도 "봤다"는 사실은 남아야, 그때마다 환영 화면이 다시 뜨지 않는다.
 * 웹에서는 이 화면 자체를 렌더링하지 않으므로 두 함수 모두 부를 일이 없다.
 */
import { IS_APP_BUILD } from "./platform";

const KEY = "subslash-welcome-seen";

// 플러그인 객체(Preferences)를 Promise의 결과로 돌려주면 안 된다. Capacitor 플러그인은 없는
// 메서드도 호출할 수 있는 척하는 프록시라, Promise가 then을 찾아 부르면 "Preferences.then() is
// not implemented"로 실패한다. 모듈을 돌려주고 쓰는 곳에서 꺼낸다.
function preferencesModule() {
  return import("@capacitor/preferences");
}

/** 읽기 실패 시 true를 돌려준다 — 오류로 매번 환영 화면이 뜨는 것보다 안 뜨는 쪽이 낫다. */
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
    console.warn("[welcome] 환영 화면을 본 것으로 남기지 못했습니다", error);
  }
}
