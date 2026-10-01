"use client";

import React, { useEffect, useRef, useState } from "react";
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

/**
 * 1회 단가 계산기. 소개 페이지 첫 칸의 오른쪽이다 — 서비스와 횟수를 움직여 보며 "가격 말고 1회당 얼마"를
 * 직접 느끼게 한다. 등록은 이 칸이 아니라 대시보드에서 한다.
 */
export function UnitCostCalculator() {
  const [selectedId, setSelectedId] = useState<string>(SAMPLES[0]?.preset.id ?? "");
  const [uses, setUses] = useState(4);

  const selected = SAMPLES.find((s) => s.preset.id === selectedId) ?? SAMPLES[0];
  if (!selected) return null;

  return (
    // 테마 색 변수로 칠한다. 예전에는 라이트 모드에서도 이 상자만 검게 칠해져 화면에서 따로 놀았다.
    <div className="w-full rounded-[1.75rem] border bg-card p-5 text-left text-card-foreground shadow-[0_40px_80px_-32px_rgba(9,9,11,0.22),0_2px_6px_rgba(9,9,11,0.04)] sm:p-9">
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
                "inline-flex flex-auto items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3.5 py-3 text-sm font-medium transition sm:text-[15px]",
                active
                  ? "border-foreground/40 bg-card text-foreground shadow-[0_4px_12px_-4px_rgba(9,9,11,0.15)]"
                  : "border-border bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              <ServiceLogo presetId={sample.preset.id} name={sample.preset.nameKo} size={22} />
              {shortName(sample.preset)}
            </button>
          );
        })}
      </div>

      <HeroResult sample={selected} uses={uses} onUsesChange={setUses} />
    </div>
  );
}

/** 바뀐 금액으로 숫자가 굴러가게 한다. 움직임 줄이기를 켰으면 바로 바꾼다. */
function useTweenedNumber(target: number): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = shownRef.current;
    if (reduce || from === target) {
      shownRef.current = target;
      setShown(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / 380);
      const value = from + (target - from) * (1 - Math.pow(1 - k, 3));
      shownRef.current = value;
      setShown(value);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return shown;
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
  const shown = useTweenedNumber(costPerUse);
  const costText = formatCurrency(costPerUse, currency);

  return (
    <>
      <p className="mt-7 text-base font-medium text-foreground sm:text-[17px]">
        {shortName(preset)}
        {planName ? ` ${planName}` : ""} · 월 {amountText}
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
        목록 기준 요금 · 등록할 때 바꿀 수 있어요
      </p>

      <div className="mt-7 flex items-center gap-4">
        <label htmlFor="hero-uses" className="w-[5.5rem] shrink-0 text-sm text-muted-foreground">
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
          className="h-7 flex-1 cursor-pointer accent-primary"
        />
        <span className="w-[3.25rem] shrink-0 text-right text-xl font-bold tabular-nums text-foreground">
          {uses}회
        </span>
      </div>

      <div className="mt-7 border-t pt-7 text-center">
        <p className="text-sm text-muted-foreground">
          {uses === 0 ? "쓰지 않고 낸 돈" : "1회당 실제 단가"}
        </p>
        {/* 굴러가는 숫자는 읽는 기계에 프레임마다 읽히지 않게 숨기고, 최종 값만 따로 알린다. */}
        <p
          aria-hidden
          className={cn(
            "mt-2 text-5xl leading-none font-extrabold tracking-tight tabular-nums transition-colors duration-300 sm:text-[clamp(3rem,6vw,4.5rem)]",
            riskColor[risk],
          )}
        >
          {formatCurrency(shown, currency)}
        </p>
        <p className="sr-only" aria-live="polite">
          {costText}
        </p>
        <p className="mt-3.5 text-[15px] text-muted-foreground">
          {verdict(uses, risk, amountText)}
        </p>
      </div>
    </>
  );
}
