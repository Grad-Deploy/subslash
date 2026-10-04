import type { Ref } from "react";
import { Lock } from "lucide-react";
import { ENTER } from "./useOnboardingMotion";

/** 마지막 장: 시작 방법 고르기. 고른 뒤의 처리(소개를 다시 띄우지 않기, 화면 이동)는 AppOnboarding이 한다. */
export function StartSlide({
  slashRef,
  onStart,
  onSample,
  onLogin,
}: {
  /** 이 장에 들어올 때 그을 앱 아이콘의 슬래시. */
  slashRef: Ref<SVGPathElement>;
  onStart: () => void;
  onSample: () => void;
  onLogin: () => void;
}) {
  return (
    <div className="flex h-full flex-col bg-card px-7 pt-[calc(env(safe-area-inset-top)+120px)] pb-[calc(env(safe-area-inset-bottom)+40px)]">
      {/* 앱 아이콘(app/icon.svg)과 같은 좌표다. */}
      <svg {...ENTER} viewBox="0 0 512 512" className="size-[72px]" aria-hidden>
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
      <h2 {...ENTER} className="mt-8 text-[34px] leading-[1.25] font-black tracking-[-0.045em]">
        이번 달 구독,
        <br />
        지금 점검해 보세요
      </h2>
      <p {...ENTER} className="mt-3.5 text-base leading-[1.6] text-muted-foreground">
        월 구독료를 실제 사용 횟수로 계산해서 안 쓰는 구독은 찾아서 해지까지 도와드릴게요.
      </p>
      <div className="flex-1" />
      <div {...ENTER} className="flex flex-col gap-2.5">
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
      <div
        {...ENTER}
        className="mt-5 flex flex-col items-center gap-1.5 text-sm text-muted-foreground"
      >
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
