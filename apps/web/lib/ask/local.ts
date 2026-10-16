import { POPULAR_SERVICES, type Subscription } from "@subslash/shared";
import { compactName } from "./fuzzy";
import type { ASK_CATEGORIES, AskCall } from "./tools";

type AskCategory = (typeof ASK_CATEGORIES)[number];

/**
 * '리포트에 물어보기'를 AI에 보내기 전에 기기에서 먼저 하는 일(lib/ask). 두 가지다.
 *
 * 1. `localAskCall`: 흔하고 뜻이 하나뿐인 질문은 규칙으로 바로 도구를 고른다. 이 질문은 서버·AI로 나가지 않는다.
 *    틀린 도구를 고르는 것이 'AI에게 넘김'보다 나쁘므로, 조금이라도 애매하면 null을 돌려 AI에 맡긴다 — 평가 세트에서
 *    규칙이 답한 질문은 모두 정답이어야 한다(테스트가 확인한다). 처음 규칙은 평가 세트를 보며 만들어 그 숫자가
 *    낙관적이다 — 앞으로 규칙은 학습 세트(lib/ask/train-set)를 보며 다듬고, 평가 세트는 재기만 한다.
 * 2. `refineCall`: 기간이 적힌 질문의 일수를 기기가 다시 정한다. AI는 오늘이 며칠인지 모르므로 "월말까지"를 셀 수 없다.
 */

/**
 * 한국의 오늘 날짜(그날 정오, 실행하는 곳의 시간대로 만든 Date). 서버(Vercel)는 UTC라 `new Date()`로 날짜를 세면 한국
 * 자정부터 아침 9시까지 하루 어긋난다 — "내일"·"월말까지"가 하루 틀린다.
 */
export function koreaToday(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return new Date(part("year"), part("month") - 1, part("day"), 12);
}

const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

const clampDays = (n: number) => Math.min(31, Math.max(1, Math.round(n)));

/** 오늘(포함)부터 이번 달 마지막 날까지의 일수. */
function daysToMonthEnd(now: Date): number {
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return clampDays(last - now.getDate() + 1);
}

/**
 * 질문에 적힌 기간을 일수로(1~31). 적히지 않았으면 null — "곧", "언제"처럼 기간이 없는 말은 여기서 정하지 않는다.
 * "이번 주"는 7일, "다음 주까지·2주"는 14일로 AI 프롬프트와 같은 규칙이다(lib/ask/provider).
 */
export function parseDays(question: string, now: Date): number | null {
  const q = normalize(question);
  const n = (m: RegExpMatchArray | null) => (m ? Number(m[1]) : null);

  const days =
    n(q.match(/(\d{1,2})\s*일\s*(?:안|내|이내|동안|뒤|후|까지)/)) ??
    n(q.match(/(?:next|within|in)\s+(\d{1,2})\s+days?/));
  if (days !== null && days > 0) return clampDays(days);
  const weeks = n(q.match(/(\d)\s*주\s*(?:안|내|이내|동안|까지)?/)) ?? n(q.match(/(\d)\s+weeks?/));
  if (weeks !== null && weeks > 0) return clampDays(weeks * 7);

  if (
    /월말|이번\s*달\s*(?:안|말|까지|중|남은)|end of (?:the )?month|rest of (?:the|this) month/.test(
      q,
    )
  ) {
    return daysToMonthEnd(now);
  }
  if (/다음\s*주까지|이주\s*(?:안|내|동안)|next week/.test(q)) return 14;
  if (/이번\s*주|일주일|한\s*주|this week/.test(q)) return 7;
  if (/모레/.test(q)) return 2;
  if (/내일|오늘|tomorrow|today/.test(q)) return 1;
  return null;
}

/** 기간을 받는 도구는 질문에 적힌 기간으로 일수를 맞춘다. 적히지 않았으면 AI가 고른 값 그대로다. */
export function refineCall(call: AskCall, question: string, now: Date): AskCall {
  if (call.tool !== "upcomingCharges" && call.tool !== "trialsEnding") return call;
  const days = parseDays(question, now);
  if (days === null || call.args?.days === days) return call;
  return { ...call, args: { ...call.args, days } };
}

// ── 규칙 ─────────────────────────────────────────────────────────

/** 앞선 질문에 기대는 말. 이런 질문은 앞선 턴을 아는 AI에 맡긴다. */
const FOLLOW_UP =
  /^(?:그럼|그러면|그거|그건|그것|걔|거기|반대로|아까|그 중|그중|then|what about|and )|(?:은|는)\?*$/;
/** 지시를 바꾸려는 말. 규칙으로 답하지 않고 AI(→ unsupported)에 맡긴다. */
const STEERING = /무시|시스템|프롬프트|지시|관리자|모드|도구|ignore|system|prompt|admin/;

/**
 * 지시를 바꾸려는 것이 분명한 말. 이런 질문은 AI에 보내지 않고 기기·서버 입구에서 곧바로 unsupported다 — 보내면 횟수와
 * 비용을 쓰고, 탈옥 문구를 모델에 시험해 볼 기회를 준다. 위의 `STEERING`("모드"·"도구"·"시스템")은 평범한 질문에도
 * 나와 거절하지 않고 AI에 맡기므로, 여기에는 정상 질문에 나올 일이 없는 표현만 둔다.
 */
const INJECTION =
  /jailbreak|탈옥|developer\s*mode|개발자\s*모드|ignore\s+(?:all\s+|any\s+|the\s+)?(?:previous|prior|above|earlier)\s+(?:instructions?|prompts?|rules?)|(?:이전|앞|위|기존)(?:의|에)?\s*(?:지시|명령|지침|규칙|프롬프트)\S*\s*(?:다\s*)?(?:무시|잊)|(?:시스템|system)\s*(?:프롬프트|prompt)|前の指示|(?:忽略|无视)(?:之前|以上|上面|前面)/;

