"use client";

import React, { useState } from "react";
import {
  POPULAR_SERVICES,
  calculateCostPerUse,
  formatCurrency,
  getRiskLevel,
  planCurrency,
  type Currency,
  type RiskLevel,
  type ServicePreset,
} from "@subslash/shared";
import { cn } from "@lib/utils";
import { ServiceLogo } from "@components/subscription/ServiceLogo";
import { IS_APP_BUILD } from "@lib/platform";

/**
 * 체험용으로 고를 수 있는 서비스. 요금은 여기 적지 않고 서비스 목록에서 읽는다. 요금제가
 * 여럿인 서비스는 어느 요금제인지 정해 두고 화면에도 적는다 — '넷플릭스 월 ₩17,000'이라고만
 * 쓰면 넷플릭스 요금이 그 값 하나인 것처럼 읽힌다.
 */
const SAMPLE_PICKS: ReadonlyArray<{ id: string; planId?: string }> = [
  { id: "netflix", planId: "premium" },
  { id: "coupang-wow" },
  { id: "youtube-premium", planId: "premium" },
];

interface Sample {
  preset: ServicePreset;
  planName: string | null;
  amount: number;
  currency: Currency;
}

// 서비스 목록에서 요금을 찾지 못한 견본은 뺀다. 요금 없이는 1회 단가를 계산할 수 없다.
const SAMPLES: Sample[] = SAMPLE_PICKS.flatMap(({ id, planId }): Sample[] => {
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
const shortName = (preset: ServicePreset) => preset.nameKo.replace(/\s*\(.*\)$/, "");

// 밝은 배경에서는 진한 색, 어두운 배경에서는 밝은 색이어야 읽힌다.
const riskColor: Record<RiskLevel, string> = {
  red: "text-red-600 dark:text-red-400",
  yellow: "text-amber-600 dark:text-amber-300",
  green: "text-emerald-600 dark:text-emerald-400",
};

/**
 * 판정 문구는 앱의 신호등(getRiskLevel)과 같은 기준을 쓴다. 커피·영화표처럼
 * 바깥 물건 값에 빗대지 않는다 — 그 값이 틀리면 이 숫자 전체가 의심받는다.
 */
function verdict(uses: number, risk: RiskLevel, amountText: string) {
  if (uses === 0) return `한 번도 안 썼다면 ${amountText}을 그냥 낸 셈이에요`;
  if (uses === 1) return "한 번 쓰려고 한 달 요금을 다 냈어요";
  if (risk === "green") return "요금만큼 잘 쓰고 있어요";
  return "애매해요. 다음 달에도 이 정도라면 다시 생각해 보세요";
}

interface UnitCostHeroProps {
  onStart: () => void;
  onDemo: () => void;
}

export function UnitCostHero({ onStart, onDemo }: UnitCostHeroProps) {
  const [selectedId, setSelectedId] = useState<string>(SAMPLES[0]?.preset.id ?? "");
  const [uses, setUses] = useState(4);

  const selected = SAMPLES.find((s) => s.preset.id === selectedId) ?? SAMPLES[0];

  return (
    // 테마 색 변수로 칠한다. 예전에는 라이트 모드에서도 이 상자만 검게 칠해져 화면에서 따로 놀았다.
    <section className="w-full rounded-2xl border bg-card px-5 py-7 text-left text-card-foreground shadow-sm sm:px-10 sm:py-10">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
        {/*
          왼쪽: 카피 + CTA. 앱(Capacitor)에서는 첫 실행 환영 화면이 같은 말과 같은 버튼(등록·샘플)을
          이미 보여주므로 빼고, 오른쪽 계산기만 둔다. "이 브라우저에 저장"이라는 문구도 앱에는 맞지 않는다.
        */}
        {!IS_APP_BUILD && (
          <div>
            <span className="inline-block rounded-full border px-3 py-1 text-xs text-muted-foreground">
              구독 디톡스
            </span>

            <h1 className="mt-4 text-3xl font-medium leading-snug text-foreground">
              그 구독,
              <br />한 달에 몇 번 써요?
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              가격 말고 1회당 단가로 판단하세요. 아래에서 횟수를 움직여 보세요.
            </p>

            {/* 글자는 한 줄로 두고, 폭이 모자라면 버튼째 다음 줄로 넘긴다. */}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={onStart}
                className="whitespace-nowrap rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                내 구독 등록하기 →
              </button>
              <button
                type="button"
                onClick={onDemo}
                className="whitespace-nowrap rounded-lg border px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                샘플로 둘러보기
              </button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">가입 없이 이 브라우저에 저장돼요.</p>
          </div>
        )}

        {/* 오른쪽: 인터랙티브 계산기 */}
        {selected && (
          <div className="rounded-xl border bg-secondary/60 p-4 sm:p-5 dark:bg-background">
            <div className="flex flex-wrap gap-2" role="group" aria-label="체험할 서비스">
              {SAMPLES.map((sample) => {
                const active = sample.preset.id === selected.preset.id;
                return (
                  <button
                    key={sample.preset.id}
                    type="button"
                    onClick={() => setSelectedId(sample.preset.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex-auto whitespace-nowrap rounded-lg border px-3 py-2 text-xs transition",
                      active
                        ? "border-foreground/40 bg-card text-foreground shadow-sm"
                        : "border-border bg-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <ServiceLogo
                        presetId={sample.preset.id}
                        name={sample.preset.nameKo}
                        size={16}
                      />
                      {shortName(sample.preset)}
                    </span>
                  </button>
                );
              })}
            </div>

            <HeroResult sample={selected} uses={uses} onUsesChange={setUses} />
          </div>
        )}
      </div>
    </section>
  );
}

function HeroResult({
  sample,
  uses,
  onUsesChange,
}: {
  sample: Sample;
  uses: number;
  onUsesChange: (n: number) => void;
}) {
  const { preset, planName, amount, currency } = sample;
  const costPerUse = calculateCostPerUse(amount, uses);
  const risk = getRiskLevel(costPerUse, amount, uses);
  const amountText = formatCurrency(amount, currency);

  return (
    <>
      <p className="mt-4 text-sm text-foreground">
        <ServiceLogo
          presetId={preset.id}
          name={preset.nameKo}
          size={16}
          className="align-text-bottom"
        />{" "}
        {shortName(preset)}
        {planName ? ` ${planName}` : ""} · 월 {amountText}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        목록 기준 요금 · 등록할 때 바꿀 수 있어요
      </p>

      <div className="mt-4 flex items-center gap-3">
        <label htmlFor="hero-uses" className="w-20 shrink-0 text-xs text-muted-foreground">
          월 이용 횟수
        </label>
        <input
          id="hero-uses"
          type="range"
          min={0}
          max={30}
          step={1}
          value={uses}
          onChange={(e) => onUsesChange(Number(e.target.value))}
          aria-valuetext={`${uses}회`}
          className="flex-1 accent-primary"
        />
        <span className="w-10 shrink-0 text-right text-sm font-medium text-foreground">
          {uses}회
        </span>
      </div>

      <div className="mt-5 border-t pt-4 text-center" aria-live="polite">
        <p className="text-xs text-muted-foreground">
          {uses === 0 ? "쓰지 않고 낸 돈" : "1회당 실제 단가"}
        </p>
        <p className={cn("mt-1 text-2xl font-medium", riskColor[risk])}>
          {formatCurrency(costPerUse, currency)}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">{verdict(uses, risk, amountText)}</p>
      </div>
    </>
  );
}
