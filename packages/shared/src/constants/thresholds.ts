/**
 * Fallback USD → KRW rate, used only until the user sets one or the app fetches
 * a published rate. It is a round number, not a quote: every total derived from
 * it is an estimate, and the UI says which rate it used so the number can be
 * checked against a card statement.
 */
export const DEFAULT_EXCHANGE_RATE = 1350;

/**
 * '잘 씀'(초록)이 되는 30일 동안의 이용 목표 양. 체크인·게이지·폰 사용 기록·리포트가 같은 단일 기준을 쓴다.
 * - 횟수(`uses`): `getRiskLevel`에서 1회 단가가 한 달 요금의 `1 / GOOD_AT.uses`(25%) 이하면 초록이므로 4회부터 초록이다.
 * - 쓴 날(`days`)·시간(`hours`): `metricRiskLevel`의 10일·10시간.
 */
export const GOOD_AT: Record<"uses" | "days" | "hours", number> = {
  uses: 4,
  days: 10,
  hours: 10,
};

/**
 * 5대 가치 지표(`uses`, `days`, `hours`, `benefit`, `storage`)의 위험도(`red` / `yellow` / `green`)
 * 판정 임계값 단일 출처 테이블.
 *
 * `GOOD_AT`이 변경되면 `uses`/`days`/`hours`의 `greenAt`과 파생 단가 비율(`1 / GOOD_AT.uses`)도 함께 따라간다.
 */
export const VERDICT_THRESHOLDS = {
  uses: {
    /** 이 횟수 미만(유료 구독은 1회 단가가 월 부담금의 `1 / redBelow` 초과)이면 red */
    redBelow: 2,
    /** 이 횟수 이상(유료 구독은 1회 단가가 월 부담금의 `1 / greenAt` 이하)이면 green */
    get greenAt(): number {
      return GOOD_AT.uses;
    },
  },
  days: {
    /** 30일 중 사용한 날이 이 일수 이하면 red */
    redAtOrBelow: 2,
    /** 30일 중 사용한 날이 이 일수 이상이면 green */
    get greenAt(): number {
      return GOOD_AT.days;
    },
    /** PC 토큰 API 환산 가치가 월 구독료의 이 배수 이상이면 일수가 적어도 green */
    apiValueGreenRatio: 1,
  },
  hours: {
    /** 30일 동안 사용한 시간이 이 시간 미만이면 red */
    redBelow: 2,
    /** 30일 동안 사용한 시간이 이 시간 이상이면 green */
    get greenAt(): number {
      return GOOD_AT.hours;
    },
  },
  benefit: {
    /** 월 회비 대비 혜택 환급 비율이 이 값 미만이면 red */
    redBelowRatio: 0.5,
    /** 월 회비 대비 혜택 환급 비율이 이 값 이상이면 green */
    greenAtRatio: 1,
  },
  storage: {
    /** 요금제 용량 점유율이 이 값(0%)이면 red */
    redAt: 0,
    /** 요금제를 모를 때 이 비율(%) 이상이면 green, 미만이면 yellow */
    unknownPlanGreenAt: 50,
  },
} as const;
