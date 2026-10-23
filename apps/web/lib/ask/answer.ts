import {
  findBundleOverlaps,
  formatCurrency,
  formatKRW,
  getDaysUntilBillingFor,
  getDaysUntilTrialEnd,
  getMyAnnualAmountKRW,
  getMyMonthlyAmountKRW,
  getNextBillingDateFor,
  getPlanAlternatives,
  getSavingsTiers,
  isInTrial,
  metricOfLog,
  planCurrency,
  sumMyAnnualKRW,
  sumMyMonthlyKRW,
  type ServicePreset,
  type Subscription,
  type UsageLog,
} from "@subslash/shared";
import { buildValueRows } from "../../components/report/valueRows";
import { latestFreshLog } from "@lib/checkins";
import { planName, presetName, serviceIdName, subscriptionName } from "@lib/service-name";
import type { Locale } from "@lib/i18n/config";
import { describeQuantityText } from "@lib/i18n/check-in-text";
import type { Messages } from "@lib/i18n/messages";
import { splitServiceNames, type AskCall } from "./tools";
import { compactName } from "./fuzzy";
import { matchPresets, matchSubscriptions } from "./service-match";

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
  /**
   * 같은 것을 다른 기간으로 보는 버튼. 기간을 적지 않은 "해지해서 얼마 아꼈어?"를 이번 달로 답하고, 올해를 물은 것이었으면
   * 눌러 바꾸게 한다 — 기간을 짐작해 답했다는 것을 숨기지 않는다.
   */
  switchTo?: { label: string; call: AskCall };
}

export interface AskContext {
  subscriptions: Subscription[];
  usageLogs: UsageLog[];
  rate: number;
  now: Date;
  /** 지금 언어의 문구. 답 문장은 이 틀에 값을 넣어 만든다. */
  t: Messages;
  /** 지금 언어. 서비스·구독 이름을 이 언어로 쓴다(lib/service-name). 주지 않으면 한국어다. */
  locale?: Locale;
  /**
   * 사용자가 이 대화에서 적은 질문(지금 질문과 앞선 질문). AI가 고른 서비스 이름(`args.service`)은 이 안에 있을 때만
   * 답 문장에 그대로 쓴다 — 질문에 없던 말을 AI가 지어 넣게 꾀어 화면에 띄우는 길(시스템 프롬프트·욕설)을 막는다.
   * 이름 맞추기는 그대로 하므로 줄임말·다른 언어 이름도 찾는다. 추천 질문 버튼처럼 정해 둔 호출이면 주지 않는다.
   */
  asked?: readonly string[];
}

/** AI가 고른 서비스 이름이 사용자가 적은 말에 있는지. `asked`가 없으면(정해 둔 호출) 믿는다. */
function isAskedName(query: string, asked: readonly string[] | undefined): boolean {
  if (!asked) return true;
  const wanted = compactName(query);
  return wanted !== "" && asked.some((text) => compactName(text).includes(wanted));
}

/** 하루치를 묻는 말("하루에 구독비 얼마꼴이야?"). 한 달 합계에 하루치를 함께 적는다. */
const PER_DAY = /하루|일당|매일|per day|a day|daily/i;

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

export { matchSubscriptions };

