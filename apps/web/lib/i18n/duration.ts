import type { Messages } from "./messages";

/** 사용 시간 한 마디: '12시간 10분', '40분', '1분 미만'. `lib/usage/history`의 `formatDuration`과 같은 뜻을 지금 언어로 만든다. */
export function formatDurationText(t: Messages, ms: number): string {
  const d = t.appSmall.batch.duration;
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return ms > 0 ? d.under1 : d.zero;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return d.minutes(rest);
  return rest === 0 ? d.hours(hours) : d.hoursMinutes(hours, rest);
}
