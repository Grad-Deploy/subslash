/**
 * 한국 시간으로 본 날짜. 서버(Vercel)는 UTC라 `new Date()`의 날짜를 그대로 쓰면 한국 자정부터 아침 9시까지 하루
 * 어긋난다 — 하루 한도가 아침 9시에 풀리고, "내일"·"월말까지"가 하루 틀린다. 한국은 일광 절약 시간이 없어 +09:00이
 * 늘 맞다.
 */

/** 한국 서비스라 날짜를 한국 시간으로 본다. */
export const KOREA_TIME_ZONE = "Asia/Seoul";

const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: KOREA_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 한국 날짜(YYYY-MM-DD). */
export function koreaDay(now: Date = new Date()): string {
  return dayFormat.format(now);
}

/** 한국의 오늘 날짜(그날 정오, 실행하는 곳의 시간대로 만든 Date). 날짜 계산을 기기 시간대 그대로 이어 하기 위한 것이다. */
export function koreaToday(now: Date = new Date()): Date {
  const [year, month, day] = koreaDay(now).split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

/** 한국 날짜(YYYY-MM-DD)가 시작하는 순간(한국 시간 0시)의 밀리초. */
export function koreaMidnight(day: string): number {
  return new Date(`${day}T00:00:00+09:00`).getTime();
}
