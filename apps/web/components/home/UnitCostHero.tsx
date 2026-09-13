"use client";

import React, { useState } from "react";
import {
  POPULAR_SERVICES,
  calculateCostPerUse,
  formatCurrency,
  getRiskLevel,
  type RiskLevel,
  type ServicePreset,
} from "@subslash/shared";
import { cn } from "@lib/utils";

/** 체험용으로 고를 수 있는 서비스. 요금은 여기 적지 않고 서비스 목록에서 읽는다. */
const SAMPLE_IDS = ["netflix", "coupang-wow", "youtube-premium"] as const;

const SAMPLES = SAMPLE_IDS.map((id) => POPULAR_SERVICES.find((s) => s.id === id)).filter(
  (s): s is ServicePreset => !!s,
);

/** 탭에는 괄호 속 부연("쿠팡 와우 (쿠팡플레이)")을 빼고 짧게 쓴다. */
const shortName = (preset: ServicePreset) => preset.nameKo.replace(/\s*\(.*\)$/, "");

const riskColor: Record<RiskLevel, string> = {
  red: "text-red-400",
  yellow: "text-amber-300",
  green: "text-emerald-400",
};

/**
 * 판정 문구는 앱의 신호등(getRiskLevel)과 같은 기준을 쓴다. 커피·영화표처럼
 * 바깥 물건 값에 빗대지 않는다 — 그 값이 틀리면 이 숫자 전체가 의심받는다.
 */
function verdict(uses: number, risk: RiskLevel, amountText: string) {
  if (uses === 0) return `한 번도 안 썼다면 ${amountText}을 그냥 낸 셈이에요`;
  if (uses === 1) return "한 번 쓰려고 한 달 요금을 다 냈어요";
  if (risk === "green") return "요금만큼 잘 쓰고 있어요 👍";
  return "애매해요. 다음 달에도 이 정도라면 다시 생각해 보세요";
}

interface UnitCostHeroProps {
  onStart: () => void;
  onDemo: () => void;
}

export function UnitCostHero({ onStart, onDemo }: UnitCostHeroProps) {
  const [selectedId, setSelectedId] = useState<string>(SAMPLES[0]?.id ?? "");
  const [uses, setUses] = useState(4);

  const selected = SAMPLES.find((s) => s.id === selectedId) ?? SAMPLES[0];

  return (
    <section className="w-full rounded-2xl bg-neutral-900 px-5 py-7 text-left dark:border dark:border-neutral-800 sm:px-10 sm:py-10">
      <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
        {/* 왼쪽: 카피 + CTA */}
        <div>
          <span className="inline-block rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-400">
            ⚡ 능동형 디지털 구독 디톡스
          </span>

          <h1 className="mt-4 text-3xl font-medium leading-snug text-white">
            그 구독,
            <br />한 달에 몇 번 써요?
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            가격만 보지 말고, 1회당 실제 사용 단가로 판단하세요. 서비스를 고르고 한 달에 쓴 횟수를
            움직여 보세요.
          </p>

          {/* 글자는 한 줄로 두고, 폭이 모자라면 버튼째 다음 줄로 넘긴다. */}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={onStart}
              className="whitespace-nowrap rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-neutral-900 transition hover:bg-neutral-200"
            >
              내 구독 모두 계산하기 →
            </button>
            <button
              type="button"
              onClick={onDemo}
              className="whitespace-nowrap rounded-lg border border-neutral-700 px-5 py-2.5 text-sm font-medium text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800"
            >
              ✨ 샘플 데이터로 1초 체험
            </button>
          </div>

          <p className="mt-3 text-xs text-neutral-500">
            🔒 회원가입 없이 이 브라우저에 저장됩니다. 결제 알림은 로그인한 뒤 켤 수 있고, 켤 때만
            이메일을 받습니다.
          </p>
        </div>

        {/* 오른쪽: 인터랙티브 계산기 */}
        {selected && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:p-5">
            <div className="flex flex-wrap gap-2" role="group" aria-label="체험할 서비스">
              {SAMPLES.map((sub) => {
                const active = sub.id === selected.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedId(sub.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex-auto whitespace-nowrap rounded-lg border px-3 py-2 text-xs transition",
                      active
                        ? "border-neutral-500 bg-neutral-800 text-white"
                        : "border-neutral-800 bg-transparent text-neutral-400 hover:border-neutral-600",
                    )}
                  >
                    {sub.iconEmoji} {shortName(sub)}
                  </button>
                );
              })}
            </div>

            <HeroResult preset={selected} uses={uses} onUsesChange={setUses} />
          </div>
        )}
      </div>
    </section>
  );
}

function HeroResult({
  preset,
  uses,
  onUsesChange,
}: {
  preset: ServicePreset;
  uses: number;
  onUsesChange: (n: number) => void;
}) {
  const amount = preset.defaultAmount;
  const costPerUse = calculateCostPerUse(amount, uses);
  const risk = getRiskLevel(costPerUse, amount, uses);
  const amountText = formatCurrency(amount, preset.currency);

  return (
    <>
      <p className="mt-4 text-sm text-neutral-300">
        {preset.iconEmoji} {shortName(preset)} · 월 {amountText}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">
        SubSlash 서비스 목록의 기준 요금이에요. 요금제마다 다를 수 있고, 등록할 때 내 요금으로 고칠
        수 있어요.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <label htmlFor="hero-uses" className="w-20 shrink-0 text-xs text-neutral-400">
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
          className="flex-1 accent-white"
        />
        <span className="w-10 shrink-0 text-right text-sm font-medium text-white">{uses}회</span>
      </div>

      <div className="mt-5 border-t border-neutral-800 pt-4 text-center" aria-live="polite">
        <p className="text-xs text-neutral-400">
          {uses === 0 ? "쓰지 않고 낸 돈" : "1회당 실제 단가"}
        </p>
        <p className={cn("mt-1 text-2xl font-medium", riskColor[risk])}>
          {formatCurrency(costPerUse, preset.currency)}
        </p>
        <p className="mt-1.5 text-xs text-neutral-500">{verdict(uses, risk, amountText)}</p>
      </div>
    </>
  );
}
