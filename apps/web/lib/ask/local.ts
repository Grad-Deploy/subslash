import { POPULAR_SERVICES, type Subscription } from "@subslash/shared";
import { ALIAS_NAMES, compactName } from "./fuzzy";
import { matchPresets, matchSubscriptions } from "./service-match";
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
  if (/이번\s*주|일주일|한\s*주|주말까지|this week|end of (?:the )?week|by the weekend/.test(q))
    return 7;
  if (/모레/.test(q)) return 2;
  if (/내일|오늘|tomorrow|today/.test(q)) return 1;
  return null;
}

/** 개수를 말하는 말. 없으면 AI가 붙인 개수(`limit`)를 지운다. */
const COUNT_WORDS =
  /(?:한|두|세|네|다섯|몇)\s*(?:개|가지)|하나만|\d+\s*(?:개|가지|위|등)|top\s*\d|\btop\b|\b(?:two|three|four|five|few)\b|\d+\s*(?:subs|subscriptions|services|ones)\b/;

/**
 * AI가 고른 호출을 질문에 적힌 대로 맞춘다. AI는 오늘을 모르고, 질문에 없는 값을 채우기도 한다.
 * - 기간을 받는 도구: 적힌 기간으로 일수를 맞춘다. 기간을 말하는 낱말이 아예 없으면("곧", "언제") 프롬프트의
 *   규칙대로 31일이다 — AI가 7일로 좁히면 8~31일 뒤에 끝나는 체험이 빠졌다. 읽지 못한 기간 낱말이 있으면 AI 값 그대로.
 * - 순위: 개수를 말하지 않았는데 AI가 1·5개로 정했으면 지운다(화면의 기본 개수로 보인다).
 */
export function refineCall(call: AskCall, question: string, now: Date): AskCall {
  const q = normalize(question);
  if (call.tool === "costPerUseRank") {
    if (call.args?.limit === undefined || COUNT_WORDS.test(q)) return call;
    return { ...call, args: { order: call.args.order } };
  }
  if (call.tool !== "upcomingCharges" && call.tool !== "trialsEnding") return call;
  const days = parseDays(question, now) ?? (PERIOD_WORDS.test(q) ? null : 31);
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
 * 내 기록으로 답할 수 없는 말: 다른 사람의 구독을 묻거나, 앞으로 어떻게 답하라고 가르치는 말. 규칙은 '구독'·'금액'만 보고
 * 내 지출 합계로 답해, "다른 사용자들이 많이 구독하는 서비스와 금액"에 내 합계를 남들의 것처럼 보였다. AI(→ unsupported)에 맡긴다.
 */
const NOT_MY_RECORDS =
  /다른\s*(?:사용자|사람|유저|이용자)|남들|사람들|other\s+(?:users|people)|everyone|학습|기억해|피드백|(?:으?로|처럼)\s*답(?:하|해)|remember|from now on/;

/**
 * 한글과 다른 문자(한자·가나·키릴·태국·아랍 등)가 한 질문에 섞였는지. 영문은 서비스 이름("Netflix")·약어("OTT")로
 * 한국어 질문에 늘 섞이므로 보지 않고, 일본어는 원래 한자와 가나를 함께 쓰므로 한글이 없으면 섞인 것이 아니다.
 * 섞인 질문("이 달 구독료 총계是多少?")은 뜻을 짐작해 답하지 않고 곧바로 unsupported다 — AI는 이런 질문에도 그럴듯한
 * 도구를 골랐고, 어느 말을 따랐는지 사용자는 알 수 없다.
 */
export function isMixedLanguage(question: string): boolean {
  return (
    /\p{Script=Hangul}/u.test(question) &&
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Cyrillic}\p{Script=Thai}\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Devanagari}]/u.test(
      question,
    )
  );
}

/**
 * 지시를 바꾸려는 것이 분명한 말. 이런 질문은 AI에 보내지 않고 기기·서버 입구에서 곧바로 unsupported다 — 보내면 횟수와
 * 비용을 쓰고, 탈옥 문구를 모델에 시험해 볼 기회를 준다. 위의 `STEERING`("모드"·"도구"·"시스템")은 평범한 질문에도
 * 나와 거절하지 않고 AI에 맡기므로, 여기에는 정상 질문에 나올 일이 없는 표현만 둔다.
 */
