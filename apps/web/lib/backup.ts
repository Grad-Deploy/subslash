import type { LinkedAccount, Subscription, UsageLog } from "@subslash/shared";
// 스토어 모듈에서는 타입만 가져온다. 이 파일은 서버(계정에 저장한 기록의 검증)도
// 쓰는데, 스토어 모듈을 실제로 불러오면 브라우저 전용 zustand 스토어가 함께 만들어진다.
import type { BackupData } from "./store";
import {
  DEFAULT_EXCHANGE_RATE_SETTING,
  isValidExchangeRate,
  type ExchangeRateSetting,
} from "./exchange-rate";

/**
 * 이 브라우저의 데이터를 파일로 내보내고 되돌려 넣는다.
 *
 * 구독 목록과 해지·체크인 기록은 localStorage에만 있다. 브라우저 데이터를
 * 지우거나 기기를 바꾸면 쌓아 온 '지킨 돈' 기록이 통째로 사라지므로, 서버에
 * 올리지 않고도 지킬 수 있는 방법으로 파일 백업을 둔다.
 *
 * 알림 설정(`notify`)은 넣지 않는다. 거기 든 동기화 토큰은 이 기기가 서버
 * 사본을 덮어쓸 수 있는 자격증명이라, 파일로 돌아다니거나 다른 기기에
 * 복원되면 안 된다.
 *
 * 복원은 병합 없이 전체 교체다. 파일에 틀린 항목이 하나라도 있으면 아무것도
 * 바꾸지 않는다 — 읽을 수 있는 것만 골라 넣으면, 사용자는 일부가 빠진 목록을
 * 온전한 복원으로 믿게 된다.
 */

export const BACKUP_APP = "subslash";
export const BACKUP_VERSION = 1;

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  data: BackupData;
}

export type BackupParseResult =
  { ok: true; data: BackupData; exportedAt: string | null } | { ok: false; error: string };

export function createBackup(data: BackupData, now: Date = new Date()): BackupFile {
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    data: {
      subscriptions: data.subscriptions,
      usageLogs: data.usageLogs,
      accounts: data.accounts,
      exchangeRate: data.exchangeRate,
    },
  };
}

