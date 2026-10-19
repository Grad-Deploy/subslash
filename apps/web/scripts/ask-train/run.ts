/**
 * '리포트에 물어보기' 학습 세트(lib/ask/train-set) 만들기. 두 단계이고, 사이에 사람의 검수가 있다.
 *
 * 1. 만들기 — 지금 설정한 AI로 도구·인자마다 질문을 바꿔 쓰게 해 검수 파일에 쓴다(git에 올리지 않는다).
 *      ASK_PROVIDER=… ASK_MODEL=… <회사>_API_KEY=… pnpm --filter @subslash/web ask:train generate
 *      … ask:train generate -- --locales ko,en,ja --per 8 --only spendTotal,lowUsage
 *    `--locales all`은 화면 언어 전부다. 기본은 ko,en, 한 뜻에 8개.
 *
 * 2. 검수 — 검수 파일을 열어 줄마다 `keep`을 true(그 뜻이 맞다)나 false(다른 뜻이거나 애매하다)로 정한다. 정답 호출이
 *    틀렸으면 `call`을 고치고 true로 둔다. `note`가 있는 줄은 특히 본다.
 *
 * 3. 반영 — `keep`이 하나라도 정해지지 않았으면 아무것도 넣지 않는다.
 *      pnpm --filter @subslash/web ask:train accept scripts/ask-train/candidates/<파일>.json
 *
 * `ask:train stats`는 학습 세트의 도구·언어별 개수를 보여 준다.
 *
 * 평가 세트(lib/ask/eval-set)와 같은 질문은 만들 때 버리고 넣을 때도 거절한다 — 평가 세트는 처음 보는 질문으로 남아야 한다.
 */
/* eslint-disable no-console -- 터미널에서 돌리는 스크립트라 결과를 콘솔에 찍는다. */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { LOCALES, type Locale } from "../../lib/i18n/config";
import { ASK_EVAL_SET } from "../../lib/ask/eval-set";
import { askProviderConfig, pickTool } from "../../lib/ask/provider";
import { ASK_TRAIN_SET, askQuestionKey, type AskTrainCase } from "../../lib/ask/train-set";
import { isValidAskCall, MAX_ASK_QUESTION, type AskCall } from "../../lib/ask/tools";

const TRAIN_SET_PATH = join(__dirname, "../../lib/ask/train-set.json");
const CANDIDATES_DIR = join(__dirname, "candidates");

const LANGUAGE: Record<Locale, string> = {
  ko: "한국어",
  en: "영어",
  zh: "중국어(간체)",
  ja: "일본어",
  vi: "베트남어",
  fr: "프랑스어",
  es: "스페인어",
  de: "독일어",
  pt: "포르투갈어(브라질)",
};

/** 서비스 이름을 받는 도구에 넣을 이름. 브랜드 이름은 한국어 밖에서는 영문 그대로 쓴다. */
const SERVICE_NAMES = {
  ko: ["넷플릭스", "유튜브 프리미엄", "티빙", "스포티파이", "쿠팡 와우", "디즈니플러스"],
  other: ["Netflix", "YouTube Premium", "Spotify", "ChatGPT Plus", "Disney+", "iCloud+"],
};

/** 만들 질문의 뜻 하나. `meaning`은 AI에게 보이는 설명이고, 질문은 이 뜻 하나만 물어야 한다. */
interface Spec {
  call: AskCall;
  meaning: string;
}

