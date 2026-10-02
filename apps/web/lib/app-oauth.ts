/**
 * 앱의 간편 로그인 넘겨받기(앱 전용). 앱이 만든 verifier로 서버가 적어 둔 로그인을 받아 간다
 * (`/api/auth/oauth/claim`).
 *
 * 예전에는 verifier를 로그인 버튼의 클로저에만 들고 있었다. 카카오톡·Chrome을 오가는 동안 운영체제가
 * 앱을 내리면 클로저가 사라져, 제공자 쪽 로그인은 끝났는데 앱은 로그인되지 않았다. 그래서 10분(서버의
 * 넘겨받기 기한) 동안 기기에 적어 두고, 돌아오는 딥링크·앱 복귀·다음 실행 어느 쪽에서든 받아 간다.
 * verifier는 그 한 번의 로그인에만 쓰이고 받아 가면 지운다.
 */
import { apiFetch } from "./api";

const PENDING_KEY = "subslash-oauth-pending";
/** 서버의 넘겨받기 기한(OAUTH_FLOW_TTL_SECONDS)과 같다. 지나면 받아 갈 것이 없다. */
const PENDING_TTL_MS = 10 * 60 * 1000;

interface Pending {
  verifier: string;
  at: number;
}

function readPending(): Pending | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<Pending>;
    if (typeof value.verifier !== "string" || typeof value.at !== "number") return null;
    if (Date.now() - value.at > PENDING_TTL_MS) {
      clearPendingLogin();
      return null;
    }
    return { verifier: value.verifier, at: value.at };
  } catch {
    return null;
  }
}

export function savePendingLogin(verifier: string): void {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ verifier, at: Date.now() }));
  } catch {
    // 적지 못해도 이번 실행 안에서는 버튼이 쥔 값으로 받아 간다.
  }
}

export function clearPendingLogin(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // 지우지 못해도 기한이 지나면 읽지 않는다.
  }
}

export function hasPendingLogin(): boolean {
  return readPending() !== null;
}

/**
 * - `ok`: 로그인했다. 부른 쪽이 로그인 상태를 다시 읽고 화면을 옮긴다.
 * - `none`: 받아 갈 것이 없다(기다리는 로그인이 없음, 아직 안 끝남, 다른 곳에서 이미 받는 중).
 * - `failed`: 서버나 네트워크 문제로 받지 못했다.
 */
export type ClaimResult = "ok" | "none" | "failed";

let inflight = false;

/**
 * 기다리는 로그인을 받아 간다. 딥링크·브라우저 닫힘·앱 복귀가 한꺼번에 부를 수 있어, 먼저 부른 쪽만
 * 받고 나머지는 `none`이다 — 같은 verifier를 두 번 내밀면 두 번째는 404라 실패처럼 보인다.
 */
export async function claimPendingLogin(): Promise<ClaimResult> {
  const pending = readPending();
  if (!pending || inflight) return "none";
  inflight = true;
  try {
    const res = await apiFetch("/api/auth/oauth/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verifier: pending.verifier }),
    });
    // 404는 아직 안 끝났거나 취소한 것이다. 기한까지 두어, 끝나고 앱으로 돌아오면 받는다.
    if (res.status === 404) return "none";
    clearPendingLogin();
    return res.ok ? "ok" : "failed";
  } catch {
    return "failed";
  } finally {
    inflight = false;
  }
}
