"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { POPULAR_SERVICES, formatCurrency, type ServicePreset } from "@subslash/shared";
import { BrandWordmark } from "@components/brand/Brand";
import { PROVIDER_LOOK } from "@components/auth/SocialLoginButtons";
import { ServiceLogo } from "@components/subscription/ServiceLogo";
import { UnitCostCalculator } from "@components/home/UnitCostCalculator";
import { SAMPLES, sampleName } from "@components/home/samples";
import { useStore } from "@lib/store";
import { isSocialLoginOpen } from "@lib/privacy";
import { markWelcomeSeen, queueWelcomePicks } from "@lib/welcome";
import { cn } from "@lib/utils";

/**
 * 앱 첫 실행의 소개. 웹의 첫 화면(`/`)이 내려 읽는 소개라면, 앱은 같은 이야기를 옆으로 넘기는 슬라이드로
 * 한다. 모양은 Claude Design 프로젝트의 'App Onboarding v2.dc.html'을 따른다 — 문제(결제 알림) → 답(가격 말고
 * 1회당 단가로) → 1회 단가 계산기 → 기능 셋 → 직접 해 보기. 마지막 장에서 쓰는 구독을 고르거나 로그인·샘플로
 * 가고, 고르면 다시 띄우지 않는다(`markWelcomeSeen`).
 *
 * 마지막 장에서 고른 서비스는 바로 등록하지 않는다. 넷플릭스처럼 요금제가 여럿인 서비스는 요금을 사용자가
 * 골라야 하고(CLAUDE.md '제1원칙'), 결제일도 모른다. 대시보드로 넘겨 등록 창을 하나씩 연다(`queueWelcomePicks`).
 * 그래서 요금제가 여럿인 서비스는 고르는 칸에 금액을 적지 않는다.
 *
 * 화면 캡처는 웹 소개와 같은 샘플 데이터 캡처(`public/landing/`)이고 그렇게 밝힌다. 첫 장의 결제 알림은
 * 서비스 목록 기준 요금으로 만든 예시다. 움직임(첫 장이 떠오름, 장이 넘기는 만큼 올라옴, 둘째 장에 멈추면
 * 슬래시를 그음)은 움직임 줄이기를 켜면 하지 않는다.
 */

const EASE = "cubic-bezier(.22,1,.36,1)";

const FEATURES = [
  {
    kicker: "한눈에 보기",
    title: ["결정할 구독만", "골라 보여 줘요"],
    body: "결제일이 다가오는데 잘 쓰지 않는 구독을 맨 위에 모아요.",
    image: "/landing/dashboard.png",
    alt: "대시보드 화면 — 결제일이 다가오는 구독과 1회당 금액",
  },
  {
    kicker: "해지 안내",
    title: ["해지하는 곳까지", "데려다줘요"],
    body: "서비스마다 해지 화면 링크와 메뉴 경로를 정리해 뒀어요.",
    image: "/landing/cancel-guide.png",
    alt: "구독 상세 화면 — 다음 결제까지 남은 날과 해지 경로 안내",
  },
  {
    kicker: "지킨 돈",
    title: ["해지로 지킨 돈이", "쌓여요"],
    body: "결제가 없었다고 확인한 금액만 '지킨 돈'으로 세요.",
    image: "/landing/savings.png",
    alt: "절약 현황 화면 — 해지로 지킨 돈",
  },
] as const;

const SLIDE_LABELS = [
  "문제",
  "답",
  "1회당 단가",
  ...FEATURES.map((f) => f.kicker),
  "직접 해 보기",
] as const;
const SLIDE_COUNT = SLIDE_LABELS.length;
const LAST = SLIDE_COUNT - 1;
/** 슬래시를 긋는 장(앱 아이콘이 있는 '답'). */
const ANSWER = 1;

/** 마지막 장에서 고를 수 있는 서비스. */
const PICKS: ServicePreset[] = ["netflix", "coupang-wow", "youtube-premium"].flatMap((id) => {
  const preset = POPULAR_SERVICES.find((p) => p.id === id);
  return preset ? [preset] : [];
});

