import type { Widen } from "../types";
import { MONTHS_SHORT, pluralOf } from "../english";
import { monthName } from "../months";

const monthShort = (month: number) => MONTHS_SHORT[Number(month) - 1] ?? String(month);

/** 한국어로 읽는 원화: '30만 원', '12만 3,400원'. */
function koWon(raw: number): string {
  const value = Number(raw);
  const man = Math.floor(value / 10_000);
  const rest = value % 10_000;
  if (man === 0) return `${rest.toLocaleString("ko-KR")}원`;
  return rest === 0
    ? `${man.toLocaleString("ko-KR")}만 원`
    : `${man.toLocaleString("ko-KR")}만 ${rest.toLocaleString("ko-KR")}원`;
}

/**
 * 절약 현황(/savings)·올해 결산(/savings/review)·공유 카드. 공유 카드는 받는 사람의 기기 언어로 보인다.
 * 서비스 이름과 금액은 부르는 쪽이 만들어 넘긴다.
 */
export const ko = {
  savings: {
    page: {
      title: "절약 & 방어 자산 현황",
      subtitle: "해지로 아끼는 돈과 실제로 지킨 돈이에요.",
      reviewLink: "올해 구독 결산 보기 →",
      emptyTitle: "아직 해지한 구독이 없어요",
      emptyHint: "대시보드에서 잘 안 쓰는 구독을 해지해 보세요.",
      goDashboard: "대시보드로 가기 →",
      rewardsTitle: "1년 동안 아끼면 누릴 수 있는 보상",
      rewardsEmpty: "연간 ₩5,000부터 보여요.",
      rewardOf: (name: string) => `${name} 환산`,
      killedTitle: (count: number) => `해지한 구독 목록 (${count})`,
      share: "결과 공유하기",
      copied: "복사했어요",
      annualSaving: (amount: string) => `연 ${amount} 아끼는 중`,
      monthlyBilled: (monthly: string) => `(월 ${monthly})`,
      perMonth: (amount: string) => `월 ${amount}`,
      revive: "다시 살리기",
    },
    rewardNames: {
      latte: "카페 라떼",
      chicken: "맛있는 치킨",
      dinner: "고급 레스토랑 저녁",
      trip: "가까운 해외 여행",
    },
    share: {
      title: "SubSlash 구독 디톡스 결과",
      confirmedLine: (confirmed: string, annual: string) =>
        `구독을 해지해 ${confirmed}을 지켰고, 해지를 유지하면 1년에 ${annual}을 아낍니다!`,
      plannedLine: (annual: string) => `구독을 해지해 1년에 ${annual}을 아낄 예정입니다!`,
      text: (level: string, line: string, headline: string, url: string) =>
        `SubSlash 구독 디톡스 ${level}\n${line} ${headline}\n결과 보기: ${url}`,
    },
    detox: {
      label: "구독 디톡스 레벨",
      saved: "지킨 돈",
      max: "최고 레벨입니다. 더 지킬 구독이 남아있는지 점검해보세요.",
      next: (amount: string, title: string, level: number) =>
        `${amount}을 더 지키면 ${title}(Lv.${level})로 올라갑니다.`,
    },
    killCheck: {
      verified: "해지 후 결제가 멈춘 것을 확인했습니다",
      due: (date: string) => `${date}에 결제가 됐는지 아직 확인하지 않았습니다 · `,
      dueLink: "대시보드에서 답하기",
      waiting: (date: string) => `해지 후 첫 결제일(${date})이 지나면 결제가 멈췄는지 확인합니다`,
      unknown: "해지 날짜나 결제 월을 몰라, 결제가 멈췄는지 확인할 날짜를 정할 수 없습니다",
    },
    basis: {
      title: "레벨 기준이 바뀌었습니다",
      close: "닫기",
      body: "해지만 해도 오르던 1년치 요금 대신, 결제가 멈춘 것을 확인한 ‘지킨 돈’으로 레벨을 정합니다.",
      change: (before: string, now: string) => `예전 기준: ${before} → 지금: ${now}`,
      answer: "해지 뒤 결제일이 지날 때마다 결제가 멈췄는지 답하면 레벨이 다시 오릅니다. ",
      answerLink: "대시보드에서 답하기 →",
    },
    killedCard: { services: (count: number) => `${count}개 서비스` },
    defense: {
      title: (year: number) => `${year}년 월별 방어액`,
      intro:
        "해지 뒤 결제일마다 빠져나가지 않았을 금액입니다. 결제가 실제로 멈췄는지 확인하기 전 금액도 들어 있고, 확인된 금액은 맨 위 ‘지킨 돈’에 있습니다.",
      past: (currentMonth: number) =>
        currentMonth === 1 ? "1월에 막은 결제" : `1~${currentMonth}월에 막은 결제`,
      future: (currentMonth: number) =>
        currentMonth < 12 ? `${currentMonth + 1}~12월에 지킬 예정` : "남은 달 없음",
      empty:
        "올해는 해지한 구독의 결제일이 아직 한 번도 돌아오지 않았습니다. 결제일이 지나면 그 달에 방어액이 쌓입니다.",
      blocked: "막은 결제",
      scheduled: "예정 (해지하지 않았다면 나갔을 금액)",
      month: (month: number) => `${month}월`,
      barLabel: (month: number, amount: string, future: boolean) =>
        `${month}월 ${amount} ${future ? "예정" : "막음"}`,
      activeScheduled: "예정 — 해지하지 않았다면 나갔을 금액",
      activeNow: "이번 달 막은 결제",
      activePast: "막은 결제",
      table: "표로 보기",
      colMonth: "월",
      colAmount: "금액",
      colKind: "구분",
      kindScheduled: "예정",
      kindBlocked: "막음",
      unknown: (count: number) =>
        `결제 월을 모르는 연간 구독 ${count}건은 어느 달에 결제되는지 알 수 없어 그래프에서 빠졌습니다. 구독 상세에서 결제 월을 지정하면 반영됩니다.`,
    },
    breakdown: {
      title: "서비스별 절약 기여도",
      subtitle: "어떤 구독을 끊었을 때 가장 많은 돈이 지켜졌는지 확인해보세요.",
      annual: "연간 환산 기준",
      yearEnd: (year: number) => `${year}년 연말까지`,
      unset: "결제 월 미설정",
      yearEndNote:
        "남은 달의 결제일까지 더한 금액입니다. 지금까지 지킨 금액과 남은 예정은 월별 방어액 그래프에서 나눠 볼 수 있습니다.",
      yearEndUnknown: (count: number) =>
        `결제 월을 모르는 연간 구독 ${count}건은 올해 결제가 해지 전이었는지 알 수 없어 합계에서 빠졌습니다. 구독 상세에서 결제 월을 지정하면 반영됩니다.`,
      top: (name: string, percent: number) =>
        `${name} 해지가 전체 절약의 ${percent}%를 차지합니다.`,
      total: (amount: string) => `합계 ${amount}`,
    },
    review: {
      back: "← 절약 현황",
      prevYear: (year: number) => `${year}년 결산`,
      thisYear: "올해 결산",
      title: (year: number) => `${year}년 구독 결산`,
      completeNote: (year: number) => `${year}년 한 해 동안의 기록입니다.`,
      partialNote: (month: number, day: number) =>
        `${month}월 ${day}일까지의 기록입니다. 연말이 지나면 한 해 결산이 됩니다.`,
      asReceipt: "영수증으로 보기",
      share: "결산 공유하기",
      copied: "클립보드에 복사됨!",
      scopeFull: (year: number) => `${year}년`,
      scopeSoFar: (year: number) => `${year}년 지금까지`,
      defendedTitle: (scope: string) => `${scope} 해지로 막은 결제`,
      confirmedBefore: "이 중 결제가 멈춘 것을 확인한 지킨 돈은 ",
      confirmedAfter: "입니다.",
      pendingNote: (amount: string) =>
        ` 확인 대기 ${amount}은 대시보드에서 결제가 멈췄는지 답하면 지킨 돈이 됩니다.`,
      scheduledNote: (amount: string) =>
        `연말까지 ${amount}을 더 지킬 예정입니다. 해지하지 않았다면 나갔을 금액입니다.`,
      unknownNote: (count: number) =>
        `결제 월을 모르는 연간 구독 ${count}건은 언제 결제되는지 알 수 없어 빠졌습니다.`,
      fxHistorical:
        "달러 구독의 지난 결제와 체크인 1회당 비용은 그날의 고시 환율(ECB 기준)로 바꿨어요. 카드사 환율과 조금 다를 수 있어요. 앞으로 지킬 금액과 지출 구성은 지금 설정한 환율이에요.",
      fxCurrent: "결제일의 환율을 받지 못해 달러 금액은 지금 설정한 환율로 계산했어요.",
      killedTitle: (scope: string, count: number) => `${scope} 해지한 구독 ${count}개`,
      killedNone: (year: number) => `${year}년에 해지한 구독이 없습니다.`,
      killedDay: (month: number, day: number) => `${month}월 ${day}일`,
      killedAtUnknown: (count: number) =>
        `해지 날짜 기록이 없는 ${count}건은 어느 해에 해지했는지 알 수 없어 넣지 않았습니다.`,
      spendTitle: "지금 구독 중인 서비스의 지출 구성",
      spendPast: "지난 해의 구독 구성은 기록으로 남아 있지 않아 보여줄 수 없습니다.",
      spendNone: "지금 구독 중인 서비스가 없습니다.",
      typeLabel: "소비 유형",
      categoryCount: (count: number) => `${count}개`,
      annualOf: (amount: string) => `연 ${amount}`,
      spendNote: (annual: string) =>
        `구독 중인 서비스를 1년 내내 낸다고 셈한 내 몫입니다(연 ${annual}). 앱에는 지난 결제 내역이 없어서, 올해 실제로 결제된 금액과는 다를 수 있습니다.`,
      checkInsTitle: (scope: string) => `${scope} 체크인으로 본 가성비`,
      checkInsNone: (year: number) =>
        `${year}년에 한 체크인이 없어 비교할 수 없습니다. 구독 상세에서 이용 횟수를 체크인하면 여기에 모입니다.`,
      cheapestLabel: "1회당 가장 싸게 쓴 서비스",
      checkedLabel: "체크인한 서비스",
      priciestLabel: "1회당 가장 비싸게 쓴 서비스",
      mostUsedLabel: "가장 자주 쓴 서비스",
      perUseValue: (amount: string, count: number) => `1회당 ${amount} · ${count}회 이용`,
      mostUsedValue: (count: number) => `30일 동안 ${count}회`,
      killedMark: "(해지함)",
      checkInsNote: (year: number) =>
        `서비스마다 ${year}년의 마지막 체크인 기준입니다. 이용 횟수는 체크인 때 직접 적은 값이라 실제 사용량과는 다를 수 있습니다.`,
      shareTitle: (year: number) => `SubSlash ${year}년 구독 결산`,
      shareText: (
        scope: string,
        killed: number,
        blocked: string,
        confirmedLine: string,
        type: string | null,
        url: string,
      ) =>
        `SubSlash ${scope} 구독 결산\n해지한 구독 ${killed}개 · 해지로 막은 결제 ${blocked}${confirmedLine}${type ? `\n소비 유형: ${type}` : ""}\n결산 보기: ${url}`,
      shareConfirmed: (amount: string) => ` · 그중 지킨 돈 ${amount}`,
    },
    spendingType: {
      focusedTitle: (category: string) => `${category} 집중형`,
      focusedDetail: (category: string, percent: number) =>
        `구독 지출의 ${percent}%가 ${category}에 모여 있습니다.`,
      spreadTitle: "고루 쓰는 분산형",
      spreadDetail: (count: number) =>
        `${count}개 분야에 나눠 쓰고, 가장 큰 분야도 절반이 되지 않습니다.`,
    },
    sharedPage: {
      badge: "SubSlash 구독 디톡스 인증서",
      nextLevel: (title: string, remaining: string) =>
        `다음 레벨 ‘${title}’까지 ${remaining} 더 지키면 됩니다`,
      heroTitle: "잠든 구독을 찾아 해지했습니다!",
      heroSub: "매달 자동 결제되던 구독을 찾아내 해지했습니다.",
      kept: "지킨 돈",
      keptNote: (verified: number) =>
        `해지 뒤 결제일에 결제가 멈춘 것을 확인한 금액 · 결제 멈춤 확인 ${verified}건`,
      keepAnnual: (annual: string, headline: string) =>
        `해지를 유지하면 1년에 ${annual}을 아낍니다${headline ? ` · ${headline}` : ""}`,
      expected: "해지를 유지하면 1년에 아끼는 금액 (예상)",
      legacy:
        "예전 형식의 공유 링크입니다. 결제가 멈춘 것을 확인한 금액은 담겨 있지 않아, 1년치 예상액만 보여줍니다.",
      killedLabel: "해지한 구독",
      rewardsTitle: "1년 동안 아끼면 누릴 수 있는 보상",
      ctaTitle: "나도 모르게 새어나가는 구독료가 있다면?",
      ctaBody:
        "SubSlash에서 1회당 실제 사용 단가를 계산하고, 가성비 낮은 구독을 찾아 해지해 보세요.",
      ctaButton: "나도 구독 디톡스 시작하기 (무료)",
      noSignup: "회원가입 없이 브라우저에서 바로 사용할 수 있습니다.",
      home: "SubSlash 홈으로 가기",
    },
    sharedReview: {
      invalidTitle: "올바르지 않은 결산 링크입니다",
      invalidBody: "링크가 잘렸거나 형식이 맞지 않아 결산 내용을 보여줄 수 없습니다.",
      badge: (year: number) => `SubSlash ${year}년 구독 결산`,
      confirmed: (amount: string) => `이 중 결제가 멈춘 것을 확인한 지킨 돈 ${amount}`,
      killedLabel: (scope: string) => `${scope} 해지한 구독`,
      typeLabel: "지금 구독 구성으로 본 소비 유형",
      ctaTitle: "내 구독도 한 해를 정리해 볼까요?",
      ctaButton: "나도 구독 정리 시작하기 (무료)",
    },
    app: {
      title: "절약 현황",
      reviewLink: "올해 결산 →",
      emptyTitle: "아직 해지한 구독이 없어요",
      emptyHint: "잘 안 쓰는 구독을 해지하면 여기에 지킨 돈이 쌓여요.",
      goDashboard: "대시보드로 가기",
      kept: "지금까지 지킨 돈",
      pending: "확인 대기",
      annual: "해지 유지하면 1년",
      maxLevel: "최고 레벨이에요",
      toNext: (level: number, remaining: string) => `Lv.${level}까지 ${remaining}`,
      stopped: (name: string, date: string) => `${name} · ${date} 결제가 멈췄나요?`,
      yes: "멈췄어요",
      charged: "결제됐어요",
      whereTitle: "어디서 아끼고 있나",
      perYear: "1년 기준",
      upcomingTitle: "다가오는 방어",
      upcomingNote: "해지 안 했으면 나갔을 날",
      today: "오늘",
      inDays: (days: number) => `${days}일 뒤`,
      dayMonth: (month: number) => `${month}월`,
      undated: (count: number) => `결제월 미설정 ${count}개는 날짜를 몰라 빠져 있어요.`,
      rewardsTitle: "1년 아끼면 이만큼",
      rewardsEmpty: "연간 ₩5,000부터 여기에 보여드려요.",
      killedTitle: (count: number) => `해지한 구독 ${count}`,
      verifiedMark: " · 확인됨",
      pendingMark: " · 확인 대기",
      reviveShort: "되살리기",
      shareButton: "결과 공유하기",
      copied: "클립보드에 복사했어요",
      moreClose: "접기",
      moreOpen: (count: number) => `${count}개 더 보기`,
      chargedTitle: "해지가 안 됐을 수 있어요",
      chargedBody:
        "첫 결제일에 결제가 됐다면\n구독 중으로 되돌릴게요.\n해지를 마친 뒤 다시 ‘해지 완료’를\n누르면 그날부터 절약으로 세요.",
      chargedConfirm: "되돌리기",
    },
    appChart: {
      title: (year: number) => `${year}년 월별 방어액`,
      byMonth: "월별",
      cumulative: "누적",
      empty:
        "올해는 해지한 구독의 결제일이 아직 돌아오지 않았어요. 결제일이 지나면 그 달에 쌓여요.",
      cumulativeUntil: (currentMonth: number) => `1~${currentMonth}월 누적`,
      scheduledMonth: (month: number) => `${month}월 · 예정`,
      split: (month: number, past: string, later: string) =>
        `${month}월 · 막은 결제 ${past} · 남은 결제일 ${later}`,
      blockedMonth: (month: number) => `${month}월 · 막은 결제`,
      barLabel: (month: number, amount: string, future: boolean) =>
        `${month}월 ${amount} ${future ? "예정" : "막음"}`,
      blocked: "막은 결제",
      upcomingThisMonth: "이번 달 남은 결제일",
      scheduled: "예정",
      untilYearEnd: (amount: string) => `연말까지 +${amount} 더 막을 예정이에요`,
      unknown: (count: number) => `결제월을 몰라 그래프에 넣지 못한 구독 ${count}개가 있어요.`,
      cumulativeLabel: "올해 누적 방어액",
    },
    income: {
      title: "월 수입 대비 구독비",
      edit: "수입 수정",
      askTitle: "구독비가 수입의 몇 %일까요?",
      askHint: "월 수입을 넣으면 해지 전후 비율을 보여드려요.",
      enter: "월 수입 입력하기",
      basis: (income: string) => `월 수입 ${income} 기준 (직접 입력)`,
      now: "지금 구독비",
      savedPart: "해지로 줄인 몫",
      rest: "나머지",
      over: (amount: string) => `구독비가 월 수입보다 ${amount} 많아요`,
      overHint:
        "수입을 잘못 넣었다면 고쳐 주세요. 맞다면 대시보드 계산서의 ‘쉬어가도 될 구독’부터 정리해 보세요.",
      reenter: "수입 다시 넣기",
      before: "해지 전",
      current: "지금",
      lowered: (diff: string) => `▼ 구독비 비중 ${diff}%p 줄었어요`,
      sheet: "월 수입 입력",
      formTitle: "월 수입을 알려주세요",
      formHint:
        "월급·용돈·생활비 예산 중 하나를 넣어요. 구독비가 수입의 몇 %인지 계산하는 데만 쓰고, 이 기기에만 저장해요.",
      ariaLabel: "월 수입(원)",
      perMonth: "/ 월",
      readout: (amount: string) => `월 ${amount}`,
      unitHint: "숫자를 쓰고 단위를 누르면 붙어요 (3 → 십만 = 30만 원)",
      units: ["만", "십만", "백만", "천만"],
      won: koWon,
      clear: "지우기",
      save: "저장",
      removeSaved: "입력한 수입 지우기",
      numberLocale: "ko-KR",
    },
  },
};