/** "subslash-backup-2026-09-11.json". 날짜는 사용자가 있는 곳 기준이다. */
export function backupFileName(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `subslash-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

const CURRENCIES = ["KRW", "USD"];
const CYCLES = ["monthly", "yearly"];
const STATUSES = ["active", "killed"];
const RISK_LEVELS = ["green", "yellow", "red"];
const PROVIDERS = ["google", "kakao", "naver", "apple", "email"];
const PAYMENT_METHODS = [
  "credit_card",
  "kakaopay",
  "naverpay",
  "apple_iap",
  "google_play",
  "telecom",
  "other",
];
const RATE_SOURCES = ["default", "manual", "ecb"];

type Obj = Record<string, unknown>;

const isObject = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isText = (v: unknown) => typeof v === "string" && v.trim().length > 0;
const isString = (v: unknown) => typeof v === "string";
const isDateText = (v: unknown) => typeof v === "string" && !Number.isNaN(Date.parse(v));
const isAmount = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const isIntIn = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
const oneOf = (v: unknown, options: readonly string[]) =>
  typeof v === "string" && options.includes(v);
/** 없어도 되는 칸. 있으면 형식이 맞아야 한다. */
const optional = (v: unknown, check: (value: unknown) => boolean) => v === undefined || check(v);

/**
 * 구독 한 개를 검사하고, 틀린 칸의 이름을 돌려준다. 맞으면 null.
 *
 * 앱이 스스로 만들 수 있는 것은 모두 통과시켜야 한다. 등록 폼은 비운 숫자
 * 칸(금액·결제일·결제 월)을 0이 아니라 '적지 않음'으로 저장하므로, 숫자 칸은
 * 없으면 통과하고 있을 때만 형식을 본다. 모르는 칸은 그대로 둔다 — 새 버전이
 * 더한 칸이 복원에서 사라지면 안 된다.
 */
function checkSubscription(v: unknown): string | null {
  if (!isObject(v)) return "형식";
  if (!isText(v.id)) return "ID";
  if (!isText(v.name)) return "이름";
  if (!optional(v.amount, isAmount)) return "금액";
  if (!oneOf(v.currency, CURRENCIES)) return "통화";
  if (!optional(v.billingDay, (d) => isIntIn(d, 1, 31))) return "결제일";
  if (!oneOf(v.billingCycle, CYCLES)) return "결제 주기";
  if (!optional(v.billingMonth, (m) => isIntIn(m, 1, 12))) return "결제 월";
  if (!isString(v.category)) return "카테고리";
  if (!oneOf(v.status, STATUSES)) return "상태";
  if (!isDateText(v.createdAt)) return "등록일";
  if (!optional(v.killedAt, isDateText)) return "해지일";
  if (!optional(v.lastPriceCheckedAt, isDateText)) return "요금 확인일";
  if (!optional(v.sharingCount, isAmount)) return "함께 쓰는 사람 수";
  if (!optional(v.myShareAmount, isAmount)) return "내 몫";
  if (!optional(v.paymentMethod, (p) => oneOf(p, PAYMENT_METHODS))) return "결제 수단";
  if (!optional(v.cancelUrl, isString)) return "해지 링크";
  if (!optional(v.cancelGuide, isString)) return "해지 안내";
  if (!optional(v.iconUrl, isString)) return "아이콘";
  if (!optional(v.linkedAccountId, isString)) return "연동 계정";
  if (!optional(v.linkedAccountName, isString)) return "연동 계정 이름";
  if (!optional(v.accountMemo, isString)) return "메모";
  return null;
}

function checkUsageLog(v: unknown): string | null {
  if (!isObject(v)) return "형식";
  if (!isText(v.id)) return "ID";
  if (!isText(v.subscriptionId)) return "구독 ID";
  if (!isString(v.month)) return "월";
  if (!isAmount(v.usageCount)) return "사용 횟수";
  if (!isAmount(v.costPerUse)) return "1회당 비용";
  if (!oneOf(v.riskLevel, RISK_LEVELS)) return "위험도";
  if (!isDateText(v.checkedAt)) return "체크인 시각";
  return null;
}

function checkAccount(v: unknown): string | null {
  if (!isObject(v)) return "형식";
  if (!isText(v.id)) return "ID";
  if (!oneOf(v.provider, PROVIDERS)) return "로그인 제공자";
  if (!isString(v.name)) return "칭호";
  if (!isString(v.emailOrId)) return "이메일/ID";
  if (!isDateText(v.createdAt)) return "등록일";
  if (!optional(v.color, isString)) return "색";
  return null;
}

function isExchangeRateSetting(v: unknown): v is ExchangeRateSetting {
  if (!isObject(v)) return false;
  const rateOk = v.rate === null || (typeof v.rate === "number" && isValidExchangeRate(v.rate));
  const updatedOk = v.updatedAt === null || isString(v.updatedAt);
  return rateOk && oneOf(v.source, RATE_SOURCES) && updatedOk;
}

const fail = (error: string): BackupParseResult => ({ ok: false, error });

/** 목록의 몇 번째 항목이 어느 칸에서 틀렸는지. 전부 맞으면 null. */
function firstProblem(
  items: unknown[],
  label: string,
  check: (v: unknown) => string | null,
): string | null {
  for (const [index, item] of items.entries()) {
    const field = check(item);
    if (field) return `${label} ${index + 1}번째 항목의 '${field}' 칸이 올바르지 않습니다.`;
  }
  return null;
}

/**
 * 백업 파일을 읽는다. 하나라도 틀리면 무엇이 틀렸는지만 돌려주고, 부분
 * 결과는 돌려주지 않는다.
 */
export function parseBackup(text: string): BackupParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail("JSON 파일이 아닙니다. SubSlash에서 저장한 백업 파일을 골라주세요.");
  }

  if (!isObject(raw) || raw.app !== BACKUP_APP) {
    return fail("SubSlash 백업 파일이 아닙니다.");
  }
  if (!isIntIn(raw.version, 1, Number.MAX_SAFE_INTEGER)) {
    return fail("백업 파일의 형식 버전을 알 수 없습니다.");
  }
  if ((raw.version as number) > BACKUP_VERSION) {
    return fail("이 앱보다 새로운 형식의 백업입니다. 페이지를 새로 고친 뒤 다시 시도해주세요.");
  }

  const data = raw.data;
  if (
    !isObject(data) ||
    !Array.isArray(data.subscriptions) ||
    !Array.isArray(data.usageLogs) ||
    !Array.isArray(data.accounts)
  ) {
    return fail("백업 파일에 구독·체크인·연동 계정 목록이 모두 있어야 합니다.");
  }

  const problem =
    firstProblem(data.subscriptions, "구독", checkSubscription) ??
    firstProblem(data.usageLogs, "체크인 기록", checkUsageLog) ??
    firstProblem(data.accounts, "연동 계정", checkAccount);
  if (problem) return fail(problem);

  // ID가 겹치면 한 구독을 고치거나 해지할 때 다른 구독까지 함께 바뀐다.
  const ids = new Set<string>();
  for (const [index, sub] of (data.subscriptions as Obj[]).entries()) {
    const id = sub.id as string;
    if (ids.has(id)) return fail(`구독 ${index + 1}번째 항목의 ID가 다른 구독과 겹칩니다.`);
    ids.add(id);
  }

  let exchangeRate: ExchangeRateSetting = DEFAULT_EXCHANGE_RATE_SETTING;
  if (data.exchangeRate !== undefined) {
    if (!isExchangeRateSetting(data.exchangeRate)) return fail("환율 설정이 올바르지 않습니다.");
    exchangeRate = data.exchangeRate;
  }

  return {
    ok: true,
    data: {
      subscriptions: data.subscriptions as Subscription[],
      usageLogs: data.usageLogs as UsageLog[],
      accounts: data.accounts as LinkedAccount[],
      exchangeRate,
    },
    exportedAt: isString(raw.exportedAt) ? (raw.exportedAt as string) : null,
  };
}
