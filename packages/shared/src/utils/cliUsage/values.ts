import type { CliLogLine } from "./types";

/** 기록에서 읽은 값 다루기. 기록은 공개 문서가 없는 내부 형식이라 칸마다 모양을 확인하고 읽는다. */

export const isObject = (value: unknown): value is CliLogLine =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** 토큰 수: 0보다 큰 유한한 수만, 아니면 0. */
export const count = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;

/** 줄의 `timestamp`(ISO 문자열) → epoch ms. */
export function timeOf(line: CliLogLine): number | null {
  if (typeof line.timestamp !== "string") return null;
  const ms = Date.parse(line.timestamp);
  return Number.isFinite(ms) ? ms : null;
}

/** 2020년 뒤의 epoch ms만 시각으로 받는다(상대 시간·0 같은 값을 거른다). */
export function plausibleTime(value: unknown): number | null {
  const ms = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(ms) && ms > Date.UTC(2020, 0, 1) && ms < Date.UTC(2100, 0, 1) ? ms : null;
}

/** JSONL 한 줄을 읽는다. 깨진 줄은 null. */
export function parseCliLine(text: string): CliLogLine | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const value: unknown = JSON.parse(trimmed);
    return isObject(value) ? value : null;
  } catch {
    return null;
  }
}
