/**
 * 개인정보처리방침에 적는 운영 정보. 방침 문장은 app/privacy/page.tsx에 있고, 사람이
 * 정해야 하는 값만 여기 모은다.
 *
 * 보호책임자는 아직 정하지 않았다. 그럴듯한 이름·주소를 채워 두면 아무도 받지 않는
 * 연락처를 사실처럼 알리게 되므로, 비워 두고 화면이 '아직 정하지 않았다'고 말한다.
 * 정해지면 이 값만 채운다.
 */
export const PRIVACY_OFFICER: { name: string; email: string } | null = null;

/** 이 방침이 효력을 갖는 날. 내용을 바꾸면 함께 바꾼다. */
export const PRIVACY_EFFECTIVE_DATE = "2026년 9월 13일";

/**
 * Gmail 자동 가져오기를 시작하는 날(YYYY-MM-DD, 한국 시간 0시). 이 기능은 서버에 저장하는 항목을
 * 늘리고, 방침은 "저장하는 항목이 늘어나는 변경은 시행 전에 알린다"고 약속한다. 그래서 날짜를 정해
 * 알리기 전에는 null로 두고, null이거나 그날 전이면 서버와 화면 모두 이 기능을 열지 않는다.
 */
export const GMAIL_AUTO_IMPORT_STARTS_ON: string | null = null;

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
