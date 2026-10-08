import {
  findBundleOverlaps,
  formatKRW,
  getDaysUntilBillingFor,
  getDaysUntilTrialEnd,
  getMyMonthlyAmountKRW,
  getNextBillingDateFor,
  getPlanAlternatives,
  isInTrial,
  metricOfLog,
  serviceNameOf,
  sumMyAnnualKRW,
  sumMyMonthDefendedKRW,
  sumMyMonthlyKRW,
  sumMyYearDefendedKRW,
  type Subscription,
  type UsageLog,
} from "@subslash/shared";
import { buildValueRows } from "../../components/report/valueRows";
import { latestFreshLog } from "@lib/stats";
import { describeQuantityText } from "@lib/i18n/check-in-text";
import type { Messages } from "@lib/i18n/messages";
import type { AskCall } from "./tools";

export { josa } from "./josa";

/**
 * '리포트에 물어보기'의 답을 기기에서 만든다. AI가 고른 호출(`AskCall`)을 받아 이 기기의 기록으로 계산하고, 도구마다
 * 정해 둔 문장 틀(`messages/ask`)에 넣는다. AI는 이 함수에 들어오는 기록도, 나가는 숫자도 보지 않는다.
 *
 * 숫자는 화면의 다른 칸과 같은 함수로 계산한다(지출은 `sumMyMonthlyKRW`, 1회 단가 순위는 리포트의 `buildValueRows`) —
 * 같은 질문에 리포트 칸과 다른 숫자가 나오면 어느 쪽도 믿을 수 없다. 모르는 것은 모른다고 쓴다.
 */
export interface AskAnswer {
  /** 굵게 보이는 한 줄. */
  headline: string;
  /** 표로 보일 줄. 없을 수 있다. */
  rows: { label: string; value: string }[];
  /** 덧붙이는 설명(모르는 것·빠진 것). */
  notes: string[];
  /** 무엇으로 계산했는지. 답 아래에 작게 보인다. */
  source: string;
  /** 도움말로 넘겨야 하는 질문. */
  goHelp?: boolean;
}

export interface AskContext {
  subscriptions: Subscription[];
  usageLogs: UsageLog[];
  rate: number;
  now: Date;
  /** 지금 언어의 문구. 답 문장은 이 틀에 값을 넣어 만든다. */
  t: Messages;
}

function answer(
  headline: string,
  source: string,
  rows: AskAnswer["rows"] = [],
  notes: string[] = [],
): AskAnswer {
  return { headline, rows, notes, source };
}

/** 카드에서 지금 돈이 나가는 구독. 무료 체험 중인 구독은 뺀다(CLAUDE.md '데이터 위치'). */
function paying(ctx: AskContext): Subscription[] {
  return ctx.subscriptions.filter((sub) => sub.status === "active" && !isInTrial(sub, ctx.now));
}

const normalize = (text: string) => text.toLowerCase().replace(/[\s·.\-_]/g, "");

/**
 * 사용자가 적은 서비스 이름("넷플", "쿠팡와우")을 이 기기의 구독과 맞춘다. 구독 이름이 적은 말을 품거나 그 반대면 같다고
 * 본다. 둘 이상 맞으면 모두 돌려준다 — 하나를 골라 답하면 다른 구독의 숫자를 그 서비스의 것처럼 말하게 된다.
 */
export function matchSubscriptions(query: string, subscriptions: Subscription[]): Subscription[] {
  const wanted = normalize(query);
  if (wanted.length < 2) return [];
  return subscriptions.filter((sub) => {
    const name = normalize(sub.name);
    return name.includes(wanted) || wanted.includes(name);
  });
}

