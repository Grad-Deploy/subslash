import type { CSSProperties } from "react";

/** 앱 소개(AppOnboarding)의 장들이 같이 쓰는 움직임과 글자 모양. */

/**
 * 장이 들어오는 정도(`--enter`, 0~1)에 묶은 움직임. 0이면 옆 장에 있고 1이면 제자리다. 값은 넘기는
 * 손가락(스크롤 위치)을 따라 매 프레임 바뀌므로 글과 그림이 넘기는 만큼 아래에서 올라오고, 나갈 때는 그만큼
 * 내려간다. 따로 재생하는 애니메이션이 아니라 중간에 끊기거나 다시 시작하지 않는다. 값이 없으면(움직임 줄이기,
 * 스크립트 전) 1로 보아 제자리에 그린다.
 */
export const RISE_TEXT: CSSProperties = {
  opacity: "calc(0.35 + 0.65 * var(--enter, 1))",
  transform: "translateY(calc((1 - var(--enter, 1)) * 14px))",
};
export const RISE_PHONE: CSSProperties = {
  opacity: "calc(0.2 + 0.8 * var(--enter, 1))",
  transform:
    "translateY(calc((1 - var(--enter, 1)) * 96px)) scale(calc(0.9 + 0.1 * var(--enter, 1)))",
  transformOrigin: "50% 100%",
  willChange: "transform, opacity",
};

export const slideTop = "pt-[calc(env(safe-area-inset-top)+96px)]";
export const kicker = "text-[15px] font-semibold text-red-500";
export const slideTitle = "mt-2.5 text-[32px] leading-[1.18] font-black tracking-[-0.045em]";
export const slideBody = "mt-3 text-base leading-[1.55] text-pretty text-muted-foreground";
