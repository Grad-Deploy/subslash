/**
 * 앱(Capacitor)의 로그인 세션 토큰.
 *
 * 웹의 세션은 httpOnly 쿠키에만 있어 자바스크립트가 만지지 않는다. 앱은 화면이 다른 출처
 * (https://localhost)에서 돌아 쿠키가 실리지 않으므로, 로그인·가입·비밀번호 변경 응답 본문의
 * 토큰(서버의 sessionTokenForApp)을 기기에 두고 요청마다 Authorization 헤더로 보낸다
 * (lib/api의 apiFetch). 웹에서는 모든 함수가 아무것도 하지 않는다.
 *
 * localStorage가 아니라 Preferences(안드로이드 SharedPreferences, iOS UserDefaults)에 둔다.
 * 운영체제가 웹뷰 저장소를 비우면 어느 날 말없이 로그아웃된다.
 */
import { IS_APP_BUILD } from "./platform";

const KEY = "subslash-session-token";

let loaded: Promise<string | null> | null = null;

// 플러그인 객체(Preferences)를 Promise의 결과로 돌려주면 안 된다. Capacitor 플러그인은 없는
// 메서드도 호출할 수 있는 척하는 프록시라, Promise가 then을 찾아 부르면 "Preferences.then() is
// not implemented"로 실패한다. 모듈을 돌려주고 쓰는 곳에서 꺼낸다.
function preferencesModule() {
  return import("@capacitor/preferences");
}

/** 보관한 토큰. 처음 한 번만 기기 저장소에서 읽는다. */
export function loadSessionToken(): Promise<string | null> {
  if (!IS_APP_BUILD) return Promise.resolve(null);
  loaded ??= preferencesModule()
    .then(({ Preferences }) => Preferences.get({ key: KEY }))
    .then((result) => result.value)
    .catch(() => null);
  return loaded;
}

/** 응답 본문에 새 세션 토큰이 있으면 보관한다. 서버는 앱 출처의 요청에만 토큰을 싣는다. */
export async function saveSessionToken(data: unknown): Promise<void> {
  if (!IS_APP_BUILD) return;
  const token = (data as { sessionToken?: unknown } | null)?.sessionToken;
  if (typeof token !== "string" || !token) return;
  loaded = Promise.resolve(token);
  await (await preferencesModule()).Preferences.set({ key: KEY, value: token });
}

/** 로그아웃했거나 계정을 지웠을 때. */
export async function clearSessionToken(): Promise<void> {
  if (!IS_APP_BUILD) return;
  loaded = Promise.resolve(null);
  await (await preferencesModule()).Preferences.remove({ key: KEY });
}

/** 성공하면 새 세션을 내리는 요청. 앱 출처면 응답 본문에 토큰이 있다. */
const SESSION_ISSUERS = new Set([
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/password",
  "/api/auth/password-reset/confirm",
  "/api/auth/oauth/claim",
]);

/**
 * apiFetch가 받은 응답으로 보관한 토큰을 바꾼다.
 *
 * `/api/auth/me`가 계정 없음(null)을 줘도 토큰을 지우지 않는다. 그 응답은 서버 DB 오류 때도
 * 같아서, 지우면 서버가 잠깐 아플 때 사용자가 로그아웃된다. 만료된 토큰은 서버가 무시할 뿐이고
 * 다음 로그인이 덮어쓴다.
 */
export async function trackSessionResponse(
  path: string,
  method: string,
  res: Response,
): Promise<void> {
  if (!IS_APP_BUILD || !res.ok) return;
  try {
    if (SESSION_ISSUERS.has(path)) {
      await saveSessionToken(await res.clone().json());
    } else if (path === "/api/auth/account" && method.toUpperCase() === "DELETE") {
      await clearSessionToken();
    }
  } catch (error) {
    // 요청은 성공했으므로 실패로 돌려주지 않는다. 토큰을 못 적었으면 다음에 다시 로그인하게 된다.
    console.warn("[session-token] 세션 토큰을 보관하지 못했습니다", error);
  }
}