function specs(locale: Locale): Spec[] {
  const names = locale === "ko" ? SERVICE_NAMES.ko : SERVICE_NAMES.other;
  const pickName = (i: number) => names[i % names.length];
  return [
    {
      call: { tool: "spendTotal", args: { period: "month" } },
      meaning: "구독 전체에 한 달에 쓰는 돈의 합계",
    },
    {
      call: { tool: "spendTotal", args: { period: "year" } },
      meaning: "구독 전체에 1년 동안 쓰는 돈의 합계",
    },
    ...(
      [
        ["ott", "영상 스트리밍(OTT)"],
        ["music", "음악 스트리밍"],
        ["cloud", "클라우드 저장 공간"],
        ["shopping", "쇼핑 멤버십(쿠팡 와우·네이버플러스 같은)"],
        ["ai", "AI 서비스(ChatGPT·Claude·Gemini 같은)"],
      ] as const
    ).map(([category, label]) => ({
      call: { tool: "spendByCategory" as const, args: { category } },
      meaning: `${label} 구독에 한 달에 쓰는 돈. 서비스 이름 하나만 적지 말고 분류를 묻는다`,
    })),
    {
      call: { tool: "spendByCategory", args: { category: "ott", period: "year" } },
      meaning:
        "OTT(동영상 스트리밍) 구독에 1년 동안 쓰는 돈. 서비스 이름 하나만 적지 말고 분류를 묻는다. '1년'·'연간' 같은 기간을 꼭 넣는다",
    },
    {
      call: { tool: "costPerUseRank", args: { order: "worst" } },
      meaning: "쓰는 것에 비해 돈이 가장 아까운(1회당 비용이 가장 비싼) 구독. 개수는 말하지 않는다",
    },
    {
      call: { tool: "costPerUseRank", args: { order: "best" } },
      meaning: "가성비가 가장 좋은(1회당 비용이 가장 싼) 구독. 개수는 말하지 않는다",
    },
    {
      call: { tool: "costPerUseRank", args: { order: "worst", limit: 3 } },
      meaning: "돈이 가장 아까운 구독 3개",
    },
    { call: { tool: "lowUsage" }, meaning: "최근에 거의 쓰지 않는 구독이 있는지" },
    {
      call: { tool: "upcomingCharges", args: { days: 1 } },
      meaning: "내일 결제되는 구독. 기간은 '내일'로만 말한다",
    },
    {
      call: { tool: "upcomingCharges", args: { days: 7 } },
      meaning: "이번 주(7일 안)에 결제될 구독이나 금액. 기간은 '이번 주' 또는 '일주일'로만 말한다",
    },
    {
      call: { tool: "upcomingCharges", args: { days: 14 } },
      meaning: "2주(14일) 안에 결제될 구독. 기간은 '2주' 또는 '14일'로만 말한다",
    },
    {
      call: { tool: "upcomingCharges", args: { days: 31 } },
      meaning:
        "곧 결제될 구독이나 다음 결제가 언제인지. 기간(며칠·이번 주·이번 달)은 말하지 않고 서비스 이름도 적지 않는다",
    },
    {
      call: { tool: "trialsEnding", args: { days: 31 } },
      meaning: "곧 끝나는 무료 체험이 있는지. 기간은 말하지 않는다",
    },
    {
      call: { tool: "trialsEnding", args: { days: 7 } },
      meaning: "이번 주(7일 안)에 끝나는 무료 체험. 기간은 '이번 주' 또는 '일주일'로만 말한다",
    },
    { call: { tool: "overlaps" }, meaning: "겹치거나 중복으로 돈을 내는 구독이 있는지" },
    ...[0, 1, 2].map((i) => ({
      call: { tool: "cheaperPlan" as const, args: { service: pickName(i) } },
      meaning: `'${pickName(i)}'에 지금보다 싼 요금제가 있는지. 서비스 이름 '${pickName(i)}'를 글자 그대로 넣는다`,
    })),
    ...[3, 4, 5].map((i) => ({
      call: { tool: "serviceDetail" as const, args: { service: pickName(i) } },
      meaning: `'${pickName(i)}'의 다음 결제일이나 내가 내는 금액이나 이번 달 사용 횟수. 서비스 이름 '${pickName(i)}'를 글자 그대로 넣는다`,
    })),
    // 줄임말로 요금만 묻는 질문 — 구독하지 않은 서비스라도 앱이 서비스 목록의 요금으로 답한다(lib/ask/answer).
    ...(locale === "ko" ? ["넷플", "아클", "밀리"] : ["Netflix", "Spotify", "Claude"]).map(
      (name) => ({
        call: { tool: "serviceDetail" as const, args: { service: name } },
        meaning: `'${name}'의 요금이 얼마인지만 묻는 짧은 질문. 서비스 이름 '${name}'를 글자 그대로 넣고 다른 서비스는 넣지 않는다`,
      }),
    ),
    {
      call: { tool: "savedSoFar", args: { period: "month" } },
      meaning: "이번 달에 구독을 해지해서 아낀 돈. '이번 달'이라는 기간을 꼭 넣는다",
    },
    {
      call: { tool: "savedSoFar", args: { period: "year" } },
      meaning: "올해 구독을 해지해서 아낀 돈. '올해'라는 기간을 꼭 넣는다",
    },
    {
      call: { tool: "compareLastMonth" },
      meaning: "지난달과 비교해 구독비가 늘었는지 줄었는지",
    },
    {
      call: { tool: "help" },
      meaning:
        "이 구독 관리 앱의 사용법이나 기능(구독 추가, 사용 횟수 체크인, Gmail에서 가져오기, 백업, 다크 모드, 결제 알림, 로그인)",
    },
    {
      call: { tool: "unsupported" },
      meaning:
        "구독 지출과 관계없는 질문(날씨·주식·잡담·영화 추천)이나 앱이 모르는 것(환불 여부·가격 인상 소식·카드 한도)",
    },
    {
      call: { tool: "unsupported" },
      meaning:
        "앱에 대신 해지·결제를 해 달라는 요청, 이전 지시를 무시하라는 말, 다른 사람의 정보나 시스템 정보를 달라는 말",
    },
  ];
}