export const en: Widen<typeof ko> = {
  savings: {
    page: {
      title: "Savings & protected money",
      subtitle: "What cancelling saves you, and what you've actually kept.",
      reviewLink: "See this year's review →",
      emptyTitle: "No cancelled subscriptions yet",
      emptyHint: "Try cancelling a subscription you barely use from the dashboard.",
      goDashboard: "Go to the dashboard →",
      rewardsTitle: "What a year of savings could buy",
      rewardsEmpty: "Shown from ₩5,000 a year.",
      rewardOf: (name) => `In ${name}`,
      killedTitle: (count) => `Cancelled subscriptions (${count})`,
      share: "Share my result",
      copied: "Copied",
      annualSaving: (amount) => `Saving ${amount} a year`,
      monthlyBilled: (monthly) => `(${monthly}/month)`,
      perMonth: (amount) => `${amount}/month`,
      revive: "Restore",
    },
    rewardNames: {
      latte: "café lattes",
      chicken: "fried chicken",
      dinner: "fine-dining dinners",
      trip: "overseas trips",
    },
    share: {
      title: "SubSlash subscription detox result",
      confirmedLine: (confirmed, annual) =>
        `I cancelled subscriptions and kept ${confirmed}. Staying cancelled saves ${annual} a year!`,
      plannedLine: (annual) => `I cancelled subscriptions and will save ${annual} a year!`,
      text: (level, line, headline, url) =>
        `SubSlash subscription detox ${level}\n${line} ${headline}\nSee the result: ${url}`,
    },
    detox: {
      label: "Subscription detox level",
      saved: "Money kept",
      max: "You're at the top level. Check whether any subscriptions are left to protect.",
      next: (amount, title, level) => `Keep ${amount} more to reach ${title} (Lv.${level}).`,
    },
    killCheck: {
      verified: "Confirmed: charges stopped after cancelling",
      due: (date) => `Haven't confirmed whether you were charged on ${date} · `,
      dueLink: "Answer on the dashboard",
      waiting: (date) =>
        `Once the first billing date after cancelling (${date}) passes, we'll check that the charge stopped`,
      unknown:
        "The cancellation date or billing month is unknown, so we can't pick a date to check that the charge stopped",
    },
    basis: {
      title: "The level rules changed",
      close: "Close",
      body: "Instead of the yearly price that rose just by cancelling, your level now comes from “Money kept”, confirmed as no longer charged.",
      change: (before, now) => `Before: ${before} → Now: ${now}`,
      answer:
        "Each time a billing date passes after you cancel, say whether the charge stopped and your level goes back up. ",
      answerLink: "Answer on the dashboard →",
    },
    killedCard: {
      services: (count) => `${count} ${pluralOf(count, "service", "services")}`,
    },
    defense: {
      title: (year) => `Protected money by month, ${year}`,
      intro:
        "What would have been charged on each billing date after cancelling. It includes amounts not yet confirmed as stopped; confirmed amounts are in “Money kept” at the top.",
      past: (currentMonth) =>
        currentMonth === 1
          ? "Charges blocked in Jan"
          : `Charges blocked in Jan–${monthShort(currentMonth)}`,
      future: (currentMonth) =>
        currentMonth < 12 ? `To be kept ${monthShort(currentMonth + 1)}–Dec` : "No months left",
      empty:
        "None of the billing dates of your cancelled subscriptions has come yet this year. Once one passes, that month builds up.",
      blocked: "Blocked charges",
      scheduled: "Scheduled (what would have been charged had you not cancelled)",
      month: (month) => monthShort(month),
      barLabel: (month, amount, future) =>
        `${monthShort(month)} ${amount} ${future ? "scheduled" : "blocked"}`,
      activeScheduled: "scheduled — what would have been charged had you not cancelled",
      activeNow: "charges blocked this month",
      activePast: "charges blocked",
      table: "View as table",
      colMonth: "Month",
      colAmount: "Amount",
      colKind: "Type",
      kindScheduled: "Scheduled",
      kindBlocked: "Blocked",
      unknown: (count) =>
        `${count} yearly ${pluralOf(count, "subscription", "subscriptions")} with an unknown billing month can't be placed in a month, so ${pluralOf(count, "it is", "they are")} left out of the chart. Set the billing month in the subscription details to include ${pluralOf(count, "it", "them")}.`,
    },
    breakdown: {
      title: "Savings by service",
      subtitle: "See which cancellation kept the most money.",
      annual: "Yearly equivalent",
      yearEnd: (year) => `Through the end of ${year}`,
      unset: "Billing month not set",
      yearEndNote:
        "Includes the remaining billing dates. What you've kept so far and what is still to come are split in the monthly chart.",
      yearEndUnknown: (count) =>
        `${count} yearly ${pluralOf(count, "subscription", "subscriptions")} with an unknown billing month can't be told apart as before or after cancelling, so ${pluralOf(count, "it is", "they are")} left out of the total. Set the billing month in the subscription details to include ${pluralOf(count, "it", "them")}.`,
      top: (name, percent) => `Cancelling ${name} accounts for ${percent}% of all savings.`,
      total: (amount) => `Total ${amount}`,
    },
    review: {
      back: "← Savings",
      prevYear: (year) => `${year} review`,
      thisYear: "This year's review",
      title: (year) => `${year} subscription review`,
      completeNote: (year) => `A record of all of ${year}.`,
      partialNote: (month, day) =>
        `A record up to ${monthShort(month)} ${day}. It becomes the full-year review after the year ends.`,
      asReceipt: "View as receipt",
      share: "Share my review",
      copied: "Copied to clipboard!",
      scopeFull: (year) => String(year),
      scopeSoFar: (year) => `${year} so far`,
      defendedTitle: (scope) => `${scope}: charges blocked by cancelling`,
      confirmedBefore: "Of this, the money kept — confirmed as no longer charged — is ",
      confirmedAfter: ".",
      pendingNote: (amount) =>
        ` Answer on the dashboard whether the ${amount} awaiting confirmation stopped and it becomes money kept.`,
      scheduledNote: (amount) =>
        `Another ${amount} will be kept by the end of the year. It's what would have been charged had you not cancelled.`,
      unknownNote: (count) =>
        `${count} yearly ${pluralOf(count, "subscription", "subscriptions")} with an unknown billing month ${pluralOf(count, "was", "were")} left out because we can't tell when ${pluralOf(count, "it is", "they are")} charged.`,
      fxHistorical:
        "Past dollar payments and the cost per use at check-in were converted at the published rate of that day (ECB). It may differ slightly from your card company's rate. Amounts still to be kept and the spending breakdown use the rate you set now.",
      fxCurrent:
        "The rates for the billing dates couldn't be fetched, so dollar amounts use the rate you set now.",
      killedTitle: (scope, count) => `${scope}: ${count} cancelled`,
      killedNone: (year) => `You didn't cancel any subscriptions in ${year}.`,
      killedDay: (month, day) => `${monthShort(month)} ${day}`,
      killedAtUnknown: (count) =>
        `${count} without a recorded cancellation date ${pluralOf(count, "was", "were")} left out because we can't tell which year ${pluralOf(count, "it was", "they were")} cancelled.`,
      spendTitle: "Spending breakdown of your current subscriptions",
      spendPast: "The subscriptions you had in past years aren't recorded, so they can't be shown.",
      spendNone: "You have no subscriptions right now.",
      typeLabel: "Spending type",
      categoryCount: (count) => String(count),
      annualOf: (amount) => `${amount} a year`,
      spendNote: (annual) =>
        `Your share if you paid for your current subscriptions all year (${annual} a year). The app has no record of past payments, so it may differ from what was actually charged this year.`,
      checkInsTitle: (scope) => `${scope}: value from check-ins`,
      checkInsNone: (year) =>
        `You made no check-ins in ${year}, so there's nothing to compare. Check in your usage in a subscription's details and it collects here.`,
      cheapestLabel: "Cheapest per use",
      checkedLabel: "Checked-in service",
      priciestLabel: "Most expensive per use",
      mostUsedLabel: "Used most often",
      perUseValue: (amount, count) =>
        `${amount} per use · ${count} ${pluralOf(count, "use", "uses")}`,
      mostUsedValue: (count) => `${count} ${pluralOf(count, "use", "uses")} in 30 days`,
      killedMark: "(cancelled)",
      checkInsNote: (year) =>
        `Based on each service's last check-in of ${year}. The number of uses is what you entered at check-in, so it may differ from your real usage.`,
      shareTitle: (year) => `SubSlash ${year} subscription review`,
      shareText: (scope, killed, blocked, confirmedLine, type, url) =>
        `SubSlash ${scope} subscription review\nCancelled ${killed} ${pluralOf(killed, "subscription", "subscriptions")} · charges blocked by cancelling ${blocked}${confirmedLine}${type ? `\nSpending type: ${type}` : ""}\nSee the review: ${url}`,
      shareConfirmed: (amount) => ` · of which kept ${amount}`,
    },
    spendingType: {
      focusedTitle: (category) => `${category}-focused`,
      focusedDetail: (category, percent) =>
        `${percent}% of your subscription spending is in ${category}.`,
      spreadTitle: "Evenly spread",
      spreadDetail: (count) =>
        `You spread your spending across ${count} areas, and even the biggest is under half.`,
    },
    sharedPage: {
      badge: "SubSlash subscription detox certificate",
      nextLevel: (title, remaining) => `Keep ${remaining} more to reach “${title}”`,
      heroTitle: "Found and cancelled sleeping subscriptions!",
      heroSub: "Found subscriptions that were charged every month and cancelled them.",
      kept: "Money kept",
      keptNote: (verified) =>
        `Confirmed as no longer charged on the billing date after cancelling · ${verified} confirmed`,
      keepAnnual: (annual, headline) =>
        `Staying cancelled saves ${annual} a year${headline ? ` · ${headline}` : ""}`,
      expected: "Estimated yearly savings if you stay cancelled",
      legacy:
        "This is an old-format share link. It has no amount confirmed as no longer charged, so only the yearly estimate is shown.",
      killedLabel: "Cancelled subscriptions",
      rewardsTitle: "What a year of savings could buy",
      ctaTitle: "Is money leaking out through subscriptions you forgot?",
      ctaBody:
        "SubSlash works out what each use really costs, so you can find and cancel the low-value ones.",
      ctaButton: "Start my subscription detox (free)",
      noSignup: "No sign-up needed. Use it right in your browser.",
      home: "Go to the SubSlash home page",
    },
    sharedReview: {
      invalidTitle: "This review link isn't valid",
      invalidBody: "The link was cut off or has the wrong format, so the review can't be shown.",
      badge: (year) => `SubSlash ${year} subscription review`,
      confirmed: (amount) => `Of this, ${amount} is money kept, confirmed as no longer charged`,
      killedLabel: (scope) => `${scope}: cancelled subscriptions`,
      typeLabel: "Spending type from current subscriptions",
      ctaTitle: "Want to tidy up your own year?",
      ctaButton: "Start tidying up my subscriptions (free)",
    },
    app: {
      title: "Savings",
      reviewLink: "This year's review →",
      emptyTitle: "No cancelled subscriptions yet",
      emptyHint: "Cancel a subscription you barely use and the money you keep builds up here.",
      goDashboard: "Go to the dashboard",
      kept: "Money kept so far",
      pending: "Awaiting confirmation",
      annual: "A year if you stay cancelled",
      maxLevel: "You're at the top level",
      toNext: (level, remaining) => `${remaining} to Lv.${level}`,
      stopped: (name, date) => `${name} · did the ${date} charge stop?`,
      yes: "It stopped",
      charged: "I was charged",
      whereTitle: "Where you're saving",
      perYear: "Per year",
      upcomingTitle: "Upcoming protection",
      upcomingNote: "Days you would have been charged",
      today: "Today",
      inDays: (days) => `In ${days} ${pluralOf(days, "day", "days")}`,
      dayMonth: (month) => monthShort(month),
      undated: (count) =>
        `${count} without a billing month ${pluralOf(count, "is", "are")} left out because the date is unknown.`,
      rewardsTitle: "A year of savings buys",
      rewardsEmpty: "Shown from ₩5,000 a year.",
      killedTitle: (count) => `Cancelled subscriptions ${count}`,
      verifiedMark: " · confirmed",
      pendingMark: " · awaiting confirmation",
      reviveShort: "Restore",
      shareButton: "Share my result",
      copied: "Copied to clipboard",
      moreClose: "Show less",
      moreOpen: (count) => `Show ${count} more`,
      chargedTitle: "The cancellation may not have gone through",
      chargedBody:
        "If you were charged on the first billing date,\nwe'll set it back to subscribed.\nAfter you finish cancelling, tap “Cancelled” again\nand it counts as savings from that day.",
      chargedConfirm: "Set back",
    },
    appChart: {
      title: (year) => `Protected money by month, ${year}`,
      byMonth: "Monthly",
      cumulative: "Total",
      empty:
        "None of the billing dates of your cancelled subscriptions has come yet this year. It builds up in that month once one passes.",
      cumulativeUntil: (currentMonth) => `Jan–${monthShort(currentMonth)} total`,
      scheduledMonth: (month) => `${monthShort(month)} · scheduled`,
      split: (month, past, later) =>
        `${monthShort(month)} · blocked ${past} · billing dates left ${later}`,
      blockedMonth: (month) => `${monthShort(month)} · blocked`,
      barLabel: (month, amount, future) =>
        `${monthShort(month)} ${amount} ${future ? "scheduled" : "blocked"}`,
      blocked: "Blocked charges",
      upcomingThisMonth: "Billing dates left this month",
      scheduled: "Scheduled",
      untilYearEnd: (amount) => `Another +${amount} will be blocked by the end of the year`,
      unknown: (count) =>
        `${count} ${pluralOf(count, "subscription", "subscriptions")} couldn't be put in the chart because the billing month is unknown.`,
      cumulativeLabel: "Protected money so far this year",
    },
    income: {
      title: "Subscriptions vs monthly income",
      edit: "Edit income",
      askTitle: "What share of your income do subscriptions take?",
      askHint: "Enter your monthly income and we'll show the share before and after cancelling.",
      enter: "Enter monthly income",
      basis: (income) => `Based on a monthly income of ${income} (entered by you)`,
      now: "Subscriptions now",
      savedPart: "Cut by cancelling",
      rest: "The rest",
      over: (amount) => `Your subscriptions cost ${amount} more than your monthly income`,
      overHint:
        "If you entered your income wrong, fix it. If it's right, start with the “Fine to pause” subscriptions in the dashboard receipt.",
      reenter: "Enter income again",
      before: "Before",
      current: "Now",
      lowered: (diff) => `▼ Subscriptions' share dropped ${diff} points`,
      sheet: "Enter monthly income",
      formTitle: "Tell us your monthly income",
      formHint:
        "Enter your salary, allowance or living budget. It's only used to work out the share your subscriptions take, and it stays on this device.",
      ariaLabel: "Monthly income (KRW)",
      perMonth: "/ month",
      readout: (amount) => `${amount} a month`,
      unitHint: "Type a number, then tap a unit to add it (3 → 100k = 300,000)",
      units: ["10k", "100k", "1M", "10M"],
      won: (value) => `${Number(value).toLocaleString("en-US")} KRW`,
      clear: "Clear",
      save: "Save",
      removeSaved: "Delete the saved income",
      numberLocale: "en-US",
    },
  },
};

const svPl = (n: number, one: string, many: string) => (Number(n) === 1 ? one : many);
const zhM = (m: number) => monthName("zh", m);
const jaM = (m: number) => monthName("ja", m);
const viM = (m: number) => monthName("vi", m);
const frM = (m: number) => monthName("fr", m);
const esM = (m: number) => monthName("es", m);
const deM = (m: number) => monthName("de", m);
const ptM = (m: number) => monthName("pt", m);
/** 만 단위로 읽는 원화(중국어·일본어): '30万韩元'. */
const manWon = (raw: number, man: string, won: string, locale: string) => {
  const value = Number(raw);
  if (value >= 10_000 && value % 10_000 === 0)
    return `${(value / 10_000).toLocaleString(locale)}${man}${won}`;
  return `${value.toLocaleString(locale)}${won}`;
};

