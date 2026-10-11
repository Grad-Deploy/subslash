import type { Widen } from "../types";

/**
 * 브라우저 탭 제목. 페이지의 `metadata.title`은 서버에서 한국어로 정해지므로, 화면 언어가 다르면
 * `LocaleEffects`가 이 표로 바꾼다. 페이지의 metadata도 이 표의 한국어를 쓴다 — 두 곳에 적으면 어긋난다.
 * 주소가 표에 없으면 사이트 제목(`site`)이다.
 */
export const ko = {
  site: "SubSlash - 구독, 끊을 용기",
  paths: {
    "/forgot-password": "비밀번호 재설정 · SubSlash",
    "/import": "Gmail에서 구독 찾기 · SubSlash",
    "/login": "로그인 · SubSlash",
    "/me": "내 정보 · SubSlash",
    "/offline": "오프라인 - SubSlash",
    "/oauth/done": "로그인 · SubSlash",
    "/privacy": "개인정보처리방침 · SubSlash",
    "/reset-password": "새 비밀번호 정하기 · SubSlash",
    "/signup": "회원가입 · SubSlash",
    "/storage-quota/done": "용량 측정 · SubSlash",
    "/verify-email": "이메일 확인 · SubSlash",
  },
};

export const en: Widen<typeof ko> = {
  site: "SubSlash - The nerve to cut subscriptions",
  paths: {
    "/forgot-password": "Reset password · SubSlash",
    "/import": "Find subscriptions in Gmail · SubSlash",
    "/login": "Log in · SubSlash",
    "/me": "My account · SubSlash",
    "/offline": "Offline - SubSlash",
    "/oauth/done": "Log in · SubSlash",
    "/privacy": "Privacy Policy · SubSlash",
    "/reset-password": "Set a new password · SubSlash",
    "/signup": "Sign up · SubSlash",
    "/storage-quota/done": "Storage check · SubSlash",
    "/verify-email": "Verify email · SubSlash",
  },
};
