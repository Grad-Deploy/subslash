import type { Messages } from "./messages";

/** 사용 시간 한 마디: '12시간 10분', '40분', '1분 미만'(영어는 '12 h 10 min'). */
export function formatDurationText(t: Messages, ms: number): string {
  const d = t.appSmall.batch.duration;
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return ms > 0 ? d.under1 : d.zero;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return d.minutes(rest);
  return rest === 0 ? d.hours(hours) : d.hoursMinutes(hours, rest);
}

/** '12시간 10분', '40분', 1분이 안 되면 '12초'. 가성비처럼 짧은 시간이 곧 근거인 자리에 쓴다. */
export function formatDurationPreciseText(t: Messages, ms: number): string {
  if (ms > 0 && ms < 60_000) return t.usageApp.seconds(Math.max(1, Math.round(ms / 1000)));
  return formatDurationText(t, ms);
}
