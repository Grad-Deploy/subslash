import React from "react";
import { cn } from "@lib/utils";

/**
 * SubSlash 브랜드 마크.
 *
 * 브랜드 시트('Final — Stop Red')의 심볼을 그대로 옮긴 것이다. 구독 카드 두 장을 빨간
 * 슬래시가 가로지르는 모양이고, 색은 시트의 픽셀에서 뽑았다.
 *
 * - 빨강 `#EF4444`(시트 측정값 #EE4444) · 검정 `#09090B` · 흰색 `#FAFAFA`
 * - 뒤 카드는 바탕에 따라 달라진다. 밝은 바탕에서는 `#D4D4D8`, 어두운 바탕에서는 `#52525B`.
 *
 * 앞 카드와 뒤 카드는 테마를 따라 뒤집히므로 색을 직접 적지 않고 Tailwind의 다크 모드
 * 유틸리티로 적는다. 앱 아이콘처럼 테마가 없는 자리(`app/icon.svg`)는 검은 바탕 버전을
 * 따로 두고, 그 파일도 여기 좌표와 같은 값을 쓴다.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="56 64 400 392"
      className={cn("h-7 w-7", className)}
      role="img"
      aria-label="SubSlash"
    >
      <g transform="rotate(-6 256 256)">
        <rect
          x="63"
          y="102"
          width="258"
          height="213"
          rx="52"
          className="fill-zinc-300 dark:fill-zinc-600"
        />
        <rect
          x="178"
          y="197"
          width="271"
          height="209"
          rx="54"
          className="fill-zinc-950 dark:fill-zinc-50"
        />
      </g>
      <path
        d="M92 422 L420 102"
        className="stroke-red-500"
        strokeWidth="51"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * 워드마크 'Sub/Slash'.
 *
 * 가운데 슬래시는 글꼴의 '/'가 아니라 기울인 막대다. 브랜드 시트의 슬래시는 글자보다 두껍고
 * 더 급하게 서 있어서, 글꼴의 '/'로는 같은 인상이 나오지 않는다. 읽는 기계에는 글자 그대로
 * 'Sub/Slash'로 들리도록 따로 적는다.
 */
export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center font-black tracking-[-0.03em]", className)}>
      <span aria-hidden>Sub</span>
      <span
        aria-hidden
        className="mx-[0.07em] inline-block h-[0.92em] w-[0.17em] -skew-x-[14deg] rounded-[0.02em] bg-red-500"
      />
      <span aria-hidden>Slash</span>
      <span className="sr-only">Sub/Slash</span>
    </span>
  );
}

/** 마크와 워드마크를 나란히. 상단 바와 같이 좁은 자리에 쓴다. */
export function BrandLockup({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <BrandMark className="h-7 w-7 shrink-0" />
      <BrandWordmark className="text-lg" />
    </span>
  );
}