const SYSTEM = `너는 구독 관리 앱의 '리포트에 물어보기'에 사용자가 칠 법한 질문 예시를 만드는 역할만 한다.
- 주어진 뜻 하나만 묻는 질문을 주어진 언어로 만든다. 다른 기간·분류·서비스가 섞여 뜻이 둘이 되면 안 된다.
- 휴대폰에서 실제로 칠 법하게: 존댓말·반말·줄임말·가벼운 오타·물음표 없는 문장을 섞고, 질문마다 표현을 다르게 한다.
- 한 질문은 60자 안으로.
- submit_questions 도구로만 낸다.`;

const SUBMIT_TOOL = {
  name: "submit_questions",
  description: "만든 질문 목록을 낸다.",
  parameters: {
    type: "object",
    properties: { questions: { type: "array", items: { type: "string" } } },
    required: ["questions"],
  },
};

interface Candidate extends AskTrainCase {
  /** 사람이 정한다. true면 넣고 false면 버린다. */
  keep: boolean | null;
  /** 검수할 때 볼 점. */
  note?: string;
}

/** 서비스 이름을 받는 호출이면 그 이름이 질문에 그대로 있어야 한다 — 기기는 적힌 말 그대로 구독과 맞춘다. */
function serviceMissing(row: AskTrainCase): boolean {
  const service = row.call.args?.service;
  return typeof service === "string" && !askQuestionKey(row.q).includes(askQuestionKey(service));
}

function knownKeys(): Set<string> {
  return new Set([...ASK_EVAL_SET, ...ASK_TRAIN_SET].map((item) => askQuestionKey(item.q)));
}

