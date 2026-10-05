"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowRight, CalendarDays, Lock, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { BrandWordmark } from "@components/brand/Brand";
import { useStore } from "@lib/store";
import { BRAND_LOGOS, type BrandLogo } from "@lib/service-logos";
import { markWelcomeSeen } from "@lib/welcome";
import { cn } from "@lib/utils";

/**
 * 앱 첫 실행의 소개. 웹의 첫 화면(`/`)이 내려 읽는 소개라면, 앱은 같은 이야기를 옆으로 넘기는 슬라이드로
 * 한다 — 예전 앱은 곧바로 대시보드로 가서 무엇을 하는 앱인지 알릴 곳이 없었다. 마지막 장에서 내 구독 등록
 * (대시보드)·샘플·로그인 중에 고르고, 고르면 다시 띄우지 않는다(`markWelcomeSeen`).
 *
 * 모양은 Claude Design 프로젝트의 'App Onboarding.dc.html'을 따른다. 화면 캡처는 웹 소개와 같은 샘플
 * 데이터 캡처(`public/landing/`)이고 그렇게 밝힌다. 첫 장의 서비스 로고는 확인한 로고(`BRAND_LOGOS`)만 쓴다.
 * 움직임(첫 장이 떠오름, 기능 장의 폰 그림이 넘기는 만큼 올라옴, 타일이 떠다님, 마지막 장에 멈추면 슬래시를 그음)은
 * 움직임 줄이기를 켜면 하지 않는다.
 */

const EASE = "cubic-bezier(.22,1,.36,1)";

const FEATURES = [
  {
    name: "한눈에 보기",
    title: "결정할 구독만 골라 보여 줘요",
    image: "/landing/dashboard.png",
    alt: "대시보드 화면 — 결제일이 다가오는 구독과 1회당 금액",
  },
  {
    name: "해지 안내",
    title: "해지하는 곳까지 데려다줘요",
    image: "/landing/cancel-guide.png",
    alt: "구독 상세 화면 — 다음 결제까지 남은 날과 해지 경로 안내",
  },
  {
    name: "메일로 찾기",
    title: "결제 메일로 구독을 찾아요",
    image: "/landing/gmail-import.png",
    alt: "결제 메일 가져오기 화면",
  },
  {
    name: "지킨 돈",
    title: "해지로 지킨 돈이 쌓여요",
    image: "/landing/savings.png",
    alt: "절약 현황 화면 — 해지로 지킨 돈",
  },
] as const;

const SLIDE_COUNT = FEATURES.length + 2;
const LAST = SLIDE_COUNT - 1;

/** 등각으로 눕힌 판. 타일과 폰 그림이 같은 각도로 눕는다. */
const ISO: CSSProperties = { transform: "rotateX(55deg) rotateZ(-45deg)" };

/**
 * 눕힌 타일. 폰보다 약하게, 얇은 판이 떠 있는 정도로만 입체를 준다.
 * - 옆면: 1px씩 쌓은 4겹(--tile-d1~4). 위에서 아래로 조금씩 어두워져 판의 두께로 읽힌다.
 * - 윗면: 흰 면은 평평하게 두고, 왼쪽 위 가장자리에 하이라이트(--tile-hi), 오른쪽 아래에 옅은 음영만 둔다.
 * - 그림자: 타일 바로 아래 바닥에 둥글게 둔다(`Tile` 안의 설명).
 */
const TILE_SURFACE: CSSProperties = {
  boxShadow: [
    "inset 1px 1px 0 var(--tile-hi)",
    "inset -1px -1px 0 rgba(9,9,11,.05)",
    "1px 1px 0 var(--tile-d1)",
    "2px 2px 0 var(--tile-d2)",
    "3px 3px 0 var(--tile-d3)",
    "4px 4px 0 var(--tile-d4)",
  ].join(", "),
};

