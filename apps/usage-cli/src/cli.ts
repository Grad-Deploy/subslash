#!/usr/bin/env node
/**
 * subslash-usage — 이 PC에서 Claude Code·Codex를 쓴 날을 세어 SubSlash 체크인 링크로 넘긴다.
 *
 * 읽는 것: 두 도구가 남긴 세션 기록의 질문 시각과 Codex의 요금제 이름, 지금 로그인 방식.
 * 보내는 것: 없다. 결과는 화면에 보이고, 링크의 `#` 뒤에 서비스별 '쓴 날 수'만 싣는다(서버로 가지 않는다).
 */
import {
  pcUsageLink,
  cliDayKey,
  summarizeCliUsage,
  type CliServiceId,
  type CliUsageSummary,
} from "@subslash/shared";
import { scanClaudeCode, scanCodex, type ToolScan } from "./scan.js";

const DEFAULT_ORIGIN = "https://www.subslash.me";
const WINDOW_DAYS = 30;

const ko = {
  title: (days: number) => `이 PC의 AI 코딩 도구 사용 (최근 ${days}일)`,
  claude: "Claude Code (Claude 구독)",
  codex: "Codex (ChatGPT 구독)",
  notInstalled: "기록 없음 (설치해 쓴 적이 없거나 기록 폴더가 다른 곳에 있어요)",
  usedDays: (days: number, prompts: number) => `${days}일 사용 · 질문 ${prompts}개`,
  noUse: "이 기간에 구독으로 쓴 기록이 없어요",
  last: (date: string) => `마지막 사용 ${date}`,
  plan: (plan: string) => `기록된 요금제: ${plan}`,
  apiValue: (usd: string) => `API 요금으로 환산하면 약 ${usd} (요금표 기준, 세금 제외)`,
  unpriced: (n: number, models: string) =>
    `요금을 확인하지 못한 모델의 응답 ${n}개는 환산에서 뺐어요: ${models}`,
  excluded: (n: number) => `구독이 아닌 방식(API 키 등)으로 쓴 세션 ${n}개는 세지 않았어요`,
  unknown: (n: number) => `구독으로 썼는지 알 수 없는 세션 ${n}개는 세지 않았어요`,
  unrecognized: (n: number) =>
    `알아보지 못한 기록 파일 ${n}개 — 도구가 업데이트돼 형식이 바뀌었을 수 있어요`,
  linkTitle: "SubSlash에 체크인하기 — 이 링크를 브라우저로 여세요:",
  linkNote:
    "쓴 날 수와 API 환산 금액만 링크의 # 뒤에 담겨요(서버로 보내지 않아요). 열면 숫자가 채워진 체크인 창이 뜨고, 확인을 눌러야 저장돼요.",
  noLink: "체크인으로 넘길 사용 기록이 없어요.",
  pcOnly: "PC에서 쓴 날만 셌어요. 웹·폰에서 쓴 날이 더 있으면 체크인 창에서 늘려 주세요.",
  privacy: "기록의 질문·답 내용은 읽지 않고 시각만 셌어요.",
};
type Text = typeof ko;

const en: Text = {
  title: (days) => `AI coding tool use on this PC (last ${days} days)`,
  claude: "Claude Code (Claude subscription)",
  codex: "Codex (ChatGPT subscription)",
  notInstalled: "No records (never used here, or the records are in another folder)",
  usedDays: (days, prompts) =>
    `Used on ${days} ${days === 1 ? "day" : "days"} · ${prompts} ${prompts === 1 ? "prompt" : "prompts"}`,
  noUse: "No subscription use in this period",
  last: (date) => `Last used ${date}`,
  plan: (plan) => `Recorded plan: ${plan}`,
  apiValue: (usd) => `About ${usd} at API prices (list prices, before tax)`,
  unpriced: (n, models) =>
    `Left out ${n} ${n === 1 ? "response" : "responses"} from models without a confirmed price: ${models}`,
  excluded: (n) =>
    `Skipped ${n} ${n === 1 ? "session" : "sessions"} not on a subscription (API key, etc.)`,
  unknown: (n) =>
    `Skipped ${n} ${n === 1 ? "session" : "sessions"} where the subscription couldn't be confirmed`,
  unrecognized: (n) =>
    `${n} record ${n === 1 ? "file" : "files"} not recognized — the tool may have changed its format`,
  linkTitle: "Check in on SubSlash — open this link in your browser:",
  linkNote:
    "Only the day counts and API-price amounts go after # in the link (not sent to the server). It opens a check-in with the number filled in; nothing is saved until you confirm.",
  noLink: "No usage to check in.",
  pcOnly:
    "Only days used on this PC are counted. Raise the number in the check-in if you also used it on the web or your phone.",
  privacy: "Prompt and reply contents weren't read — only their times were counted.",
};

