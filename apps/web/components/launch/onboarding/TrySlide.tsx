"use client";

import { ArrowRight, Check } from "lucide-react";
import { POPULAR_SERVICES, formatCurrency, type ServicePreset } from "@subslash/shared";
import { PROVIDER_LOOK } from "@components/auth/SocialLoginButtons";
import { ServiceLogo } from "@components/subscription/ServiceLogo";
import { shortServiceName } from "@lib/service-name";
import { isSocialLoginOpen } from "@lib/privacy";
import { cn } from "@lib/utils";
import { RISE_TEXT, kicker, slideBody, slideTitle, slideTop } from "./styles";

/**
 * 앱 소개의 마지막 장('직접 해 보기'). 고른 서비스는 바로 등록하지 않는다 — 넷플릭스처럼 요금제가 여럿인 서비스는
 * 요금을 사용자가 골라야 하고(CLAUDE.md '제1원칙'), 결제일도 모른다. 부르는 쪽이 대시보드로 넘겨 등록 창을 하나씩
 * 연다(`queueWelcomePicks`). 그래서 요금제가 여럿인 서비스는 고르는 칸에 금액을 적지 않는다.
 */

/** 마지막 장에서 고를 수 있는 서비스. */
export const PICKS: ServicePreset[] = ["netflix", "coupang-wow", "youtube-premium"].flatMap(
  (id) => {
    const preset = POPULAR_SERVICES.find((p) => p.id === id);
    return preset ? [preset] : [];
  },
);

const LOGIN_PROVIDERS = [
  { id: "kakao", label: "카카오로 로그인하러 가기" },
  { id: "naver", label: "네이버로 로그인하러 가기" },
  { id: "google", label: "Google로 로그인하러 가기" },
] as const;

export function TrySlide({
  picked,
  onToggle,
  onStart,
  onSample,
  onLogin,
}: {
  picked: string[];
  onToggle: (id: string) => void;
  onStart: () => void;
  onSample: () => void;
  onLogin: () => void;
}) {
  const chosen = PICKS.filter((p) => picked.includes(p.id));
  // 고른 것이 모두 요금 하나뿐인 서비스일 때만 합계를 쓴다. 요금제가 여럿이면 등록할 때 골라야 안다.
  const allKnown = chosen.every((p) => p.defaultAmount !== null && p.currency === "KRW");
  const total = chosen.reduce((sum, p) => sum + (p.defaultAmount ?? 0), 0);

  return (
    <div
      className={cn(
        "flex h-full flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+28px)]",
        slideTop,
      )}
      style={RISE_TEXT}
    >
      <p className={kicker}>직접 해 보기</p>
      <h2 className={slideTitle}>
        지금 쓰고 있는 구독,
        <br />
        골라 볼까요?
      </h2>
      <p className={slideBody}>
        고르면 대시보드에서 하나씩 등록해요. 요금제와 결제일은 그때 정해요.
      </p>

      <div className="mt-6 flex flex-col gap-2">
        {PICKS.map((preset) => {
          const on = picked.includes(preset.id);
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onToggle(preset.id)}
              aria-pressed={on}
              className={cn(
                "flex w-full items-center gap-3.5 rounded-[18px] border-[1.5px] bg-card px-4 py-3 text-left transition-[border-color,transform] active:scale-[0.98]",
                on ? "border-foreground" : "border-border",
              )}
            >
              <ServiceLogo presetId={preset.id} name={preset.nameKo} size={40} />
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold">{shortServiceName(preset)}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">
                  {preset.defaultAmount !== null
                    ? `월 ${formatCurrency(preset.defaultAmount, preset.currency)}`
                    : "요금제는 등록할 때 골라요"}
                </span>
              </span>
              <span
                aria-hidden
                className={cn(
                  "grid size-[26px] shrink-0 place-items-center rounded-full transition-colors",
                  on ? "bg-red-500" : "ring-[1.5px] ring-border ring-inset",
                )}
              >
                <Check
                  className={cn("size-3.5 text-white transition-opacity", !on && "opacity-0")}
                  strokeWidth={3.5}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex-1" />
      <div className="flex items-baseline justify-between gap-3 px-1 pb-3">
        <span className="text-sm text-muted-foreground">
          {chosen.length > 0 ? `고른 구독 ${chosen.length}개` : "고른 구독"}
        </span>
        <span className="text-right text-[15px] font-bold tabular-nums">
          {chosen.length === 0
            ? "—"
            : allKnown
              ? `매달 ${formatCurrency(total, "KRW")}`
              : "요금은 등록하며 확인해요"}
        </span>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="flex h-14 items-center justify-center gap-1.5 rounded-[14px] bg-primary text-[17px] font-bold text-primary-foreground active:bg-primary/90"
      >
        {chosen.length > 0 ? `${chosen.length}개 등록하러 가기` : "직접 추가하며 시작하기"}
        <ArrowRight className="size-[18px]" strokeWidth={2.25} aria-hidden />
      </button>
      <button
        type="button"
        onClick={onSample}
        className="mt-1 h-11 text-[15px] font-semibold text-muted-foreground underline underline-offset-4"
      >
        샘플로 둘러보기
      </button>
      {isSocialLoginOpen() ? (
        <div className="mt-1 flex items-center justify-center gap-2.5">
          <span className="text-[13px] text-muted-foreground">계정으로 이어서 하기</span>
          {LOGIN_PROVIDERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={onLogin}
              aria-label={label}
              className={cn(
                "grid size-11 place-items-center rounded-full border",
                PROVIDER_LOOK[id].className,
              )}
            >
              {PROVIDER_LOOK[id].mark}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
          이미 계정이 있나요?
          <button
            type="button"
            onClick={onLogin}
            className="px-0.5 py-1.5 font-bold text-foreground underline underline-offset-[3px]"
          >
            로그인
          </button>
        </p>
      )}
    </div>
  );
}
