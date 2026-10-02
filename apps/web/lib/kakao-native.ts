/**
 * 카카오톡 앱으로 로그인(apps/mobile의 KakaoLoginPlugin). 안드로이드 앱에서만 동작한다.
 *
 * 앱이 SDK로 액세스 토큰을 받아 서버(/api/auth/oauth/native)에 넘기면, 서버가 토큰이 우리 앱에서
 * 발급됐는지 확인하고 웹 로그인과 같은 규칙으로 계정을 찾거나 만든다. 인앱 브라우저와 웹 화면을 거치지
 * 않는다. 웹·iOS이거나, 이 빌드에 카카오 키가 없거나, 서버가 토큰을 확인할 수 없으면(`native` 목록에 없음)
 * 화면은 예전처럼 인앱 브라우저로 한다.
 */
import { androidPluginLoader } from "./android-plugin";
import { apiFetch } from "./api";

interface KakaoLoginPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  login(): Promise<{ accessToken: string }>;
}

const load = androidPluginLoader<KakaoLoginPlugin>("KakaoLogin");

/** 이 기기에서 카카오톡 로그인을 쓸 수 있는지. 예전 앱(플러그인 없음)이면 거절당하므로 false다. */
export async function isKakaoNativeAvailable(): Promise<boolean> {
  const p = (await load())?.plugin;
  if (!p) return false;
  try {
    return (await p.isAvailable()).available;
  } catch {
    return false;
  }
}

/**
 * - `ok`: 로그인했거나(로그인) 이었다(잇기).
 * - `cancelled`: 사용자가 카카오톡·카카오계정 화면에서 그만뒀다. 아무 말도 하지 않는다.
 * - `error`: 서버가 거절했다. `result`는 끝 화면과 같은 모양(`oauthError`·`oauthVia`·`oauthProvider`)이라
 *   같은 문구로 보인다.
 */
export type KakaoNativeResult =
  { status: "ok" } | { status: "cancelled" } | { status: "error"; result: URLSearchParams };

function errorOf(code: string, extra: Record<string, unknown> = {}): KakaoNativeResult {
  const result = new URLSearchParams({ oauthError: code });
  for (const key of ["oauthVia", "oauthProvider"]) {
    if (typeof extra[key] === "string") result.set(key, extra[key]);
  }
  return { status: "error", result };
}

export async function kakaoNativeLogin(options: {
  over14?: boolean;
  /** 로그인한 계정에 잇는다('내 정보'의 로그인 방법). */
  link?: boolean;
}): Promise<KakaoNativeResult> {
  const p = (await load())?.plugin;
  if (!p) return errorOf("unavailable");
  let accessToken: string;
  try {
    ({ accessToken } = await p.login());
  } catch (error) {
    const code = (error as { code?: unknown } | null)?.code;
    if (code === "cancelled") return { status: "cancelled" };
    return errorOf(code === "unavailable" ? "unavailable" : "provider");
  }
  try {
    const res = await apiFetch("/api/auth/oauth/native", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "kakao",
        accessToken,
        over14: options.over14 === true,
        link: options.link === true,
      }),
    });
    if (res.ok) return { status: "ok" };
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return errorOf(typeof body.oauthError === "string" ? body.oauthError : "server", body);
  } catch {
    return errorOf("server");
  }
}