function Tile({ children, x, y }: { children: ReactNode; x: number; y: number }) {
  return (
    <div data-tile className="absolute" style={{ left: x, top: y }}>
      {/* 바닥 그림자. 타일과 같이 눕히면 등각 각도 때문에 오른쪽 아래로 길게 늘어져, 눕히지 않은 화면 좌표에서
          타일 바로 아래에 둥근 그림자로 둔다. 가운데가 가장 진하고 바깥으로 갈수록 사라진다. 타일과 사이를 조금
          띄워 떠 있는 것처럼 보이게 하고, 타일이 떠오르면 바닥에 남아 작아지고 옅어진다(아래 움직임). */}
      <div
        data-float-shadow
        aria-hidden
        className="absolute top-[67px] left-0 h-4 w-[76px] rounded-[50%] bg-[radial-gradient(closest-side,rgba(9,9,11,.2),rgba(9,9,11,.08)_55%,transparent)] dark:bg-[radial-gradient(closest-side,rgba(0,0,0,.45),rgba(0,0,0,.18)_55%,transparent)]"
      />
      <div data-float>
        <div
          className="relative flex size-[68px] items-center justify-center rounded-xl bg-card"
          style={{ ...ISO, ...TILE_SURFACE }}
        >
          {/* 판을 눕힌 만큼 되돌려, 로고는 바로 서 보이게 한다. */}
          <span className="flex size-[34px] rotate-45 items-center justify-center overflow-hidden rounded-[28%]">
            {children}
          </span>
        </div>
      </div>
    </div>
  );
}

function LogoGlyph({ logo }: { logo: BrandLogo }) {
  return (
    <span className="flex size-full items-center justify-center" style={{ background: logo.hex }}>
      <svg viewBox={logo.viewBox ?? "0 0 24 24"} className="size-[18px] fill-white" aria-hidden>
        <path d={logo.path} />
      </svg>
    </span>
  );
}

/**
 * 첫 장에 눕혀 놓은 폰. 판 하나에 옆면 그림자 한 줄이면 화면만 붙인 납작한 판으로 보이고, 검은 옆면을 두껍게
 * 쌓으면(14px) 벽돌처럼 보여 실제 폰과 멀어졌다. 옆면은 1px씩 쌓은 5겹으로 얇게 두고, 밝은 금속에서 어두운
 * 쪽으로 옅어지게 칠해 정면의 검은 베젤과 이어지게 한다. 그림자는 판의 좌표에서 오른쪽 아래로 쌓여, 등각으로
 * 눕히면 아래로 두께가 보인다. 바닥 그림자·옆 버튼·카메라 구멍·유리 반사로 입체감을 더한다.
 */
const PHONE_DEPTH = ["#71717a", "#52525b", "#3f3f46", "#333338", "#27272a"]
  .map((color, i) => `${i + 1}px ${i + 1}px 0 ${color}`)
  .join(", ");