function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function answerAsk(call: AskCall, ctx: AskContext): AskAnswer {
  const k = ctx.t.ask;
  const args = call.args ?? {};
  const noSubscriptions = () => answer(k.noSubs.headline, k.noSubs.source, [], [k.noSubs.note]);
  const dateText = (date: Date) => k.upcoming.date(date.getMonth() + 1, date.getDate());
  if (call.tool === "help") {
    return { ...answer(k.help.headline, k.help.source), goHelp: true };
  }
  if (call.tool === "unsupported") {
    return answer(
      k.unsupported.headline,
      k.unsupported.source,
      [],
      [k.unsupported.note(k.suggestions.join(" / "))],
    );
  }

  const active = ctx.subscriptions.filter((sub) => sub.status === "active");
  const subs = paying(ctx);
  const trialCount = active.length - subs.length;
  const trialNote = trialCount > 0 ? [k.trialNote(trialCount)] : [];

  switch (call.tool) {
    case "spendTotal": {
      if (active.length === 0) return noSubscriptions();
      const year = args.period === "year";
      const total = year ? sumMyAnnualKRW(subs, ctx.rate) : sumMyMonthlyKRW(subs, ctx.rate);
      return answer(
        year
          ? k.spend.year(subs.length, formatKRW(total))
          : k.spend.month(subs.length, formatKRW(total)),
        year ? k.spend.sourceYear : k.spend.sourceMonth,
        [],
        trialNote,
      );
    }

    case "spendByCategory": {
      if (active.length === 0) return noSubscriptions();
      const category = args.category as Subscription["category"];
      const label = ctx.t.value.category[category];
      const inCategory = subs.filter((sub) => sub.category === category);
      if (inCategory.length === 0) {
        return answer(k.category.none(label), k.category.source);
      }
      const part = sumMyMonthlyKRW(inCategory, ctx.rate);
      const total = sumMyMonthlyKRW(subs, ctx.rate);
      const share = total > 0 ? Math.round((part / total) * 100) : 0;
      return answer(
        k.category.some(label, inCategory.length, formatKRW(part), share),
        k.category.source,
        inCategory
          .map((sub) => ({ sub, monthly: getMyMonthlyAmountKRW(sub, ctx.rate) }))
          .sort((a, b) => b.monthly - a.monthly)
          .map(({ sub, monthly }) => ({ label: sub.name, value: formatKRW(monthly) })),
        trialNote,
      );
    }

    case "costPerUseRank": {
      const rows = buildValueRows(subs, ctx.usageLogs, ctx.rate, ctx.now).filter(
        (row) => row.usageCount !== null,
      );
      if (rows.length === 0) {
        return answer(k.rank.none, k.rank.sourceNone, [], [k.rank.noneNote]);
      }
      const worst = args.order !== "best";
      const ordered = worst ? rows : [...rows].reverse();
      const limit = typeof args.limit === "number" ? args.limit : 3;
      const top = ordered.slice(0, limit);
      const per = (row: (typeof rows)[number]) =>
        row.usageCount === 0 ? k.rank.perZero : k.rank.perUse(formatKRW(row.costPerUse ?? 0));
      return answer(
        worst
          ? k.rank.worst(top[0].sub.name, per(top[0]))
          : k.rank.best(top[0].sub.name, per(top[0])),
        k.rank.source,
        top.map((row) => ({ label: row.sub.name, value: per(row) })),
        rows.length < subs.length ? [k.rank.skipped] : [],
      );
    }

    case "lowUsage": {
      if (active.length === 0) return noSubscriptions();
      const red = subs.filter(
        (sub) => latestFreshLog(ctx.usageLogs, sub.id, ctx.now)?.riskLevel === "red",
      );
      const unknown = subs.filter((sub) => !latestFreshLog(ctx.usageLogs, sub.id, ctx.now)).length;
      const notes = unknown > 0 ? [k.low.unknown(unknown)] : [];
      if (red.length === 0) return answer(k.low.none, k.low.source, [], notes);
      return answer(
        k.low.some(red.length),
        k.low.source,
        red.map((sub) => ({
          label: sub.name,
          value: k.low.monthly(formatKRW(getMyMonthlyAmountKRW(sub, ctx.rate))),
        })),
        notes,
      );
    }

    case "upcomingCharges": {
      if (active.length === 0) return noSubscriptions();
      const days = Number(args.days);
      const due = subs
        .map((sub) => ({
          sub,
          left: getDaysUntilBillingFor(sub, ctx.now),
          next: getNextBillingDateFor(sub, ctx.now),
        }))
        .filter((item) => item.left !== null && item.next !== null && item.left <= days)
        .sort((a, b) => (a.left ?? 0) - (b.left ?? 0));
      const unknown = subs.filter((sub) => getDaysUntilBillingFor(sub, ctx.now) === null).length;
      const notes = [...trialNote, ...(unknown > 0 ? [k.upcoming.unknown(unknown)] : [])];
      if (due.length === 0) return answer(k.upcoming.none(days), k.upcoming.sourceNone, [], notes);
      return answer(
        k.upcoming.some(days, due.length),
        k.upcoming.source,
        due.map(({ sub, next }) => ({
          label: k.upcoming.row(dateText(next as Date), sub.name),
          value: formatKRW(
            getMyMonthlyAmountKRW(sub, ctx.rate) * (sub.billingCycle === "yearly" ? 12 : 1),
          ),
        })),
        notes,
      );
    }

    case "trialsEnding": {
      const days = Number(args.days);
      const ending = active
        .map((sub) => ({ sub, left: getDaysUntilTrialEnd(sub, ctx.now) }))
        .filter((item) => item.left !== null && item.left <= days)
        .sort((a, b) => (a.left ?? 0) - (b.left ?? 0));
      if (ending.length === 0) {
        return answer(k.trials.none(days), k.trials.source, [], [k.trials.noneNote]);
      }
      return answer(
        k.trials.some(ending.length, days),
        k.trials.source,
        ending.map(({ sub, left }) => ({
          label: sub.name,
          value: left === 0 ? k.trials.today : k.trials.left(left ?? 0),
        })),
      );
    }

    case "overlaps": {
      if (active.length === 0) return noSubscriptions();
      const bundle = findBundleOverlaps(active).map((item) => ({
        label: `${item.bundle.name} · ${item.other.name}`,
        value: k.overlaps.bundleValue(item.serviceIds.map(serviceNameOf).join(", ")),
      }));
      const byCategory = new Map<string, Subscription[]>();
      for (const sub of subs)
        byCategory.set(sub.category, [...(byCategory.get(sub.category) ?? []), sub]);
      const crowded = [...byCategory.entries()]
        .filter(([category, list]) => list.length >= 2 && category !== "other")
        .map(([category, list]) => ({
          label: k.overlaps.crowdedLabel(
            ctx.t.value.category[category as Subscription["category"]],
            list.length,
          ),
          value: list.map((sub) => sub.name).join(", "),
        }));
      if (bundle.length === 0 && crowded.length === 0)
        return answer(k.overlaps.none, k.overlaps.source);
      return answer(
        bundle.length > 0 ? k.overlaps.bundleHead : k.overlaps.crowdedHead,
        k.overlaps.source,
        [...bundle, ...crowded],
        crowded.length > 0 ? [k.overlaps.note] : [],
      );
    }

    case "cheaperPlan":
    case "serviceDetail": {
      const s = k.service;
      const query = String(args.service);
      const matches = matchSubscriptions(query, active);
      if (matches.length === 0) {
        return answer(s.notFound(query), s.source, [], [s.notFoundNote]);
      }
      if (matches.length > 1) {
        return answer(
          s.many(query, matches.length),
          s.source,
          matches.map((sub) => ({ label: sub.name, value: "" })),
        );
      }
      const sub = matches[0];
      if (call.tool === "cheaperPlan") {
        const plans = getPlanAlternatives(sub, ctx.usageLogs, ctx.now);
        if (plans.state === "none") return answer(s.noPlans(sub.name), s.plansSource);
        if (plans.state === "plan-unknown") {
          return answer(s.planUnknown(sub.name), s.plansSource, [], [s.planUnknownNote]);
        }
        if (plans.alternatives.length === 0) return answer(s.cheapest(sub.name), s.plansSource);
        const best = plans.alternatives[0];
        return answer(
          s.best(best.planName, formatKRW(best.yearlySaving)),
          s.bestSource,
          plans.alternatives.map((plan) => ({
            label: plan.planName,
            value: s.saving(formatKRW(plan.yearlySaving)),
          })),
          [s.current(plans.current.planName), ...(plans.shared ? [s.shared] : [])],
        );
      }
      const next = getNextBillingDateFor(sub, ctx.now);
      const log = latestFreshLog(ctx.usageLogs, sub.id, ctx.now);
      return answer(
        s.detail(sub.name, formatKRW(getMyMonthlyAmountKRW(sub, ctx.rate))),
        s.detailSource,
        [
          {
            label: s.nextBilling,
            value: isInTrial(sub, ctx.now) ? s.inTrial : next ? dateText(next) : s.unset,
          },
          {
            label: s.checkIn,
            value: log ? describeQuantityText(ctx.t, metricOfLog(log), log.usageCount) : s.noRecord,
          },
        ],
      );
    }

    case "savedSoFar": {
      const sv = k.saved;
      const killed = ctx.subscriptions.filter((sub) => sub.status === "killed");
      if (killed.length === 0) return answer(sv.none, sv.source);
      const month = args.period === "month";
      const summary = month
        ? sumMyMonthDefendedKRW(killed, ctx.now.getFullYear(), ctx.now.getMonth() + 1, ctx.rate)
        : sumMyYearDefendedKRW(killed, ctx.now.getFullYear(), ctx.rate);
      return answer(
        month ? sv.month(formatKRW(summary.amount)) : sv.year(formatKRW(summary.amount)),
        month ? sv.sourceMonth : sv.sourceYear,
        [],
        summary.unknownCount > 0 ? [sv.unknown(summary.unknownCount)] : [],
      );
    }

    case "compareLastMonth": {
      const c = k.compare;
      const from = startOfMonth(ctx.now).getTime();
      const inMonth = (iso?: string) =>
        !!iso && Date.parse(iso) >= from && Date.parse(iso) <= ctx.now.getTime();
      const added = subs.filter((sub) => inMonth(sub.createdAt));
      // 이번 달에 등록하고 이번 달에 해지한 구독은 지난달에도 없던 것이라 비교에서 뺀다. 넣으면 늘지 않은 돈이
      // '줄었어요'로 나왔다.
      const removed = ctx.subscriptions.filter(
        (sub) => sub.status === "killed" && inMonth(sub.killedAt) && !inMonth(sub.createdAt),
      );
      const notes = [c.note];
      if (added.length === 0 && removed.length === 0) {
        return answer(c.none, c.noneSource, [], notes);
      }
      const plus = sumMyMonthlyKRW(added, ctx.rate);
      const minus = sumMyMonthlyKRW(removed, ctx.rate);
      const diff = plus - minus;
      return answer(
        diff === 0
          ? c.same
          : diff > 0
            ? c.up(formatKRW(Math.abs(diff)))
            : c.down(formatKRW(Math.abs(diff))),
        c.source,
        [
          ...removed.map((sub) => ({
            label: c.killed(sub.name),
            value: `−${formatKRW(getMyMonthlyAmountKRW(sub, ctx.rate))}`,
          })),
          ...added.map((sub) => ({
            label: c.added(sub.name),
            value: `+${formatKRW(getMyMonthlyAmountKRW(sub, ctx.rate))}`,
          })),
        ],
        notes,
      );
    }
  }
  // 도구를 더하고 여기를 빠뜨리면 타입 검사가 잡는다.
  const unreachable: never = call.tool;
  throw new Error(`answerAsk: 처리하지 않은 도구 ${String(unreachable)}`);
}
