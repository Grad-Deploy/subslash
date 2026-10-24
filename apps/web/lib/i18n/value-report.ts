import {
  formatKRW,
  metricOfLog,
  type ValueReportItem,
  type WasteSuggestion,
} from "@subslash/shared";
import { describeCheckInText } from "./check-in-text";
import type { Messages } from "./messages";

/** 월간 가성비 리포트의 '뽕 뽑은 구독' 줄 옆 한 마디: 마지막 체크인 한 줄, 기록이 없으면 '기록 없음'. */
export function describeWorthItem(t: Messages, item: ValueReportItem): string {
  return item.log ? describeCheckInText(t, item.log, item.sub.currency) : t.report.noRecord;
}

/** '줄일 수 있는 지출' 줄 옆 한 마디. 이번 달 한 번도 안 썼으면 쉬어가기를, 아니면 체크인 한 줄에 다이어트를 권한다. */
export function describeWastedItem(t: Messages, item: ValueReportItem): string {
  const log = item.log;
  if (!log) return t.report.unusedThisMonth;
  return log.usageCount === 0 && metricOfLog(log) !== "storage"
    ? t.report.unusedThisMonth
    : t.report.diet(describeCheckInText(t, log, item.sub.currency));
}

/**
 * 절약 기회를 일상 소비재로 환산한 한 문장. 구독 이름은 저장된 이름이라 `nameOf`(화면에서는 `useServiceNames().sub`)로
 * 화면 언어의 이름으로 바꾼다 — 그대로 넣었더니 영어 화면에 "Pause 구글 원 this month"가 나왔다.
 */
export function describeWasteSuggestion(
  t: Messages,
  suggestion: WasteSuggestion,
  nameOf: (name: string) => string = (name) => name,
): string {
  const item = t.value.metaphor[suggestion.item](suggestion.count);
  const amount = formatKRW(suggestion.amountKRW);
  return suggestion.name !== null
    ? t.report.suggestOne(nameOf(suggestion.name), item, amount)
    : t.report.suggestMany(item, amount);
}
