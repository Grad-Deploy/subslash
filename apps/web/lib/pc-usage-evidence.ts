import { parseStoredObject, readLocal, writeLocal } from "@lib/local-storage";
import {
  cliDayKey,
  type CliDayKey,
  type CliServiceId,
  type CliTool,
  DAY_MS,
} from "@subslash/shared";

/**
 * 'PC 기록 읽기'로 센 쓴 날의 근거를 **이 기기에** 날짜로 남겨, 다른 때 다른 기록을 읽어도 같은 구독의 쓴 날을 합친다.
 *
 * Claude Code 기록(PC 터미널)과 claude.ai 내보내기(웹·앱 대화)는 서로 다른 사용을 센다 — 둘은 겨루는 숫자가 아니라
 * 서로의 빈 곳을 채우는 숫자라, 평균이나 큰 값이 아니라 날짜의 합집합으로 합친다. 예전에는 한 번에 함께 고를 때만
 * 합쳤고, 체크인에는 숫자만 남아 어제 읽은 것과 오늘 읽은 것을 합칠 수 없었다.
 *
 * 날짜는 이 기기에만 둔다(구독 기록 저장소·백업·계정 동기화·서버에 넣지 않는다) — 쓴 날짜 목록은 숫자보다 자세한
 * 기록이라, 기기 사이로 옮기려면 개인정보처리방침에 먼저 적어야 한다. 출처마다 마지막으로 읽은 것 하나만 두고,
 * 그 출처가 어디까지 덮는지(`coveredUntil`)를 함께 남긴다 — 내보내기 파일은 내보낸 날까지만 알고, 그 뒤는 '안 썼다'가
 * 아니라 모른다.
 */

export type EvidenceSource = CliTool | "claudeWeb";

export interface UsageEvidence {
  /** 쓴 날(이 기기의 날짜, YYYY-MM-DD). */
  days: string[];
  /** 이 근거가 덮는 마지막 시각(epoch ms) — 기록을 읽은 때. */
  coveredUntil: number;
}

type EvidenceStore = Partial<Record<CliServiceId, Partial<Record<EvidenceSource, UsageEvidence>>>>;

export const EVIDENCE_KEY = "subslash-pc-usage-evidence";

/** 이만큼 지난 날짜는 지운다. 체크인은 최근 30일을 묻고, 하루 이틀 늦게 다시 읽어도 겹치게 여유를 둔다. */
const KEEP_DAYS = 40;

export function readEvidence(): EvidenceStore {
  return parseStoredObject<EvidenceStore>(readLocal(EVIDENCE_KEY));
}

// 저장소를 쓸 수 없으면 이번 화면 안에서만 합친다.
function writeEvidence(store: EvidenceStore) {
  writeLocal(EVIDENCE_KEY, JSON.stringify(store));
}

/** 한 출처의 새 근거로 바꾼다(같은 출처의 예전 것은 버린다). 오래된 날짜는 지운다. 바뀐 저장소를 돌려준다. */
export function saveEvidence(
  serviceId: CliServiceId,
  source: EvidenceSource,
  evidence: UsageEvidence,
  dayKey: CliDayKey = cliDayKey,
): EvidenceStore {
  const store = readEvidence();
  const oldest = dayKey(evidence.coveredUntil - KEEP_DAYS * DAY_MS);
  store[serviceId] = {
    ...store[serviceId],
    [source]: { ...evidence, days: evidence.days.filter((day) => day >= oldest) },
  };
  writeEvidence(store);
  return store;
}

/** 한 구독의 남은 근거를 모두 지운다. */
export function forgetEvidence(serviceId: CliServiceId): EvidenceStore {
  const store = readEvidence();
  delete store[serviceId];
  writeEvidence(store);
  return store;
}

export interface EvidencePart {
  source: EvidenceSource;
  /** 최근 기간 안의 쓴 날 수. */
  days: number;
  coveredUntil: number;
  /** 이번에 읽은 것이 아니라 이 기기에 남은 지난 근거인지. */
  fromSaved: boolean;
}

export interface MergedUsage {
  /** 출처를 합친 쓴 날(같은 날은 한 번). */
  days: number;
  parts: EvidencePart[];
  /** 둘 이상의 출처에 함께 있던 날의 수(출처별 합 − 합친 수). */
  overlap: number;
}

/**
 * 이번에 읽은 근거(`fresh`)와 이 기기에 남은 근거(`saved`)를 최근 `windowDays`일로 합친다. 같은 출처는 이번에 읽은
 * 것을 쓴다. 기간 앞에서 끝난 근거는 뺀다.
 */
export function mergeEvidence(
  fresh: { source: EvidenceSource; days: string[]; at: number }[],
  saved: Partial<Record<EvidenceSource, UsageEvidence>> | undefined,
  options: { now: number; windowDays: number; dayKey?: CliDayKey },
): MergedUsage {
  const dayKey = options.dayKey ?? cliDayKey;
  const since = options.now - options.windowDays * DAY_MS;
  const first = dayKey(since);
  const inWindow = (days: string[]) => days.filter((day) => day >= first);

  const entries: {
    source: EvidenceSource;
    days: string[];
    coveredUntil: number;
    fromSaved: boolean;
  }[] = fresh.map((item) => ({
    source: item.source,
    days: inWindow(item.days),
    coveredUntil: item.at,
    fromSaved: false,
  }));
  for (const [source, evidence] of Object.entries(saved ?? {}) as [
    EvidenceSource,
    UsageEvidence,
  ][]) {
    if (!evidence || entries.some((entry) => entry.source === source)) continue;
    if (evidence.coveredUntil < since) continue;
    entries.push({
      source,
      days: inWindow(evidence.days),
      coveredUntil: evidence.coveredUntil,
      fromSaved: true,
    });
  }

  const union = new Set(entries.flatMap((entry) => entry.days));
  const total = entries.reduce((sum, entry) => sum + entry.days.length, 0);
  return {
    days: union.size,
    parts: entries.map(({ source, days, coveredUntil, fromSaved }) => ({
      source,
      days: days.length,
      coveredUntil,
      fromSaved,
    })),
    overlap: total - union.size,
  };
}