export const zh: Widen<typeof ko> = {
  savings: {
    page: {
      title: "节省与守住的钱",
      subtitle: "退订能省下多少，实际守住了多少。",
      reviewLink: "查看今年的总结 →",
      emptyTitle: "还没有退订的订阅",
      emptyHint: "在仪表板上试着退订一个几乎不用的订阅吧。",
      goDashboard: "前往仪表板 →",
      rewardsTitle: "一年省下的钱能买什么",
      rewardsEmpty: "一年满 5,000 韩元才会显示。",
      rewardOf: (name) => `换成${name}`,
      killedTitle: (count) => `已退订的订阅（${count}）`,
      share: "分享我的结果",
      copied: "已复制",
      annualSaving: (amount) => `每年节省 ${amount}`,
      monthlyBilled: (monthly) => `（每月 ${monthly}）`,
      perMonth: (amount) => `每月 ${amount}`,
      revive: "恢复",
    },
    rewardNames: { latte: "杯拿铁", chicken: "份炸鸡", dinner: "顿高级晚餐", trip: "次出国旅行" },
    share: {
      title: "SubSlash 订阅瘦身结果",
      confirmedLine: (confirmed, annual) =>
        `我退订了订阅，守住了 ${confirmed}。保持退订每年可省 ${annual}！`,
      plannedLine: (annual) => `我退订了订阅，每年将省下 ${annual}！`,
      text: (level, line, headline, url) =>
        `SubSlash 订阅瘦身 ${level}\n${line} ${headline}\n查看结果：${url}`,
    },
    detox: {
      label: "订阅瘦身等级",
      saved: "守住的钱",
      max: "已达到最高等级。看看还有没有要守住的订阅。",
      next: (amount, title, level) => `再守住 ${amount} 就能达到 ${title}（Lv.${level}）。`,
    },
    killCheck: {
      verified: "已确认：退订后不再扣款",
      due: (date) => `还没确认 ${date} 是否扣款 · `,
      dueLink: "在仪表板上回答",
      waiting: (date) => `退订后第一个扣款日（${date}）过后，我们会确认扣款是否停止`,
      unknown: "不知道退订日期或扣款月份，无法确定确认扣款停止的日期",
    },
    basis: {
      title: "等级标准变了",
      close: "关闭",
      body: "等级不再按退订后就上涨的年费计算，而是按确认不再扣款的「守住的钱」计算。",
      change: (before, now) => `之前：${before} → 现在：${now}`,
      answer: "退订后每过一个扣款日，回答扣款是否停止，等级就会回升。",
      answerLink: "在仪表板上回答 →",
    },
    killedCard: { services: (count) => `${count} 个服务` },
    defense: {
      title: (year) => `${year} 年每月守住的钱`,
      intro:
        "退订后每个扣款日本来会扣的钱。包括还没确认停止的金额；确认过的金额在上方的「守住的钱」里。",
      past: (m) => (Number(m) === 1 ? "1月拦下的扣款" : `1–${zhM(m)}拦下的扣款`),
      future: (m) => (Number(m) < 12 ? `${Number(m) + 1}–12月将守住` : "没有剩下的月份"),
      empty: "今年已退订订阅的扣款日还没到。过了以后，那个月就会累积。",
      blocked: "拦下的扣款",
      scheduled: "预计（如果没退订本来会扣的钱）",
      month: (month) => zhM(month),
      barLabel: (month, amount, future) => `${zhM(month)} ${amount} ${future ? "预计" : "已拦下"}`,
      activeScheduled: "预计 — 如果没退订本来会扣的钱",
      activeNow: "本月拦下的扣款",
      activePast: "拦下的扣款",
      table: "以表格查看",
      colMonth: "月份",
      colAmount: "金额",
      colKind: "类型",
      kindScheduled: "预计",
      kindBlocked: "已拦下",
      unknown: (count) =>
        `${count} 个不知道扣款月份的年付订阅无法放进月份，所以没有计入图表。在订阅详情中设置扣款月份即可计入。`,
    },
    breakdown: {
      title: "各服务的节省",
      subtitle: "看看哪次退订守住的钱最多。",
      annual: "按年计算",
      yearEnd: (year) => `到 ${year} 年底`,
      unset: "未设置扣款月份",
      yearEndNote: "包括剩下的扣款日。已守住的和将要守住的在月度图表中分开显示。",
      yearEndUnknown: (count) =>
        `${count} 个不知道扣款月份的年付订阅无法区分是在退订前还是退订后，所以没有计入合计。在订阅详情中设置扣款月份即可计入。`,
      top: (name, percent) => `退订 ${name} 占全部节省的 ${percent}%。`,
      total: (amount) => `合计 ${amount}`,
    },
    review: {
      back: "← 节省",
      prevYear: (year) => `${year} 年总结`,
      thisYear: "今年的总结",
      title: (year) => `${year} 年订阅总结`,
      completeNote: (year) => `${year} 年全年的记录。`,
      partialNote: (month, day) => `截至 ${zhM(month)}${day}日的记录。年底过后会变成全年总结。`,
      asReceipt: "以小票查看",
      share: "分享我的总结",
      copied: "已复制到剪贴板！",
      scopeFull: (year) => `${year} 年`,
      scopeSoFar: (year) => `${year} 年至今`,
      defendedTitle: (scope) => `${scope}：退订拦下的扣款`,
      confirmedBefore: "其中确认不再扣款的守住的钱是 ",
      confirmedAfter: "。",
      pendingNote: (amount) => ` 在仪表板上回答等待确认的 ${amount} 是否停止，就会变成守住的钱。`,
      scheduledNote: (amount) => `到年底还会再守住 ${amount}。这是如果没退订本来会扣的钱。`,
      unknownNote: (count) => `${count} 个不知道扣款月份的年付订阅不知道何时扣款，所以没有计入。`,
      fxHistorical:
        "过去的美元付款和签到时的单次成本按当天的公布汇率（ECB）换算。可能与发卡公司的汇率略有不同。将要守住的金额和支出构成按你现在设置的汇率计算。",
      fxCurrent: "无法获取扣款日的汇率，所以美元金额按你现在设置的汇率计算。",
      killedTitle: (scope, count) => `${scope}：退订 ${count} 个`,
      killedNone: (year) => `${year} 年没有退订任何订阅。`,
      killedDay: (month, day) => `${zhM(month)}${day}日`,
      killedAtUnknown: (count) =>
        `${count} 个没有记录退订日期的订阅不知道是哪一年退订的，所以没有计入。`,
      spendTitle: "当前订阅的支出构成",
      spendPast: "过去年份的订阅没有记录，无法显示。",
      spendNone: "现在没有订阅。",
      typeLabel: "消费类型",
      categoryCount: (count) => `${count} 个`,
      annualOf: (amount) => `每年 ${amount}`,
      spendNote: (annual) =>
        `假设当前订阅全年付款时你的份额（每年 ${annual}）。应用没有过去的付款记录，可能与今年实际扣款不同。`,
      checkInsTitle: (scope) => `${scope}：签到看到的性价比`,
      checkInsNone: (year) =>
        `${year} 年没有签到，无法比较。在订阅详情中签到使用量，就会在这里汇总。`,
      cheapestLabel: "单次最便宜",
      checkedLabel: "已签到的服务",
      priciestLabel: "单次最贵",
      mostUsedLabel: "用得最多",
      perUseValue: (amount, count) => `每次 ${amount} · ${count} 次`,
      mostUsedValue: (count) => `30 天 ${count} 次`,
      killedMark: "（已退订）",
      checkInsNote: (year) =>
        `按各服务在 ${year} 年的最后一次签到计算。使用次数是签到时输入的值，可能与实际使用不同。`,
      shareTitle: (year) => `SubSlash ${year} 年订阅总结`,
      shareText: (scope, killed, blocked, confirmedLine, type, url) =>
        `SubSlash ${scope}订阅总结\n退订 ${killed} 个 · 退订拦下的扣款 ${blocked}${confirmedLine}${type ? `\n消费类型：${type}` : ""}\n查看总结：${url}`,
      shareConfirmed: (amount) => ` · 其中守住 ${amount}`,
    },
    spendingType: {
      focusedTitle: (category) => `${category}集中型`,
      focusedDetail: (category, percent) => `订阅支出的 ${percent}% 花在${category}上。`,
      spreadTitle: "均衡分散型",
      spreadDetail: (count) => `支出分散在 ${count} 个领域，最大的也不到一半。`,
    },
    sharedPage: {
      badge: "SubSlash 订阅瘦身证书",
      nextLevel: (title, remaining) => `再守住 ${remaining} 就到「${title}」`,
      heroTitle: "找到并退订了沉睡的订阅！",
      heroSub: "找到每个月都在扣款的订阅并退订了。",
      kept: "守住的钱",
      keptNote: (verified) => `退订后的扣款日确认不再扣款 · 已确认 ${verified}`,
      keepAnnual: (annual, headline) =>
        `保持退订每年可省 ${annual}${headline ? ` · ${headline}` : ""}`,
      expected: "保持退订时预计每年节省",
      legacy: "这是旧格式的分享链接。没有确认不再扣款的金额，所以只显示每年的预计。",
      killedLabel: "已退订的订阅",
      rewardsTitle: "一年省下的钱能买什么",
      ctaTitle: "忘掉的订阅是不是在偷偷扣钱？",
      ctaBody: "SubSlash 算出每次使用的真实成本，帮你找到并退订性价比低的订阅。",
      ctaButton: "开始我的订阅瘦身（免费）",
      noSignup: "无需注册，直接在浏览器中使用。",
      home: "前往 SubSlash 首页",
    },
    sharedReview: {
      invalidTitle: "这个总结链接无效",
      invalidBody: "链接被截断或格式不对，无法显示总结。",
      badge: (year) => `SubSlash ${year} 年订阅总结`,
      confirmed: (amount) => `其中 ${amount} 是确认不再扣款的守住的钱`,
      killedLabel: (scope) => `${scope}：已退订的订阅`,
      typeLabel: "按当前订阅得出的消费类型",
      ctaTitle: "想整理一下你自己的一年吗？",
      ctaButton: "开始整理我的订阅（免费）",
    },
    app: {
      title: "节省",
      reviewLink: "今年的总结 →",
      emptyTitle: "还没有退订的订阅",
      emptyHint: "退订一个几乎不用的订阅，守住的钱就会在这里累积。",
      goDashboard: "前往仪表板",
      kept: "到目前守住的钱",
      pending: "等待确认",
      annual: "保持退订的一年",
      maxLevel: "已达到最高等级",
      toNext: (level, remaining) => `距 Lv.${level} 还差 ${remaining}`,
      stopped: (name, date) => `${name} · ${date} 的扣款停止了吗？`,
      yes: "停止了",
      charged: "被扣款了",
      whereTitle: "在哪里省钱",
      perYear: "每年",
      upcomingTitle: "即将守住",
      upcomingNote: "本来会扣款的日子",
      today: "今天",
      inDays: (days) => `${days} 天后`,
      dayMonth: (month) => zhM(month),
      undated: (count) => `${count} 个没有扣款月份的订阅日期不明，所以没有计入。`,
      rewardsTitle: "一年省下的钱能买",
      rewardsEmpty: "一年满 5,000 韩元才会显示。",
      killedTitle: (count) => `已退订的订阅 ${count}`,
      verifiedMark: " · 已确认",
      pendingMark: " · 等待确认",
      reviveShort: "恢复",
      shareButton: "分享我的结果",
      copied: "已复制到剪贴板",
      moreClose: "收起",
      moreOpen: (count) => `再显示 ${count} 个`,
      chargedTitle: "可能没有退订成功",
      chargedBody:
        "如果第一个扣款日被扣款了，\n我们会把它改回订阅中。\n完成退订后再点一次「已退订」，\n从那天起就算作节省。",
      chargedConfirm: "改回",
    },
    appChart: {
      title: (year) => `${year} 年每月守住的钱`,
      byMonth: "每月",
      cumulative: "累计",
      empty: "今年已退订订阅的扣款日还没到。过了以后会在那个月累积。",
      cumulativeUntil: (m) => `1–${zhM(m)}累计`,
      scheduledMonth: (month) => `${zhM(month)} · 预计`,
      split: (month, past, later) => `${zhM(month)} · 已拦下 ${past} · 剩下的扣款日 ${later}`,
      blockedMonth: (month) => `${zhM(month)} · 已拦下`,
      barLabel: (month, amount, future) => `${zhM(month)} ${amount} ${future ? "预计" : "已拦下"}`,
      blocked: "拦下的扣款",
      upcomingThisMonth: "本月剩下的扣款日",
      scheduled: "预计",
      untilYearEnd: (amount) => `到年底还会再拦下 +${amount}`,
      unknown: (count) => `${count} 个订阅不知道扣款月份，无法放进图表。`,
      cumulativeLabel: "今年至今守住的钱",
    },
    income: {
      title: "订阅占月收入",
      edit: "修改收入",
      askTitle: "订阅占收入的多少？",
      askHint: "输入月收入，就能看到退订前后的比例。",
      enter: "输入月收入",
      basis: (income) => `按月收入 ${income}（你输入的）计算`,
      now: "现在的订阅",
      savedPart: "退订减掉的",
      rest: "剩下的",
      over: (amount) => `订阅比月收入多出 ${amount}`,
      overHint: "如果收入输错了，请修改。如果没错，请从仪表板小票中「可以暂停」的订阅开始。",
      reenter: "重新输入收入",
      before: "之前",
      current: "现在",
      lowered: (diff) => `▼ 订阅占比下降了 ${diff} 个百分点`,
      sheet: "输入月收入",
      formTitle: "告诉我们你的月收入",
      formHint: "输入工资、零花钱或生活费。只用来计算订阅占的比例，并且只保存在这台设备上。",
      ariaLabel: "月收入（韩元）",
      perMonth: "/ 月",
      readout: (amount) => `每月 ${amount}`,
      unitHint: "输入数字后点单位即可加上（3 → 十万 = 30万韩元）",
      units: ["万", "十万", "百万", "千万"],
      won: (value) => manWon(value, "万", "韩元", "zh-CN"),
      clear: "清除",
      save: "保存",
      removeSaved: "删除保存的收入",
      numberLocale: "zh-CN",
    },
  },
};

export const ja: Widen<typeof ko> = {
  savings: {
    page: {
      title: "節約と守ったお金",
      subtitle: "解約でいくら浮くか、実際にいくら守れたか。",
      reviewLink: "今年のまとめを見る →",
      emptyTitle: "まだ解約したサブスクはありません",
      emptyHint: "ダッシュボードで、ほとんど使っていないサブスクを解約してみましょう。",
      goDashboard: "ダッシュボードへ →",
      rewardsTitle: "1 年の節約で買えるもの",
      rewardsEmpty: "年 5,000 ウォンから表示します。",
      rewardOf: (name) => `${name}にすると`,
      killedTitle: (count) => `解約したサブスク（${count}）`,
      share: "結果をシェア",
      copied: "コピーしました",
      annualSaving: (amount) => `年 ${amount} の節約`,
      monthlyBilled: (monthly) => `（月 ${monthly}）`,
      perMonth: (amount) => `月 ${amount}`,
      revive: "元に戻す",
    },
    rewardNames: {
      latte: "カフェラテ",
      chicken: "フライドチキン",
      dinner: "高級ディナー",
      trip: "海外旅行",
    },
    share: {
      title: "SubSlash サブスク・デトックスの結果",
      confirmedLine: (confirmed, annual) =>
        `サブスクを解約して ${confirmed} を守りました。解約を続ければ年 ${annual} の節約！`,
      plannedLine: (annual) => `サブスクを解約して年 ${annual} 節約します！`,
      text: (level, line, headline, url) =>
        `SubSlash サブスク・デトックス ${level}\n${line} ${headline}\n結果を見る: ${url}`,
    },
    detox: {
      label: "サブスク・デトックスのレベル",
      saved: "守ったお金",
      max: "最高レベルです。まだ守るべきサブスクがないか確認してみましょう。",
      next: (amount, title, level) => `あと ${amount} 守ると ${title}（Lv.${level}）です。`,
    },
    killCheck: {
      verified: "確認済み: 解約後は請求されていません",
      due: (date) => `${date} に請求されたか未確認 · `,
      dueLink: "ダッシュボードで答える",
      waiting: (date) => `解約後の最初の請求日（${date}）が過ぎたら、請求が止まったか確認します`,
      unknown: "解約日か請求月がわからないため、請求が止まったか確かめる日を決められません",
    },
    basis: {
      title: "レベルの基準が変わりました",
      close: "閉じる",
      body: "解約しただけで上がる年額ではなく、請求されないと確認した「守ったお金」でレベルを決めます。",
      change: (before, now) => `以前: ${before} → 今: ${now}`,
      answer: "解約後に請求日が来るたびに、請求が止まったか答えるとレベルが戻ります。",
      answerLink: "ダッシュボードで答える →",
    },
    killedCard: { services: (count) => `${count} サービス` },
    defense: {
      title: (year) => `${year} 年の月別の守ったお金`,
      intro:
        "解約後の各請求日に請求されていたはずの金額です。止まったと未確認の金額も含み、確認済みの金額は上の「守ったお金」にあります。",
      past: (m) => (Number(m) === 1 ? "1月に止めた請求" : `1〜${jaM(m)}に止めた請求`),
      future: (m) => (Number(m) < 12 ? `${Number(m) + 1}〜12月に守る予定` : "残りの月はありません"),
      empty: "今年はまだ解約したサブスクの請求日が来ていません。過ぎるとその月に積み上がります。",
      blocked: "止めた請求",
      scheduled: "予定（解約しなければ請求されていた額）",
      month: (month) => jaM(month),
      barLabel: (month, amount, future) => `${jaM(month)} ${amount} ${future ? "予定" : "止めた"}`,
      activeScheduled: "予定 — 解約しなければ請求されていた額",
      activeNow: "今月止めた請求",
      activePast: "止めた請求",
      table: "表で見る",
      colMonth: "月",
      colAmount: "金額",
      colKind: "種類",
      kindScheduled: "予定",
      kindBlocked: "止めた",
      unknown: (count) =>
        `請求月がわからない年払いのサブスク ${count} 件は月に入れられないため、グラフから外しました。サブスクの詳細で請求月を設定すると入ります。`,
    },
    breakdown: {
      title: "サービス別の節約",
      subtitle: "どの解約が一番お金を守ったか見てみましょう。",
      annual: "年換算",
      yearEnd: (year) => `${year} 年末まで`,
      unset: "請求月が未設定",
      yearEndNote: "残りの請求日も含みます。守った分とこれから守る分は月別のグラフで分けています。",
      yearEndUnknown: (count) =>
        `請求月がわからない年払いのサブスク ${count} 件は解約の前か後か分けられないため、合計から外しました。サブスクの詳細で請求月を設定すると入ります。`,
      top: (name, percent) => `${name} の解約が節約全体の ${percent}% を占めます。`,
      total: (amount) => `合計 ${amount}`,
    },
    review: {
      back: "← 節約",
      prevYear: (year) => `${year} 年のまとめ`,
      thisYear: "今年のまとめ",
      title: (year) => `${year} 年サブスクまとめ`,
      completeNote: (year) => `${year} 年 1 年間の記録です。`,
      partialNote: (month, day) =>
        `${jaM(month)}${day}日までの記録です。年が明けると 1 年分のまとめになります。`,
      asReceipt: "レシートで見る",
      share: "まとめをシェア",
      copied: "クリップボードにコピーしました！",
      scopeFull: (year) => `${year} 年`,
      scopeSoFar: (year) => `${year} 年のこれまで`,
      defendedTitle: (scope) => `${scope}: 解約で止めた請求`,
      confirmedBefore: "このうち請求されないと確認した守ったお金は ",
      confirmedAfter: " です。",
      pendingNote: (amount) =>
        ` 確認待ちの ${amount} が止まったかダッシュボードで答えると、守ったお金になります。`,
      scheduledNote: (amount) =>
        `年末までにさらに ${amount} を守ります。解約しなければ請求されていた額です。`,
      unknownNote: (count) =>
        `請求月がわからない年払いのサブスク ${count} 件は、いつ請求されるかわからないため外しました。`,
      fxHistorical:
        "過去のドル支払いとチェックイン時の単価は、その日の公表レート（ECB）で換算しました。カード会社のレートと少し違うことがあります。これから守る額と支出の内訳は今設定しているレートです。",
      fxCurrent:
        "請求日のレートを取得できなかったため、ドルの金額は今設定しているレートで換算しました。",
      killedTitle: (scope, count) => `${scope}: ${count} 件解約`,
      killedNone: (year) => `${year} 年に解約したサブスクはありません。`,
      killedDay: (month, day) => `${jaM(month)}${day}日`,
      killedAtUnknown: (count) =>
        `解約日の記録がない ${count} 件は、何年に解約したかわからないため外しました。`,
      spendTitle: "今のサブスクの支出の内訳",
      spendPast: "過去の年のサブスクは記録がないため表示できません。",
      spendNone: "今はサブスクがありません。",
      typeLabel: "支出タイプ",
      categoryCount: (count) => `${count} 件`,
      annualOf: (amount) => `年 ${amount}`,
      spendNote: (annual) =>
        `今のサブスクを 1 年払ったとした自分の負担分（年 ${annual}）です。アプリには過去の支払い記録がないため、今年実際に請求された額と違うことがあります。`,
      checkInsTitle: (scope) => `${scope}: チェックインで見たお得度`,
      checkInsNone: (year) =>
        `${year} 年はチェックインがないので比べられません。サブスクの詳細で利用量をチェックインするとここに集まります。`,
      cheapestLabel: "1 回あたり最も安い",
      checkedLabel: "チェックインしたサービス",
      priciestLabel: "1 回あたり最も高い",
      mostUsedLabel: "最もよく使った",
      perUseValue: (amount, count) => `1 回 ${amount} · ${count} 回`,
      mostUsedValue: (count) => `30 日で ${count} 回`,
      killedMark: "（解約済み）",
      checkInsNote: (year) =>
        `各サービスの ${year} 年最後のチェックインが基準です。利用回数はチェックインで入力した値なので、実際の利用と違うことがあります。`,
      shareTitle: (year) => `SubSlash ${year} 年サブスクまとめ`,
      shareText: (scope, killed, blocked, confirmedLine, type, url) =>
        `SubSlash ${scope}サブスクまとめ\n${killed} 件解約 · 解約で止めた請求 ${blocked}${confirmedLine}${type ? `\n支出タイプ: ${type}` : ""}\nまとめを見る: ${url}`,
      shareConfirmed: (amount) => ` · うち守った ${amount}`,
    },
    spendingType: {
      focusedTitle: (category) => `${category}集中型`,
      focusedDetail: (category, percent) => `サブスク支出の ${percent}% が${category}です。`,
      spreadTitle: "まんべんなく分散型",
      spreadDetail: (count) => `${count} の分野に分けて使っていて、一番大きいものも半分未満です。`,
    },
    sharedPage: {
      badge: "SubSlash サブスク・デトックス認定証",
      nextLevel: (title, remaining) => `あと ${remaining} 守ると「${title}」`,
      heroTitle: "眠っていたサブスクを見つけて解約しました！",
      heroSub: "毎月請求されていたサブスクを見つけて解約しました。",
      kept: "守ったお金",
      keptNote: (verified) => `解約後の請求日に請求されないと確認 · 確認済み ${verified}`,
      keepAnnual: (annual, headline) =>
        `解約を続ければ年 ${annual} の節約${headline ? ` · ${headline}` : ""}`,
      expected: "解約を続けた場合の年間節約見込み",
      legacy:
        "古い形式の共有リンクです。請求されないと確認した金額がないため、年間の見込みだけを表示します。",
      killedLabel: "解約したサブスク",
      rewardsTitle: "1 年の節約で買えるもの",
      ctaTitle: "忘れたサブスクからお金が漏れていませんか？",
      ctaBody:
        "SubSlash は 1 回あたりの本当のコストを計算して、お得でないサブスクを見つけて解約できるようにします。",
      ctaButton: "サブスク・デトックスを始める（無料）",
      noSignup: "登録不要。ブラウザですぐ使えます。",
      home: "SubSlash のホームへ",
    },
    sharedReview: {
      invalidTitle: "このまとめのリンクは無効です",
      invalidBody: "リンクが途中で切れているか形式が違うため、まとめを表示できません。",
      badge: (year) => `SubSlash ${year} 年サブスクまとめ`,
      confirmed: (amount) => `このうち ${amount} は請求されないと確認した守ったお金です`,
      killedLabel: (scope) => `${scope}: 解約したサブスク`,
      typeLabel: "今のサブスクから見た支出タイプ",
      ctaTitle: "自分の 1 年も整理してみませんか？",
      ctaButton: "サブスクの整理を始める（無料）",
    },
    app: {
      title: "節約",
      reviewLink: "今年のまとめ →",
      emptyTitle: "まだ解約したサブスクはありません",
      emptyHint: "ほとんど使わないサブスクを解約すると、守ったお金がここに積み上がります。",
      goDashboard: "ダッシュボードへ",
      kept: "これまで守ったお金",
      pending: "確認待ち",
      annual: "解約を続けた 1 年",
      maxLevel: "最高レベルです",
      toNext: (level, remaining) => `Lv.${level} まであと ${remaining}`,
      stopped: (name, date) => `${name} · ${date} の請求は止まりましたか？`,
      yes: "止まった",
      charged: "請求された",
      whereTitle: "どこで節約しているか",
      perYear: "年あたり",
      upcomingTitle: "これから守る分",
      upcomingNote: "請求されていたはずの日",
      today: "今日",
      inDays: (days) => `${days} 日後`,
      dayMonth: (month) => jaM(month),
      undated: (count) => `請求月のない ${count} 件は日付がわからないため外しました。`,
      rewardsTitle: "1 年の節約で買えるもの",
      rewardsEmpty: "年 5,000 ウォンから表示します。",
      killedTitle: (count) => `解約したサブスク ${count}`,
      verifiedMark: " · 確認済み",
      pendingMark: " · 確認待ち",
      reviveShort: "戻す",
      shareButton: "結果をシェア",
      copied: "クリップボードにコピーしました",
      moreClose: "閉じる",
      moreOpen: (count) => `あと ${count} 件表示`,
      chargedTitle: "解約できていないかもしれません",
      chargedBody:
        "最初の請求日に請求されたなら、\n購読中に戻します。\n解約を済ませてからもう一度「解約した」を押すと、\nその日から節約として数えます。",
      chargedConfirm: "戻す",
    },
    appChart: {
      title: (year) => `${year} 年の月別の守ったお金`,
      byMonth: "月別",
      cumulative: "累計",
      empty: "今年はまだ解約したサブスクの請求日が来ていません。過ぎるとその月に積み上がります。",
      cumulativeUntil: (m) => `1〜${jaM(m)}の累計`,
      scheduledMonth: (month) => `${jaM(month)} · 予定`,
      split: (month, past, later) => `${jaM(month)} · 止めた ${past} · 残りの請求日 ${later}`,
      blockedMonth: (month) => `${jaM(month)} · 止めた`,
      barLabel: (month, amount, future) => `${jaM(month)} ${amount} ${future ? "予定" : "止めた"}`,
      blocked: "止めた請求",
      upcomingThisMonth: "今月の残りの請求日",
      scheduled: "予定",
      untilYearEnd: (amount) => `年末までにさらに +${amount} を止めます`,
      unknown: (count) =>
        `${count} 件のサブスクは請求月がわからないため、グラフに入れられませんでした。`,
      cumulativeLabel: "今年これまでに守ったお金",
    },
    income: {
      title: "月収に占めるサブスク",
      edit: "収入を直す",
      askTitle: "サブスクは収入のどれくらい？",
      askHint: "月収を入れると、解約の前と後の割合を見せます。",
      enter: "月収を入れる",
      basis: (income) => `月収 ${income}（入力した値）基準`,
      now: "今のサブスク",
      savedPart: "解約で減った分",
      rest: "残り",
      over: (amount) => `サブスクが月収より ${amount} 多くなっています`,
      overHint:
        "収入を入れ間違えたなら直してください。合っているなら、ダッシュボードのレシートの「一時停止してよい」サブスクから始めましょう。",
      reenter: "収入を入れ直す",
      before: "以前",
      current: "今",
      lowered: (diff) => `▼ サブスクの割合が ${diff} ポイント下がりました`,
      sheet: "月収を入れる",
      formTitle: "月収を教えてください",
      formHint:
        "給料・お小遣い・生活費を入れてください。サブスクの割合を出すためだけに使い、この端末にだけ保存します。",
      ariaLabel: "月収（ウォン）",
      perMonth: "/ 月",
      readout: (amount) => `月 ${amount}`,
      unitHint: "数字を入れて単位を押すと付きます（3 → 十万 = 30万ウォン）",
      units: ["万", "十万", "百万", "千万"],
      won: (value) => manWon(value, "万", "ウォン", "ja-JP"),
      clear: "消す",
      save: "保存",
      removeSaved: "保存した収入を削除",
      numberLocale: "ja-JP",
    },
  },
};

