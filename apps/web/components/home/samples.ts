import {
  POPULAR_SERVICES,
  formatCurrency,
  planCurrency,
  type Currency,
  type ServicePreset,
} from "@subslash/shared";
import { planName as planDisplayName, shortServiceName } from "@lib/service-name";
import type { Locale } from "@lib/i18n/config";

/**
 * 소개(웹 `/`·앱 첫 실행)의 견본 서비스. 첫 장면의 결제 알림과 1회 단가 계산기가 같은 목록을 쓴다. 요금은 여기
 * 적지 않고 서비스 목록에서 읽는다. 요금제가 여럿인 서비스는 어느 요금제인지 정해 두고 화면에도 적는다 —
 * '넷플릭스 월 ₩17,000'이라고만 쓰면 넷플릭스 요금이 그 값 하나인 것처럼 읽힌다.
 */
const SAMPLE_PICKS: ReadonlyArray<{ id: string; planId?: string }> = [
  { id: "netflix", planId: "premium" },
  { id: "coupang-wow" },
  { id: "youtube-premium", planId: "premium" },
];

export interface Sample {
  preset: ServicePreset;
  planName: string | null;
  amount: number;
  currency: Currency;
}

// 서비스 목록에서 요금을 찾지 못한 견본은 뺀다. 요금 없이는 1회 단가를 계산할 수 없다.
export const SAMPLES: Sample[] = SAMPLE_PICKS.flatMap(({ id, planId }): Sample[] => {
  const preset = POPULAR_SERVICES.find((s) => s.id === id);
  if (!preset) return [];
  if (planId) {
    const plan = preset.plans?.find((p) => p.id === planId);
    if (!plan) return [];
    return [
      { preset, planName: plan.name, amount: plan.amount, currency: planCurrency(preset, plan) },
    ];
  }
  if (preset.defaultAmount === null) return [];
  return [{ preset, planName: null, amount: preset.defaultAmount, currency: preset.currency }];
});

/**
 * 요금제까지 붙인 이름("넷플릭스 프리미엄"). 서비스 이름 끝과 요금제 이름 앞이 겹치면 한 번만 쓴다 — 그대로 붙이면
 * 유튜브 프리미엄의 '프리미엄' 요금제가 '유튜브 프리미엄 프리미엄'이 됐다.
 */
export const sampleName = ({ preset, planName }: Sample, locale: Locale = "ko") => {
  const service = shortServiceName(preset, locale);
  if (!planName) return service;
  const serviceWords = service.split(/\s+/);
  const planWords = planDisplayName(planName, locale).split(/\s+/);
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  for (let n = Math.min(serviceWords.length - 1, planWords.length); n > 0; n--) {
    const tail = serviceWords.slice(-n);
    if (tail.every((word, i) => same(word, planWords[i]!))) {
      return [...serviceWords, ...planWords.slice(n)].join(" ");
    }
  }
  return [...serviceWords, ...planWords].join(" ");
};

/**
 * 결제 알림 견본의 한 달 합계("모르는 사이 매달 …"). 모두 원화일 때만 쓴다 — 통화가 섞이면 더한 숫자가 뜻이 없다.
 */
export const SAMPLE_TOTAL: string | null = SAMPLES.every((s) => s.currency === "KRW")
  ? formatCurrency(
      SAMPLES.reduce((sum, s) => sum + s.amount, 0),
      "KRW",
    )
  : null;
