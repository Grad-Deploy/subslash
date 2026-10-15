/**
 * 앱의 기기 저장소(Capacitor Preferences) 모듈을 불러온다. 웹 번들에 넣지 않으려고 쓰는 곳마다 동적으로 부른다.
 *
 * 플러그인 객체(Preferences)를 Promise의 결과로 돌려주면 안 된다. Capacitor 플러그인은 없는 메서드도 호출할 수
 * 있는 척하는 프록시라, Promise가 then을 찾아 부르면 "Preferences.then() is not implemented"로 실패한다. 그래서
 * 모듈을 돌려주고 쓰는 곳에서 꺼낸다(`(await preferencesModule()).Preferences`).
 */
export function preferencesModule() {
  return import("@capacitor/preferences");
}