const INJECTION =
  /jailbreak|탈옥|developer\s*mode|개발자\s*모드|ignore\s+(?:all\s+|any\s+|the\s+)?(?:previous|prior|above|earlier)\s+(?:instructions?|prompts?|rules?)|(?:이전|앞|위|기존)(?:의|에)?\s*(?:지시|명령|지침|규칙|프롬프트)\S*\s*(?:다\s*)?(?:무시|잊)|(?:시스템|system)\s*(?:프롬프트|prompt)|前の指示|(?:忽略|无视)(?:之前|以上|上面|前面)/;

// '스트리밍'은 음악에도 붙어("음악 스트리밍") OTT 낱말에 두지 않고, 다른 분류 낱말이 없을 때만 OTT로 본다(localAskCall).
const CATEGORY_WORDS: [RegExp, AskCategory][] = [
  [/ott|영상|동영상|드라마|영화/, "ott"],
  [/음악|음원|뮤직|music/, "music"],
  [/클라우드|저장\s*공간|스토리지|cloud/, "cloud"],
  [/쇼핑|멤버십|shopping/, "shopping"],
  [/\bai\b|인공지능|ai\s*툴|ai\s*구독/, "ai"],
];

/** 서비스 하나에 대해 묻는 말(요금·결제일·쓴 횟수). 이 낱말 앞이 서비스 이름이어야 한다. */
const DETAIL_WORD =
  /얼마|요금제?|가격|구독료|구독비|월정액|이용료|비용|결제\s*금액|결제액|몇\s*원|다음\s*(?:결제|청구|요금)|결제일|청구일|결제\s*(?:날짜|일정)|빠지는\s*날|몇\s*번|(?:사용|이용)\s*횟수/;
/** 서비스의 더 싼 요금제를 묻는 말. */
const CHEAPER_WORD =
  /더\s*(?:싼|싸|저렴)|싸게|저렴한|싼\s*(?:거|게|요금제)|최저가|(?:제일|가장)\s*(?:싼|저렴)|낮추|낮은\s*요금제|다운그레이드/;
/**
 * 서비스를 묻지만 앱이 답할 수 없거나 뜻이 다른 말 — AI에 맡긴다. 요금이 바뀌었는지·할인·방법·평균·특정 달(앱은 최근 30일만
 * 안다)·해지·대신 해 달라는 요청이다. 학습 세트를 만들며 이런 질문이 서비스 이름과 '요금'을 함께 담고 있었다.
 */
const NOT_DETAIL =
  /할인|방법|바뀐|바뀌|올랐|오른|오르|인상|내린|내려|싸진|소식|해지|취소|끊|비싼\s*편|비교|지난\s*달|\d+\s*월(?!\s*(?:요금|구독|정액))|추천|대신|평균|왜|이유/;
/** 이름 앞뒤에 붙는 말(조사·때·한 달). 떼고 남은 것이 서비스 이름이어야 한다. */
const NAME_HEAD = /^(?:(?:이번\s*달|이달|오늘|지금|요즘|혹시|내)\s*)+/;
const NAME_TAIL =
  /(?:\s*(?:내가|제가|나는|저는))?\s*(?:구독\s*(?:하면|하려면|할\s*때|시)?)?\s*(?:은|는|이|가|의)?\s*(?:한\s*달에?|1\s*달에?|매달|매월|월|이번\s*달|이달|오늘\s*기준|지금보다|지금|다음에?)?\s*(?:은|는|이|가|의|에|에서)?\s*$/;
/** 여러 서비스·기간·분류를 함께 묻는 말 — 한 서비스의 질문이 아니다("넷플 티빙 합쳐서 얼마", "넷플 1년에 얼마"). */
const NOT_ONE_SERVICE =
  /랑|하고|이랑|합쳐|합치|전부|모두|다\s|및|,|\+\s|\band\b|(?:이)?나\s|같은|\s등(?:\s|의)|\d+\s*(?:년|개월|주|일)|올해|연간|일\s*년|한\s*해|ott|음악|클라우드|쇼핑|전체|총/;