export const vi: Widen<typeof ko> = {
  savings: {
    page: {
      title: "Tiết kiệm & tiền giữ được",
      subtitle: "Hủy giúp bạn tiết kiệm bao nhiêu, và thực tế đã giữ được bao nhiêu.",
      reviewLink: "Xem tổng kết năm nay →",
      emptyTitle: "Chưa có gói nào đã hủy",
      emptyHint: "Thử hủy một gói bạn hầu như không dùng trên bảng điều khiển.",
      goDashboard: "Đến bảng điều khiển →",
      rewardsTitle: "Một năm tiết kiệm mua được gì",
      rewardsEmpty: "Hiện từ 5.000 won mỗi năm.",
      rewardOf: (name) => `Bằng ${name}`,
      killedTitle: (count) => `Gói đã hủy (${count})`,
      share: "Chia sẻ kết quả",
      copied: "Đã sao chép",
      annualSaving: (amount) => `Tiết kiệm ${amount} mỗi năm`,
      monthlyBilled: (monthly) => `(${monthly}/tháng)`,
      perMonth: (amount) => `${amount}/tháng`,
      revive: "Khôi phục",
    },
    rewardNames: {
      latte: "ly cà phê latte",
      chicken: "phần gà rán",
      dinner: "bữa tối sang trọng",
      trip: "chuyến du lịch nước ngoài",
    },
    share: {
      title: "Kết quả cai nghiện gói đăng ký SubSlash",
      confirmedLine: (confirmed, annual) =>
        `Tôi đã hủy gói đăng ký và giữ được ${confirmed}. Tiếp tục hủy sẽ tiết kiệm ${annual} mỗi năm!`,
      plannedLine: (annual) => `Tôi đã hủy gói đăng ký và sẽ tiết kiệm ${annual} mỗi năm!`,
      text: (level, line, headline, url) =>
        `Cai nghiện gói đăng ký SubSlash ${level}\n${line} ${headline}\nXem kết quả: ${url}`,
    },
    detox: {
      label: "Cấp cai nghiện gói đăng ký",
      saved: "Tiền giữ được",
      max: "Bạn đã ở cấp cao nhất. Hãy xem còn gói nào cần giữ không.",
      next: (amount, title, level) => `Giữ thêm ${amount} để đạt ${title} (Lv.${level}).`,
    },
    killCheck: {
      verified: "Đã xác nhận: không bị trừ tiền sau khi hủy",
      due: (date) => `Chưa xác nhận có bị trừ tiền ngày ${date} không · `,
      dueLink: "Trả lời trên bảng điều khiển",
      waiting: (date) =>
        `Khi qua ngày thanh toán đầu tiên sau khi hủy (${date}), chúng tôi sẽ kiểm tra khoản trừ đã dừng chưa`,
      unknown:
        "Không rõ ngày hủy hoặc tháng thanh toán nên không chọn được ngày kiểm tra khoản trừ đã dừng",
    },
    basis: {
      title: "Cách tính cấp đã thay đổi",
      close: "Đóng",
      body: "Thay vì giá năm tăng lên chỉ vì hủy, cấp của bạn giờ tính theo “Tiền giữ được” đã xác nhận không còn bị trừ.",
      change: (before, now) => `Trước: ${before} → Giờ: ${now}`,
      answer:
        "Mỗi khi qua một ngày thanh toán sau khi hủy, trả lời khoản trừ đã dừng chưa thì cấp sẽ tăng lại. ",
      answerLink: "Trả lời trên bảng điều khiển →",
    },
    killedCard: { services: (count) => `${count} dịch vụ` },
    defense: {
      title: (year) => `Tiền giữ được theo tháng, ${year}`,
      intro:
        "Số tiền lẽ ra bị trừ vào mỗi ngày thanh toán sau khi hủy. Gồm cả khoản chưa xác nhận đã dừng; khoản đã xác nhận nằm trong “Tiền giữ được” ở trên.",
      past: (m) =>
        Number(m) === 1
          ? "Khoản trừ đã chặn trong tháng 1"
          : `Khoản trừ đã chặn tháng 1–${Number(m)}`,
      future: (m) =>
        Number(m) < 12 ? `Sẽ giữ được tháng ${Number(m) + 1}–12` : "Không còn tháng nào",
      empty:
        "Năm nay chưa đến ngày thanh toán nào của các gói đã hủy. Khi qua, tháng đó sẽ được cộng dồn.",
      blocked: "Khoản trừ đã chặn",
      scheduled: "Dự kiến (số tiền lẽ ra bị trừ nếu không hủy)",
      month: (month) => `T${Number(month)}`,
      barLabel: (month, amount, future) =>
        `${viM(month)} ${amount} ${future ? "dự kiến" : "đã chặn"}`,
      activeScheduled: "dự kiến — số tiền lẽ ra bị trừ nếu không hủy",
      activeNow: "khoản trừ đã chặn tháng này",
      activePast: "khoản trừ đã chặn",
      table: "Xem dạng bảng",
      colMonth: "Tháng",
      colAmount: "Số tiền",
      colKind: "Loại",
      kindScheduled: "Dự kiến",
      kindBlocked: "Đã chặn",
      unknown: (count) =>
        `${count} gói năm không rõ tháng thanh toán nên không xếp vào tháng được và bị loại khỏi biểu đồ. Đặt tháng thanh toán trong chi tiết gói để tính vào.`,
    },
    breakdown: {
      title: "Tiết kiệm theo dịch vụ",
      subtitle: "Xem lần hủy nào giữ được nhiều tiền nhất.",
      annual: "Quy ra năm",
      yearEnd: (year) => `Đến cuối năm ${year}`,
      unset: "Chưa đặt tháng thanh toán",
      yearEndNote:
        "Gồm cả các ngày thanh toán còn lại. Phần đã giữ và phần sắp giữ được tách trong biểu đồ theo tháng.",
      yearEndUnknown: (count) =>
        `${count} gói năm không rõ tháng thanh toán nên không phân biệt được trước hay sau khi hủy và bị loại khỏi tổng. Đặt tháng thanh toán trong chi tiết gói để tính vào.`,
      top: (name, percent) => `Hủy ${name} chiếm ${percent}% tổng tiết kiệm.`,
      total: (amount) => `Tổng ${amount}`,
    },
    review: {
      back: "← Tiết kiệm",
      prevYear: (year) => `Tổng kết ${year}`,
      thisYear: "Tổng kết năm nay",
      title: (year) => `Tổng kết gói đăng ký ${year}`,
      completeNote: (year) => `Ghi chép cả năm ${year}.`,
      partialNote: (month, day) =>
        `Ghi chép đến ngày ${day}/${Number(month)}. Sau khi hết năm sẽ thành tổng kết cả năm.`,
      asReceipt: "Xem dạng hóa đơn",
      share: "Chia sẻ tổng kết",
      copied: "Đã sao chép vào bộ nhớ tạm!",
      scopeFull: (year) => String(year),
      scopeSoFar: (year) => `${year} đến nay`,
      defendedTitle: (scope) => `${scope}: khoản trừ đã chặn nhờ hủy`,
      confirmedBefore: "Trong đó, tiền giữ được đã xác nhận không còn bị trừ là ",
      confirmedAfter: ".",
      pendingNote: (amount) =>
        ` Trả lời trên bảng điều khiển xem ${amount} đang chờ xác nhận đã dừng chưa để nó thành tiền giữ được.`,
      scheduledNote: (amount) =>
        `Đến cuối năm sẽ giữ thêm ${amount}. Đó là số tiền lẽ ra bị trừ nếu không hủy.`,
      unknownNote: (count) =>
        `${count} gói năm không rõ tháng thanh toán bị loại vì không biết khi nào bị trừ.`,
      fxHistorical:
        "Các khoản trả bằng đô la trước đây và chi phí mỗi lần dùng khi check-in được quy đổi theo tỷ giá công bố ngày đó (ECB). Có thể hơi khác tỷ giá của công ty thẻ. Số tiền sắp giữ và cơ cấu chi tiêu dùng tỷ giá bạn đặt hiện tại.",
      fxCurrent:
        "Không lấy được tỷ giá của các ngày thanh toán nên số tiền đô la dùng tỷ giá bạn đặt hiện tại.",
      killedTitle: (scope, count) => `${scope}: đã hủy ${count}`,
      killedNone: (year) => `Bạn không hủy gói nào trong năm ${year}.`,
      killedDay: (month, day) => `${day}/${Number(month)}`,
      killedAtUnknown: (count) =>
        `${count} gói không ghi ngày hủy bị loại vì không biết hủy năm nào.`,
      spendTitle: "Cơ cấu chi tiêu của các gói hiện tại",
      spendPast: "Không có ghi chép gói của các năm trước nên không hiển thị được.",
      spendNone: "Hiện bạn không có gói nào.",
      typeLabel: "Kiểu chi tiêu",
      categoryCount: (count) => String(count),
      annualOf: (amount) => `${amount} mỗi năm`,
      spendNote: (annual) =>
        `Phần của bạn nếu trả các gói hiện tại cả năm (${annual} mỗi năm). Ứng dụng không có ghi chép thanh toán trước đây nên có thể khác số tiền thực tế bị trừ năm nay.`,
      checkInsTitle: (scope) => `${scope}: giá trị từ check-in`,
      checkInsNone: (year) =>
        `Năm ${year} bạn không check-in nên không có gì để so sánh. Check-in mức dùng trong chi tiết gói thì sẽ được gom ở đây.`,
      cheapestLabel: "Rẻ nhất mỗi lần",
      checkedLabel: "Dịch vụ đã check-in",
      priciestLabel: "Đắt nhất mỗi lần",
      mostUsedLabel: "Dùng nhiều nhất",
      perUseValue: (amount, count) => `${amount} mỗi lần · ${count} lần`,
      mostUsedValue: (count) => `${count} lần trong 30 ngày`,
      killedMark: "(đã hủy)",
      checkInsNote: (year) =>
        `Dựa trên lần check-in cuối cùng năm ${year} của mỗi dịch vụ. Số lần dùng là giá trị bạn nhập khi check-in nên có thể khác thực tế.`,
      shareTitle: (year) => `Tổng kết gói đăng ký SubSlash ${year}`,
      shareText: (scope, killed, blocked, confirmedLine, type, url) =>
        `Tổng kết gói đăng ký SubSlash ${scope}\nĐã hủy ${killed} gói · khoản trừ đã chặn nhờ hủy ${blocked}${confirmedLine}${type ? `\nKiểu chi tiêu: ${type}` : ""}\nXem tổng kết: ${url}`,
      shareConfirmed: (amount) => ` · trong đó giữ được ${amount}`,
    },
    spendingType: {
      focusedTitle: (category) => `Tập trung vào ${category}`,
      focusedDetail: (category, percent) =>
        `${percent}% chi tiêu cho gói đăng ký của bạn là ${category}.`,
      spreadTitle: "Phân bổ đều",
      spreadDetail: (count) =>
        `Bạn chia chi tiêu cho ${count} lĩnh vực, lĩnh vực lớn nhất cũng chưa tới một nửa.`,
    },
    sharedPage: {
      badge: "Chứng nhận cai nghiện gói đăng ký SubSlash",
      nextLevel: (title, remaining) => `Giữ thêm ${remaining} để đạt “${title}”`,
      heroTitle: "Đã tìm và hủy các gói ngủ quên!",
      heroSub: "Đã tìm các gói bị trừ tiền mỗi tháng và hủy chúng.",
      kept: "Tiền giữ được",
      keptNote: (verified) =>
        `Đã xác nhận không còn bị trừ vào ngày thanh toán sau khi hủy · đã xác nhận ${verified}`,
      keepAnnual: (annual, headline) =>
        `Tiếp tục hủy sẽ tiết kiệm ${annual} mỗi năm${headline ? ` · ${headline}` : ""}`,
      expected: "Ước tính tiết kiệm mỗi năm nếu tiếp tục hủy",
      legacy:
        "Đây là đường dẫn chia sẻ kiểu cũ. Không có số tiền đã xác nhận không còn bị trừ nên chỉ hiện ước tính năm.",
      killedLabel: "Gói đã hủy",
      rewardsTitle: "Một năm tiết kiệm mua được gì",
      ctaTitle: "Tiền có đang rò rỉ qua những gói bạn đã quên?",
      ctaBody: "SubSlash tính chi phí thật của mỗi lần dùng để bạn tìm và hủy các gói kém giá trị.",
      ctaButton: "Bắt đầu cai nghiện gói đăng ký (miễn phí)",
      noSignup: "Không cần đăng ký. Dùng ngay trên trình duyệt.",
      home: "Về trang chủ SubSlash",
    },
    sharedReview: {
      invalidTitle: "Đường dẫn tổng kết này không hợp lệ",
      invalidBody: "Đường dẫn bị cắt hoặc sai định dạng nên không hiển thị được tổng kết.",
      badge: (year) => `Tổng kết gói đăng ký SubSlash ${year}`,
      confirmed: (amount) => `Trong đó ${amount} là tiền giữ được, đã xác nhận không còn bị trừ`,
      killedLabel: (scope) => `${scope}: gói đã hủy`,
      typeLabel: "Kiểu chi tiêu theo các gói hiện tại",
      ctaTitle: "Muốn sắp xếp lại năm của chính bạn?",
      ctaButton: "Bắt đầu sắp xếp gói đăng ký (miễn phí)",
    },
    app: {
      title: "Tiết kiệm",
      reviewLink: "Tổng kết năm nay →",
      emptyTitle: "Chưa có gói nào đã hủy",
      emptyHint: "Hủy một gói bạn hầu như không dùng, tiền giữ được sẽ cộng dồn ở đây.",
      goDashboard: "Đến bảng điều khiển",
      kept: "Tiền giữ được đến nay",
      pending: "Chờ xác nhận",
      annual: "Một năm nếu tiếp tục hủy",
      maxLevel: "Bạn đã ở cấp cao nhất",
      toNext: (level, remaining) => `Còn ${remaining} đến Lv.${level}`,
      stopped: (name, date) => `${name} · khoản trừ ngày ${date} đã dừng chưa?`,
      yes: "Đã dừng",
      charged: "Vẫn bị trừ",
      whereTitle: "Bạn tiết kiệm ở đâu",
      perYear: "Mỗi năm",
      upcomingTitle: "Sắp giữ được",
      upcomingNote: "Những ngày lẽ ra bị trừ tiền",
      today: "Hôm nay",
      inDays: (days) => `${days} ngày nữa`,
      dayMonth: (month) => `T${Number(month)}`,
      undated: (count) => `${count} gói không có tháng thanh toán bị loại vì không rõ ngày.`,
      rewardsTitle: "Một năm tiết kiệm mua được",
      rewardsEmpty: "Hiện từ 5.000 won mỗi năm.",
      killedTitle: (count) => `Gói đã hủy ${count}`,
      verifiedMark: " · đã xác nhận",
      pendingMark: " · chờ xác nhận",
      reviveShort: "Khôi phục",
      shareButton: "Chia sẻ kết quả",
      copied: "Đã sao chép vào bộ nhớ tạm",
      moreClose: "Thu gọn",
      moreOpen: (count) => `Xem thêm ${count}`,
      chargedTitle: "Có thể việc hủy chưa thành công",
      chargedBody:
        "Nếu bạn bị trừ tiền vào ngày thanh toán đầu tiên,\nchúng tôi sẽ đặt lại thành đang đăng ký.\nHủy xong, nhấn “Đã hủy” lần nữa\nthì sẽ tính là tiết kiệm từ ngày đó.",
      chargedConfirm: "Đặt lại",
    },
    appChart: {
      title: (year) => `Tiền giữ được theo tháng, ${year}`,
      byMonth: "Theo tháng",
      cumulative: "Cộng dồn",
      empty:
        "Năm nay chưa đến ngày thanh toán nào của các gói đã hủy. Khi qua, tháng đó sẽ được cộng dồn.",
      cumulativeUntil: (m) => `Cộng dồn tháng 1–${Number(m)}`,
      scheduledMonth: (month) => `${viM(month)} · dự kiến`,
      split: (month, past, later) =>
        `${viM(month)} · đã chặn ${past} · ngày thanh toán còn lại ${later}`,
      blockedMonth: (month) => `${viM(month)} · đã chặn`,
      barLabel: (month, amount, future) =>
        `${viM(month)} ${amount} ${future ? "dự kiến" : "đã chặn"}`,
      blocked: "Khoản trừ đã chặn",
      upcomingThisMonth: "Ngày thanh toán còn lại tháng này",
      scheduled: "Dự kiến",
      untilYearEnd: (amount) => `Đến cuối năm sẽ chặn thêm +${amount}`,
      unknown: (count) => `${count} gói không xếp vào biểu đồ được vì không rõ tháng thanh toán.`,
      cumulativeLabel: "Tiền giữ được từ đầu năm đến nay",
    },
    income: {
      title: "Gói đăng ký so với thu nhập tháng",
      edit: "Sửa thu nhập",
      askTitle: "Gói đăng ký chiếm bao nhiêu thu nhập?",
      askHint: "Nhập thu nhập tháng để xem tỷ lệ trước và sau khi hủy.",
      enter: "Nhập thu nhập tháng",
      basis: (income) => `Theo thu nhập tháng ${income} (bạn nhập)`,
      now: "Gói hiện tại",
      savedPart: "Đã cắt nhờ hủy",
      rest: "Phần còn lại",
      over: (amount) => `Gói đăng ký tốn hơn thu nhập tháng ${amount}`,
      overHint:
        "Nếu nhập sai thu nhập, hãy sửa. Nếu đúng, hãy bắt đầu từ các gói “Có thể tạm dừng” trong hóa đơn trên bảng điều khiển.",
      reenter: "Nhập lại thu nhập",
      before: "Trước",
      current: "Giờ",
      lowered: (diff) => `▼ Tỷ lệ gói đăng ký giảm ${diff} điểm`,
      sheet: "Nhập thu nhập tháng",
      formTitle: "Cho chúng tôi biết thu nhập tháng của bạn",
      formHint:
        "Nhập lương, tiền tiêu vặt hoặc ngân sách sinh hoạt. Chỉ dùng để tính tỷ lệ gói đăng ký và chỉ lưu trên thiết bị này.",
      ariaLabel: "Thu nhập tháng (won)",
      perMonth: "/ tháng",
      readout: (amount) => `${amount} mỗi tháng`,
      unitHint: "Nhập số rồi nhấn đơn vị để thêm vào (3 → 100k = 300.000)",
      units: ["10k", "100k", "1M", "10M"],
      won: (value) => `${Number(value).toLocaleString("vi-VN")} won`,
      clear: "Xóa",
      save: "Lưu",
      removeSaved: "Xóa thu nhập đã lưu",
      numberLocale: "vi-VN",
    },
  },
};