/** 탭·목록에는 괄호 속 부연("쿠팡 와우 (쿠팡플레이)")을 뺀다. */
const shortName = (preset: ServicePreset) => preset.nameKo.replace(/\s*\(.*\)$/, "");

const sampleTotal = SAMPLES.every((s) => s.currency === "KRW")
  ? formatCurrency(
      SAMPLES.reduce((sum, s) => sum + s.amount, 0),
      "KRW",
    )
  : null;

/**
 * 장이 들어오는 정도(`--enter`, 0~1)에 묶은 움직임. 0이면 옆 장에 있고 1이면 제자리다. 값은 넘기는
 * 손가락(스크롤 위치)을 따라 매 프레임 바뀌므로 글과 그림이 넘기는 만큼 아래에서 올라오고, 나갈 때는 그만큼
 * 내려간다. 따로 재생하는 애니메이션이 아니라 중간에 끊기거나 다시 시작하지 않는다. 값이 없으면(움직임 줄이기,
 * 스크립트 전) 1로 보아 제자리에 그린다.
 */
const RISE_TEXT: CSSProperties = {
  opacity: "calc(0.35 + 0.65 * var(--enter, 1))",
  transform: "translateY(calc((1 - var(--enter, 1)) * 14px))",
};
const RISE_PHONE: CSSProperties = {
  opacity: "calc(0.2 + 0.8 * var(--enter, 1))",
  transform:
    "translateY(calc((1 - var(--enter, 1)) * 96px)) scale(calc(0.9 + 0.1 * var(--enter, 1)))",
  transformOrigin: "50% 100%",
  willChange: "transform, opacity",
};

const slideTop = "pt-[calc(env(safe-area-inset-top)+96px)]";
const kicker = "text-[15px] font-semibold text-red-500";
const slideTitle = "mt-2.5 text-[32px] leading-[1.18] font-black tracking-[-0.045em]";
const slideBody = "mt-3 text-base leading-[1.55] text-pretty text-muted-foreground";