/** 서비스 이름·줄임말 그대로인지(띄어쓰기·대소문자 무시). */
function isExactName(text: string, subscriptions: readonly Subscription[]): boolean {
  const wanted = compactName(text);
  return [
    ...POPULAR_SERVICES.flatMap((preset) => [preset.nameKo, preset.nameEn, preset.name]),
    ...subscriptions.map((sub) => sub.name),
    ...ALIAS_NAMES,
  ].some((name) => !!name && compactName(name) === wanted);
}

/** 서비스 이름이면 그 말(적은 그대로), 아니면 null. 이 기기의 구독이나 서비스 목록의 서비스 하나에 맞아야 한다. */
function serviceNameIn(text: string, subscriptions: readonly Subscription[]): string | null {
  const raw = text.replace(NAME_HEAD, "").trim();
  let stripped = raw.replace(NAME_TAIL, "").trim();
  // 뗀 조사가 이름의 끝 글자였으면("스포티파이"·"잼민이"의 '이') 되돌린다 — 이름 그대로인 쪽을 넘긴다.
  const restored = (stripped + raw.slice(stripped.length, stripped.length + 1)).trim();
  if (restored !== stripped && isExactName(restored, subscriptions)) stripped = restored;
  // 그래도 맞지 않으면 떼기 전 이름도 본다.
  for (const name of new Set([stripped, raw])) {
    if (name.length < 2 || name.length > 20 || NOT_ONE_SERVICE.test(name)) continue;
    const known =
      matchSubscriptions(name, [...subscriptions]).length > 0 || matchPresets(name).length === 1;
    if (known) return name;
  }
  return null;
}

/**
 * 서비스 하나를 묻는 질문이면 그 호출. 더 싼 요금제를 물으면 `cheaperPlan`("티빙 더 저렴한 요금제 있나요?"), 요금·결제일·쓴
 * 횟수를 물으면 `serviceDetail`("밀리 얼마야?", "스포티파이 다음 결제일 언제야?", "이번 달 쿠팡 와우 몇 번 썼지?"). 이름은
 * 적은 말 그대로 넘기고 맞추기는 답이 한다(구독 중이면 내 구독, 아니면 서비스 목록의 요금). 이름이 맞지 않거나 다른 뜻이
 * 섞이면(`NOT_DETAIL`) null — AI에 맡긴다. AI는 "밀리 얼마"를 '결제 예정'으로 읽기도 했다.
 */
function serviceCall(q: string, subscriptions: readonly Subscription[]): AskCall | null {
  const text = q.replace(/[?？!！.。~]+$/, "").trim();
  if (NOT_DETAIL.test(text)) return null;
  const cheaper = CHEAPER_WORD.exec(text);
  if (cheaper) {
    // "넷플릭스 요금제 중에 지금보다 저렴한 거" — 이름은 '요금제·지금' 같은 말 앞까지다.
    const head = text.slice(0, cheaper.index).split(/\s*(?:요금제|요금|지금|중에)/)[0];
    const name = serviceNameIn(head, subscriptions);
    return name ? { tool: "cheaperPlan", args: { service: name } } : null;
  }
  const detail = DETAIL_WORD.exec(text);
  if (!detail) return null;
  const name = serviceNameIn(text.slice(0, detail.index), subscriptions);
  return name ? { tool: "serviceDetail", args: { service: name } } : null;
}

/** 1회당 비용 순위를 묻는 말. 아까운 쪽(worst)과 가성비 좋은 쪽(best). 요금이 싼 구독("가장 싼 구독")은 순위가 아니다. */
const RANK_WORST =
  /아까운|아깝|아까웠|손해|후회|가성비\s*(?:가|이)?\s*(?:제일|가장)?\s*(?:떨어|나쁜|안\s*좋|최악|낮)|(?:쓰는|사용|쓴)\s*(?:거|것|만큼|빈도|량)?.{0,10}(?:비해|대비|낮은데|적은데).{0,12}(?:비싼|많이\s*(?:들|나가)|안\s*좋)|한\s*번\s*쓸\s*때.{0,6}비싼|(?:1회|한\s*번)\s*(?:당|단가).{0,6}(?:비싼|높)|적게\s*쓰는데|비용\s*대비\s*사용량.{0,8}안\s*좋/;