export const fr: Widen<typeof ko> = {
  savings: {
    page: {
      title: "Économies et argent préservé",
      subtitle: "Ce que la résiliation vous fait économiser, et ce que vous avez réellement gardé.",
      reviewLink: "Voir le bilan de l'année →",
      emptyTitle: "Aucun abonnement résilié pour l'instant",
      emptyHint:
        "Essayez de résilier depuis le tableau de bord un abonnement que vous n'utilisez presque pas.",
      goDashboard: "Aller au tableau de bord →",
      rewardsTitle: "Ce qu'une année d'économies pourrait acheter",
      rewardsEmpty: "Affiché à partir de 5 000 ₩ par an.",
      rewardOf: (name) => `En ${name}`,
      killedTitle: (count) => `Abonnements résiliés (${count})`,
      share: "Partager mon résultat",
      copied: "Copié",
      annualSaving: (amount) => `${amount} économisés par an`,
      monthlyBilled: (monthly) => `(${monthly}/mois)`,
      perMonth: (amount) => `${amount}/mois`,
      revive: "Rétablir",
    },
    rewardNames: {
      latte: "cafés latte",
      chicken: "poulets frits",
      dinner: "dîners gastronomiques",
      trip: "voyages à l'étranger",
    },
    share: {
      title: "Résultat de la détox d'abonnements SubSlash",
      confirmedLine: (confirmed, annual) =>
        `J'ai résilié des abonnements et gardé ${confirmed}. En restant résilié, j'économise ${annual} par an !`,
      plannedLine: (annual) => `J'ai résilié des abonnements et j'économiserai ${annual} par an !`,
      text: (level, line, headline, url) =>
        `Détox d'abonnements SubSlash ${level}\n${line} ${headline}\nVoir le résultat : ${url}`,
    },
    detox: {
      label: "Niveau de détox d'abonnements",
      saved: "Argent gardé",
      max: "Vous êtes au niveau maximal. Vérifiez s'il reste des abonnements à surveiller.",
      next: (amount, title, level) =>
        `Gardez encore ${amount} pour atteindre ${title} (Lv.${level}).`,
    },
    killCheck: {
      verified: "Confirmé : plus de prélèvement après la résiliation",
      due: (date) => `Prélèvement du ${date} non confirmé · `,
      dueLink: "Répondre sur le tableau de bord",
      waiting: (date) =>
        `Une fois passée la première date de prélèvement après la résiliation (${date}), nous vérifierons que le prélèvement s'est arrêté`,
      unknown:
        "La date de résiliation ou le mois de prélèvement est inconnu : impossible de choisir une date pour vérifier l'arrêt du prélèvement",
    },
    basis: {
      title: "Les règles des niveaux ont changé",
      close: "Fermer",
      body: "Au lieu du prix annuel qui montait dès la résiliation, votre niveau dépend désormais de l'« Argent gardé », confirmé comme n'étant plus prélevé.",
      change: (before, now) => `Avant : ${before} → Maintenant : ${now}`,
      answer:
        "À chaque date de prélèvement passée après la résiliation, indiquez si le prélèvement s'est arrêté et votre niveau remontera. ",
      answerLink: "Répondre sur le tableau de bord →",
    },
    killedCard: { services: (count) => `${count} service${svPl(count, "", "s")}` },
    defense: {
      title: (year) => `Argent préservé par mois, ${year}`,
      intro:
        "Ce qui aurait été prélevé à chaque date après la résiliation. Inclut les montants non encore confirmés ; les montants confirmés figurent dans « Argent gardé » en haut.",
      past: (m) =>
        Number(m) === 1
          ? "Prélèvements bloqués en janvier"
          : `Prélèvements bloqués de janvier à ${frM(m)}`,
      future: (m) =>
        Number(m) < 12 ? `À garder de ${frM(Number(m) + 1)} à décembre` : "Plus aucun mois",
      empty:
        "Aucune date de prélèvement de vos abonnements résiliés n'est encore passée cette année. Une fois passée, le mois se remplit.",
      blocked: "Prélèvements bloqués",
      scheduled: "Prévu (ce qui aurait été prélevé sans résiliation)",
      month: (month) => frM(month).slice(0, 4),
      barLabel: (month, amount, future) => `${frM(month)} ${amount} ${future ? "prévu" : "bloqué"}`,
      activeScheduled: "prévu — ce qui aurait été prélevé sans résiliation",
      activeNow: "prélèvements bloqués ce mois-ci",
      activePast: "prélèvements bloqués",
      table: "Voir en tableau",
      colMonth: "Mois",
      colAmount: "Montant",
      colKind: "Type",
      kindScheduled: "Prévu",
      kindBlocked: "Bloqué",
      unknown: (count) =>
        `${count} abonnement${svPl(count, "", "s")} annuel${svPl(count, "", "s")} au mois de prélèvement inconnu ne peu${svPl(count, "t", "vent")} pas être placé${svPl(count, "", "s")} dans un mois et ${svPl(count, "est exclu", "sont exclus")} du graphique. Indiquez le mois de prélèvement dans les détails de l'abonnement pour l'inclure.`,
    },
    breakdown: {
      title: "Économies par service",
      subtitle: "Voyez quelle résiliation a préservé le plus d'argent.",
      annual: "Équivalent annuel",
      yearEnd: (year) => `Jusqu'à fin ${year}`,
      unset: "Mois de prélèvement non défini",
      yearEndNote:
        "Inclut les dates de prélèvement restantes. Ce qui est déjà gardé et ce qui reste à venir sont séparés dans le graphique mensuel.",
      yearEndUnknown: (count) =>
        `${count} abonnement${svPl(count, "", "s")} annuel${svPl(count, "", "s")} au mois de prélèvement inconnu ne peu${svPl(count, "t", "vent")} pas être classé${svPl(count, "", "s")} avant ou après la résiliation et ${svPl(count, "est exclu", "sont exclus")} du total. Indiquez le mois de prélèvement dans les détails pour l'inclure.`,
      top: (name, percent) =>
        `La résiliation de ${name} représente ${percent} % de toutes les économies.`,
      total: (amount) => `Total ${amount}`,
    },
    review: {
      back: "← Économies",
      prevYear: (year) => `Bilan ${year}`,
      thisYear: "Bilan de l'année",
      title: (year) => `Bilan des abonnements ${year}`,
      completeNote: (year) => `Le relevé de toute l'année ${year}.`,
      partialNote: (month, day) =>
        `Relevé jusqu'au ${day} ${frM(month)}. Il deviendra le bilan annuel à la fin de l'année.`,
      asReceipt: "Voir en ticket",
      share: "Partager mon bilan",
      copied: "Copié dans le presse-papiers !",
      scopeFull: (year) => String(year),
      scopeSoFar: (year) => `${year} jusqu'ici`,
      defendedTitle: (scope) => `${scope} : prélèvements bloqués grâce à la résiliation`,
      confirmedBefore: "Dont l'argent gardé — confirmé comme n'étant plus prélevé — s'élève à ",
      confirmedAfter: ".",
      pendingNote: (amount) =>
        ` Indiquez sur le tableau de bord si les ${amount} en attente se sont arrêtés pour qu'ils deviennent de l'argent gardé.`,
      scheduledNote: (amount) =>
        `Encore ${amount} seront gardés d'ici la fin de l'année. C'est ce qui aurait été prélevé sans résiliation.`,
      unknownNote: (count) =>
        `${count} abonnement${svPl(count, "", "s")} annuel${svPl(count, "", "s")} au mois de prélèvement inconnu ${svPl(count, "a été exclu", "ont été exclus")} car on ne sait pas quand ${svPl(count, "il est prélevé", "ils sont prélevés")}.`,
      fxHistorical:
        "Les paiements passés en dollars et le coût par utilisation au check-in ont été convertis au taux publié du jour (BCE). Il peut différer légèrement de celui de votre banque. Les montants à venir et la répartition des dépenses utilisent le taux que vous avez réglé.",
      fxCurrent:
        "Les taux des dates de prélèvement n'ont pas pu être récupérés : les montants en dollars utilisent le taux que vous avez réglé.",
      killedTitle: (scope, count) => `${scope} : ${count} résilié${svPl(count, "", "s")}`,
      killedNone: (year) => `Vous n'avez résilié aucun abonnement en ${year}.`,
      killedDay: (month, day) => `${day} ${frM(month)}`,
      killedAtUnknown: (count) =>
        `${count} sans date de résiliation enregistrée ${svPl(count, "a été exclu", "ont été exclus")} car on ne sait pas en quelle année ${svPl(count, "il a été résilié", "ils ont été résiliés")}.`,
      spendTitle: "Répartition des dépenses de vos abonnements actuels",
      spendPast:
        "Les abonnements des années passées ne sont pas enregistrés et ne peuvent pas être affichés.",
      spendNone: "Vous n'avez aucun abonnement pour l'instant.",
      typeLabel: "Profil de dépenses",
      categoryCount: (count) => String(count),
      annualOf: (amount) => `${amount} par an`,
      spendNote: (annual) =>
        `Votre part si vous payiez vos abonnements actuels toute l'année (${annual} par an). L'appli n'a pas l'historique des paiements, cela peut différer de ce qui a réellement été prélevé cette année.`,
      checkInsTitle: (scope) => `${scope} : la valeur selon les check-ins`,
      checkInsNone: (year) =>
        `Aucun check-in en ${year}, rien à comparer. Faites un check-in dans les détails d'un abonnement et il apparaîtra ici.`,
      cheapestLabel: "Le moins cher par utilisation",
      checkedLabel: "Service avec check-in",
      priciestLabel: "Le plus cher par utilisation",
      mostUsedLabel: "Le plus utilisé",
      perUseValue: (amount, count) =>
        `${amount} par utilisation · ${count} utilisation${svPl(count, "", "s")}`,
      mostUsedValue: (count) => `${count} utilisation${svPl(count, "", "s")} en 30 jours`,
      killedMark: "(résilié)",
      checkInsNote: (year) =>
        `Basé sur le dernier check-in de ${year} de chaque service. Le nombre d'utilisations est celui saisi au check-in et peut différer de l'usage réel.`,
      shareTitle: (year) => `Bilan des abonnements SubSlash ${year}`,
      shareText: (scope, killed, blocked, confirmedLine, type, url) =>
        `Bilan des abonnements SubSlash ${scope}\n${killed} abonnement${svPl(killed, "", "s")} résilié${svPl(killed, "", "s")} · prélèvements bloqués ${blocked}${confirmedLine}${type ? `\nProfil de dépenses : ${type}` : ""}\nVoir le bilan : ${url}`,
      shareConfirmed: (amount) => ` · dont ${amount} gardés`,
    },
    spendingType: {
      focusedTitle: (category) => `Axé ${category}`,
      focusedDetail: (category, percent) =>
        `${percent} % de vos dépenses d'abonnements vont à ${category}.`,
      spreadTitle: "Bien réparti",
      spreadDetail: (count) =>
        `Vos dépenses sont réparties sur ${count} domaines, et même le plus gros fait moins de la moitié.`,
    },
    sharedPage: {
      badge: "Certificat de détox d'abonnements SubSlash",
      nextLevel: (title, remaining) => `Encore ${remaining} à garder pour « ${title} »`,
      heroTitle: "Abonnements dormants trouvés et résiliés !",
      heroSub: "J'ai trouvé les abonnements prélevés chaque mois et je les ai résiliés.",
      kept: "Argent gardé",
      keptNote: (verified) =>
        `Confirmé comme non prélevé à la date suivant la résiliation · ${verified} confirmé${svPl(verified, "", "s")}`,
      keepAnnual: (annual, headline) =>
        `En restant résilié : ${annual} économisés par an${headline ? ` · ${headline}` : ""}`,
      expected: "Économie annuelle estimée en restant résilié",
      legacy:
        "C'est un lien de partage à l'ancien format. Il n'a pas de montant confirmé, seule l'estimation annuelle est affichée.",
      killedLabel: "Abonnements résiliés",
      rewardsTitle: "Ce qu'une année d'économies pourrait acheter",
      ctaTitle: "De l'argent fuit-il par des abonnements oubliés ?",
      ctaBody:
        "SubSlash calcule le vrai coût de chaque utilisation pour que vous trouviez et résiliiez ceux qui valent peu.",
      ctaButton: "Commencer ma détox d'abonnements (gratuit)",
      noSignup: "Sans inscription. Utilisez-le directement dans votre navigateur.",
      home: "Aller à l'accueil de SubSlash",
    },
    sharedReview: {
      invalidTitle: "Ce lien de bilan n'est pas valide",
      invalidBody: "Le lien est coupé ou mal formé, le bilan ne peut pas être affiché.",
      badge: (year) => `Bilan des abonnements SubSlash ${year}`,
      confirmed: (amount) => `Dont ${amount} d'argent gardé, confirmé comme n'étant plus prélevé`,
      killedLabel: (scope) => `${scope} : abonnements résiliés`,
      typeLabel: "Profil de dépenses selon les abonnements actuels",
      ctaTitle: "Envie de faire le tri dans votre propre année ?",
      ctaButton: "Commencer à trier mes abonnements (gratuit)",
    },
    app: {
      title: "Économies",
      reviewLink: "Bilan de l'année →",
      emptyTitle: "Aucun abonnement résilié pour l'instant",
      emptyHint:
        "Résiliez un abonnement que vous utilisez à peine et l'argent gardé s'accumulera ici.",
      goDashboard: "Aller au tableau de bord",
      kept: "Argent gardé jusqu'ici",
      pending: "En attente de confirmation",
      annual: "Sur un an en restant résilié",
      maxLevel: "Vous êtes au niveau maximal",
      toNext: (level, remaining) => `${remaining} jusqu'au Lv.${level}`,
      stopped: (name, date) => `${name} · le prélèvement du ${date} s'est-il arrêté ?`,
      yes: "Il s'est arrêté",
      charged: "J'ai été prélevé",
      whereTitle: "Où vous économisez",
      perYear: "Par an",
      upcomingTitle: "Protection à venir",
      upcomingNote: "Jours où vous auriez été prélevé",
      today: "Aujourd'hui",
      inDays: (days) => `Dans ${days} jour${svPl(days, "", "s")}`,
      dayMonth: (month) => frM(month).slice(0, 4),
      undated: (count) =>
        `${count} sans mois de prélèvement ${svPl(count, "est exclu", "sont exclus")} car la date est inconnue.`,
      rewardsTitle: "Une année d'économies, c'est",
      rewardsEmpty: "Affiché à partir de 5 000 ₩ par an.",
      killedTitle: (count) => `Abonnements résiliés ${count}`,
      verifiedMark: " · confirmé",
      pendingMark: " · en attente",
      reviveShort: "Rétablir",
      shareButton: "Partager mon résultat",
      copied: "Copié dans le presse-papiers",
      moreClose: "Afficher moins",
      moreOpen: (count) => `Afficher ${count} de plus`,
      chargedTitle: "La résiliation n'a peut-être pas abouti",
      chargedBody:
        "Si vous avez été prélevé à la première date,\nnous le remettons en abonnement actif.\nUne fois la résiliation terminée, touchez à nouveau « Résilié »\net cela comptera comme économie à partir de ce jour.",
      chargedConfirm: "Remettre",
    },
    appChart: {
      title: (year) => `Argent préservé par mois, ${year}`,
      byMonth: "Par mois",
      cumulative: "Cumul",
      empty:
        "Aucune date de prélèvement de vos abonnements résiliés n'est encore passée cette année. Le mois se remplit une fois passée.",
      cumulativeUntil: (m) => `Cumul janvier–${frM(m)}`,
      scheduledMonth: (month) => `${frM(month)} · prévu`,
      split: (month, past, later) => `${frM(month)} · bloqué ${past} · dates restantes ${later}`,
      blockedMonth: (month) => `${frM(month)} · bloqué`,
      barLabel: (month, amount, future) => `${frM(month)} ${amount} ${future ? "prévu" : "bloqué"}`,
      blocked: "Prélèvements bloqués",
      upcomingThisMonth: "Dates de prélèvement restantes ce mois-ci",
      scheduled: "Prévu",
      untilYearEnd: (amount) => `Encore +${amount} bloqués d'ici la fin de l'année`,
      unknown: (count) =>
        `${count} abonnement${svPl(count, "", "s")} n'${svPl(count, "a", "ont")} pas pu être placé${svPl(count, "", "s")} dans le graphique car le mois de prélèvement est inconnu.`,
      cumulativeLabel: "Argent préservé depuis le début de l'année",
    },
    income: {
      title: "Abonnements et revenu mensuel",
      edit: "Modifier le revenu",
      askTitle: "Quelle part de votre revenu vont aux abonnements ?",
      askHint:
        "Indiquez votre revenu mensuel et nous afficherons la part avant et après résiliation.",
      enter: "Saisir le revenu mensuel",
      basis: (income) => `Sur la base d'un revenu mensuel de ${income} (saisi par vous)`,
      now: "Abonnements actuels",
      savedPart: "Réduit par la résiliation",
      rest: "Le reste",
      over: (amount) => `Vos abonnements coûtent ${amount} de plus que votre revenu mensuel`,
      overHint:
        "Si vous avez mal saisi votre revenu, corrigez-le. Sinon, commencez par les abonnements « À mettre en pause » du ticket du tableau de bord.",
      reenter: "Ressaisir le revenu",
      before: "Avant",
      current: "Maintenant",
      lowered: (diff) => `▼ La part des abonnements a baissé de ${diff} points`,
      sheet: "Saisir le revenu mensuel",
      formTitle: "Indiquez votre revenu mensuel",
      formHint:
        "Salaire, argent de poche ou budget de vie. Il sert uniquement à calculer la part de vos abonnements et reste sur cet appareil.",
      ariaLabel: "Revenu mensuel (KRW)",
      perMonth: "/ mois",
      readout: (amount) => `${amount} par mois`,
      unitHint: "Tapez un nombre, puis touchez une unité pour l'ajouter (3 → 100k = 300 000)",
      units: ["10k", "100k", "1M", "10M"],
      won: (value) => `${Number(value).toLocaleString("fr-FR")} KRW`,
      clear: "Effacer",
      save: "Enregistrer",
      removeSaved: "Supprimer le revenu enregistré",
      numberLocale: "fr-FR",
    },
  },
};