function pickText(): Text {
  const env = process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || "";
  const locale = env || Intl.DateTimeFormat().resolvedOptions().locale;
  return locale.toLowerCase().startsWith("ko") ? ko : en;
}

interface Options {
  origin: string;
  json: boolean;
  link: boolean;
}

function parseArgs(argv: string[]): Options {
  const options: Options = { origin: DEFAULT_ORIGIN, json: false, link: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") options.json = true;
    else if (arg === "--no-link") options.link = false;
    else if (arg === "--origin" && argv[i + 1]) options.origin = argv[++i];
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: subslash-usage [--json] [--no-link] [--origin https://www.subslash.me]");
      process.exit(0);
    }
  }
  if (!/^https?:\/\/[^/]+$/.test(options.origin.replace(/\/$/, ""))) {
    console.error("--origin must be like https://www.subslash.me");
    process.exit(1);
  }
  return options;
}

function summaryOf(scan: ToolScan, now: number): CliUsageSummary {
  return summarizeCliUsage(scan.sessions, {
    now,
    windowDays: WINDOW_DAYS,
    subscriptionDefault: scan.subscriptionDefault,
  });
}

/** 링크에 실을 값. 요금을 아는 응답이 없으면 금액은 싣지 않는다. */
function linkValue(summary: CliUsageSummary) {
  return { days: summary.days, usd: summary.api.pricedRequests > 0 ? summary.api.usd : null };
}

function printTool(t: Text, label: string, scan: ToolScan, summary: CliUsageSummary) {
  console.log(`\n${label}`);
  if (!scan.installed) {
    console.log(`  ${t.notInstalled}`);
    return;
  }
  console.log(`  ${summary.days > 0 ? t.usedDays(summary.days, summary.prompts) : t.noUse}`);
  if (summary.lastAt !== null) console.log(`  ${t.last(cliDayKey(summary.lastAt))}`);
  if (summary.planType) console.log(`  ${t.plan(summary.planType)}`);
  if (summary.api.pricedRequests > 0)
    console.log(`  ${t.apiValue(`$${summary.api.usd.toFixed(2)}`)}`);
  if (summary.api.unpricedRequests > 0) {
    console.log(
      `  ${t.unpriced(summary.api.unpricedRequests, summary.api.unpricedModels.join(", "))}`,
    );
  }
  if (summary.excludedSessions > 0) console.log(`  ${t.excluded(summary.excludedSessions)}`);
  if (summary.unknownSessions > 0) console.log(`  ${t.unknown(summary.unknownSessions)}`);
  if (scan.unrecognizedFiles > 0) console.log(`  ${t.unrecognized(scan.unrecognizedFiles)}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const t = pickText();
  const now = Date.now();
  // 파일을 고친 시각이 기간보다 앞이면 그 안의 질문도 기간 밖이다. 하루 여유를 둔다.
  const since = now - (WINDOW_DAYS + 1) * 24 * 60 * 60 * 1000;
  const [claude, codex] = await Promise.all([scanClaudeCode(since), scanCodex(since)]);
  const summaries: Record<CliServiceId, CliUsageSummary> = {
    "claude-pro": summaryOf(claude, now),
    "chatgpt-plus": summaryOf(codex, now),
  };
  const until = cliDayKey(now);
  const link = pcUsageLink(
    options.origin,
    {
      "claude-pro": linkValue(summaries["claude-pro"]),
      "chatgpt-plus": linkValue(summaries["chatgpt-plus"]),
    },
    { windowDays: WINDOW_DAYS, until },
  );

  if (options.json) {
    console.log(
      JSON.stringify(
        { windowDays: WINDOW_DAYS, until, services: summaries, link: options.link ? link : null },
        null,
        2,
      ),
    );
    return;
  }

  console.log(t.title(WINDOW_DAYS));
  printTool(t, t.claude, claude, summaries["claude-pro"]);
  printTool(t, t.codex, codex, summaries["chatgpt-plus"]);
  console.log("");
  if (!options.link) return;
  if (!link) {
    console.log(t.noLink);
    return;
  }
  console.log(t.linkTitle);
  console.log(`  ${link}`);
  console.log(`\n${t.linkNote}`);
  console.log(t.pcOnly);
  console.log(t.privacy);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
