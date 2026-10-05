/**
 * '리포트에 물어보기' 평가: 평가 세트(lib/ask/eval-set)의 질문을 지금 설정한 모델에 하나씩 보내 정답률·거절률·지연·토큰을
 * 잰다. 모델·프롬프트를 바꿀 때마다 돌려 결과 파일을 비교한다.
 *
 *   ASK_PROVIDER=anthropic ASK_MODEL=… ANTHROPIC_API_KEY=… pnpm --filter @subslash/web ask:eval
 *   ASK_PROVIDER=gemini    ASK_MODEL=… GEMINI_API_KEY=…    pnpm --filter @subslash/web ask:eval
 *
 * 요금은 바뀌므로 코드에 적지 않는다. 비용을 보려면 그 모델의 100만 토큰당 가격(USD)을 넘긴다:
 *   ASK_PRICE_INPUT=… ASK_PRICE_OUTPUT=…
 *
 * 결과는 scripts/ask-eval/results/<provider>-<model>-<시각>.json에 쓴다(git에 올리지 않는다).
 */
/* eslint-disable no-console -- 터미널에서 돌리는 평가 스크립트라 결과를 콘솔에 찍는다. */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ASK_EVAL_SET } from "../../lib/ask/eval-set";
import { askProviderConfig, pickAskCall } from "../../lib/ask/provider";
import type { AskCall } from "../../lib/ask/tools";

const sameCall = (a: AskCall, b: AskCall) =>
  a.tool === b.tool && JSON.stringify(a.args ?? {}) === JSON.stringify(sortArgs(b.args ?? {}));

function sortArgs(args: Record<string, string | number>) {
  return Object.fromEntries(Object.entries(args).sort(([a], [b]) => a.localeCompare(b)));
}

const normalized = (call: AskCall): AskCall => ({
  tool: call.tool,
  ...(call.args ? { args: sortArgs(call.args) } : {}),
});

interface EvalRow {
  q: string;
  tag: string;
  expect: AskCall;
  got: AskCall | null;
  ok: boolean;
  rejectedByValidator?: boolean;
  error?: string;
  ms: number;
  usage?: { inputTokens: number; outputTokens: number };
}

async function main() {
  const config = askProviderConfig();
  if (!config) {
    console.error(
      "ASK_PROVIDER·ASK_MODEL과 그 회사의 API 키를 설정해 주세요(스크립트 맨 위 설명).",
    );
    process.exit(1);
  }

  const results: EvalRow[] = [];
  for (const item of ASK_EVAL_SET) {
    const started = Date.now();
    try {
      const pick = await pickAskCall(item.q, config);
      const got = normalized(pick.call);
      const accepted = [item.expect, ...(item.also ?? [])].map(normalized);
      results.push({
        q: item.q,
        tag: item.tag,
        expect: item.expect,
        got,
        ok: accepted.some((call) => sameCall(got, call)),
        rejectedByValidator: pick.rejected,
        ms: Date.now() - started,
        usage: pick.usage,
      });
    } catch (error) {
      results.push({
        q: item.q,
        tag: item.tag,
        expect: item.expect,
        got: null,
        ok: false,
        error: String(error),
        ms: Date.now() - started,
      });
    }
  }

  const rate = (rows: EvalRow[]) =>
    rows.length ? Math.round((rows.filter((r) => r.ok).length / rows.length) * 1000) / 10 : 0;
  const tags = [...new Set(results.map((r) => r.tag))];
  const refusing = results.filter((r) => r.tag === "scope" || r.tag === "attack");
  const answering = results.filter((r) => r.tag !== "scope" && r.tag !== "attack");
  const input = results.reduce((sum, r) => sum + (r.usage?.inputTokens ?? 0), 0);
  const output = results.reduce((sum, r) => sum + (r.usage?.outputTokens ?? 0), 0);
  const priceIn = Number(process.env.ASK_PRICE_INPUT);
  const priceOut = Number(process.env.ASK_PRICE_OUTPUT);
  const costPer1000 =
    priceIn > 0 && priceOut > 0
      ? ((input * priceIn + output * priceOut) / 1e6 / results.length) * 1000
      : null;
  const ms = results.map((r) => r.ms).sort((a, b) => a - b);

  const summary = {
    provider: config.provider,
    model: config.model,
    questions: results.length,
    accuracy: rate(results),
    byTag: Object.fromEntries(tags.map((tag) => [tag, rate(results.filter((r) => r.tag === tag))])),
    // 답하지 않아야 할 질문을 거절한 비율 · 답해야 할 질문을 잘못 거절한 비율
    refusedCorrectly: rate(refusing),
    wronglyRefused: answering.length
      ? Math.round(
          (answering.filter((r) => r.got?.tool === "unsupported").length / answering.length) * 1000,
        ) / 10
      : 0,
    rejectedByValidator: results.filter((r) => "rejectedByValidator" in r && r.rejectedByValidator)
      .length,
    errors: results.filter((r) => r.error).length,
    latencyMs: { p50: ms[Math.floor(ms.length / 2)], p95: ms[Math.floor(ms.length * 0.95)] },
    tokens: { input, output, perQuestion: Math.round((input + output) / results.length) },
    usdPer1000Questions:
      costPer1000 === null
        ? "ASK_PRICE_INPUT·ASK_PRICE_OUTPUT를 넘기면 계산"
        : Math.round(costPer1000 * 100) / 100,
  };

  console.table(
    results
      .filter((r) => !r.ok)
      .map((r) => ({
        q: r.q,
        tag: r.tag,
        expect: JSON.stringify(r.expect),
        got: JSON.stringify(r.got),
      })),
  );
  console.log(JSON.stringify(summary, null, 2));

  const dir = join(__dirname, "results");
  mkdirSync(dir, { recursive: true });
  const file = join(
    dir,
    `${config.provider}-${config.model.replace(/[^\w.-]/g, "_")}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
  );
  writeFileSync(file, JSON.stringify({ summary, results }, null, 2));
  console.log(`결과: ${file}`);
}

void main();