const RANK_BEST =
  /가성비\s*(?:가|이)?\s*(?:제일|가장)?\s*(?:좋|최고)|(?:제일|가장)\s*가성비|(?:1회|한\s*번)\s*(?:당|단가).{0,8}(?:낮|싼|저렴)|비용\s*효율|경제적/;
const KOREAN_COUNT: Record<string, number> = { 한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5 };

/** 순위 질문이면 그 호출. 개수를 말했을 때만 limit을 둔다(1~5). 안 쓰는 구독·요금제가 섞이면 null. */
function rankCall(q: string): AskCall | null {
  const worst = RANK_WORST.test(q);
  const best = RANK_BEST.test(q);
  if (worst === best) return null;
  if (/안\s*(?:쓰는|쓴)|거의\s*안|요금제/.test(q)) return null;
  const m = /(\d+)\s*(?:개|가지|위)|top\s*(\d+)|(한|두|세|네|다섯)\s*(?:개|가지)/.exec(q);
  const count = m ? Number(m[1] ?? m[2]) || KOREAN_COUNT[m[3]] : undefined;
  if (count !== undefined && (count < 1 || count > 5)) return null;
  const order = worst ? "worst" : "best";
  return { tool: "costPerUseRank", args: count ? { order, limit: count } : { order } };
}

/** 앱이 대신 해 달라는 요청. 앱은 계산만 하므로 답하지 않는다(서비스 이름이 있어도). */
const ACTION_REQUEST =
  /대신\s*(?:해지|결제|가입|취소|해\s*줄|해\s*줘|해줘|해\s*주)|(?:해지|결제|가입|취소)\s*(?:해\s*줘|해줘|해\s*주세요|해\s*줄래|해\s*줄\s*수)/;

/** 앱 사용법 질문: 어떻게·어디서를 묻고 앱 기능 낱말이 함께 있다. 도움말(`help`)로 넘긴다. */
const HELP_HOW =
  /어떻게\s*(?:해|하|켜|추가|등록|설정|바꿔|바꾸|고쳐|고치|되어|돼|되)|어디서|어디에\s*있|방법\s*(?:있|알려|이)|하는\s*법|고칠\s*수/;
const HELP_TOPIC =
  /체크인|백업|알림|다크\s*모드|테마|로그인|비밀번호|구독\s*(?:추가|등록)|추가하|등록하|gmail|지메일|불러오|가져오|설정|캘린더|언어|탈퇴|동기화|복원/;

