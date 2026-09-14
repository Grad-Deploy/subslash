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