export const es: Widen<typeof ko> = {
  savings: {
    page: {
      title: "Ahorro y dinero protegido",
      subtitle: "Lo que te ahorra cancelar y lo que de verdad has conservado.",
      reviewLink: "Ver el resumen del año →",
      emptyTitle: "Aún no has cancelado ninguna suscripción",
      emptyHint: "Prueba a cancelar desde el panel una suscripción que casi no usas.",
      goDashboard: "Ir al panel →",
      rewardsTitle: "Lo que podría comprar un año de ahorro",
      rewardsEmpty: "Se muestra desde 5.000 ₩ al año.",
      rewardOf: (name) => `En ${name}`,
      killedTitle: (count) => `Suscripciones canceladas (${count})`,
      share: "Compartir mi resultado",
      copied: "Copiado",
      annualSaving: (amount) => `Ahorras ${amount} al año`,
      monthlyBilled: (monthly) => `(${monthly}/mes)`,
      perMonth: (amount) => `${amount}/mes`,
      revive: "Restaurar",
    },
    rewardNames: {
      latte: "cafés con leche",
      chicken: "pollos fritos",
      dinner: "cenas de lujo",
      trip: "viajes al extranjero",
    },
    share: {
      title: "Resultado de la desintoxicación de suscripciones de SubSlash",
      confirmedLine: (confirmed, annual) =>
        `Cancelé suscripciones y conservé ${confirmed}. ¡Si sigo así ahorro ${annual} al año!`,
      plannedLine: (annual) => `¡Cancelé suscripciones y ahorraré ${annual} al año!`,
      text: (level, line, headline, url) =>
        `Desintoxicación de suscripciones SubSlash ${level}\n${line} ${headline}\nMira el resultado: ${url}`,
    },
    detox: {
      label: "Nivel de desintoxicación de suscripciones",
      saved: "Dinero conservado",
      max: "Estás en el nivel máximo. Revisa si quedan suscripciones que proteger.",
      next: (amount, title, level) =>
        `Conserva ${amount} más para llegar a ${title} (Lv.${level}).`,
    },
    killCheck: {
      verified: "Confirmado: no hubo cobros tras cancelar",
      due: (date) => `Sin confirmar si hubo cobro el ${date} · `,
      dueLink: "Responder en el panel",
      waiting: (date) =>
        `Cuando pase la primera fecha de cobro tras cancelar (${date}), comprobaremos que el cobro se detuvo`,
      unknown:
        "Se desconoce la fecha de cancelación o el mes de cobro, así que no se puede elegir una fecha para comprobar que el cobro se detuvo",
    },
    basis: {
      title: "Las reglas de nivel cambiaron",
      close: "Cerrar",
      body: "En vez del precio anual que subía solo con cancelar, tu nivel ahora sale del «Dinero conservado», confirmado como ya no cobrado.",
      change: (before, now) => `Antes: ${before} → Ahora: ${now}`,
      answer:
        "Cada vez que pase una fecha de cobro tras cancelar, di si el cobro se detuvo y tu nivel volverá a subir. ",
      answerLink: "Responder en el panel →",
    },
    killedCard: { services: (count) => `${count} servicio${svPl(count, "", "s")}` },
    defense: {
      title: (year) => `Dinero protegido por mes, ${year}`,
      intro:
        "Lo que se habría cobrado en cada fecha tras cancelar. Incluye importes aún sin confirmar; los confirmados están en «Dinero conservado» arriba.",
      past: (m) =>
        Number(m) === 1 ? "Cobros bloqueados en enero" : `Cobros bloqueados de enero a ${esM(m)}`,
      future: (m) =>
        Number(m) < 12 ? `Por conservar de ${esM(Number(m) + 1)} a diciembre` : "No quedan meses",
      empty:
        "Este año aún no ha pasado ninguna fecha de cobro de tus suscripciones canceladas. Cuando pase, ese mes se irá llenando.",
      blocked: "Cobros bloqueados",
      scheduled: "Previsto (lo que se habría cobrado sin cancelar)",
      month: (month) => esM(month).slice(0, 3),
      barLabel: (month, amount, future) =>
        `${esM(month)} ${amount} ${future ? "previsto" : "bloqueado"}`,
      activeScheduled: "previsto — lo que se habría cobrado sin cancelar",
      activeNow: "cobros bloqueados este mes",
      activePast: "cobros bloqueados",
      table: "Ver como tabla",
      colMonth: "Mes",
      colAmount: "Importe",
      colKind: "Tipo",
      kindScheduled: "Previsto",
      kindBlocked: "Bloqueado",
      unknown: (count) =>
        `${count} suscripci${svPl(count, "ón", "ones")} anual${svPl(count, "", "es")} con mes de cobro desconocido no se ${svPl(count, "puede", "pueden")} colocar en un mes y ${svPl(count, "queda", "quedan")} fuera del gráfico. Indica el mes de cobro en los detalles de la suscripción para incluirla.`,
    },
    breakdown: {
      title: "Ahorro por servicio",
      subtitle: "Mira qué cancelación conservó más dinero.",
      annual: "Equivalente anual",
      yearEnd: (year) => `Hasta fin de ${year}`,
      unset: "Mes de cobro sin definir",
      yearEndNote:
        "Incluye las fechas de cobro restantes. Lo ya conservado y lo que queda por venir se separan en el gráfico mensual.",
      yearEndUnknown: (count) =>
        `${count} suscripci${svPl(count, "ón", "ones")} anual${svPl(count, "", "es")} con mes de cobro desconocido no se ${svPl(count, "puede", "pueden")} clasificar como antes o después de cancelar y ${svPl(count, "queda", "quedan")} fuera del total. Indica el mes de cobro en los detalles para incluirla.`,
      top: (name, percent) => `Cancelar ${name} supone el ${percent} % de todo el ahorro.`,
      total: (amount) => `Total ${amount}`,
    },
    review: {
      back: "← Ahorro",
      prevYear: (year) => `Resumen de ${year}`,
      thisYear: "Resumen del año",
      title: (year) => `Resumen de suscripciones ${year}`,
      completeNote: (year) => `El registro de todo ${year}.`,
      partialNote: (month, day) =>
        `Registro hasta el ${day} de ${esM(month)}. Será el resumen de todo el año cuando termine.`,
      asReceipt: "Ver como ticket",
      share: "Compartir mi resumen",
      copied: "¡Copiado al portapapeles!",
      scopeFull: (year) => String(year),
      scopeSoFar: (year) => `${year} hasta ahora`,
      defendedTitle: (scope) => `${scope}: cobros bloqueados al cancelar`,
      confirmedBefore: "De esto, el dinero conservado — confirmado como ya no cobrado — es ",
      confirmedAfter: ".",
      pendingNote: (amount) =>
        ` Responde en el panel si los ${amount} pendientes de confirmar se detuvieron y pasarán a dinero conservado.`,
      scheduledNote: (amount) =>
        `Se conservarán otros ${amount} hasta fin de año. Es lo que se habría cobrado sin cancelar.`,
      unknownNote: (count) =>
        `${count} suscripci${svPl(count, "ón", "ones")} anual${svPl(count, "", "es")} con mes de cobro desconocido ${svPl(count, "quedó", "quedaron")} fuera porque no sabemos cuándo se cobra${svPl(count, "", "n")}.`,
      fxHistorical:
        "Los pagos pasados en dólares y el coste por uso al registrar se convirtieron al tipo publicado ese día (BCE). Puede diferir un poco del de tu banco. Lo que queda por conservar y el desglose de gastos usan el tipo que tienes configurado.",
      fxCurrent:
        "No se pudieron obtener los tipos de las fechas de cobro, así que los importes en dólares usan el tipo que tienes configurado.",
      killedTitle: (scope, count) => `${scope}: ${count} cancelada${svPl(count, "", "s")}`,
      killedNone: (year) => `No cancelaste ninguna suscripción en ${year}.`,
      killedDay: (month, day) => `${day} de ${esM(month)}`,
      killedAtUnknown: (count) =>
        `${count} sin fecha de cancelación registrada ${svPl(count, "quedó", "quedaron")} fuera porque no sabemos en qué año se cancel${svPl(count, "ó", "aron")}.`,
      spendTitle: "Desglose de gasto de tus suscripciones actuales",
      spendPast:
        "Las suscripciones de años anteriores no están registradas, así que no se pueden mostrar.",
      spendNone: "Ahora no tienes suscripciones.",
      typeLabel: "Tipo de gasto",
      categoryCount: (count) => String(count),
      annualOf: (amount) => `${amount} al año`,
      spendNote: (annual) =>
        `Tu parte si pagaras tus suscripciones actuales todo el año (${annual} al año). La app no tiene historial de pagos, así que puede diferir de lo cobrado de verdad este año.`,
      checkInsTitle: (scope) => `${scope}: valor según los registros`,
      checkInsNone: (year) =>
        `No hiciste registros en ${year}, así que no hay nada que comparar. Registra el uso en los detalles de una suscripción y se reunirá aquí.`,
      cheapestLabel: "Más barata por uso",
      checkedLabel: "Servicio registrado",
      priciestLabel: "Más cara por uso",
      mostUsedLabel: "Más usada",
      perUseValue: (amount, count) => `${amount} por uso · ${count} uso${svPl(count, "", "s")}`,
      mostUsedValue: (count) => `${count} uso${svPl(count, "", "s")} en 30 días`,
      killedMark: "(cancelada)",
      checkInsNote: (year) =>
        `Según el último registro de ${year} de cada servicio. El número de usos es el que escribiste al registrar y puede diferir del uso real.`,
      shareTitle: (year) => `Resumen de suscripciones SubSlash ${year}`,
      shareText: (scope, killed, blocked, confirmedLine, type, url) =>
        `Resumen de suscripciones SubSlash ${scope}\n${killed} suscripci${svPl(killed, "ón", "ones")} cancelada${svPl(killed, "", "s")} · cobros bloqueados ${blocked}${confirmedLine}${type ? `\nTipo de gasto: ${type}` : ""}\nMira el resumen: ${url}`,
      shareConfirmed: (amount) => ` · de ello conservado ${amount}`,
    },
    spendingType: {
      focusedTitle: (category) => `Centrado en ${category}`,
      focusedDetail: (category, percent) =>
        `El ${percent} % de tu gasto en suscripciones va a ${category}.`,
      spreadTitle: "Bien repartido",
      spreadDetail: (count) =>
        `Repartes el gasto en ${count} áreas, y ni la mayor llega a la mitad.`,
    },
    sharedPage: {
      badge: "Certificado de desintoxicación de suscripciones SubSlash",
      nextLevel: (title, remaining) => `Conserva ${remaining} más para «${title}»`,
      heroTitle: "¡Encontré y cancelé suscripciones dormidas!",
      heroSub: "Encontré las suscripciones que se cobraban cada mes y las cancelé.",
      kept: "Dinero conservado",
      keptNote: (verified) =>
        `Confirmado como no cobrado en la fecha tras cancelar · ${verified} confirmada${svPl(verified, "", "s")}`,
      keepAnnual: (annual, headline) =>
        `Si sigue cancelado, ahorras ${annual} al año${headline ? ` · ${headline}` : ""}`,
      expected: "Ahorro anual estimado si sigue cancelado",
      legacy:
        "Es un enlace de formato antiguo. No tiene importe confirmado, así que solo se muestra la estimación anual.",
      killedLabel: "Suscripciones canceladas",
      rewardsTitle: "Lo que podría comprar un año de ahorro",
      ctaTitle: "¿Se te escapa dinero por suscripciones olvidadas?",
      ctaBody:
        "SubSlash calcula lo que cuesta de verdad cada uso para que encuentres y canceles las que valen poco.",
      ctaButton: "Empezar mi desintoxicación (gratis)",
      noSignup: "Sin registro. Úsalo directamente en el navegador.",
      home: "Ir al inicio de SubSlash",
    },
    sharedReview: {
      invalidTitle: "Este enlace de resumen no es válido",
      invalidBody:
        "El enlace está cortado o tiene un formato incorrecto, así que no se puede mostrar el resumen.",
      badge: (year) => `Resumen de suscripciones SubSlash ${year}`,
      confirmed: (amount) =>
        `De esto, ${amount} es dinero conservado, confirmado como ya no cobrado`,
      killedLabel: (scope) => `${scope}: suscripciones canceladas`,
      typeLabel: "Tipo de gasto según las suscripciones actuales",
      ctaTitle: "¿Quieres ordenar tu propio año?",
      ctaButton: "Empezar a ordenar mis suscripciones (gratis)",
    },
    app: {
      title: "Ahorro",
      reviewLink: "Resumen del año →",
      emptyTitle: "Aún no has cancelado ninguna suscripción",
      emptyHint:
        "Cancela una suscripción que casi no uses y el dinero conservado se irá sumando aquí.",
      goDashboard: "Ir al panel",
      kept: "Dinero conservado hasta ahora",
      pending: "Pendiente de confirmar",
      annual: "Un año si sigue cancelada",
      maxLevel: "Estás en el nivel máximo",
      toNext: (level, remaining) => `${remaining} hasta Lv.${level}`,
      stopped: (name, date) => `${name} · ¿se detuvo el cobro del ${date}?`,
      yes: "Se detuvo",
      charged: "Me cobraron",
      whereTitle: "Dónde ahorras",
      perYear: "Al año",
      upcomingTitle: "Protección próxima",
      upcomingNote: "Días en que te habrían cobrado",
      today: "Hoy",
      inDays: (days) => `En ${days} día${svPl(days, "", "s")}`,
      dayMonth: (month) => esM(month).slice(0, 3),
      undated: (count) =>
        `${count} sin mes de cobro ${svPl(count, "queda", "quedan")} fuera porque se desconoce la fecha.`,
      rewardsTitle: "Un año de ahorro equivale a",
      rewardsEmpty: "Se muestra desde 5.000 ₩ al año.",
      killedTitle: (count) => `Suscripciones canceladas ${count}`,
      verifiedMark: " · confirmada",
      pendingMark: " · pendiente",
      reviveShort: "Restaurar",
      shareButton: "Compartir mi resultado",
      copied: "Copiado al portapapeles",
      moreClose: "Mostrar menos",
      moreOpen: (count) => `Mostrar ${count} más`,
      chargedTitle: "Puede que la cancelación no se completara",
      chargedBody:
        "Si te cobraron en la primera fecha,\nla volveremos a poner como activa.\nCuando termines de cancelar, toca «Cancelada» de nuevo\ny contará como ahorro desde ese día.",
      chargedConfirm: "Volver a activa",
    },
    appChart: {
      title: (year) => `Dinero protegido por mes, ${year}`,
      byMonth: "Por mes",
      cumulative: "Acumulado",
      empty:
        "Este año aún no ha pasado ninguna fecha de cobro de tus suscripciones canceladas. Se irá sumando en ese mes cuando pase.",
      cumulativeUntil: (m) => `Acumulado enero–${esM(m)}`,
      scheduledMonth: (month) => `${esM(month)} · previsto`,
      split: (month, past, later) =>
        `${esM(month)} · bloqueado ${past} · fechas restantes ${later}`,
      blockedMonth: (month) => `${esM(month)} · bloqueado`,
      barLabel: (month, amount, future) =>
        `${esM(month)} ${amount} ${future ? "previsto" : "bloqueado"}`,
      blocked: "Cobros bloqueados",
      upcomingThisMonth: "Fechas de cobro restantes este mes",
      scheduled: "Previsto",
      untilYearEnd: (amount) => `Se bloquearán otros +${amount} hasta fin de año`,
      unknown: (count) =>
        `${count} suscripci${svPl(count, "ón", "ones")} no se ${svPl(count, "pudo", "pudieron")} poner en el gráfico porque se desconoce el mes de cobro.`,
      cumulativeLabel: "Dinero protegido en lo que va de año",
    },
    income: {
      title: "Suscripciones frente a ingresos mensuales",
      edit: "Editar ingresos",
      askTitle: "¿Qué parte de tus ingresos se llevan las suscripciones?",
      askHint:
        "Escribe tus ingresos mensuales y te mostraremos la parte antes y después de cancelar.",
      enter: "Escribir ingresos mensuales",
      basis: (income) => `Con unos ingresos mensuales de ${income} (escritos por ti)`,
      now: "Suscripciones ahora",
      savedPart: "Recortado al cancelar",
      rest: "El resto",
      over: (amount) => `Tus suscripciones cuestan ${amount} más que tus ingresos mensuales`,
      overHint:
        "Si escribiste mal tus ingresos, corrígelos. Si están bien, empieza por las suscripciones «Se puede pausar» del ticket del panel.",
      reenter: "Volver a escribir ingresos",
      before: "Antes",
      current: "Ahora",
      lowered: (diff) => `▼ La parte de las suscripciones bajó ${diff} puntos`,
      sheet: "Escribir ingresos mensuales",
      formTitle: "Dinos tus ingresos mensuales",
      formHint:
        "Sueldo, paga o presupuesto para vivir. Solo se usa para calcular la parte de tus suscripciones y se queda en este dispositivo.",
      ariaLabel: "Ingresos mensuales (KRW)",
      perMonth: "/ mes",
      readout: (amount) => `${amount} al mes`,
      unitHint: "Escribe un número y toca una unidad para añadirla (3 → 100k = 300.000)",
      units: ["10k", "100k", "1M", "10M"],
      won: (value) => `${Number(value).toLocaleString("es-ES")} KRW`,
      clear: "Borrar",
      save: "Guardar",
      removeSaved: "Borrar los ingresos guardados",
      numberLocale: "es-ES",
    },
  },
};

