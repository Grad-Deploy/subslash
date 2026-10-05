import {
  POPULAR_SERVICES,
  planCurrency,
  type Currency,
  type ServicePreset,
} from "@subslash/shared";

/**
 * 소개 페이지의 견본 서비스. 첫 칸의 결제 알림과 1회 단가 계산기가 같은 목록을 쓴다. 요금은 여기 적지 않고
 * 서비스 목록에서 읽는다. 요금제가 여럿인 서비스는 어느 요금제인지 정해 두고 화면에도 적는다 — '넷플릭스 월
 * ₩17,000'이라고만 쓰면 넷플릭스 요금이 그 값 하나인 것처럼 읽힌다.
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

/** 탭에는 괄호 속 부연("쿠팡 와우 (쿠팡플레이)")을 빼고 짧게 쓴다. */
export const shortName = (preset: ServicePreset) => preset.nameKo.replace(/\s*\(.*\)$/, "");

/** 요금제까지 붙인 이름("넷플릭스 프리미엄"). */
export const sampleName = ({ preset, planName }: Sample) =>
  `${shortName(preset)}${planName ? ` ${planName}` : ""}`;
