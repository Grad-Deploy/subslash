import type { CSSProperties, ReactNode } from "react";
import { CalendarDays, Mail } from "lucide-react";
import { BRAND_LOGOS, type BrandLogo } from "@lib/service-logos";
import { AppScreenshot } from "./AppScreenshot";
import { ENTER, FLOAT } from "./useOnboardingMotion";

/** 등각으로 눕힌 판. 타일과 폰 그림이 같은 각도로 눕는다. */
const ISO: CSSProperties = { transform: "rotateX(55deg) rotateZ(-45deg)" };

/** 눕힌 타일. 옆면은 그림자로 그린다. 위치는 디자인의 390px 좌표다. */
function Tile({ children, x, y }: { children: ReactNode; x: number; y: number }) {
  return (
    <div {...FLOAT} className="absolute" style={{ left: x, top: y }}>
      <div
        className="flex size-[68px] items-center justify-center rounded-xl bg-card shadow-[5px_5px_0_var(--tile-side),0_18px_30px_-10px_rgba(9,9,11,0.18)]"
        style={ISO}
      >
        {/* 판을 눕힌 만큼 되돌려, 로고는 바로 서 보이게 한다. */}
        <span className="flex size-[34px] rotate-45 items-center justify-center overflow-hidden rounded-[28%]">
          {children}
        </span>
      </div>
    </div>
  );
}

/** 브랜드 색 바탕에 흰 글리프. 확인한 로고(`BRAND_LOGOS`)만 넘긴다. */
function LogoGlyph({ logo }: { logo: BrandLogo }) {
  return (
    <span className="flex size-full items-center justify-center" style={{ background: logo.hex }}>
      <svg viewBox={logo.viewBox ?? "0 0 24 24"} className="size-[18px] fill-white" aria-hidden>
        <path d={logo.path} />
      </svg>
    </span>
  );
}

function IconGlyph({ children }: { children: ReactNode }) {
  return <span className="flex size-full items-center justify-center bg-muted">{children}</span>;
}

/** 첫 장: 1회 단가 문구와 떠 있는 서비스 타일, 눕힌 대시보드 화면. */
export function HeroSlide() {
  const coupang = BRAND_LOGOS["coupang-wow"];
  return (
    <>
      {/* 바닥의 빨간 판. 워드마크의 빨간 슬래시와 같은 색이다. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[420px] bg-red-500 [clip-path:polygon(0_52%,100%_18%,100%_100%,0_100%)]"
      />
      <div className="absolute inset-x-7 top-[calc(env(safe-area-inset-top)+96px)]">
        <p
          {...ENTER}
          className="text-[22px] font-semibold tracking-[-0.03em] text-muted-foreground"
        >
          가격 말고 1회당 단가로
        </p>
        <h1 {...ENTER} className="mt-2.5 text-[36px] leading-[1.25] font-black tracking-[-0.045em]">
          그 구독,
          <br />
          <span className="text-red-500">한 달에 몇 번 써요?</span>
        </h1>
      </div>
      {/* 그림은 390px 폭의 디자인 좌표 그대로 두고 가운데에 놓는다. */}
      <div
        aria-hidden
        className="absolute inset-y-0 left-1/2 w-[390px] -translate-x-1/2 [--tile-side:#e4e4e7] dark:[--tile-side:#3f3f46]"
      >
        <div className="absolute inset-x-0 top-[env(safe-area-inset-top)] bottom-0">
          <Tile x={268} y={238}>
            <LogoGlyph logo={BRAND_LOGOS.netflix} />
          </Tile>
          <Tile x={30} y={372}>
            <LogoGlyph logo={BRAND_LOGOS["youtube-premium"]} />
          </Tile>
          <Tile x={292} y={352}>
            <IconGlyph>
              <Mail className="size-[18px] text-red-500" strokeWidth={2} />
            </IconGlyph>
          </Tile>
          <Tile x={-14} y={262}>
            <IconGlyph>
              <CalendarDays className="size-[18px] text-foreground" strokeWidth={2} />
            </IconGlyph>
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
          <div {...ENTER} className="absolute top-[400px] left-[88px]">
            <div
              className="w-[270px] rounded-[38px] bg-zinc-950 p-[9px] shadow-[9px_9px_0_var(--tile-side),0_40px_60px_-20px_rgba(9,9,11,0.35)] ring-1 ring-transparent dark:ring-zinc-600"
              style={ISO}
            >
              <AppScreenshot
                src="/landing/dashboard.png"
                alt=""
                className="rounded-[30px] bg-white"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