export const de: Widen<typeof ko> = {
  savings: {
    page: {
      title: "Ersparnis & geschütztes Geld",
      subtitle: "Was dir Kündigen spart und was du wirklich behalten hast.",
      reviewLink: "Jahresrückblick ansehen →",
      emptyTitle: "Noch keine gekündigten Abos",
      emptyHint: "Kündige in der Übersicht ein Abo, das du kaum nutzt.",
      goDashboard: "Zur Übersicht →",
      rewardsTitle: "Was ein Jahr Ersparnis kaufen könnte",
      rewardsEmpty: "Ab 5.000 ₩ im Jahr angezeigt.",
      rewardOf: (name) => `In ${name}`,
      killedTitle: (count) => `Gekündigte Abos (${count})`,
      share: "Mein Ergebnis teilen",
      copied: "Kopiert",
      annualSaving: (amount) => `${amount} Ersparnis im Jahr`,
      monthlyBilled: (monthly) => `(${monthly}/Monat)`,
      perMonth: (amount) => `${amount}/Monat`,
      revive: "Wiederherstellen",
    },
    rewardNames: {
      latte: "Milchkaffees",
      chicken: "Brathähnchen",
      dinner: "Gourmet-Abendessen",
      trip: "Auslandsreisen",
    },
    share: {
      title: "SubSlash Abo-Detox-Ergebnis",
      confirmedLine: (confirmed, annual) =>
        `Ich habe Abos gekündigt und ${confirmed} behalten. Bleibt es gekündigt, spare ich ${annual} im Jahr!`,
      plannedLine: (annual) => `Ich habe Abos gekündigt und spare ${annual} im Jahr!`,
      text: (level, line, headline, url) =>
        `SubSlash Abo-Detox ${level}\n${line} ${headline}\nErgebnis ansehen: ${url}`,
    },
    detox: {
      label: "Abo-Detox-Stufe",
      saved: "Behaltenes Geld",
      max: "Du bist auf der höchsten Stufe. Schau, ob noch Abos zu schützen sind.",
      next: (amount, title, level) =>
        `Behalte noch ${amount}, um ${title} (Lv.${level}) zu erreichen.`,
    },
    killCheck: {
      verified: "Bestätigt: nach der Kündigung keine Abbuchung mehr",
      due: (date) => `Nicht bestätigt, ob am ${date} abgebucht wurde · `,
      dueLink: "In der Übersicht antworten",
      waiting: (date) =>
        `Sobald der erste Abbuchungstag nach der Kündigung (${date}) vorbei ist, prüfen wir, ob die Abbuchung aufgehört hat`,
      unknown:
        "Kündigungsdatum oder Abbuchungsmonat unbekannt, daher lässt sich kein Tag zum Prüfen wählen",
    },
    basis: {
      title: "Die Stufenregeln haben sich geändert",
      close: "Schließen",
      body: "Statt des Jahrespreises, der schon beim Kündigen stieg, ergibt sich deine Stufe jetzt aus dem „Behaltenen Geld“, das als nicht mehr abgebucht bestätigt ist.",
      change: (before, now) => `Vorher: ${before} → Jetzt: ${now}`,
      answer:
        "Sag nach jedem Abbuchungstag nach der Kündigung, ob die Abbuchung aufgehört hat, und deine Stufe steigt wieder. ",
      answerLink: "In der Übersicht antworten →",
    },
    killedCard: { services: (count) => `${count} ${svPl(count, "Dienst", "Dienste")}` },
    defense: {
      title: (year) => `Geschütztes Geld nach Monat, ${year}`,
      intro:
        "Was an jedem Abbuchungstag nach der Kündigung abgebucht worden wäre. Enthält noch nicht bestätigte Beträge; bestätigte stehen oben unter „Behaltenes Geld“.",
      past: (m) =>
        Number(m) === 1
          ? "Im Januar verhinderte Abbuchungen"
          : `Januar–${deM(m)} verhinderte Abbuchungen`,
      future: (m) =>
        Number(m) < 12 ? `${deM(Number(m) + 1)}–Dezember noch zu behalten` : "Keine Monate mehr",
      empty:
        "Dieses Jahr ist noch kein Abbuchungstag deiner gekündigten Abos vorbei. Danach füllt sich der Monat.",
      blocked: "Verhinderte Abbuchungen",
      scheduled: "Geplant (was ohne Kündigung abgebucht worden wäre)",
      month: (month) => deM(month).slice(0, 3),
      barLabel: (month, amount, future) =>
        `${deM(month)} ${amount} ${future ? "geplant" : "verhindert"}`,
      activeScheduled: "geplant — was ohne Kündigung abgebucht worden wäre",
      activeNow: "diesen Monat verhinderte Abbuchungen",
      activePast: "verhinderte Abbuchungen",
      table: "Als Tabelle ansehen",
      colMonth: "Monat",
      colAmount: "Betrag",
      colKind: "Art",
      kindScheduled: "Geplant",
      kindBlocked: "Verhindert",
      unknown: (count) =>
        `${count} ${svPl(count, "Jahresabo", "Jahresabos")} mit unbekanntem Abbuchungsmonat ${svPl(count, "lässt", "lassen")} sich keinem Monat zuordnen und ${svPl(count, "fehlt", "fehlen")} im Diagramm. Trag den Abbuchungsmonat in den Abo-Details ein, um ${svPl(count, "es", "sie")} einzubeziehen.`,
    },
    breakdown: {
      title: "Ersparnis nach Dienst",
      subtitle: "Sieh, welche Kündigung am meisten Geld geschützt hat.",
      annual: "Aufs Jahr gerechnet",
      yearEnd: (year) => `Bis Ende ${year}`,
      unset: "Abbuchungsmonat nicht gesetzt",
      yearEndNote:
        "Enthält die restlichen Abbuchungstage. Bereits Behaltenes und Kommendes sind im Monatsdiagramm getrennt.",
      yearEndUnknown: (count) =>
        `${count} ${svPl(count, "Jahresabo", "Jahresabos")} mit unbekanntem Abbuchungsmonat ${svPl(count, "lässt", "lassen")} sich nicht vor oder nach der Kündigung einordnen und ${svPl(count, "fehlt", "fehlen")} in der Summe. Trag den Abbuchungsmonat in den Details ein, um ${svPl(count, "es", "sie")} einzubeziehen.`,
      top: (name, percent) =>
        `Die Kündigung von ${name} macht ${percent} % der gesamten Ersparnis aus.`,
      total: (amount) => `Gesamt ${amount}`,
    },
    review: {
      back: "← Ersparnis",
      prevYear: (year) => `Rückblick ${year}`,
      thisYear: "Jahresrückblick",
      title: (year) => `Abo-Rückblick ${year}`,
      completeNote: (year) => `Die Aufzeichnung des ganzen Jahres ${year}.`,
      partialNote: (month, day) =>
        `Aufzeichnung bis ${day}. ${deM(month)}. Nach Jahresende wird daraus der Jahresrückblick.`,
      asReceipt: "Als Beleg ansehen",
      share: "Meinen Rückblick teilen",
      copied: "In die Zwischenablage kopiert!",
      scopeFull: (year) => String(year),
      scopeSoFar: (year) => `${year} bisher`,
      defendedTitle: (scope) => `${scope}: durch Kündigen verhinderte Abbuchungen`,
      confirmedBefore: "Davon ist das behaltene Geld — als nicht mehr abgebucht bestätigt — ",
      confirmedAfter: ".",
      pendingNote: (amount) =>
        ` Sag in der Übersicht, ob die ${amount}, die auf Bestätigung warten, aufgehört haben, dann werden sie zu behaltenem Geld.`,
      scheduledNote: (amount) =>
        `Bis Jahresende kommen weitere ${amount} hinzu. Das wäre ohne Kündigung abgebucht worden.`,
      unknownNote: (count) =>
        `${count} ${svPl(count, "Jahresabo", "Jahresabos")} mit unbekanntem Abbuchungsmonat ${svPl(count, "wurde", "wurden")} weggelassen, weil wir nicht wissen, wann abgebucht wird.`,
      fxHistorical:
        "Frühere Dollarzahlungen und die Kosten pro Nutzung beim Eintragen wurden zum veröffentlichten Kurs des Tages (EZB) umgerechnet. Er kann leicht vom Kurs deiner Bank abweichen. Kommende Beträge und die Ausgabenaufteilung nutzen deinen aktuellen Kurs.",
      fxCurrent:
        "Die Kurse der Abbuchungstage konnten nicht abgerufen werden, daher nutzen Dollarbeträge deinen aktuellen Kurs.",
      killedTitle: (scope, count) => `${scope}: ${count} gekündigt`,
      killedNone: (year) => `Du hast ${year} keine Abos gekündigt.`,
      killedDay: (month, day) => `${day}. ${deM(month)}`,
      killedAtUnknown: (count) =>
        `${count} ohne eingetragenes Kündigungsdatum ${svPl(count, "wurde", "wurden")} weggelassen, weil wir das Kündigungsjahr nicht kennen.`,
      spendTitle: "Ausgabenaufteilung deiner aktuellen Abos",
      spendPast: "Abos früherer Jahre sind nicht aufgezeichnet und können nicht angezeigt werden.",
      spendNone: "Du hast gerade keine Abos.",
      typeLabel: "Ausgabentyp",
      categoryCount: (count) => String(count),
      annualOf: (amount) => `${amount} im Jahr`,
      spendNote: (annual) =>
        `Dein Anteil, wenn du deine aktuellen Abos das ganze Jahr zahlst (${annual} im Jahr). Die App kennt keine früheren Zahlungen, es kann also vom tatsächlich Abgebuchten abweichen.`,
      checkInsTitle: (scope) => `${scope}: Wert laut Einträgen`,
      checkInsNone: (year) =>
        `${year} gab es keine Einträge, also nichts zu vergleichen. Trag die Nutzung in den Abo-Details ein, dann sammelt sie sich hier.`,
      cheapestLabel: "Am günstigsten pro Nutzung",
      checkedLabel: "Eingetragener Dienst",
      priciestLabel: "Am teuersten pro Nutzung",
      mostUsedLabel: "Am häufigsten genutzt",
      perUseValue: (amount, count) => `${amount} pro Nutzung · ${count}-mal`,
      mostUsedValue: (count) => `${count}-mal in 30 Tagen`,
      killedMark: "(gekündigt)",
      checkInsNote: (year) =>
        `Basierend auf dem letzten Eintrag ${year} je Dienst. Die Anzahl der Nutzungen ist deine Eingabe und kann von der echten Nutzung abweichen.`,
      shareTitle: (year) => `SubSlash Abo-Rückblick ${year}`,
      shareText: (scope, killed, blocked, confirmedLine, type, url) =>
        `SubSlash Abo-Rückblick ${scope}\n${killed} ${svPl(killed, "Abo", "Abos")} gekündigt · verhinderte Abbuchungen ${blocked}${confirmedLine}${type ? `\nAusgabentyp: ${type}` : ""}\nRückblick ansehen: ${url}`,
      shareConfirmed: (amount) => ` · davon behalten ${amount}`,
    },
    spendingType: {
      focusedTitle: (category) => `Fokus ${category}`,
      focusedDetail: (category, percent) =>
        `${percent} % deiner Abo-Ausgaben entfallen auf ${category}.`,
      spreadTitle: "Gleichmäßig verteilt",
      spreadDetail: (count) =>
        `Du verteilst deine Ausgaben auf ${count} Bereiche, und selbst der größte liegt unter der Hälfte.`,
    },
    sharedPage: {
      badge: "SubSlash Abo-Detox-Zertifikat",
      nextLevel: (title, remaining) => `Noch ${remaining} bis „${title}“`,
      heroTitle: "Schlafende Abos gefunden und gekündigt!",
      heroSub: "Ich habe Abos gefunden, die jeden Monat abgebucht wurden, und sie gekündigt.",
      kept: "Behaltenes Geld",
      keptNote: (verified) =>
        `Am Abbuchungstag nach der Kündigung als nicht abgebucht bestätigt · ${verified} bestätigt`,
      keepAnnual: (annual, headline) =>
        `Bleibt es gekündigt, spart es ${annual} im Jahr${headline ? ` · ${headline}` : ""}`,
      expected: "Geschätzte Jahresersparnis, wenn es gekündigt bleibt",
      legacy:
        "Das ist ein Teilen-Link im alten Format. Er hat keinen bestätigten Betrag, daher wird nur die Jahresschätzung gezeigt.",
      killedLabel: "Gekündigte Abos",
      rewardsTitle: "Was ein Jahr Ersparnis kaufen könnte",
      ctaTitle: "Versickert Geld in vergessenen Abos?",
      ctaBody:
        "SubSlash berechnet, was jede Nutzung wirklich kostet, damit du die wenig wertvollen findest und kündigst.",
      ctaButton: "Mein Abo-Detox starten (kostenlos)",
      noSignup: "Ohne Anmeldung. Direkt im Browser nutzen.",
      home: "Zur SubSlash-Startseite",
    },
    sharedReview: {
      invalidTitle: "Dieser Rückblick-Link ist ungültig",
      invalidBody:
        "Der Link ist abgeschnitten oder falsch formatiert, daher kann der Rückblick nicht angezeigt werden.",
      badge: (year) => `SubSlash Abo-Rückblick ${year}`,
      confirmed: (amount) =>
        `Davon sind ${amount} behaltenes Geld, als nicht mehr abgebucht bestätigt`,
      killedLabel: (scope) => `${scope}: gekündigte Abos`,
      typeLabel: "Ausgabentyp nach aktuellen Abos",
      ctaTitle: "Willst du dein eigenes Jahr aufräumen?",
      ctaButton: "Meine Abos aufräumen (kostenlos)",
    },
    app: {
      title: "Ersparnis",
      reviewLink: "Jahresrückblick →",
      emptyTitle: "Noch keine gekündigten Abos",
      emptyHint: "Kündige ein Abo, das du kaum nutzt, und das behaltene Geld sammelt sich hier.",
      goDashboard: "Zur Übersicht",
      kept: "Bisher behaltenes Geld",
      pending: "Wartet auf Bestätigung",
      annual: "Ein Jahr, wenn es gekündigt bleibt",
      maxLevel: "Du bist auf der höchsten Stufe",
      toNext: (level, remaining) => `Noch ${remaining} bis Lv.${level}`,
      stopped: (name, date) => `${name} · hat die Abbuchung am ${date} aufgehört?`,
      yes: "Hat aufgehört",
      charged: "Wurde abgebucht",
      whereTitle: "Wo du sparst",
      perYear: "Pro Jahr",
      upcomingTitle: "Kommender Schutz",
      upcomingNote: "Tage, an denen abgebucht worden wäre",
      today: "Heute",
      inDays: (days) => `In ${days} ${svPl(days, "Tag", "Tagen")}`,
      dayMonth: (month) => deM(month).slice(0, 3),
      undated: (count) =>
        `${count} ohne Abbuchungsmonat ${svPl(count, "fehlt", "fehlen")}, weil das Datum unbekannt ist.`,
      rewardsTitle: "Ein Jahr Ersparnis entspricht",
      rewardsEmpty: "Ab 5.000 ₩ im Jahr angezeigt.",
      killedTitle: (count) => `Gekündigte Abos ${count}`,
      verifiedMark: " · bestätigt",
      pendingMark: " · wartet auf Bestätigung",
      reviveShort: "Wiederherstellen",
      shareButton: "Mein Ergebnis teilen",
      copied: "In die Zwischenablage kopiert",
      moreClose: "Weniger anzeigen",
      moreOpen: (count) => `${count} weitere anzeigen`,
      chargedTitle: "Die Kündigung hat vielleicht nicht geklappt",
      chargedBody:
        "Wenn am ersten Abbuchungstag abgebucht wurde,\nsetzen wir es wieder auf abonniert.\nWenn du fertig gekündigt hast, tippe erneut auf „Gekündigt“,\ndann zählt es ab diesem Tag als Ersparnis.",
      chargedConfirm: "Zurücksetzen",
    },
    appChart: {
      title: (year) => `Geschütztes Geld nach Monat, ${year}`,
      byMonth: "Monatlich",
      cumulative: "Gesamt",
      empty:
        "Dieses Jahr ist noch kein Abbuchungstag deiner gekündigten Abos vorbei. Danach sammelt es sich in diesem Monat.",
      cumulativeUntil: (m) => `Januar–${deM(m)} gesamt`,
      scheduledMonth: (month) => `${deM(month)} · geplant`,
      split: (month, past, later) =>
        `${deM(month)} · verhindert ${past} · restliche Abbuchungstage ${later}`,
      blockedMonth: (month) => `${deM(month)} · verhindert`,
      barLabel: (month, amount, future) =>
        `${deM(month)} ${amount} ${future ? "geplant" : "verhindert"}`,
      blocked: "Verhinderte Abbuchungen",
      upcomingThisMonth: "Restliche Abbuchungstage diesen Monat",
      scheduled: "Geplant",
      untilYearEnd: (amount) => `Bis Jahresende werden weitere +${amount} verhindert`,
      unknown: (count) =>
        `${count} ${svPl(count, "Abo konnte", "Abos konnten")} nicht ins Diagramm, weil der Abbuchungsmonat unbekannt ist.`,
      cumulativeLabel: "Dieses Jahr bisher geschütztes Geld",
    },
    income: {
      title: "Abos im Verhältnis zum Monatseinkommen",
      edit: "Einkommen bearbeiten",
      askTitle: "Welchen Anteil deines Einkommens nehmen Abos ein?",
      askHint:
        "Gib dein Monatseinkommen ein, dann zeigen wir den Anteil vor und nach dem Kündigen.",
      enter: "Monatseinkommen eingeben",
      basis: (income) => `Bei einem Monatseinkommen von ${income} (von dir eingegeben)`,
      now: "Abos jetzt",
      savedPart: "Durch Kündigen gespart",
      rest: "Der Rest",
      over: (amount) => `Deine Abos kosten ${amount} mehr als dein Monatseinkommen`,
      overHint:
        "Wenn du das Einkommen falsch eingegeben hast, korrigier es. Sonst fang mit den Abos „Kann pausieren“ im Beleg der Übersicht an.",
      reenter: "Einkommen neu eingeben",
      before: "Vorher",
      current: "Jetzt",
      lowered: (diff) => `▼ Abo-Anteil um ${diff} Prozentpunkte gesunken`,
      sheet: "Monatseinkommen eingeben",
      formTitle: "Sag uns dein Monatseinkommen",
      formHint:
        "Gehalt, Taschengeld oder Lebensbudget. Es wird nur für den Anteil deiner Abos genutzt und bleibt auf diesem Gerät.",
      ariaLabel: "Monatseinkommen (KRW)",
      perMonth: "/ Monat",
      readout: (amount) => `${amount} im Monat`,
      unitHint: "Gib eine Zahl ein und tippe eine Einheit, um sie anzuhängen (3 → 100k = 300.000)",
      units: ["10k", "100k", "1M", "10M"],
      won: (value) => `${Number(value).toLocaleString("de-DE")} KRW`,
      clear: "Löschen",
      save: "Speichern",
      removeSaved: "Gespeichertes Einkommen löschen",
      numberLocale: "de-DE",
    },
  },
};

