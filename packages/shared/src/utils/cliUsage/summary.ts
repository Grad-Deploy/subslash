import { apiCostUsd } from "../../constants/aiApiPrices";
import type { CliSessionUsage, CliTokenRecord } from "./types";

/** 한 서비스의 최근 기간 요약. */
export interface CliUsageSummary {
  /** 질문을 보낸 날(이 PC의 날짜 기준) 수. */
  days: number;
  /** 질문 수(Antigravity는 대화 수). */
  prompts: number;
  /** 마지막 질문 시각(epoch ms). 없으면 null. */
  lastAt: number | null;
  /** 이 기간에 기록이 남은 요금제(가장 최근 것). */
  planType: string | null;
  /** 구독인지 몰라 세지 않은 세션 수. */
  unknownSessions: number;
  /** 구독이 아니라(API 키·무료 요금제 등) 세지 않은 세션 수. */
  excludedSessions: number;
  /** 이 기간에 구독으로 쓴 토큰을 API로 냈다면 든 금액. */
  api: CliApiValue;
}

export interface CliApiValue {
  /** 요금을 아는 요청의 합계(USD, 세금 제외). */
  usd: number;
  pricedRequests: number;
  /** 구독으로 쓴 토큰 수(입력·캐시 쓰기·캐시 읽기·출력 모두, 요금을 모르는 모델도 포함). */
  tokens: number;
  /** 요금을 모르는 모델·빠른 모드 요청 수. 0원으로 치지 않고 따로 알린다. */
  unpricedRequests: number;
  unpricedModels: string[];
}

/** 이 PC의 날짜(YYYY-MM-DD). 테스트는 시간대를 주입한다. */
export type CliDayKey = (ms: number) => string;

export const cliDayKey: CliDayKey = (ms) => {
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/**
 * 세션들을 최근 `windowDays`일로 요약한다. `subscriptionDefault`는 기록에 구독 여부가 없는 세션에 쓸 값이다
 * (Claude Code는 지금 로그인 상태, Antigravity는 사용자의 답). 그것도 모르면(null) 그 세션은 세지 않는다.
 */
export function summarizeCliUsage(
  sessions: CliSessionUsage[],
  options: {
    now: number;
    windowDays: number;
    subscriptionDefault: boolean | null;
    dayKey?: CliDayKey;
  },
): CliUsageSummary {
  const dayKey = options.dayKey ?? cliDayKey;
  const since = options.now - options.windowDays * 24 * 60 * 60 * 1000;
  const inWindow = (at: number) => at >= since && at <= options.now;
  const days = new Set<string>();
  let prompts = 0;
  let lastAt: number | null = null;
  let planType: string | null = null;
  let planAt = -Infinity;
  let unknownSessions = 0;
  let excludedSessions = 0;
  const api = newApiValue();
  const seenResponses = new Set<string>();

  for (const session of sessions) {
    const asked = session.prompts.filter(inWindow);
    if (asked.length === 0) continue;
    const subscription = session.subscription ?? options.subscriptionDefault;
    if (subscription === null) {
      unknownSessions += 1;
      continue;
    }
    if (!subscription) {
      excludedSessions += 1;
      continue;
    }
    for (const at of asked) {
      days.add(dayKey(at));
      prompts += 1;
      if (lastAt === null || at > lastAt) lastAt = at;
    }
    for (const record of session.tokens) {
      if (!inWindow(record.at)) continue;
      // 세션을 이어 하면 앞 세션의 응답이 새 파일에 다시 적힌다. 응답 id로 한 번만 센다.
      if (record.id) {
        if (seenResponses.has(record.id)) continue;
        seenResponses.add(record.id);
      }
      addToApiValue(api, record);
    }
    const latest = Math.max(...asked);
    if (session.planType && latest > planAt) {
      planType = session.planType;
      planAt = latest;
    }
  }

  return { days: days.size, prompts, lastAt, planType, unknownSessions, excludedSessions, api };
}

function newApiValue(): CliApiValue {
  return { usd: 0, pricedRequests: 0, tokens: 0, unpricedRequests: 0, unpricedModels: [] };
}

/** 응답 하나를 API 환산 합계에 더한다. 요금을 모르면 0원으로 치지 않고 따로 센다. */
function addToApiValue(api: CliApiValue, record: CliTokenRecord) {
  api.tokens +=
    record.input + record.cacheWrite5m + record.cacheWrite1h + record.cacheRead + record.output;
  const usd = record.fast ? null : apiCostUsd(record);
  if (usd === null) {
    api.unpricedRequests += 1;
    const label = record.fast ? `${record.model} (fast)` : record.model;
    if (!api.unpricedModels.includes(label)) api.unpricedModels.push(label);
    return;
  }
  api.usd += usd;
  api.pricedRequests += 1;
}
