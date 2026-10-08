/**
 * 결제일을 쓰는 캘린더 이름. 전용 캘린더라 통째로 지우면 결제일만 사라진다. 등록한 화면의 언어로 짓고, 다른
 * 언어로 다시 등록하면 웹 앱이 같은 캘린더의 이름을 바꾼다(두 이름 모두 SubSlash의 캘린더로 알아본다).
 * 화면(등록 칸·개인정보처리방침)과 서버(lib/calendar-sync)가 함께 쓰므로 DB를 부르지 않는 이 파일에 둔다.
 */
export const CALENDAR_NAMES = { ko: "SubSlash 결제일", en: "SubSlash Billing Days" } as const;

export type CalendarLang = keyof typeof CALENDAR_NAMES;

export function calendarNameFor(lang: CalendarLang): string {
  return CALENDAR_NAMES[lang];
}
