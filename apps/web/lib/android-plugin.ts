/**
 * 앱(apps/mobile)에 직접 둔 안드로이드 플러그인을 불러오는 함수를 만든다. 웹과 iOS에서는 null이라 부르는
 * 쪽이 '지원하지 않음'으로 처리한다 — iOS에서 부르면 "not implemented"로 거절당해 경고만 쌓인다.
 *
 * 플러그인 프록시는 { plugin }으로 한 번 감싸서 넘긴다. Capacitor 플러그인 프록시는 어떤 속성이든 네이티브
 * 메서드로 답해서 `then`도 있는 것처럼 보인다. 프록시를 그대로 Promise의 결과로 넘기면 Promise가 그것을
 * thenable로 여겨 네이티브 'then'을 부르고, 영영 끝나지 않는다(사용 현황이 계속 '확인 중'에 머물렀다).
 *
 * @capacitor/core는 동적으로 불러와 웹 번들의 첫 화면에 들어가지 않게 한다. 한 번 불러온 것은 다시 쓴다.
 */
import { IS_APP_BUILD } from "./platform";

export function androidPluginLoader<T>(name: string): () => Promise<{ plugin: T } | null> {
  let loaded: Promise<{ plugin: T } | null> | null = null;
  return () => {
    if (!IS_APP_BUILD) return Promise.resolve(null);
    loaded ??= import("@capacitor/core")
      .then(({ Capacitor, registerPlugin }) =>
        Capacitor.getPlatform() === "android" ? { plugin: registerPlugin<T>(name) } : null,
      )
      .catch(() => null);
    return loaded;
  };
}