function IsoPhone() {
  return (
    <div className="relative" style={ISO}>
      {/* 바닥 그림자 — 폰보다 더 아래로 떨어져 떠 있는 것처럼 보이게 한다. */}
      <div className="absolute inset-0 translate-x-[34px] translate-y-[34px] rounded-[38px] bg-zinc-950/45 blur-[18px]" />
      <div
        className="relative w-[270px] rounded-[38px] p-[9px]"
        style={{
          background: "linear-gradient(135deg,#3f3f46 0%,#18181b 18%,#09090b 60%,#27272a 100%)",
          boxShadow: `inset 0 0 0 1.5px rgba(255,255,255,.14), inset 0 0 0 3px #09090b, ${PHONE_DEPTH}`,
        }}
      >
        {/* 옆 버튼(전원·음량). 옆면 두께 바로 바깥에 얇게 둔다. */}
        <span className="absolute top-[150px] -right-[7px] h-[46px] w-[3px] rounded-[2px] bg-zinc-600" />
        <span className="absolute top-[215px] -right-[7px] h-[70px] w-[3px] rounded-[2px] bg-zinc-600" />
        <div className="relative overflow-hidden rounded-[30px] bg-white">
          {/* 앱 빌드는 정적 내보내기라 next/image의 최적화를 쓸 수 없다(Landing과 같다). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/landing/dashboard.png"
            alt=""
            width={1080}
            height={1920}
            draggable={false}
            className="block aspect-[1080/1920] w-full object-cover"
          />
          <span className="absolute top-2.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-zinc-950 shadow-[inset_0_0_0_2px_#27272a]" />
          <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,transparent_18%,rgba(255,255,255,.28)_30%,transparent_44%)]" />
        </div>
      </div>
    </div>
  );
}

function HeroSlide() {
  const coupang = BRAND_LOGOS["coupang-wow"];
  return (
    <>
      {/* 바닥의 빨간 판. 워드마크의 빨간 슬래시와 같은 색이다. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[420px] bg-red-500 [clip-path:polygon(0_52%,100%_18%,100%_100%,0_100%)]"
      />
      <div className="absolute inset-x-7 top-[calc(env(safe-area-inset-top)+96px)]">
        <p data-a className="text-[22px] font-semibold tracking-[-0.03em] text-muted-foreground">
          가격 말고 1회당 단가로
        </p>
        <h1 data-a className="mt-2.5 text-[36px] leading-[1.25] font-black tracking-[-0.045em]">
          그 구독,
          <br />
          <span className="text-red-500">한 달에 몇 번 써요?</span>
        </h1>
      </div>
      {/* 그림은 390px 폭의 디자인 좌표 그대로 두고 가운데에 놓는다. */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-1/2 w-[390px] -translate-x-1/2 [--tile-d1:#ececee] [--tile-d2:#e4e4e7] [--tile-d3:#dcdce0] [--tile-d4:#d4d4d8] [--tile-hi:#ffffff] dark:[--tile-d1:#52525b] dark:[--tile-d2:#46464d] dark:[--tile-d3:#3f3f46] dark:[--tile-d4:#35353b] dark:[--tile-hi:rgba(255,255,255,.08)]"
      >
        <div className="absolute top-[calc(env(safe-area-inset-top))] inset-x-0 bottom-0">
          <Tile x={268} y={238}>
            <LogoGlyph logo={BRAND_LOGOS.netflix} />
          </Tile>
          <Tile x={30} y={372}>
            <LogoGlyph logo={BRAND_LOGOS["youtube-premium"]} />
          </Tile>
          <Tile x={292} y={352}>
            <span className="flex size-full items-center justify-center bg-muted">
              <Mail className="size-[18px] text-red-500" strokeWidth={2} />
            </span>
          </Tile>
          <Tile x={-14} y={262}>
            <span className="flex size-full items-center justify-center bg-muted">
              <CalendarDays className="size-[18px] text-foreground" strokeWidth={2} />
            </span>
          </Tile>
          {coupang?.image && (
            <Tile x={150} y={300}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coupang.image}
                alt=""
                className="size-full bg-white object-contain ring-1 ring-black/10"
              />
            </Tile>
          )}
          <div data-a className="absolute top-[400px] left-[88px]">
            <IsoPhone />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * 기능 장이 들어오는 정도(`--enter`, 0~1)에 묶은 움직임. 0이면 옆 장에 있고 1이면 제자리다. 값은 넘기는
 * 손가락(스크롤 위치)을 따라 매 프레임 바뀌므로 폰 그림이 넘기는 만큼 아래에서 올라오고, 나갈 때는 그만큼
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

function FeatureSlide({ feature }: { feature: (typeof FEATURES)[number] }) {
  return (
    <div className="flex h-full flex-col items-center pt-[calc(env(safe-area-inset-top)+68px)]">
      <h2 className="text-[32px] font-black tracking-[-0.045em]" style={RISE_TEXT}>
        {feature.name}
      </h2>
      <p
        className="mt-2.5 px-8 text-center text-[17px] leading-normal text-balance text-muted-foreground"
        style={RISE_TEXT}
      >
        {feature.title}
      </p>
      <p className="mt-1 text-xs text-muted-foreground/80" style={RISE_TEXT}>
        샘플 데이터로 찍은 화면
      </p>
      {/* 폰 그림은 화면 높이에 맞춰 줄인다. 아래쪽은 넘기기 막대 뒤로 잘려도 된다. 테두리는 웹 소개의 PhoneFrame처럼
          검게 둔다 — 바탕(muted)과 비슷한 회색으로 두면 테두리가 보이지 않았다. */}
      <div
        className="mt-6 w-[min(304px,calc((100svh-env(safe-area-inset-top)-200px)*0.5625))] rounded-[48px] bg-zinc-950 p-[9px] shadow-[0_40px_80px_-30px_rgba(9,9,11,0.45)] ring-1 ring-transparent dark:ring-zinc-600"
        style={RISE_PHONE}
      >
        <div className="overflow-hidden rounded-[39px] bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={feature.image}
            alt={feature.alt}
            width={1080}
            height={1920}
            draggable={false}
            className="block aspect-[1080/1920] w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}

function StartSlide({
  slashRef,
  onStart,
  onSample,
  onLogin,
}: {
  slashRef: React.Ref<SVGPathElement>;
  onStart: () => void;
  onSample: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-card px-7 pt-[calc(env(safe-area-inset-top)+120px)] pb-[calc(env(safe-area-inset-bottom)+40px)]">
      {/* 앱 아이콘(app/icon.svg)과 같은 좌표다. */}
      <svg data-a viewBox="0 0 512 512" className="size-[72px]" aria-hidden>
        <rect width="512" height="512" rx="123" fill="#1C1C20" />
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
      <h2 data-a className="mt-8 text-[34px] leading-[1.25] font-black tracking-[-0.045em]">
        이번 달 구독,
        <br />
        지금 점검해 보세요
      </h2>
      <p data-a className="mt-3.5 text-base leading-[1.6] text-muted-foreground">
        월 구독료를 실제 사용 횟수로 계산해서 안 쓰는 구독은 찾아서 해지까지 도와드릴게요.
      </p>
      <div className="flex-1" />
      <div data-a className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={onStart}
          className="h-14 rounded-[14px] bg-primary text-[17px] font-bold text-primary-foreground active:bg-primary/90"
        >
          내 구독 등록하기
        </button>
        <button
          type="button"
          onClick={onSample}
          className="h-14 rounded-[14px] border bg-card text-[17px] font-bold active:bg-muted"
        >
          샘플로 둘러보기
        </button>
      </div>
      <div data-a className="mt-5 flex flex-col items-center gap-1.5 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Lock className="size-[13px]" aria-hidden />
          로그인 없이 이 기기에만 저장돼요
        </span>
        <span className="flex items-center gap-1.5">
          이미 계정이 있나요?
          <button
            type="button"
            onClick={onLogin}
            className="px-0.5 py-1.5 font-bold text-foreground underline underline-offset-[3px]"
          >
            로그인
          </button>
        </span>
      </div>
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
  // 바뀌고(점·버튼), settled는 넘김이 끝나 장이 제자리에 섰을 때만 바뀐다(마지막 장의 슬래시).
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
      if (Math.abs(track.scrollLeft - nearest * width) < 2) setSettled(nearest);
      if (motion && !frame) frame = requestAnimationFrame(paint);
    };
    if (motion) paint();
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // 첫 장의 타일이 천천히 떠다닌다.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduceMotion()) return;
    // 타일이 떠오르면 바닥 그림자는 제자리에서 작아지고 옅어진다. 둘은 같은 시간·같은 박자로 움직인다.
    const anims = [...root.querySelectorAll("[data-tile]")].flatMap((tile, i) => {
      const timing: KeyframeAnimationOptions = {
        duration: 3200 + i * 420,
        delay: -i * 600,
        iterations: Infinity,
        easing: "ease-in-out",
      };
      const card = tile.querySelector("[data-float]");
      const shadow = tile.querySelector("[data-float-shadow]");
      return [
        card?.animate(
          [
            { transform: "translateY(0)" },
            { transform: "translateY(-12px)" },
            { transform: "translateY(0)" },
          ],
          timing,
        ),
        shadow?.animate(
          [
            { transform: "scale(1)", opacity: 1 },
            { transform: "scale(.82)", opacity: 0.7 },
            { transform: "scale(1)", opacity: 1 },
          ],
          timing,
        ),
      ].filter((a): a is Animation => a !== undefined);
    });
    return () => anims.forEach((a) => a.cancel());
  }, []);

  // 첫 장의 글과 그림은 소개가 열릴 때 한 번 차례로 떠오른다. 기능 장은 장이 바뀔 때 애니메이션을 다시 틀지
  // 않고 넘기는 위치(--enter)를 따라 떠오른다 — 장이 바뀌는 것은 넘기는 도중(다음 장이 절반 들어온 때)이라, 그때
  // 애니메이션을 틀면 이미 보이던 글과 그림이 사라졌다가 넘김이 끝난 뒤 아래에서 다시 떠올랐다.
  useEffect(() => {
    const slide = rootRef.current?.querySelector('[data-slide="0"]');
    if (!slide || reduceMotion()) return;
    const anims = [...slide.querySelectorAll("[data-a]")].map((el, k) =>
      el.animate(
        [
          { opacity: 0, transform: "translateY(28px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 700, delay: 60 + k * 90, easing: EASE, fill: "backwards" },
      ),
    );
    return () => anims.forEach((a) => a.cancel());
  }, []);

  // 마지막 장의 로고 슬래시는 처음부터 지워 두고, 그 장에 멈춰 섰을 때 한 번 긋는다. 들어오는 도중에 숨기면
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
    if (settled !== LAST || !path || slashDrawnRef.current || reduceMotion()) return;
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

  const slideLabels = ["소개", ...FEATURES.map((f) => f.name), "시작하기"];

  return (
    // 인트로의 검은 판에서 이어지므로 바깥은 검게 두고 소개만 서서히 드러낸다(그 사이 홈이 비치지 않게).
    <div className="fixed inset-0 z-[100] bg-[#09090b]">
      <div
        ref={rootRef}
        className="hero-in relative h-full overflow-hidden bg-muted text-foreground break-keep"
        style={{ "--hero-delay": "0ms" } as CSSProperties}
        role="region"
        aria-roledescription="carousel"
        aria-label="SubSlash 소개"
      >
        <div
          ref={trackRef}
          className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slideLabels.map((label, i) => (
            <section
              key={label}
              data-slide={i}
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${SLIDE_COUNT} · ${label}`}
              aria-hidden={i !== index}
              className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden"
            >
              {i === 0 ? (
                <HeroSlide />
              ) : i === LAST ? (
                <StartSlide
                  slashRef={slashRef}
                  onStart={() => void finish(() => router.push("/dashboard"))}
                  onSample={() =>
                    void finish(() => {
                      startDemo();
                      router.push("/dashboard");
                    })
                  }
                  onLogin={() => void finish(() => router.push("/login"))}
                />
              ) : (
                <FeatureSlide feature={FEATURES[i - 1]} />
              )}
            </section>
          ))}
        </div>

        {/* 위: 워드마크와 건너뛰기. 마지막 장에서는 숨긴다. */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 flex h-14 items-center justify-between px-5 transition-opacity duration-300",
            "box-content pt-[env(safe-area-inset-top)]",
            last && "opacity-0",
          )}
        >
          <BrandWordmark className="text-base" />
          <button
            type="button"
            onClick={() => goTo(LAST)}
            tabIndex={last ? -1 : undefined}
            className={cn(
              "px-1 py-3 text-[15px] font-semibold text-muted-foreground",
              !last && "pointer-events-auto",
            )}
          >
            건너뛰기
          </button>
        </div>

        {/* 아래: 몇 번째 장인지와 다음. 마지막 장에서는 고르는 버튼이 대신한다. */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 flex h-28 items-center justify-between px-6 pb-[calc(env(safe-area-inset-bottom)+28px)] transition-[opacity,transform] duration-300",
            "box-content",
            last && "pointer-events-none translate-y-5 opacity-0",
          )}
        >
          <div className="flex items-center gap-1.5">
            {slideLabels.map((label, i) => (
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