function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function answerAsk(call: AskCall, ctx: AskContext): AskAnswer {
  const k = ctx.t.ask;
  const locale = ctx.locale ?? "ko";
  const nameOf = (sub: { name: string; cancelUrl?: string }) => subscriptionName(sub, locale);
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

  /**
   * 구독하지 않은 서비스의 요금. 서비스 목록에 확인해 둔 요금만 말하고, 확인하지 못한 서비스(`defaultAmount: null`이고
   * 요금제도 없음)는 모른다고 한다. 요금제가 여럿이면 하나를 고르지 않고 모두 보인다. 한국에서 확인한 값이라고 적는다.
   */
  /** 서비스 목록의 요금. 1년(`year`)이면 매달 내는 요금제는 한 달 요금 × 12로 보이고 그렇게 적는다. */
  const catalogAnswer = (preset: ServicePreset, year: boolean): AskAnswer => {
    const c = k.catalog;
    const name = presetName(preset, locale);
    const notes = (monthlyTimes12: boolean) => [
      ...(monthlyTimes12 ? [c.yearNote] : []),
      ...(preset.plansIncomplete ? [c.incomplete] : []),
      ...(preset.taxRate ? [c.tax(preset.taxRate)] : []),
      c.note,
    ];
    if (preset.plans && preset.plans.length > 0) {
      return answer(
        c.plans(name, preset.plans.length),
        c.source,
        preset.plans.map((plan) => {
          const yearly = plan.billingCycle === "yearly";
          const amount = year && !yearly ? plan.amount * 12 : plan.amount;
          const price = formatCurrency(amount, planCurrency(preset, plan));
          return {
            label: planName(plan.name, locale),
            value: yearly || year ? c.perYear(price) : c.perMonth(price),
          };
        }),
        notes(year && preset.plans.some((plan) => plan.billingCycle !== "yearly")),
      );
    }
    if (preset.defaultAmount === null) return answer(c.unknown(name), c.source);
    if (year) {
      return answer(
        c.yearly(name, formatCurrency(preset.defaultAmount * 12, preset.currency)),
        c.source,
        [],
        notes(true),
      );
    }
    return answer(
      c.monthly(name, formatCurrency(preset.defaultAmount, preset.currency)),
      c.source,
      [],
      notes(false),
    );
  };

  switch (call.tool) {
    case "spendTotal": {
      if (active.length === 0) return noSubscriptions();
      const year = args.period === "year";
      const total = year ? sumMyAnnualKRW(subs, ctx.rate) : sumMyMonthlyKRW(subs, ctx.rate);
      // "하루에 구독비 얼마꼴이야?"에 한 달 합계만 말하면 묻는 기간과 다른 숫자다. 하루치를 함께 적는다.
      const perDay = !year && PER_DAY.test(ctx.asked?.[0] ?? "");
      return answer(
        year
          ? k.spend.year(subs.length, formatKRW(total))
          : k.spend.month(subs.length, formatKRW(total)),
        year ? k.spend.sourceYear : k.spend.sourceMonth,
        [],
        [...(perDay ? [k.spend.perDay(formatKRW(Math.round(total / 30)))] : []), ...trialNote],
      );
    }

    case "serviceSum": {
      // 이름을 댄 서비스만 더한다("넷플이랑 티빙 합쳐서 얼마"). 예전에는 OTT 전체(쿠팡 와우·유튜브까지)를 더했다.
      // 이름이 여러 구독에 맞으면 하나를 골라 더하지 않고, 구독하지 않는 이름은 빼고 그렇게 적는다.
      if (active.length === 0) return noSubscriptions();
      const sm = k.sum;
      const year = args.period === "year";
      const names = splitServiceNames(String(args.services)).filter((name) =>
        isAskedName(name, ctx.asked),
      );
      if (names.length === 0) return answerAsk({ tool: "unsupported" }, ctx);
      const counted = new Map<string, Subscription>();
      const notSubscribed: string[] = [];
      const ambiguous: string[] = [];
      for (const name of names) {
        const matches = matchSubscriptions(name, active);
        if (matches.length === 0) notSubscribed.push(name);
        else if (matches.length > 1) ambiguous.push(sm.many(name, matches.length));
        else counted.set(matches[0].id, matches[0]);
      }
      const found = [...counted.values()];
      const payingNow = found.filter((sub) => !isInTrial(sub, ctx.now));
      const trials = found.length - payingNow.length;
      const notes = [
        ...(notSubscribed.length > 0 ? [sm.notSubscribed(notSubscribed.join(sm.join))] : []),
        ...ambiguous,
        ...(trials > 0 ? [k.trialNote(trials)] : []),
      ];
      if (payingNow.length === 0) return answer(sm.none, sm.source, [], notes);
      const total = year
        ? sumMyAnnualKRW(payingNow, ctx.rate)
        : sumMyMonthlyKRW(payingNow, ctx.rate);
      const amountOf = year ? getMyAnnualAmountKRW : getMyMonthlyAmountKRW;
      const label = payingNow.map(nameOf).join(sm.join);
      return {
        ...answer(
          year ? sm.year(label, formatKRW(total)) : sm.month(label, formatKRW(total)),
          sm.source,
          payingNow.map((sub) => ({
            label: nameOf(sub),
            value: formatKRW(amountOf(sub, ctx.rate)),
          })),
          notes,
        ),
        switchTo: {
          label: year ? k.service.switchMonth : k.service.switchYear,
          call: {
            tool: "serviceSum",
            args: year
              ? { services: String(args.services) }
              : { services: String(args.services), period: "year" },
          },
        },
      };
    }

    case "spendByCategory": {
      if (active.length === 0) return noSubscriptions();
      const category = args.category as Subscription["category"];
      const label = ctx.t.value.category[category];
      const inCategory = subs.filter((sub) => sub.category === category);
      if (inCategory.length === 0) {
        return answer(k.category.none(label), k.category.source);
      }
      const year = args.period === "year";
      const sum = year ? sumMyAnnualKRW : sumMyMonthlyKRW;
      const amountOf = year ? getMyAnnualAmountKRW : getMyMonthlyAmountKRW;
      const part = sum(inCategory, ctx.rate);
      const total = sum(subs, ctx.rate);
      const share = total > 0 ? Math.round((part / total) * 100) : 0;
      return answer(
        (year ? k.category.someYear : k.category.some)(
          label,
          inCategory.length,
          formatKRW(part),
          share,
        ),
        year ? k.category.sourceYear : k.category.source,
        inCategory
          .map((sub) => ({ sub, amount: amountOf(sub, ctx.rate) }))
          .sort((a, b) => b.amount - a.amount)
          .map(({ sub, amount }) => ({ label: nameOf(sub), value: formatKRW(amount) })),
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
          ? k.rank.worst(nameOf(top[0].sub), per(top[0]))
          : k.rank.best(nameOf(top[0].sub), per(top[0])),
        k.rank.source,
        top.map((row) => ({ label: nameOf(row.sub), value: per(row) })),
        rows.length < subs.length ? [k.rank.skipped] : [],
      );
    }

    case "priceRank": {
      // 쓴 만큼이 아니라 요금 순위다("제일 비싼 구독"). 금액은 지출 합계와 같은 내 몫 한 달치다.
      if (active.length === 0) return noSubscriptions();
      if (subs.length === 0) return answer(k.price.none, k.price.source, [], trialNote);
      const high = args.order !== "low";
      const ranked = subs
        .map((sub) => ({ sub, amount: getMyMonthlyAmountKRW(sub, ctx.rate) }))
        .sort((a, b) => (high ? b.amount - a.amount : a.amount - b.amount));
      const limit = typeof args.limit === "number" ? args.limit : 3;
      const top = ranked.slice(0, limit);
      const first = top[0];
      return answer(
        (high ? k.price.high : k.price.low)(nameOf(first.sub), formatKRW(first.amount)),
        k.price.source,
        top.map(({ sub, amount }) => ({ label: nameOf(sub), value: formatKRW(amount) })),
        [
          ...(top.some(({ sub }) => sub.billingCycle === "yearly") ? [k.price.yearlyNote] : []),
          ...trialNote,
        ],
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
      // "안 쓰는 구독에 얼마 나가?"에 구독마다의 금액만 늘어놓지 않고 합계를 함께 말한다.
      return answer(
        `${k.low.some(red.length)} ${k.low.total(formatKRW(sumMyMonthlyKRW(red, ctx.rate)))}`,
        k.low.source,
        red.map((sub) => ({
          label: nameOf(sub),
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
          label: k.upcoming.row(dateText(next as Date), nameOf(sub)),
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
          label: nameOf(sub),
          value: left === 0 ? k.trials.today : k.trials.left(left ?? 0),
        })),
      );
    }

    case "overlaps": {
      if (active.length === 0) return noSubscriptions();
      const bundle = findBundleOverlaps(active).map((item) => ({
        label: `${nameOf(item.bundle)} · ${nameOf(item.other)}`,
        value: k.overlaps.bundleValue(
          item.serviceIds.map((id) => serviceIdName(id, locale)).join(", "),
        ),
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
          value: list.map((sub) => nameOf(sub)).join(", "),
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
      // 서비스 하나의 1년 요금("유튜브 프리미엄 1년 얼마야?"). 기간을 바꿔 보는 버튼을 함께 둔다.
      const year = call.tool === "serviceDetail" && args.period === "year";
      const switchPeriod: AskAnswer["switchTo"] = {
        label: year ? s.switchMonth : s.switchYear,
        call: {
          tool: "serviceDetail",
          args: year ? { service: query } : { service: query, period: "year" },
        },
      };
      const matches = matchSubscriptions(query, active);
      const asked = isAskedName(query, ctx.asked);
      if (matches.length === 0) {
        // 구독하지 않은 서비스면 서비스 목록의 확인한 요금으로 답한다("디즈니플러스 얼마야?").
        const presets = matchPresets(query);
        if (presets.length === 1) {
          const listed = catalogAnswer(presets[0], year);
          return call.tool === "serviceDetail" ? { ...listed, switchTo: switchPeriod } : listed;
        }
        if (presets.length > 1 && asked) {
          return answer(
            k.catalog.many(query, presets.length),
            k.catalog.source,
            presets.map((preset) => ({ label: presetName(preset, locale), value: "" })),
          );
        }
        // 질문에 없던 이름을 찾지 못했으면 AI가 질문을 엉뚱하게 읽은 것이다 — 그 이름을 띄우지 않고 못 알아들었다고 한다.
        if (!asked) return answerAsk({ tool: "unsupported" }, ctx);
        return answer(s.notFound(query), s.source, [], [s.notFoundNote]);
      }
      if (matches.length > 1) {
        return answer(
          asked ? s.many(query, matches.length) : s.manyUnnamed(matches.length),
          s.source,
          matches.map((sub) => ({ label: nameOf(sub), value: "" })),
        );
      }
      const sub = matches[0];
      if (call.tool === "cheaperPlan") {
        const plans = getPlanAlternatives(sub, ctx.usageLogs, ctx.now);
        if (plans.state === "none") return answer(s.noPlans(nameOf(sub)), s.plansSource);
        if (plans.state === "plan-unknown") {
          return answer(s.planUnknown(nameOf(sub)), s.plansSource, [], [s.planUnknownNote]);
        }
        if (plans.alternatives.length === 0) return answer(s.cheapest(nameOf(sub)), s.plansSource);
        const best = plans.alternatives[0];
        return answer(
          s.best(planName(best.planName, locale), formatKRW(best.yearlySaving)),
          s.bestSource,
          plans.alternatives.map((plan) => ({
            label: planName(plan.planName, locale),
            value: s.saving(formatKRW(plan.yearlySaving)),
          })),
          [
            s.current(planName(plans.current.planName, locale)),
            ...(plans.shared ? [s.shared] : []),
          ],
        );
      }
      const next = getNextBillingDateFor(sub, ctx.now);
      const log = latestFreshLog(ctx.usageLogs, sub.id, ctx.now);
      const detailAnswer = answer(
        year
          ? s.detailYear(nameOf(sub), formatKRW(getMyAnnualAmountKRW(sub, ctx.rate)))
          : s.detail(nameOf(sub), formatKRW(getMyMonthlyAmountKRW(sub, ctx.rate))),
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
      return { ...detailAnswer, switchTo: switchPeriod };
    }

    case "savedSoFar": {
      const sv = k.saved;
      const killed = ctx.subscriptions.filter((sub) => sub.status === "killed");
      if (killed.length === 0) return answer(sv.none, sv.source);
      // 절약 현황·대시보드의 '해지로 지킨 돈'과 같은 함수로 센다. 예전에는 올해의 남은 결제일과 결제가 멈췄는지 확인하지
      // 않은 해지까지 더해, "올해 ₩71,100을 지켰어요"라고 말하는 옆 화면이 "지금까지 지킨 돈 ₩39,500"이었다.
      const period = args.period === "year" || args.period === "all" ? args.period : "month";
      const now = ctx.now;
      const from =
        period === "month"
          ? new Date(now.getFullYear(), now.getMonth(), 1)
          : period === "year"
            ? new Date(now.getFullYear(), 0, 1)
            : undefined;
      const tiers = getSavingsTiers(killed, now, ctx.rate, { from, to: now });
      const amount = formatKRW(tiers.confirmed);
      const notes = [
        ...(tiers.pending > 0 ? [sv.pending(formatKRW(tiers.pending), tiers.pendingCount)] : []),
        ...(tiers.unknownCount > 0 ? [sv.unknown(tiers.unknownCount)] : []),
      ];
      const next = period === "month" ? "year" : period === "year" ? "all" : "month";
      return {
        ...answer(
          period === "month"
            ? sv.month(amount)
            : period === "year"
              ? sv.year(amount)
              : sv.all(amount),
          period === "month" ? sv.sourceMonth : period === "year" ? sv.sourceYear : sv.sourceAll,
          [],
          notes,
        ),
        switchTo: {
          label: next === "year" ? sv.switchYear : next === "all" ? sv.switchAll : sv.switchMonth,
          call: { tool: "savedSoFar", args: { period: next } },
        },
      };
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
            label: c.killed(nameOf(sub)),
            value: `−${formatKRW(getMyMonthlyAmountKRW(sub, ctx.rate))}`,
          })),
          ...added.map((sub) => ({
            label: c.added(nameOf(sub)),
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
