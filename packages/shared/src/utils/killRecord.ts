import type { Subscription } from "../types";
import { formatAmount } from "./currency";

/**
 * 해지한 뒤의 기록 — 다시 살펴볼 날(`resubscribeRemindOn`)과 해지 근거(`killEvidence`).
 *
 * 둘 다 사용자가 적은 것만 쓴다. 다시 살펴볼 날을 앱이 추천하지 않고, 해지 근거를 앱이 확인한
 * 것처럼 말하지 않는다.
 */

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `YYYY-MM-DD`를 그 기기 시간대의 0시로. 형식이 틀리거나 없는 날짜(2월 30일)면 null. */
export function parseDateOnly(value: string | undefined): Date | null {
  const match = value ? DATE_ONLY.exec(value) : null;
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

/** 오늘(기기 시간대)을 `YYYY-MM-DD`로. 날짜 입력칸의 최솟값에 쓴다. */
export function toDateOnly(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 다시 살펴볼 날이 왔는지. 해지한 구독에만 참이고, 그날 0시부터 참이다. */
export function isResubscribeReminderDue(
  sub: Pick<Subscription, "status" | "resubscribeRemindOn">,
  now: Date = new Date(),
): boolean {
  if (sub.status !== "killed") return false;
  const on = parseDateOnly(sub.resubscribeRemindOn);
  return on !== null && on.getTime() <= now.getTime();
}

/** "2026.09.27". 영수증·메일 날짜와 같은 모양이다. */
function formatDot(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

/**
 * 해지한 뒤에 결제됐을 때 고객센터에 보낼 환불 요청 글. 결제 메일이라는 증거(`chargedAfterKillAt`)가
 * 있을 때만 만든다 — 증거 없이 "해지 후 결제됐다"고 쓰게 하지 않는다.
 *
 * 글에는 앱이 가진 사실만 넣는다. 해지한 날은 사용자가 '해지 완료'를 누른 날이고, 확인 번호는
 * 사용자가 적어 둔 것이 있을 때만 넣는다. 법 조항이나 환불 기한처럼 앱이 확인하지 않은 말은 넣지
 * 않는다.
 */
export function formatRefundRequest(
  sub: Pick<
    Subscription,
    | "name"
    | "status"
    | "currency"
    | "killedAt"
    | "killEvidence"
    | "chargedAfterKillAt"
    | "chargedAfterKillAmount"
  >,
): string | null {
  if (sub.status !== "killed" || !sub.chargedAfterKillAt) return null;

  const killed = sub.killedAt ? new Date(sub.killedAt) : null;
  const killedText =
    killed && !Number.isNaN(killed.getTime()) ? `${formatDot(killed)}에 ` : "앞서 ";
  const reference = sub.killEvidence?.reference?.trim();
  const amount =
    typeof sub.chargedAfterKillAmount === "number"
      ? ` ${formatAmount(sub.chargedAfterKillAmount, sub.currency)}이`
      : "";

  const lines = [
    `안녕하세요. ${sub.name} 구독 결제 건으로 문의드립니다.`,
    `${killedText}구독을 해지했는데, ${sub.chargedAfterKillAt}에${amount} 다시 결제되었습니다.`,
  ];
  if (reference) lines.push(`해지할 때 받은 확인 내용: ${reference}`);
  lines.push("해지가 정상적으로 처리됐는지 확인해 주시고, 이 결제를 환불해 주시기 바랍니다.");
  lines.push("감사합니다.");
  return lines.join("\n");
}