/** 질문에 서비스 이름이 들어 있는지(서비스 목록과 이 기기의 구독). 들어 있으면 그 서비스를 묻는 질문일 수 있다. */
function mentionsService(q: string, subscriptions: readonly Subscription[]): boolean {
  const compact = compactName(q);
  const names = [
    ...POPULAR_SERVICES.flatMap((preset) => [preset.nameKo, preset.nameEn]),
    ...subscriptions.map((sub) => sub.name),
    // 줄임말("클로드", "아클")도 서비스 이름이다 — 빠지면 "클로드 구독료 얼마야"를 전체 구독비로 답했다.
    ...ALIAS_NAMES,
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

/**
 * 기간을 말하는 낱말. `parseDays`가 읽지 못한 기간이 있는지 볼 때 쓴다. `parseDays`는 한국어·영어만 읽으므로 다른 화면
 * 언어의 주·달·날 낱말도 여기에 둔다 — 없으면 "这周有要扣款的吗？"를 기간 없는 질문으로 읽어, AI가 고른 7일을 31일로
 * 덮었다. 걸리면 AI 값을 그대로 둘 뿐이라 넓게 잡는다.
 */
const PERIOD_WORDS =
  /\d|주|week|달|month|내일|모레|오늘|today|tomorrow|[周週星期礼拜月天日]|今日|明日|あした|きょう|tuần|tháng|ngày|hôm nay|(?<!\p{L})(?:semaines?|mois|jours?|aujourd'hui|demain|semanas?|mes(?:es)?|mês|días?|dias?|hoy|mañana|hoje|amanhã|wochen?|monate?|tagen?|heute|morgen)(?!\p{L})/u;

const asksAmount =
  /얼마|총액|합계|총합|총계|합쳐|합치|다\s*합|금액|결제액|몇\s*(?:천\s*|만\s*)?원|지출|비용|과금|요금|구독료|구독비|how much|total/;
/** 지출을 묻지만 앱이 모르는 것(요금 변경·평균·이유)이나 다른 기능(알림·비교)이 섞인 말. */
const NOT_SPEND =
  /인상|올랐|오르|오른|내린|소식|평균|왜|이유|알림|비교|보통|예산|추천|줄었|늘었|증가|감소|변화/;
const yearly = /1년|일년|한\s*해|연간|연\s*단위|올해|1\s*년|12\s*개월|열두\s*달|year|annual/;
const monthly = /한\s*달|1달|월\s*(?:에|마다|고정|구독)|매달|매월|달에|월간|month/;

// ── 기간만 바꾸는 꼬리 질문 ──────────────────────────────────────

/** 꼬리 질문의 앞뒤에 붙는 말. 떼고 나서 기간 말만 남아야 기간만 바꾸는 질문이다. */
const FOLLOW_UP_HEAD = /^(?:그럼|그러면|그렇다면|그건|and|then|so|what about|how about)\s*/;
const FOLLOW_UP_TAIL =
  /\s*(?:으로|로)?\s*(?:하면|치면|따지면|계산하면|보면)$|\s*(?:기준)?\s*(?:이라면|라면|이면|면|으로는|로는|으론|론|은|는|치는|이야|야)$/;
/** 기간 말 전체가 1년·한 달인지. 다른 말이 섞이면(“1년 동안 안 쓴 구독은?”) 기간만 바꾸는 질문이 아니다. */
const WHOLE_YEAR =
  /^(?:1\s*년|일\s*년|한\s*해|연간|연\s*단위|1\s*년\s*치|일\s*년\s*치|12\s*개월|열두\s*달|올해|(?:a|per|for a|for the|this|one|the)\s+year|yearly|annually|annual)$/;
const WHOLE_MONTH =
  /^(?:한\s*달|1\s*달|한\s*달\s*치|월|월간|매달|매월|이번\s*달|(?:a|per|for a|for the|this|one|the)\s+month|monthly)$/;
/** 일수로 읽는 기간 말 전체(결제 예정·체험 종료의 꼬리 질문). 읽는 것은 `parseDays`가 한다. */
const WHOLE_DAYS =
  /^(?:\d{1,2}\s*일|\d\s*주|이번\s*주|다음\s*주(?:까지)?|일주일|한\s*주|내일|모레|오늘|월말|이번\s*달\s*(?:말|안)|(?:next|within|in)\s+\d{1,2}\s+days?|\d\s+weeks?|this week|next week|tomorrow|today|end of (?:the )?month)(?:\s*(?:안|내|이내|동안|까지))?$/;

/**
 * 앞선 호출에서 기간만 바꾸는 꼬리 질문("그럼 1년이면?", "한 달로는?", "2주면?")이면 앞선 호출을 이어받아 기간만 고친다.
 * 아니면 null — 다른 말이 섞였거나, 앞선 도구가 그 기간을 받지 않으면(순위에 "1년이면?") AI에 맡긴다. 늘 AI를 거치면
 * AI가 닫혀 있을 때는 아예 답하지 못했고, 예전 앱은 이 인자를 몰라 1년을 물어도 한 달로 답했다.
 */
export function periodFollowUp(question: string, previous: AskCall, now: Date): AskCall | null {
  const phrase = normalize(question)
    .replace(/[?？!！.。~]+$/, "")
    .replace(FOLLOW_UP_HEAD, "")
    .replace(FOLLOW_UP_TAIL, "")
    .trim();
  if (!phrase) return null;
  const period = WHOLE_YEAR.test(phrase) ? "year" : WHOLE_MONTH.test(phrase) ? "month" : null;
  switch (previous.tool) {
    case "spendTotal":
    case "savedSoFar":
      return period ? { tool: previous.tool, args: { period } } : null;
    case "spendByCategory": {
      if (!period) return null;
      const category = previous.args?.category;
      if (typeof category !== "string") return null;
      // 한 달은 인자를 두지 않는다(기본값). 예전 앱도 그대로 받는다.
      return {
        tool: "spendByCategory",
        args: period === "year" ? { category, period } : { category },
      };
    }
    case "upcomingCharges":
    case "trialsEnding": {
      if (!WHOLE_DAYS.test(phrase)) return null;
      const days = parseDays(phrase, now);
      return days === null ? null : { tool: previous.tool, args: { days } };
    }
    default:
      return null;
  }
}

/**
 * 규칙으로 고를 수 있으면 그 호출, 아니면 null. 탈옥 문구(`INJECTION`)는 unsupported다. `hasHistory`면 짧은 꼬리 질문을 규칙으로 읽지 않는다.
 * 다만 기간만 바꾸는 꼬리 질문은 `previous`(앞선 턴의 호출)를 이어받아 규칙으로 답하고, 앞선 턴 없이 기간만 물으면
 * ("1년이면?") 구독비 합계다 — AI는 이 말을 '내일까지 결제'(1일)로 읽기도 했다.
 */
export function localAskCall(
  question: string,
  options: {
    now: Date;
    subscriptions?: readonly Subscription[];
    hasHistory?: boolean;
    previous?: AskCall;
  },
): AskCall | null {
  const q = normalize(question);
  if (INJECTION.test(q) || isMixedLanguage(q)) return { tool: "unsupported" };
  if (q.length <= 30) {
    const previous =
      options.previous ??
      (options.hasHistory
        ? undefined
        : ({ tool: "spendTotal", args: { period: "month" } } as const));
    const followUp = previous && periodFollowUp(q, previous, options.now);
    if (followUp) return followUp;
  }
  if (q.length < 4 || q.length > 60) return null;
  if (STEERING.test(q) || NOT_MY_RECORDS.test(q)) return null;
  if (options.hasHistory && FOLLOW_UP.test(q)) return null;
  if (ACTION_REQUEST.test(q)) return { tool: "unsupported" };
  const subscriptions = options.subscriptions ?? [];
  const ofService = serviceCall(q, subscriptions);
  if (ofService) return ofService;
  // 분류를 묻는 질문은 예로 서비스 이름을 들기도 한다("쿠팡 와우 같은 쇼핑 멤버십") — 그때는 서비스 질문으로 보지 않는다.
  const categories = CATEGORY_WORDS.filter(([pattern]) => pattern.test(q)).map(([, c]) => c);
  if (categories.length === 0 && /스트리밍/.test(q)) categories.push("ott");
  const categoryByExample = categories.length === 1 && /같은|\s등(?:\s|의)|처럼/.test(q);
  if (mentionsService(q, subscriptions) && !categoryByExample) return null;

  // 앱 사용법
  if (HELP_HOW.test(q) && HELP_TOPIC.test(q)) return { tool: "help" };
  // 1회당 비용 순위
  const rank = rankCall(q);
  if (rank) return rank;
  // 지난달과 비교. 앱에는 달별 기록이 없어 답은 이번 달에 등록·해지한 구독으로 한다(answer의 compareLastMonth).
  if (
    /지난\s*달|저번\s*달|전월/.test(q) &&
    /구독\s*(?:비|료|값)|구독에\s*(?:쓴|낸)/.test(q) &&
    /비교|대비|늘|줄|올랐|증감|보다|차이/.test(q) &&
    !/다음\s*달/.test(q)
  ) {
    return { tool: "compareLastMonth" };
  }
  // 그 밖의 비교·순위·요금제·사용법은 규칙으로 읽지 않는다(뜻이 여럿이다).
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
    const days = parseDays(q, options.now);
    // 기간을 적었는데 읽지 못했으면("week's trial") 31일로 넓히지 않고 AI에 맡긴다
    if (days === null && PERIOD_WORDS.test(q)) return null;
    return { tool: "trialsEnding", args: { days: days ?? 31 } };
  }

  // 지킨 돈(해지로 아낀 돈). 기간이 적히지 않았으면("얼마 아꼈어?") 이번 달인지 올해인지 정하지 않고 AI에 맡긴다.
  if (
    /아낀|아꼈|절약|지킨|굳은|sav(?:e|ed|ing)\b/.test(q) ||
    /(?:해지|취소|끊).{0,12}(?:모은|삭감|여유|생긴\s*돈)/.test(q)
  ) {
    const isYear = yearly.test(q);
    const isMonth = /이번\s*달|한\s*달|this month/.test(q);
    if (isYear === isMonth) return null;
    return { tool: "savedSoFar", args: { period: isYear ? "year" : "month" } };
  }

  // 겹치는 구독
  if (/겹치|중복|두\s*번\s*내|overlap|duplicate/.test(q)) return { tool: "overlaps" };

  // 거의 안 쓰는 구독
  // '안'은 낱말 앞에서만 본다 — "한 해 동안 쓴"의 '안 쓴'을 '안 쓰는 구독'으로 읽었다
  // 돈 말이 함께 있으면("안 쓰는데 비용이 제일 비싼") 아까운 구독을 묻는 것일 수 있어 AI에 맡긴다.
  if (
    /(?:^|\s)안\s*(?:쓰는|쓴)|거의\s*안|쓰지\s*않는|놀고\s*있는|(?:사용|이용)\s*안\s*한|활동\s*(?:이\s*)?거의\s*없|unused|not using/.test(
      q,
    )
  ) {
    return /비싼|비용|아까|아깝|가성비|돈만/.test(q) ? null : { tool: "lowUsage" };
  }

  // 결제 예정
  if (
    // 공짜·무료가 함께 있으면 무료 체험을 묻는 말이다("공짜로 쓰다가 곧 돈 나가는 거")
    !/공짜|무료/.test(q) &&
    /결제|빠져\s*나|빠지는|빠질|나갈|나가는|청구|charge|bill/.test(q) &&
    /예정|될|되는|나갈|나가는|빠져나갈|빠지는|다가오|돌아오|곧|있어|있는|있나|언제|upcoming|due|coming/.test(
      q,
    )
  ) {
    const days = parseDays(q, options.now);
    if (days !== null) return { tool: "upcomingCharges", args: { days } };
    // 기간 없이 다음 결제가 언제인지 물으면 31일(프롬프트의 규칙과 같다)
    if (/곧|다음|이번\s*결제|다가오|언제|upcoming|next/.test(q))
      return { tool: "upcomingCharges", args: { days: 31 } };
    return null;
  }

  // 분류별 지출
  if (categories.length > 1) return null;
  if (categories.length === 1) {
    if (!asksAmount.test(q) && !/쓰고|쓰는|내는|나가|나와|들어|드는|지불/.test(q)) return null;
    if (NOT_SPEND.test(q)) return null;
    const isYear = yearly.test(q);
    if (isYear && monthly.test(q)) return null;
    return {
      tool: "spendByCategory",
      args: isYear ? { category: categories[0], period: "year" } : { category: categories[0] },
    };
  }

  // 전체 지출. 기간(며칠·이번 주)이 붙은 '얼마'는 결제 예정이고, 순위·해지·절약이 섞이면 뜻이 여럿이라 AI에 맡긴다.
  if (/구독/.test(q) || /subscription/.test(q)) {
    if (!asksAmount.test(q) && !/나가|내고|쓰고|나와|들어|지불|쓴\s*돈|들인|spend/.test(q))
      return null;
    if (NOT_SPEND.test(q)) return null;
    if (parseDays(q, options.now) !== null) return null;
    if (/해지|취소|끊|제일|가장|덜|top|cancel|least|most|cheap/.test(q)) return null;
    const isYear = yearly.test(q);
    const isMonth = monthly.test(q);
    if (isYear && isMonth) return null;
    return { tool: "spendTotal", args: { period: isYear ? "year" : "month" } };
  }
  return null;
}