function argValue(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function generate() {
  const config = askProviderConfig();
  if (!config) {
    console.error(
      "ASK_PROVIDER·ASK_MODEL과 그 회사의 API 키를 설정해 주세요(스크립트 맨 위 설명).",
    );
    process.exit(1);
  }
  const localesArg = argValue("locales") ?? "ko,en";
  const locales = (localesArg === "all" ? [...LOCALES] : localesArg.split(",")) as Locale[];
  const unknown = locales.filter((locale) => !LOCALES.includes(locale));
  if (unknown.length > 0) {
    console.error(`모르는 언어: ${unknown.join(", ")} (쓸 수 있는 것: ${LOCALES.join(", ")})`);
    process.exit(1);
  }
  const per = Math.min(20, Math.max(1, Number(argValue("per") ?? 8)));
  const only = argValue("only")?.split(",");

  const seen = knownKeys();
  const rows: Candidate[] = [];
  let skipped = 0;
  for (const locale of locales) {
    for (const spec of specs(locale)) {
      if (only && !only.includes(spec.call.tool)) continue;
      const message = `언어: ${LANGUAGE[locale]}\n개수: ${per}\n뜻: ${spec.meaning}`;
      try {
        const raw = await pickTool(message, SYSTEM, [SUBMIT_TOOL], config, fetch, {
          maxTokens: 2000,
          timeoutMs: 60_000,
          // 같은 뜻을 여러 표현으로 써야 하므로 묻기(0)와 달리 올린다.
          temperature: 0.9,
        });
        const questions = (raw.args as { questions?: unknown } | undefined)?.questions;
        if (!Array.isArray(questions)) throw new Error("질문 목록이 오지 않았다");
        for (const q of questions) {
          if (typeof q !== "string" || q.trim() === "") continue;
          const key = askQuestionKey(q);
          // 평가 세트·학습 세트·이번에 만든 것과 같은 질문은 버린다.
          if (seen.has(key)) {
            skipped++;
            continue;
          }
          seen.add(key);
          const row: Candidate = { q: q.trim(), call: spec.call, locale, keep: null };
          if (serviceMissing(row)) {
            row.note =
              "서비스 이름이 바뀌었다 — call.args.service를 질문에 적힌 대로 고치거나 버린다";
          }
          rows.push(row);
        }
        console.log(
          `${locale} ${spec.call.tool} ${JSON.stringify(spec.call.args ?? {})}: ${questions.length}개`,
        );
      } catch (error) {
        console.error(`${locale} ${spec.call.tool}: 실패 — ${String(error)}`);
      }
    }
  }

  mkdirSync(CANDIDATES_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  // 모델 ID에 '/'가 든 경우(`local/qwen3-coder-next`) 폴더로 읽히지 않게 평가 결과 파일처럼 바꾼다.
  const model = config.model.replace(/[^\w.-]/g, "_");
  const file = join(CANDIDATES_DIR, `${config.provider}-${model}-${stamp}.json`);
  writeFileSync(file, `${JSON.stringify(rows, null, 2)}\n`);
  console.log(`\n${rows.length}개를 썼다(겹쳐서 버린 것 ${skipped}개): ${file}`);
  console.log("줄마다 keep을 true/false로 정한 뒤 `ask:train accept <파일>`로 넣는다.");
}

function accept(path: string | undefined) {
  if (!path) {
    console.error("검수한 파일을 주세요: ask:train accept <파일>");
    process.exit(1);
  }
  const rows = JSON.parse(readFileSync(path, "utf8")) as Candidate[];
  const undecided = rows.filter((row) => typeof row.keep !== "boolean");
  if (undecided.length > 0) {
    console.error(
      `keep을 정하지 않은 줄이 ${undecided.length}개 있다. 모두 정한 뒤 다시 돌려 주세요.`,
    );
    for (const row of undecided.slice(0, 5)) console.error(`  - ${row.q}`);
    process.exit(1);
  }

  const evalKeys = new Set(ASK_EVAL_SET.map((item) => askQuestionKey(item.q)));
  const merged = new Map(ASK_TRAIN_SET.map((item) => [askQuestionKey(item.q), item]));
  const problems: string[] = [];
  let added = 0;
  for (const row of rows.filter((r) => r.keep)) {
    const item: AskTrainCase = { q: row.q.trim(), call: row.call, locale: row.locale };
    const key = askQuestionKey(item.q);
    if (!isValidAskCall(item.call)) problems.push(`호출이 도구 목록 밖이다: ${item.q}`);
    else if (!LOCALES.includes(item.locale)) problems.push(`모르는 언어 ${item.locale}: ${item.q}`);
    else if (item.q.length > MAX_ASK_QUESTION) problems.push(`질문이 너무 길다: ${item.q}`);
    else if (serviceMissing(item)) problems.push(`서비스 이름이 질문에 없다: ${item.q}`);
    else if (evalKeys.has(key)) problems.push(`평가 세트에 같은 질문이 있다: ${item.q}`);
    else if (!merged.has(key)) {
      merged.set(key, item);
      added++;
    }
  }
  if (problems.length > 0) {
    console.error(`넣지 않았다 — 고칠 줄이 ${problems.length}개 있다:`);
    for (const problem of problems) console.error(`  - ${problem}`);
    process.exit(1);
  }

  const sorted = [...merged.values()].sort(
    (a, b) =>
      a.call.tool.localeCompare(b.call.tool) ||
      a.locale.localeCompare(b.locale) ||
      a.q.localeCompare(b.q),
  );
  writeFileSync(TRAIN_SET_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
  const dropped = rows.filter((r) => !r.keep).length;
  console.log(`${added}개를 넣었다(버린 것 ${dropped}개). 학습 세트는 이제 ${sorted.length}개다.`);
}

function stats() {
  const counts = new Map<string, number>();
  for (const item of ASK_TRAIN_SET) {
    const key = `${item.call.tool}\t${item.locale}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  console.log(`학습 세트 ${ASK_TRAIN_SET.length}개 (평가 세트 ${ASK_EVAL_SET.length}개는 따로)`);
  for (const [key, count] of [...counts].sort()) console.log(`  ${key}\t${count}`);
}

const [command, path] = process.argv.slice(2).filter((arg) => arg !== "--");
if (command === "generate") void generate();
else if (command === "accept") accept(path);
else if (command === "stats") stats();
else {
  console.error("사용법: ask:train generate | accept <파일> | stats (스크립트 맨 위 설명)");
  process.exit(1);
}
