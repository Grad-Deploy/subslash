"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  calculateCostPerUse,
  formatCurrency,
  getRiskLevel,
  type RiskLevel,
} from "@subslash/shared";
import { cn } from "@lib/utils";
import { useT, type Messages } from "@lib/i18n";
import { ServiceLogo } from "@components/subscription/ServiceLogo";
import { shortServiceName } from "@lib/service-name";
import { SAMPLES, sampleName, type Sample } from "./samples";

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
function verdict(
  c: Messages["landing"]["calc"],
  uses: number,
  risk: RiskLevel,
  amountText: string,
) {
  if (uses === 0) return c.verdictZero(amountText);
  if (uses === 1) return c.verdictOne;
  if (risk === "green") return c.verdictGreen;
  return c.verdictMaybe;
}

/**
 * 1회 단가 계산기. 소개 페이지 '1회당 단가' 칸의 오른쪽이다 — 서비스와 횟수를 움직여 보며 "가격 말고 1회당 얼마"를
 * 직접 느끼게 한다. 등록은 이 칸이 아니라 대시보드에서 한다.
 */
export function UnitCostCalculator() {
  const c = useT().landing.calc;
  const [selectedId, setSelectedId] = useState<string>(SAMPLES[0]?.preset.id ?? "");
  const [uses, setUses] = useState(4);

  const selected = SAMPLES.find((s) => s.preset.id === selectedId) ?? SAMPLES[0];
  if (!selected) return null;

  return (
    // 테마 색 변수로 칠한다. 예전에는 라이트 모드에서도 이 상자만 검게 칠해져 화면에서 따로 놀았다.
    <div className="w-full rounded-[1.75rem] border bg-card p-5 text-left text-card-foreground shadow-[0_40px_80px_-32px_rgba(9,9,11,0.22),0_2px_6px_rgba(9,9,11,0.04)] sm:p-9">
      <div className="flex flex-wrap gap-2" role="group" aria-label={c.servicesLabel}>
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
              {shortServiceName(sample.preset)}
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
  const c = useT().landing.calc;
  const { amount, currency } = sample;
  const costPerUse = calculateCostPerUse(amount, uses);
  const risk = getRiskLevel(costPerUse, amount, uses);
  const amountText = formatCurrency(amount, currency);
  const shown = useTweenedNumber(costPerUse);
  const costText = formatCurrency(costPerUse, currency);

  return (
    <>
      <p className="mt-7 text-base font-medium text-foreground sm:text-[17px]">
        {c.line(sampleName(sample), amountText)}
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{c.basis}</p>

      <div className="mt-7 flex items-center gap-4">
        <label htmlFor="hero-uses" className="w-[5.5rem] shrink-0 text-sm text-muted-foreground">
          {c.usesLabel}
        </label>
        <input
          id="hero-uses"
          type="range"
          min={0}
          max={30}
          step={1}
          value={uses}
          onChange={(e) => onUsesChange(Number(e.target.value))}
          aria-valuetext={c.uses(uses)}
          className="h-7 flex-1 cursor-pointer accent-red-500"
        />
        <span className="w-[3.25rem] shrink-0 text-right text-xl font-bold tabular-nums text-foreground">
          {c.uses(uses)}
        </span>
      </div>

      <div className="mt-7 border-t pt-7 text-center">
        <p className="text-sm text-muted-foreground">{uses === 0 ? c.zeroLabel : c.perUse}</p>
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
          {verdict(c, uses, risk, amountText)}
        </p>
      </div>
    </>
  );
}