function ProblemSlide() {
  return (
    <div
      className={cn(
        "flex h-full flex-col px-6 pb-[calc(env(safe-area-inset-bottom)+120px)]",
        "pt-[calc(env(safe-area-inset-top)+104px)]",
      )}
    >
      <h1 data-a className="text-[32px] leading-[1.2] font-black tracking-[-0.045em]">
        넷플릭스,
        <br />
        이번 달에 몇 번 봤어요?
      </h1>
      <p
        data-a
        className="mt-3 text-[22px] leading-[1.3] font-extrabold tracking-[-0.04em] text-muted-foreground"
      >
        쿠팡 와우는? 유튜브 프리미엄은?
      </p>
      <ul className="mt-10 flex flex-col gap-2.5">
        {SAMPLES.map((sample) => (
          <li
            key={sample.preset.id}
            data-n
            className="flex items-center gap-3.5 rounded-[20px] border bg-card px-4 py-3.5 shadow-[0_16px_32px_-20px_rgba(9,9,11,0.25)]"
          >
            <ServiceLogo presetId={sample.preset.id} name={sample.preset.nameKo} size={40} />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-2 text-[15px] font-bold">
                <span className="truncate">{sampleName(sample)}</span>
                <span className="shrink-0 text-[13px] font-medium text-muted-foreground">
                  결제일
                </span>
              </div>
              <p className="mt-0.5 text-[15px] tabular-nums text-muted-foreground">
                {formatCurrency(sample.amount, sample.currency)} 결제 완료
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex-1" />
      {sampleTotal && (
        <div data-n>
          <p className="text-[26px] leading-[1.3] font-black tracking-[-0.04em]">
            모르는 사이 매달
            <br />
            <span className="text-red-500 tabular-nums">{sampleTotal}</span>
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">예시예요 · 서비스 목록 기준 요금</p>
        </div>
      )}
    </div>
  );
}

function AnswerSlide({ slashRef }: { slashRef: React.Ref<SVGPathElement> }) {
  return (
    <div
      className="flex h-full flex-col items-center justify-center px-7 pb-[calc(env(safe-area-inset-bottom)+112px)] text-center"
      style={RISE_TEXT}
    >
      <AnswerIcon slashRef={slashRef} />
      <p className="mt-8 text-[15px] font-semibold text-muted-foreground">구독 디톡스</p>
      <h2 className="mt-2.5 text-[48px] leading-[1.08] font-black tracking-[-0.05em]">
        가격 말고
        <br />
        <span className="text-red-500">1회당 단가로.</span>
      </h2>
      <p className="mt-5 text-[17px] leading-[1.6] text-pretty text-muted-foreground">
        한 달에 몇 번 쓰는지 체크하면 안 쓰는 구독이 보여요. 해지 경로까지 알려 드려요.
      </p>
    </div>
  );
}

/** 앱 아이콘. 슬래시는 이 장에 멈춰 섰을 때 긋는다(ref로 움직인다). icon.svg·BrandAppIcon과 같은 좌표다. */
function AnswerIcon({ slashRef }: { slashRef: React.Ref<SVGPathElement> }) {
  return (
    <svg
      viewBox="0 0 512 512"
      aria-hidden
      className="size-[104px] rounded-[24%] shadow-[0_30px_60px_-24px_rgba(9,9,11,0.45)] dark:ring-1 dark:ring-zinc-700"
    >
      <rect width="512" height="512" rx="123" fill="#09090B" />
      <g transform="rotate(-6 256 256)">
        <rect x="63" y="102" width="258" height="213" rx="52" fill="#52525B" />
        <rect x="178" y="197" width="271" height="209" rx="54" fill="#FAFAFA" />
      </g>
      <path
        ref={slashRef}
        d="M92 422 L420 102"
        stroke="#EF4444"
        strokeWidth="51"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function CalculatorSlide() {
  return (
    <div className={cn("flex h-full flex-col px-5", slideTop)}>
      <div className="px-1" style={RISE_TEXT}>
        <p className={kicker}>1회당 단가</p>
        <h2 className={slideTitle}>
          그 구독,
          <br />한 달에 몇 번 써요?
        </h2>
        <p className={slideBody}>횟수를 움직여 보세요.</p>
      </div>
      {/* 웹 소개와 같은 계산기다. 요금은 서비스 목록에서 읽는다. */}
      <div className="mt-6" style={RISE_TEXT}>
        <UnitCostCalculator />
      </div>
    </div>
  );
}

function FeatureSlide({ feature }: { feature: (typeof FEATURES)[number] }) {
  return (
    <div className={cn("flex h-full flex-col", slideTop)}>
      <div className="px-6" style={RISE_TEXT}>
        <p className={kicker}>{feature.kicker}</p>
        <h2 className={slideTitle}>
          {feature.title[0]}
          <br />
          {feature.title[1]}
        </h2>
        <p className={slideBody}>{feature.body}</p>
        <p className="mt-1 text-xs text-muted-foreground/80">샘플 데이터로 찍은 화면</p>
      </div>
      {/* 폰 윗부분만 보인다. 아래쪽은 넘기기 막대 뒤로 잘려도 된다. */}
      <div
        className="mx-auto mt-7 w-[290px] rounded-t-[46px] bg-zinc-950 px-2.5 pt-2.5 ring-1 ring-transparent dark:ring-zinc-700"
        style={RISE_PHONE}
      >
        {/* 앱 빌드는 정적 내보내기라 next/image의 최적화를 쓸 수 없다(Landing과 같다). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={feature.image}
          alt={feature.alt}
          width={1080}
          height={1920}
          draggable={false}
          className="block h-[440px] w-full rounded-t-[36px] bg-white object-cover object-top"
        />
      </div>
    </div>
  );
}

const LOGIN_PROVIDERS = [
  { id: "kakao", label: "카카오로 로그인하러 가기" },
  { id: "naver", label: "네이버로 로그인하러 가기" },
  { id: "google", label: "Google로 로그인하러 가기" },
] as const;

function TrySlide({
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
                <span className="block text-base font-bold">{shortName(preset)}</span>
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

export function AppOnboarding({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const startDemo = useStore((state) => state.startDemo);
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const slashRef = useRef<SVGPathElement>(null);
  const busyRef = useRef(false);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const last = index === LAST;

  const finish = async (after: () => void) => {
    if (busyRef.current) return;
    busyRef.current = true;
    await markWelcomeSeen();
    onDone();
    after();
  };

  const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const goTo = (i: number) => {
    const track = trackRef.current;
    if (!track) return;
    const target = Math.max(0, Math.min(LAST, i));
    track.scrollTo({
      left: target * track.clientWidth,
      behavior: reduceMotion() ? "auto" : "smooth",
    });
  };

  // 넘긴 만큼을 지금 장으로 본다. 넘기는 것은 브라우저의 스크롤 스냅이 맡는다. index는 다음 장이 절반 들어오면
  // 바뀌고(점·버튼·진행 줄), settled는 넘김이 끝나 장이 제자리에 섰을 때만 바뀐다(둘째 장의 슬래시).
  const [settled, setSettled] = useState(0);
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slides = [...track.querySelectorAll<HTMLElement>("[data-slide]")];
    const motion = !reduceMotion();
    let frame = 0;
    // 장마다 들어온 정도를 --enter로 적는다. 끝으로 갈수록 천천히 서도록 ease-out으로 굽힌다.
    const paint = () => {
      frame = 0;
      const width = track.clientWidth;
      if (width === 0) return;
      const position = track.scrollLeft / width;
      slides.forEach((slide, i) => {
        const p = Math.max(0, 1 - Math.abs(position - i));
        slide.style.setProperty("--enter", (1 - (1 - p) ** 2).toFixed(3));
      });
    };
    const onScroll = () => {
      const width = track.clientWidth;
      if (width === 0) return;
      const nearest = Math.round(track.scrollLeft / width);
      setIndex(nearest);
      // 제자리는 장 폭에 대한 비율로 본다. 화면 폭이 소수(392.7px 등)면 clientWidth는 반올림한 값이라, 뒤 장일수록
      // scrollLeft와 '장 번호 × clientWidth'의 차이가 몇 px씩 쌓여 제자리로 보지 못했다. 끝까지 넘겼으면 그것도
      // 제자리다.
      const atEnd = track.scrollLeft >= track.scrollWidth - width - 1;
      if (Math.abs(track.scrollLeft / width - nearest) < 0.01 || atEnd) setSettled(nearest);
      if (motion && !frame) frame = requestAnimationFrame(paint);
    };
    if (motion) paint();
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // 첫 장은 소개가 열릴 때 한 번 차례로 떠오른다 — 질문이 먼저, 결제 알림과 합계가 뒤따라 하나씩.
  // 다른 장은 장이 바뀔 때 애니메이션을 다시 틀지 않고 넘기는 위치(--enter)를 따라 떠오른다 — 장이 바뀌는 것은
  // 넘기는 도중(다음 장이 절반 들어온 때)이라, 그때 애니메이션을 틀면 보이던 글이 사라졌다가 다시 떠올랐다.
  useEffect(() => {
    const slide = rootRef.current?.querySelector('[data-slide="0"]');
    if (!slide || reduceMotion()) return;
    const rise = (el: Element, delay: number, from: string) =>
      el.animate(
        [
          { opacity: 0, transform: from },
          { opacity: 1, transform: "none" },
        ],
        { duration: 700, delay, easing: EASE, fill: "backwards" },
      );
    const anims = [
      ...[...slide.querySelectorAll("[data-a]")].map((el, k) =>
        rise(el, 60 + k * 90, "translateY(28px)"),
      ),
      ...[...slide.querySelectorAll("[data-n]")].map((el, k) =>
        rise(el, 380 + k * 340, "translateY(36px) scale(0.95)"),
      ),
    ];
    return () => anims.forEach((a) => a.cancel());
  }, []);

  // 둘째 장의 로고 슬래시는 처음부터 지워 두고, 그 장에 멈춰 섰을 때 한 번 긋는다. 들어오는 도중에 숨기면
  // 보이던 슬래시가 사라졌다가 다시 그어진다.
  const slashDrawnRef = useRef(false);
  useEffect(() => {
    const path = slashRef.current;
    if (!path || reduceMotion()) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
  }, []);
  useEffect(() => {
    const path = slashRef.current;
    if (settled !== ANSWER || !path || slashDrawnRef.current || reduceMotion()) return;
    slashDrawnRef.current = true;
    const len = path.getTotalLength();
    const anim = path.animate([{ strokeDashoffset: `${len}` }, { strokeDashoffset: "0" }], {
      duration: 650,
      delay: 120,
      easing: EASE,
      fill: "forwards",
    });
    anim.onfinish = () => {
      path.style.strokeDashoffset = "0";
      anim.cancel();
    };
  }, [settled]);

  const togglePick = (id: string) =>
    setPicked((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  const slide = (i: number) => {
    if (i === 0) return <ProblemSlide />;
    if (i === ANSWER) return <AnswerSlide slashRef={slashRef} />;
    if (i === 2) return <CalculatorSlide />;
    if (i === LAST)
      return (
        <TrySlide
          picked={picked}
          onToggle={togglePick}
          onStart={() =>
            void finish(() => {
              // 목록 순서대로 연다(고른 순서와 관계없이).
              queueWelcomePicks(PICKS.filter((p) => picked.includes(p.id)).map((p) => p.id));
              router.push("/dashboard");
            })
          }
          onSample={() =>
            void finish(() => {
              startDemo();
              router.push("/dashboard");
            })
          }
          onLogin={() => void finish(() => router.push("/login"))}
        />
      );
    return <FeatureSlide feature={FEATURES[i - 3]} />;
  };

  return (
    // 인트로의 검은 판에서 이어지므로 바깥은 검게 두고 소개만 서서히 드러낸다(그 사이 홈이 비치지 않게).
    <div className="fixed inset-0 z-[100] bg-[#09090b]">
      <div
        ref={rootRef}
        className="hero-in relative h-full overflow-hidden bg-background text-foreground break-keep"
        style={{ "--hero-delay": "0ms" } as CSSProperties}
        role="region"
        aria-roledescription="carousel"
        aria-label="SubSlash 소개"
      >
        <div
          ref={trackRef}
          className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SLIDE_LABELS.map((label, i) => (
            <section
              key={label}
              data-slide={i}
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${SLIDE_COUNT} · ${label}`}
              aria-hidden={i !== index}
              className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden"
            >
              {slide(i)}
            </section>
          ))}
        </div>

        {/* 위: 워드마크와 건너뛰기, 그 아래 몇 장째인지 차오르는 빨간 줄. 건너뛰기는 마지막 장에서 숨긴다. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-background pt-[env(safe-area-inset-top)]">
          <div className="flex h-16 items-center justify-between px-5 pt-2">
            <BrandWordmark className="text-base" />
            <button
              type="button"
              onClick={() => goTo(LAST)}
              tabIndex={last ? -1 : undefined}
              className={cn(
                "px-1 py-3 text-[15px] font-semibold text-muted-foreground transition-opacity duration-300",
                last ? "opacity-0" : "pointer-events-auto",
              )}
            >
              건너뛰기
            </button>
          </div>
          <div
            aria-hidden
            className="h-0.5 bg-red-500 transition-[width] duration-[350ms] ease-out"
            style={{ width: `${((index + 1) / SLIDE_COUNT) * 100}%` }}
          />
        </div>

        {/* 아래: 몇 번째 장인지와 다음. 마지막 장에서는 그 장의 버튼이 대신한다. */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 box-content flex h-28 items-center justify-between bg-gradient-to-t from-background from-70% to-transparent px-6 pb-[calc(env(safe-area-inset-bottom)+28px)] transition-[opacity,transform] duration-300",
            last && "pointer-events-none translate-y-5 opacity-0",
          )}
        >
          <div className="flex items-center gap-1.5">
            {SLIDE_LABELS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => goTo(i)}
                tabIndex={last ? -1 : undefined}
                aria-label={`${i + 1}번째 장 · ${label}`}
                aria-current={i === index ? "step" : undefined}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === index ? "w-6 bg-foreground" : "w-2 bg-zinc-300 dark:bg-zinc-700",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            tabIndex={last ? -1 : undefined}
            className="flex h-[52px] items-center gap-1.5 rounded-full bg-primary px-6 text-base font-bold text-primary-foreground"
          >
            다음
            <ArrowRight className="size-[18px]" strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
