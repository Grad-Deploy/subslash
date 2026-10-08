import type { Widen } from "../types";

/** 문구 검사가 글자를 넘기기도 해서 숫자로 바꿔 비교한다. */
const one = (n: number) => Number(n) === 1;
const plural = (n: number, singular: string, pluralForm: string) =>
  one(n) ? singular : pluralForm;
const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const monthShort = (month: number) => EN_MONTHS[Number(month) - 1] ?? String(month);

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
      dateLocale: "ko-KR",
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
      services: (count) => `${count} ${plural(count, "service", "services")}`,
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
        `${count} yearly ${plural(count, "subscription", "subscriptions")} with an unknown billing month can't be placed in a month, so ${plural(count, "it is", "they are")} left out of the chart. Set the billing month in the subscription details to include ${plural(count, "it", "them")}.`,
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
        `${count} yearly ${plural(count, "subscription", "subscriptions")} with an unknown billing month can't be told apart as before or after cancelling, so ${plural(count, "it is", "they are")} left out of the total. Set the billing month in the subscription details to include ${plural(count, "it", "them")}.`,
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
        `${count} yearly ${plural(count, "subscription", "subscriptions")} with an unknown billing month ${plural(count, "was", "were")} left out because we can't tell when ${plural(count, "it is", "they are")} charged.`,
      fxHistorical:
        "Past dollar payments and the cost per use at check-in were converted at the published rate of that day (ECB). It may differ slightly from your card company's rate. Amounts still to be kept and the spending breakdown use the rate you set now.",
      fxCurrent:
        "The rates for the billing dates couldn't be fetched, so dollar amounts use the rate you set now.",
      killedTitle: (scope, count) => `${scope}: ${count} cancelled`,
      killedNone: (year) => `You didn't cancel any subscriptions in ${year}.`,
      killedDay: (month, day) => `${monthShort(month)} ${day}`,
      killedAtUnknown: (count) =>
        `${count} without a recorded cancellation date ${plural(count, "was", "were")} left out because we can't tell which year ${plural(count, "it was", "they were")} cancelled.`,
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
        `${amount} per use · ${count} ${plural(count, "use", "uses")}`,
      mostUsedValue: (count) => `${count} ${plural(count, "use", "uses")} in 30 days`,
      killedMark: "(cancelled)",
      checkInsNote: (year) =>
        `Based on each service's last check-in of ${year}. The number of uses is what you entered at check-in, so it may differ from your real usage.`,
      shareTitle: (year) => `SubSlash ${year} subscription review`,
      shareText: (scope, killed, blocked, confirmedLine, type, url) =>
        `SubSlash ${scope} subscription review\nCancelled ${killed} ${plural(killed, "subscription", "subscriptions")} · charges blocked by cancelling ${blocked}${confirmedLine}${type ? `\nSpending type: ${type}` : ""}\nSee the review: ${url}`,
      shareConfirmed: (amount) => ` · of which kept ${amount}`,
      dateLocale: "en-US",
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
      inDays: (days) => `In ${days} ${plural(days, "day", "days")}`,
      dayMonth: (month) => monthShort(month),
      undated: (count) =>
        `${count} without a billing month ${plural(count, "is", "are")} left out because the date is unknown.`,
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
        `${count} ${plural(count, "subscription", "subscriptions")} couldn't be put in the chart because the billing month is unknown.`,
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
