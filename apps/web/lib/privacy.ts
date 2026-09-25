/**
 * 개인정보처리방침에 적는 운영 정보. 방침 문장은 app/privacy/page.tsx에 있고, 사람이
 * 정해야 하는 값만 여기 모은다.
 *
 * 보호책임자는 이 서비스를 실제로 운영하는 사람이다 — 배포·데이터베이스·메일 계정을 쥐고 있어
 * 지워 달라는 요청을 받으면 실제로 지울 수 있는 사람이어야 한다(개인정보 보호법 제31조).
 * 이름만 있고 데이터에 손댈 수 없는 사람을 적으면 방침이 지키지 못할 약속이 된다.
 *
 * 연락처는 개인 메일이 아니라 도메인 주소로 두고 받아 보는 메일함으로 전달한다. 방침은 공개
 * 페이지라 개인 주소를 적으면 그대로 수집된다. 이 값을 null로 되돌리면 화면이 '아직 정하지
 * 않았다'고 말한다 — 그럴듯한 이름·주소를 채워 두면 아무도 받지 않는 연락처를 사실처럼 알리게
 * 되므로, 비우는 것이 지어내는 것보다 낫다.
 */
export const PRIVACY_OFFICER: { name: string; email: string } | null = {
  name: "이은성",
  email: "privacy@subslash.me",
};

/** 이 방침이 효력을 갖는 날. 내용을 바꾸면 함께 바꾼다. */
export const PRIVACY_EFFECTIVE_DATE = "2026년 9월 25일";

/**
 * Gmail 자동 가져오기를 시작하는 날(YYYY-MM-DD, 한국 시간 0시). 이 기능은 서버에 저장하는 항목을
 * 늘리고, 방침은 "저장하는 항목이 늘어나는 변경은 시행 전에 알린다"고 약속한다. 그래서 날짜를 정해
 * 알리기 전에는 null로 두고, null이거나 그날 전이면 서버와 화면 모두 이 기능을 열지 않는다.
 */
export const GMAIL_AUTO_IMPORT_STARTS_ON: string | null = "2026-09-17";

/** Gmail 자동 가져오기가 열렸는지. */
export function isGmailAutoImportOpen(now: Date = new Date()): boolean {
  // 시작 전에도 테스트가 이 기능의 화면과 API를 볼 수 있게 여는 스위치. 운영 빌드에서는
  // NODE_ENV가 production이라 이 줄이 빠지므로 배포에서는 켤 수 없다.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_GMAIL_AUTO_IMPORT_TEST_OPEN === "true"
  ) {
    return true;
  }
  if (!GMAIL_AUTO_IMPORT_STARTS_ON) return false;
  return now.getTime() >= new Date(`${GMAIL_AUTO_IMPORT_STARTS_ON}T00:00:00+09:00`).getTime();
}

/**
 * 익명 구독 통계(lib/stats)를 시작하는 날(YYYY-MM-DD, 한국 시간 0시). 동의한 기기의 요약을 서버에
 * 새로 저장하는 기능이라, Gmail 자동 가져오기와 같이 방침에 항목을 먼저 알리고 그날부터 연다.
 * null이면 닫혀 있다 — 리포트 화면은 내 기록만 보여 주고 비교 칸은 '준비 중'이라고 말한다.
 */
export const ANONYMOUS_STATS_STARTS_ON: string | null = "2026-09-25";

/** 익명 구독 통계가 열렸는지. */
export function isAnonymousStatsOpen(now: Date = new Date()): boolean {
  // 테스트 서버만 시작 전에 여는 스위치. 운영 빌드에서는 이 줄이 빠진다.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_ANONYMOUS_STATS_TEST_OPEN === "true"
  ) {
    return true;
  }
  if (!ANONYMOUS_STATS_STARTS_ON) return false;
  return now.getTime() >= new Date(`${ANONYMOUS_STATS_STARTS_ON}T00:00:00+09:00`).getTime();
}

/**
 * 기기 간 사용 측정(lib/device-usage)을 시작하는 날(YYYY-MM-DD, 한국 시간 0시). 로그인한 계정의 앱
 * 사용 구간을 서버에 새로 저장하는 기능이라 방침에 항목을 먼저 알리고 그날부터 연다. 앱 사용 기록은
 * 사생활에 가까운 정보라, 날짜를 정하기 전에 스토어 정책(사용 정보 접근 권한)도 확인한다. null이면
 * 닫혀 있다.
 */
export const DEVICE_USAGE_STARTS_ON: string | null = null;

/** 기기 간 사용 측정이 열렸는지. */
export function isDeviceUsageOpen(now: Date = new Date()): boolean {
  // 테스트 서버만 시작 전에 여는 스위치. 운영 빌드에서는 이 줄이 빠진다.
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_DEVICE_USAGE_TEST_OPEN === "true"
  ) {
    return true;
  }
  if (!DEVICE_USAGE_STARTS_ON) return false;
  return now.getTime() >= new Date(`${DEVICE_USAGE_STARTS_ON}T00:00:00+09:00`).getTime();
}