const CATEGORY_WORDS: [RegExp, AskCategory][] = [
  [/ott|영상|동영상|스트리밍|드라마|영화/, "ott"],
  [/음악|뮤직|music/, "music"],
  [/클라우드|저장\s*공간|cloud/, "cloud"],
  [/쇼핑|shopping/, "shopping"],
  [/\bai\b|인공지능|ai\s*툴|ai\s*구독/, "ai"],
];

/** 질문에 서비스 이름이 들어 있는지(서비스 목록과 이 기기의 구독). 들어 있으면 그 서비스를 묻는 질문일 수 있다. */
function mentionsService(q: string, subscriptions: readonly Subscription[]): boolean {
  const compact = compactName(q);
  const names = [
    ...POPULAR_SERVICES.flatMap((preset) => [preset.nameKo, preset.nameEn]),
    ...subscriptions.map((sub) => sub.name),
  ]
    .filter((name): name is string => Boolean(name))
    .map(compactName)
    .filter((name) => name.length >= 2);
  // 한글 이름은 앞 두 글자 줄임말("넷플", "디즈")도 본다. 잘못 걸려도 AI에 넘길 뿐이라 넓게 잡는다. 영문은 앞 글자가
  // 흔한 낱말과 겹쳐(chatgpt의 'ch' ↔ 'charge') 이름 전체만 본다.
  return names.some(
    (name) =>
      compact.includes(name) ||
      (/^[가-힣]/.test(name) && name.length >= 4 && compact.includes(name.slice(0, 2))),
  );
}

const asksAmount = /얼마|총액|합계|총합|합쳐|합치|다\s*합|금액|how much|total/;
const yearly = /1년|일년|한\s*해|연간|연\s*단위|올해|1\s*년|year|annual/;
const monthly = /한\s*달|1달|월\s*(?:에|마다|고정|구독)|매달|매월|달에|월간|month/;

/**
 * 규칙으로 고를 수 있으면 그 호출, 아니면 null. 탈옥 문구(`INJECTION`)는 unsupported다. `hasHistory`면 짧은 꼬리 질문을 규칙으로 읽지 않는다.
 */
export function localAskCall(
  question: string,
  options: { now: Date; subscriptions?: readonly Subscription[]; hasHistory?: boolean },
): AskCall | null {
  const q = normalize(question);
  if (INJECTION.test(q)) return { tool: "unsupported" };
  if (q.length < 4 || q.length > 60) return null;
  if (STEERING.test(q)) return null;
  if (options.hasHistory && FOLLOW_UP.test(q)) return null;
  if (mentionsService(q, options.subscriptions ?? [])) return null;
  // 비교·순위·요금제·사용법은 규칙으로 읽지 않는다(뜻이 여럿이다).
  if (
    /지난\s*달|저번\s*달|전월|비교|순위|아까운|아깝|가성비|단가|요금제|싼|어떻게|방법|설정|알림|last month|compare|cheaper|how do/.test(
      q,
    )
  ) {
    return null;
  }

  // 무료 체험이 끝나는 구독
  if (/무료\s*체험|체험|trial/.test(q)) {
    if (!/끝|종료|만료|end/.test(q)) return null;
    return { tool: "trialsEnding", args: { days: parseDays(q, options.now) ?? 31 } };
  }

  // 지킨 돈(해지로 아낀 돈). 기간이 적히지 않았으면("얼마 아꼈어?") 이번 달인지 올해인지 정하지 않고 AI에 맡긴다.
  if (/아낀|아꼈|절약|지킨|굳은|saved|saving/.test(q)) {
    const isYear = yearly.test(q);
    const isMonth = /이번\s*달|한\s*달|this month/.test(q);
    if (isYear === isMonth) return null;
    return { tool: "savedSoFar", args: { period: isYear ? "year" : "month" } };
  }

  // 겹치는 구독
  if (/겹치|중복|두\s*번\s*내|overlap|duplicate/.test(q)) return { tool: "overlaps" };

  // 거의 안 쓰는 구독
  if (/안\s*쓰는|안쓰는|거의\s*안|쓰지\s*않는|안\s*쓴|놀고\s*있는|unused|not using/.test(q)) {
    return { tool: "lowUsage" };
  }

  // 결제 예정
  if (
    /결제|빠져\s*나|나갈|청구|charge|bill/.test(q) &&
    /예정|될|되는|나갈|빠져나갈|다가오|돌아오|곧|있어|upcoming|due|coming/.test(q)
  ) {
    const days = parseDays(q, options.now);
    if (days !== null) return { tool: "upcomingCharges", args: { days } };
    if (/곧|다음\s*결제|다가오|upcoming|next/.test(q))
      return { tool: "upcomingCharges", args: { days: 31 } };
    return null;
  }

  // 분류별 지출
  const categories = CATEGORY_WORDS.filter(([pattern]) => pattern.test(q)).map(([, c]) => c);
  if (categories.length > 1) return null;
  if (categories.length === 1) {
    if (!asksAmount.test(q) && !/쓰고|쓰는|내는|나가/.test(q)) return null;
    return { tool: "spendByCategory", args: { category: categories[0] } };
  }

  // 전체 지출
  if (/구독/.test(q) || /subscription/.test(q)) {
    if (!asksAmount.test(q) && !/나가|내고|쓰고|spend/.test(q)) return null;
    const isYear = yearly.test(q);
    const isMonth = monthly.test(q);
    if (isYear && isMonth) return null;
    return { tool: "spendTotal", args: { period: isYear ? "year" : "month" } };
  }
  return null;
}
