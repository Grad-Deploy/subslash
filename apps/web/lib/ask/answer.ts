import {
  CATEGORY_LABELS,
  findBundleOverlaps,
  formatKRW,
  formatQuantity,
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
import type { AskCall } from "./tools";

/**
 * '리포트에 물어보기'의 답을 기기에서 만든다. AI가 고른 호출(`AskCall`)을 받아 이 기기의 기록으로 계산하고, 도구마다
 * 정해 둔 문장 틀에 넣는다. AI는 이 함수에 들어오는 기록도, 나가는 숫자도 보지 않는다.
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
}

/** 물어볼 수 있는 질문. 범위 밖 질문의 답과 화면의 질문 칩이 함께 쓴다. */
export const ASK_SUGGESTIONS = [
  "한 달에 구독비 얼마 나가?",
  "제일 아까운 구독 뭐야?",
  "OTT에 얼마 쓰고 있어?",
  "이번 주에 빠져나갈 돈 얼마야?",
  "겹치는 구독 있어?",
] as const;

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

/**
 * 이름 뒤에 붙일 조사. 마지막 글자의 받침으로 고른다("웨이브예요"·"넷플릭스는"·"광고형 스탠다드로"). 한글이 아니면
 * 받침을 알 수 없어 둘을 함께 적는다("ChatGPT Plus은(는)").
 */
export function josa(word: string, withFinal: string, withoutFinal: string): string {
  const code = word.trim().charCodeAt(word.trim().length - 1) - 0xac00;
  if (Number.isNaN(code) || code < 0 || code > 11171) return `${withFinal}(${withoutFinal})`;
  const final = code % 28;
  // '으로/로'는 ㄹ 받침 뒤에서도 '로'다.
  if (withoutFinal === "로" && final === 8) return "로";
  return final === 0 ? withoutFinal : withFinal;
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

function wonDate(date: Date): string {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function noSubscriptions(): AskAnswer {
  return answer(
    "아직 등록한 구독이 없어요.",
    "등록한 구독",
    [],
    ["구독을 등록하면 물어볼 수 있어요."],
  );
}

export function answerAsk(call: AskCall, ctx: AskContext): AskAnswer {
  const args = call.args ?? {};
  if (call.tool === "help") {
    return { ...answer("앱 사용법은 도움말에서 찾아 드릴게요.", "도움말"), goHelp: true };
  }
  if (call.tool === "unsupported") {
    return answer(
      "그건 답할 수 없는 질문이에요.",
      "물어볼 수 있는 것",
      [],
      [`이런 걸 물어볼 수 있어요: ${ASK_SUGGESTIONS.join(" / ")}`],
    );
  }

  const active = ctx.subscriptions.filter((sub) => sub.status === "active");
  const subs = paying(ctx);
  const trialCount = active.length - subs.length;
  const trialNote =
    trialCount > 0 ? [`무료 체험 중인 ${trialCount}개는 아직 돈이 나가지 않아 뺐어요.`] : [];

  switch (call.tool) {
    case "spendTotal": {
      if (active.length === 0) return noSubscriptions();
      const year = args.period === "year";
      const total = year ? sumMyAnnualKRW(subs, ctx.rate) : sumMyMonthlyKRW(subs, ctx.rate);
      return answer(
        `구독 ${subs.length}개에 ${year ? "1년" : "한 달"} ${formatKRW(total)}을 내요.`,
        year ? "내 몫 1년 합계" : "내 몫 한 달 합계",
        [],
        trialNote,
      );
    }

    case "spendByCategory": {
      if (active.length === 0) return noSubscriptions();
      const category = args.category as Subscription["category"];
      const label = CATEGORY_LABELS[category];
      const inCategory = subs.filter((sub) => sub.category === category);
      if (inCategory.length === 0) {
        return answer(
          `${label}${josa(label, "으로", "로")} 등록한 구독이 없어요.`,
          "분류별 내 몫 한 달 합계",
        );
      }
      const part = sumMyMonthlyKRW(inCategory, ctx.rate);
      const total = sumMyMonthlyKRW(subs, ctx.rate);
      const share = total > 0 ? Math.round((part / total) * 100) : 0;
      return answer(
        `${label} ${inCategory.length}개에 한 달 ${formatKRW(part)}을 내요. 전체 구독비의 ${share}%예요.`,
        "분류별 내 몫 한 달 합계",
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
        return answer(
          "1회 단가를 계산할 체크인이 없어요.",
          "리포트 1회 단가 순위",
          [],
          ["구독마다 최근 30일 동안 몇 번 썼는지 체크인하면 계산할 수 있어요."],
        );
      }
      const worst = args.order !== "best";
      const ordered = worst ? rows : [...rows].reverse();
      const limit = typeof args.limit === "number" ? args.limit : 3;
      const top = ordered.slice(0, limit);
      const per = (row: (typeof rows)[number]) =>
        row.usageCount === 0 ? "0회 (한 번도 안 씀)" : `1회 ${formatKRW(row.costPerUse ?? 0)}`;
      return answer(
        worst
          ? `가장 아까운 구독은 ${top[0].sub.name}${josa(top[0].sub.name, "이에요", "예요")}. ${per(top[0])}.`
          : `가성비가 가장 좋은 구독은 ${top[0].sub.name}${josa(top[0].sub.name, "이에요", "예요")}. ${per(top[0])}.`,
        "리포트의 1회 단가 순위(최근 30일 체크인)",
        top.map((row) => ({ label: row.sub.name, value: per(row) })),
        rows.length < subs.length
          ? ["체크인하지 않았거나 횟수로 재지 않는 구독은 순위에서 빠졌어요."]
          : [],
      );
    }

    case "lowUsage": {
      if (active.length === 0) return noSubscriptions();
      const red = subs.filter(
        (sub) => latestFreshLog(ctx.usageLogs, sub.id, ctx.now)?.riskLevel === "red",
      );
      const unknown = subs.filter((sub) => !latestFreshLog(ctx.usageLogs, sub.id, ctx.now)).length;
      const notes =
        unknown > 0 ? [`최근 30일 체크인이 없는 ${unknown}개는 쓰는지 몰라서 넣지 않았어요.`] : [];
      if (red.length === 0)
        return answer(
          "최근 체크인 기준으로 거의 안 쓰는 구독은 없어요.",
          "최근 30일 체크인 평가",
          [],
          notes,
        );
      return answer(
        `거의 안 쓰는 구독이 ${red.length}개 있어요.`,
        "최근 30일 체크인 평가",
        red.map((sub) => ({
          label: sub.name,
          value: `한 달 ${formatKRW(getMyMonthlyAmountKRW(sub, ctx.rate))}`,
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
      const notes = [
        ...trialNote,
        ...(unknown > 0
          ? [`결제 월을 모르는 연간 구독 ${unknown}개는 날짜를 몰라 넣지 않았어요.`]
          : []),
      ];
      if (due.length === 0)
        return answer(`${days}일 안에 결제되는 구독은 없어요.`, "다음 결제일", [], notes);
      return answer(
        `${days}일 안에 ${due.length}건이 결제돼요.`,
        "다음 결제일 · 한 번에 내는 내 몫",
        due.map(({ sub, next }) => ({
          label: `${wonDate(next as Date)} ${sub.name}`,
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
        return answer(
          `${days}일 안에 무료 체험이 끝나는 구독은 없어요.`,
          "체험 종료일",
          [],
          ["체험 종료일을 적은 구독만 알 수 있어요."],
        );
      }
      return answer(
        `${ending.length}개의 무료 체험이 ${days}일 안에 끝나요.`,
        "체험 종료일",
        ending.map(({ sub, left }) => ({
          label: sub.name,
          value: left === 0 ? "오늘 끝나요" : `${left}일 남음`,
        })),
      );
    }

    case "overlaps": {
      if (active.length === 0) return noSubscriptions();
      const bundle = findBundleOverlaps(active).map((item) => ({
        label: `${item.bundle.name} · ${item.other.name}`,
        value: `${item.serviceIds.map(serviceNameOf).join(", ")} 겹침`,
      }));
      const byCategory = new Map<string, Subscription[]>();
      for (const sub of subs)
        byCategory.set(sub.category, [...(byCategory.get(sub.category) ?? []), sub]);
      const crowded = [...byCategory.entries()]
        .filter(([category, list]) => list.length >= 2 && category !== "other")
        .map(([category, list]) => ({
          label: `${CATEGORY_LABELS[category as Subscription["category"]]} ${list.length}개`,
          value: list.map((sub) => sub.name).join(", "),
        }));
      if (bundle.length === 0 && crowded.length === 0)
        return answer("겹치는 구독은 없어요.", "결합 상품 구성 · 분류");
      return answer(
        bundle.length > 0
          ? "두 번 내고 있을 수 있는 구독이 있어요."
          : "같은 분류에 여러 개 구독하고 있어요.",
        "결합 상품 구성 · 분류",
        [...bundle, ...crowded],
        crowded.length > 0
          ? ["같은 분류라도 쓰임이 다를 수 있어요. 겹치는지는 직접 판단해 주세요."]
          : [],
      );
    }

    case "cheaperPlan":
    case "serviceDetail": {
      const matches = matchSubscriptions(String(args.service), active);
      if (matches.length === 0) {
        return answer(
          `'${args.service}'로 등록한 구독을 찾지 못했어요.`,
          "등록한 구독 이름",
          [],
          ["이름을 바꿔 물어보세요."],
        );
      }
      if (matches.length > 1) {
        return answer(
          `'${args.service}'에 맞는 구독이 ${matches.length}개예요. 이름을 더 정확히 적어 주세요.`,
          "등록한 구독 이름",
          matches.map((sub) => ({ label: sub.name, value: "" })),
        );
      }
      const sub = matches[0];
      if (call.tool === "cheaperPlan") {
        const plans = getPlanAlternatives(sub, ctx.usageLogs, ctx.now);
        if (plans.state === "none")
          return answer(
            `${sub.name}${josa(sub.name, "은", "는")} 비교할 요금제 목록이 없어요.`,
            "서비스 요금제 목록",
          );
        if (plans.state === "plan-unknown") {
          return answer(
            `${sub.name}의 지금 요금제를 몰라 비교할 수 없어요.`,
            "서비스 요금제 목록",
            [],
            ["구독 정보에서 요금제를 고르면 비교할 수 있어요."],
          );
        }
        if (plans.alternatives.length === 0)
          return answer(
            `${sub.name}${josa(sub.name, "은", "는")} 이미 가장 싼 요금제예요.`,
            "서비스 요금제 목록",
          );
        const best = plans.alternatives[0];
        return answer(
          `${best.planName}${josa(best.planName, "으로", "로")} 바꾸면 1년에 ${formatKRW(best.yearlySaving)} 덜 내요.`,
          "서비스 요금제 목록 · 요금표 가격",
          plans.alternatives.map((plan) => ({
            label: plan.planName,
            value: `1년 ${formatKRW(plan.yearlySaving)} 절약`,
          })),
          [
            `지금 요금제: ${plans.current.planName}`,
            ...(plans.shared
              ? ["나눠 내는 구독이라 금액은 카드에 찍히는 전체 요금 기준이에요."]
              : []),
          ],
        );
      }
      const next = getNextBillingDateFor(sub, ctx.now);
      const log = latestFreshLog(ctx.usageLogs, sub.id, ctx.now);
      return answer(
        `${sub.name}: 한 달 ${formatKRW(getMyMonthlyAmountKRW(sub, ctx.rate))}`,
        "구독 정보 · 체크인 기록",
        [
          {
            label: "다음 결제일",
            value: isInTrial(sub, ctx.now)
              ? "무료 체험 중"
              : next
                ? wonDate(next)
                : "결제 월 미설정",
          },
          {
            label: "최근 30일 체크인",
            value: log ? formatQuantity(metricOfLog(log), log.usageCount) : "기록 없음",
          },
        ],
      );
    }

    case "savedSoFar": {
      const killed = ctx.subscriptions.filter((sub) => sub.status === "killed");
      if (killed.length === 0) return answer("아직 해지한 구독이 없어요.", "해지 기록");
      const month = args.period === "month";
      const summary = month
        ? sumMyMonthDefendedKRW(killed, ctx.now.getFullYear(), ctx.now.getMonth() + 1, ctx.rate)
        : sumMyYearDefendedKRW(killed, ctx.now.getFullYear(), ctx.rate);
      return answer(
        `해지해서 ${month ? "이번 달" : "올해"} ${formatKRW(summary.amount)}을 지켰어요.`,
        month ? "이번 달 지킨 돈" : "올해 지킨 돈",
        [],
        summary.unknownCount > 0
          ? [`결제 월이나 해지 날을 몰라 ${summary.unknownCount}개는 넣지 못했어요.`]
          : [],
      );
    }

    case "compareLastMonth": {
      const from = startOfMonth(ctx.now).getTime();
      const inMonth = (iso?: string) =>
        !!iso && Date.parse(iso) >= from && Date.parse(iso) <= ctx.now.getTime();
      const added = subs.filter((sub) => inMonth(sub.createdAt));
      const removed = ctx.subscriptions.filter(
        (sub) => sub.status === "killed" && inMonth(sub.killedAt),
      );
      const notes = [
        "앱에는 달마다 쓴 돈의 기록이 없어, 이번 달에 등록·해지한 구독으로만 비교해요.",
      ];
      if (added.length === 0 && removed.length === 0) {
        return answer(
          "이번 달에 새로 등록하거나 해지한 구독이 없어요.",
          "등록일 · 해지일",
          [],
          notes,
        );
      }
      const plus = sumMyMonthlyKRW(added, ctx.rate);
      const minus = sumMyMonthlyKRW(removed, ctx.rate);
      const diff = plus - minus;
      return answer(
        diff === 0
          ? "이번 달에 바뀐 구독의 금액이 같아요."
          : `이번 달에 한 달 구독비가 ${formatKRW(Math.abs(diff))} ${diff > 0 ? "늘었어요" : "줄었어요"}.`,
        "이번 달 등록일 · 해지일 · 내 몫 한 달 금액",
        [
          ...removed.map((sub) => ({
            label: `해지 ${sub.name}`,
            value: `−${formatKRW(getMyMonthlyAmountKRW(sub, ctx.rate))}`,
          })),
          ...added.map((sub) => ({
            label: `등록 ${sub.name}`,
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