export const pt: Widen<typeof ko> = {
  savings: {
    page: {
      title: "Economia e dinheiro protegido",
      subtitle: "O que cancelar economiza e o que você realmente guardou.",
      reviewLink: "Ver o resumo do ano →",
      emptyTitle: "Ainda não há assinaturas canceladas",
      emptyHint: "Tente cancelar pelo painel uma assinatura que você quase não usa.",
      goDashboard: "Ir para o painel →",
      rewardsTitle: "O que um ano de economia poderia comprar",
      rewardsEmpty: "Mostrado a partir de ₩5.000 por ano.",
      rewardOf: (name) => `Em ${name}`,
      killedTitle: (count) => `Assinaturas canceladas (${count})`,
      share: "Compartilhar meu resultado",
      copied: "Copiado",
      annualSaving: (amount) => `Economia de ${amount} por ano`,
      monthlyBilled: (monthly) => `(${monthly}/mês)`,
      perMonth: (amount) => `${amount}/mês`,
      revive: "Restaurar",
    },
    rewardNames: {
      latte: "cafés com leite",
      chicken: "frangos fritos",
      dinner: "jantares sofisticados",
      trip: "viagens ao exterior",
    },
    share: {
      title: "Resultado do detox de assinaturas SubSlash",
      confirmedLine: (confirmed, annual) =>
        `Cancelei assinaturas e guardei ${confirmed}. Mantendo cancelado, economizo ${annual} por ano!`,
      plannedLine: (annual) => `Cancelei assinaturas e vou economizar ${annual} por ano!`,
      text: (level, line, headline, url) =>
        `Detox de assinaturas SubSlash ${level}\n${line} ${headline}\nVeja o resultado: ${url}`,
    },
    detox: {
      label: "Nível de detox de assinaturas",
      saved: "Dinheiro guardado",
      max: "Você está no nível máximo. Veja se ainda há assinaturas a proteger.",
      next: (amount, title, level) => `Guarde mais ${amount} para chegar a ${title} (Lv.${level}).`,
    },
    killCheck: {
      verified: "Confirmado: sem cobrança depois de cancelar",
      due: (date) => `Não confirmado se houve cobrança em ${date} · `,
      dueLink: "Responder no painel",
      waiting: (date) =>
        `Quando passar a primeira data de cobrança após o cancelamento (${date}), vamos verificar se a cobrança parou`,
      unknown:
        "A data de cancelamento ou o mês de cobrança é desconhecido, então não dá para escolher uma data para verificar se a cobrança parou",
    },
    basis: {
      title: "As regras de nível mudaram",
      close: "Fechar",
      body: "Em vez do preço anual que subia só de cancelar, seu nível agora vem do “Dinheiro guardado”, confirmado como não mais cobrado.",
      change: (before, now) => `Antes: ${before} → Agora: ${now}`,
      answer:
        "A cada data de cobrança que passar depois de cancelar, diga se a cobrança parou e seu nível volta a subir. ",
      answerLink: "Responder no painel →",
    },
    killedCard: { services: (count) => `${count} serviço${svPl(count, "", "s")}` },
    defense: {
      title: (year) => `Dinheiro protegido por mês, ${year}`,
      intro:
        "O que teria sido cobrado em cada data após o cancelamento. Inclui valores ainda não confirmados; os confirmados estão em “Dinheiro guardado” no topo.",
      past: (m) =>
        Number(m) === 1
          ? "Cobranças bloqueadas em janeiro"
          : `Cobranças bloqueadas de janeiro a ${ptM(m)}`,
      future: (m) =>
        Number(m) < 12 ? `A guardar de ${ptM(Number(m) + 1)} a dezembro` : "Não restam meses",
      empty:
        "Neste ano ainda não passou nenhuma data de cobrança das assinaturas canceladas. Quando passar, o mês vai acumulando.",
      blocked: "Cobranças bloqueadas",
      scheduled: "Previsto (o que teria sido cobrado sem cancelar)",
      month: (month) => ptM(month).slice(0, 3),
      barLabel: (month, amount, future) =>
        `${ptM(month)} ${amount} ${future ? "previsto" : "bloqueado"}`,
      activeScheduled: "previsto — o que teria sido cobrado sem cancelar",
      activeNow: "cobranças bloqueadas neste mês",
      activePast: "cobranças bloqueadas",
      table: "Ver como tabela",
      colMonth: "Mês",
      colAmount: "Valor",
      colKind: "Tipo",
      kindScheduled: "Previsto",
      kindBlocked: "Bloqueado",
      unknown: (count) =>
        `${count} assinatura${svPl(count, "", "s")} anua${svPl(count, "l", "is")} com mês de cobrança desconhecido não ${svPl(count, "pode", "podem")} ser colocada${svPl(count, "", "s")} num mês e ${svPl(count, "fica", "ficam")} fora do gráfico. Defina o mês de cobrança nos detalhes da assinatura para incluir.`,
    },
    breakdown: {
      title: "Economia por serviço",
      subtitle: "Veja qual cancelamento guardou mais dinheiro.",
      annual: "Equivalente anual",
      yearEnd: (year) => `Até o fim de ${year}`,
      unset: "Mês de cobrança não definido",
      yearEndNote:
        "Inclui as datas de cobrança restantes. O que já foi guardado e o que ainda vem estão separados no gráfico mensal.",
      yearEndUnknown: (count) =>
        `${count} assinatura${svPl(count, "", "s")} anua${svPl(count, "l", "is")} com mês de cobrança desconhecido não ${svPl(count, "pode", "podem")} ser classificada${svPl(count, "", "s")} como antes ou depois do cancelamento e ${svPl(count, "fica", "ficam")} fora do total. Defina o mês de cobrança nos detalhes para incluir.`,
      top: (name, percent) => `Cancelar ${name} representa ${percent}% de toda a economia.`,
      total: (amount) => `Total ${amount}`,
    },
    review: {
      back: "← Economia",
      prevYear: (year) => `Resumo de ${year}`,
      thisYear: "Resumo do ano",
      title: (year) => `Resumo de assinaturas ${year}`,
      completeNote: (year) => `O registro de todo o ano de ${year}.`,
      partialNote: (month, day) =>
        `Registro até ${day} de ${ptM(month)}. Vira o resumo do ano inteiro depois que o ano acabar.`,
      asReceipt: "Ver como recibo",
      share: "Compartilhar meu resumo",
      copied: "Copiado para a área de transferência!",
      scopeFull: (year) => String(year),
      scopeSoFar: (year) => `${year} até agora`,
      defendedTitle: (scope) => `${scope}: cobranças bloqueadas ao cancelar`,
      confirmedBefore: "Disso, o dinheiro guardado — confirmado como não mais cobrado — é ",
      confirmedAfter: ".",
      pendingNote: (amount) =>
        ` Responda no painel se os ${amount} aguardando confirmação pararam e eles viram dinheiro guardado.`,
      scheduledNote: (amount) =>
        `Mais ${amount} serão guardados até o fim do ano. É o que teria sido cobrado sem cancelar.`,
      unknownNote: (count) =>
        `${count} assinatura${svPl(count, "", "s")} anua${svPl(count, "l", "is")} com mês de cobrança desconhecido ${svPl(count, "ficou", "ficaram")} de fora porque não sabemos quando ${svPl(count, "é cobrada", "são cobradas")}.`,
      fxHistorical:
        "Pagamentos passados em dólar e o custo por uso no registro foram convertidos pela taxa publicada do dia (BCE). Pode diferir um pouco da taxa do seu cartão. Os valores a guardar e a divisão de gastos usam a taxa que você definiu agora.",
      fxCurrent:
        "Não foi possível obter as taxas das datas de cobrança, então os valores em dólar usam a taxa que você definiu agora.",
      killedTitle: (scope, count) => `${scope}: ${count} cancelada${svPl(count, "", "s")}`,
      killedNone: (year) => `Você não cancelou nenhuma assinatura em ${year}.`,
      killedDay: (month, day) => `${day} de ${ptM(month)}`,
      killedAtUnknown: (count) =>
        `${count} sem data de cancelamento registrada ${svPl(count, "ficou", "ficaram")} de fora porque não sabemos em que ano ${svPl(count, "foi cancelada", "foram canceladas")}.`,
      spendTitle: "Divisão de gastos das assinaturas atuais",
      spendPast:
        "As assinaturas de anos anteriores não estão registradas, então não podem ser mostradas.",
      spendNone: "Você não tem assinaturas agora.",
      typeLabel: "Perfil de gastos",
      categoryCount: (count) => String(count),
      annualOf: (amount) => `${amount} por ano`,
      spendNote: (annual) =>
        `Sua parte se pagasse as assinaturas atuais o ano todo (${annual} por ano). O app não tem histórico de pagamentos, então pode diferir do que foi cobrado de fato este ano.`,
      checkInsTitle: (scope) => `${scope}: valor pelos registros`,
      checkInsNone: (year) =>
        `Você não fez registros em ${year}, então não há o que comparar. Registre o uso nos detalhes de uma assinatura e ele aparece aqui.`,
      cheapestLabel: "Mais barata por uso",
      checkedLabel: "Serviço registrado",
      priciestLabel: "Mais cara por uso",
      mostUsedLabel: "Mais usada",
      perUseValue: (amount, count) => `${amount} por uso · ${count} uso${svPl(count, "", "s")}`,
      mostUsedValue: (count) => `${count} uso${svPl(count, "", "s")} em 30 dias`,
      killedMark: "(cancelada)",
      checkInsNote: (year) =>
        `Com base no último registro de ${year} de cada serviço. O número de usos é o que você informou e pode diferir do uso real.`,
      shareTitle: (year) => `Resumo de assinaturas SubSlash ${year}`,
      shareText: (scope, killed, blocked, confirmedLine, type, url) =>
        `Resumo de assinaturas SubSlash ${scope}\n${killed} assinatura${svPl(killed, "", "s")} cancelada${svPl(killed, "", "s")} · cobranças bloqueadas ${blocked}${confirmedLine}${type ? `\nPerfil de gastos: ${type}` : ""}\nVeja o resumo: ${url}`,
      shareConfirmed: (amount) => ` · dos quais guardados ${amount}`,
    },
    spendingType: {
      focusedTitle: (category) => `Foco em ${category}`,
      focusedDetail: (category, percent) =>
        `${percent}% dos seus gastos com assinaturas vão para ${category}.`,
      spreadTitle: "Bem distribuído",
      spreadDetail: (count) =>
        `Você divide os gastos em ${count} áreas, e nem a maior chega à metade.`,
    },
    sharedPage: {
      badge: "Certificado de detox de assinaturas SubSlash",
      nextLevel: (title, remaining) => `Guarde mais ${remaining} para “${title}”`,
      heroTitle: "Encontrei e cancelei assinaturas esquecidas!",
      heroSub: "Encontrei as assinaturas cobradas todo mês e cancelei.",
      kept: "Dinheiro guardado",
      keptNote: (verified) =>
        `Confirmado como não cobrado na data após o cancelamento · ${verified} confirmada${svPl(verified, "", "s")}`,
      keepAnnual: (annual, headline) =>
        `Mantendo cancelado, economiza ${annual} por ano${headline ? ` · ${headline}` : ""}`,
      expected: "Economia anual estimada mantendo cancelado",
      legacy:
        "Este é um link de compartilhamento no formato antigo. Ele não tem valor confirmado, então só a estimativa anual é mostrada.",
      killedLabel: "Assinaturas canceladas",
      rewardsTitle: "O que um ano de economia poderia comprar",
      ctaTitle: "Tem dinheiro vazando por assinaturas esquecidas?",
      ctaBody:
        "O SubSlash calcula quanto cada uso realmente custa para você achar e cancelar as que valem pouco.",
      ctaButton: "Começar meu detox de assinaturas (grátis)",
      noSignup: "Sem cadastro. Use direto no navegador.",
      home: "Ir para a página inicial do SubSlash",
    },
    sharedReview: {
      invalidTitle: "Este link de resumo não é válido",
      invalidBody:
        "O link está cortado ou com formato errado, então o resumo não pode ser mostrado.",
      badge: (year) => `Resumo de assinaturas SubSlash ${year}`,
      confirmed: (amount) =>
        `Disso, ${amount} é dinheiro guardado, confirmado como não mais cobrado`,
      killedLabel: (scope) => `${scope}: assinaturas canceladas`,
      typeLabel: "Perfil de gastos pelas assinaturas atuais",
      ctaTitle: "Quer organizar o seu próprio ano?",
      ctaButton: "Começar a organizar minhas assinaturas (grátis)",
    },
    app: {
      title: "Economia",
      reviewLink: "Resumo do ano →",
      emptyTitle: "Ainda não há assinaturas canceladas",
      emptyHint:
        "Cancele uma assinatura que você quase não usa e o dinheiro guardado vai se acumulando aqui.",
      goDashboard: "Ir para o painel",
      kept: "Dinheiro guardado até agora",
      pending: "Aguardando confirmação",
      annual: "Um ano mantendo cancelado",
      maxLevel: "Você está no nível máximo",
      toNext: (level, remaining) => `${remaining} até o Lv.${level}`,
      stopped: (name, date) => `${name} · a cobrança de ${date} parou?`,
      yes: "Parou",
      charged: "Fui cobrado",
      whereTitle: "Onde você economiza",
      perYear: "Por ano",
      upcomingTitle: "Próxima proteção",
      upcomingNote: "Dias em que você seria cobrado",
      today: "Hoje",
      inDays: (days) => `Em ${days} dia${svPl(days, "", "s")}`,
      dayMonth: (month) => ptM(month).slice(0, 3),
      undated: (count) =>
        `${count} sem mês de cobrança ${svPl(count, "fica", "ficam")} de fora porque a data é desconhecida.`,
      rewardsTitle: "Um ano de economia compra",
      rewardsEmpty: "Mostrado a partir de ₩5.000 por ano.",
      killedTitle: (count) => `Assinaturas canceladas ${count}`,
      verifiedMark: " · confirmada",
      pendingMark: " · aguardando confirmação",
      reviveShort: "Restaurar",
      shareButton: "Compartilhar meu resultado",
      copied: "Copiado para a área de transferência",
      moreClose: "Mostrar menos",
      moreOpen: (count) => `Mostrar mais ${count}`,
      chargedTitle: "Talvez o cancelamento não tenha dado certo",
      chargedBody:
        "Se você foi cobrado na primeira data,\nvamos voltar para assinatura ativa.\nDepois de terminar o cancelamento, toque em “Cancelada” de novo\ne conta como economia a partir desse dia.",
      chargedConfirm: "Voltar",
    },
    appChart: {
      title: (year) => `Dinheiro protegido por mês, ${year}`,
      byMonth: "Por mês",
      cumulative: "Acumulado",
      empty:
        "Neste ano ainda não passou nenhuma data de cobrança das assinaturas canceladas. Quando passar, acumula naquele mês.",
      cumulativeUntil: (m) => `Acumulado janeiro–${ptM(m)}`,
      scheduledMonth: (month) => `${ptM(month)} · previsto`,
      split: (month, past, later) => `${ptM(month)} · bloqueado ${past} · datas restantes ${later}`,
      blockedMonth: (month) => `${ptM(month)} · bloqueado`,
      barLabel: (month, amount, future) =>
        `${ptM(month)} ${amount} ${future ? "previsto" : "bloqueado"}`,
      blocked: "Cobranças bloqueadas",
      upcomingThisMonth: "Datas de cobrança restantes neste mês",
      scheduled: "Previsto",
      untilYearEnd: (amount) => `Mais +${amount} serão bloqueados até o fim do ano`,
      unknown: (count) =>
        `${count} assinatura${svPl(count, "", "s")} não ${svPl(count, "pôde", "puderam")} entrar no gráfico porque o mês de cobrança é desconhecido.`,
      cumulativeLabel: "Dinheiro protegido neste ano até agora",
    },
    income: {
      title: "Assinaturas x renda mensal",
      edit: "Editar renda",
      askTitle: "Quanto da sua renda vai para assinaturas?",
      askHint: "Informe sua renda mensal e mostramos a parte antes e depois de cancelar.",
      enter: "Informar renda mensal",
      basis: (income) => `Com base numa renda mensal de ${income} (informada por você)`,
      now: "Assinaturas agora",
      savedPart: "Cortado ao cancelar",
      rest: "O resto",
      over: (amount) => `Suas assinaturas custam ${amount} a mais que sua renda mensal`,
      overHint:
        "Se você informou a renda errada, corrija. Se está certa, comece pelas assinaturas “Pode pausar” do recibo do painel.",
      reenter: "Informar a renda de novo",
      before: "Antes",
      current: "Agora",
      lowered: (diff) => `▼ A parte das assinaturas caiu ${diff} pontos`,
      sheet: "Informar renda mensal",
      formTitle: "Conte sua renda mensal",
      formHint:
        "Salário, mesada ou orçamento de vida. Só serve para calcular a parte das assinaturas e fica neste dispositivo.",
      ariaLabel: "Renda mensal (KRW)",
      perMonth: "/ mês",
      readout: (amount) => `${amount} por mês`,
      unitHint: "Digite um número e toque numa unidade para acrescentar (3 → 100k = 300.000)",
      units: ["10k", "100k", "1M", "10M"],
      won: (value) => `${Number(value).toLocaleString("pt-BR")} KRW`,
      clear: "Limpar",
      save: "Salvar",
      removeSaved: "Apagar a renda salva",
      numberLocale: "pt-BR",
    },
  },
};
