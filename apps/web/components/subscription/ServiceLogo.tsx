import { findPresetForSubscription } from "@subslash/shared";

import { BRAND_LOGOS, foregroundOn, NEUTRAL_LOGO_HEX, type BrandLogo } from "@lib/service-logos";
import { cn } from "@lib/utils";

/** 글자 수가 늘수록 글자를 줄여, 세 글자(GPT)도 타일 안에 들어오게 한다. */
function initialFontSize(size: number, initial: string): number {
  if (initial.length >= 3) return size * 0.3;
  if (initial.length === 2) return size * 0.38;
  return size * 0.48;
}

interface ServiceLogoProps {
  /**
   * 이미 어느 서비스인지 아는 화면(서비스 고르기·빠른 등록)이 넘기는 프리셋 id.
   * 있으면 이름으로 되찾는 과정을 건너뛴다.
   */
  presetId?: string;
  /** 구독·프리셋의 이름. `presetId`가 없을 때 이 이름으로 서비스 목록에서 프리셋을 찾는다. */
  name: string;
  /**
   * 구독에 저장된 해지 주소. 있으면 이름보다 먼저 프리셋을 가린다 — 애플·구글 구독 관리처럼
   * 주소가 겹치는 프리셋은 `findPresetForSubscription`이 이름으로 다시 가른다.
   */
  cancelUrl?: string;
  /**
   * 프리셋을 찾지 못했을 때 대신 보여줄 이모지. 사용자가 직접 등록한 구독은 로고를 모르므로
   * 지금처럼 이모지를 쓴다 — 첫 글자로 그럴듯한 마크를 만들어 브랜드인 척하지 않는다.
   */
  fallbackEmoji?: string;
  /** 타일 한 변의 크기(px). */
  size?: number;
  className?: string;
}

/**
 * 구독 한 줄 앞에 붙는 서비스 로고.
 *
 * 알려진 서비스는 브랜드 색 타일 위에 로고(또는 이니셜)를 그리고, 알 수 없는 구독은
 * 저장된 이모지를 그대로 보여준다. 로고 자료와 그 출처는 `lib/service-logos.ts`에 있다.
 *
 * 화면에서 로고 옆에는 늘 서비스 이름이 함께 나오므로 로고는 장식으로 둔다 — 읽어 주면
 * "넷플릭스 로고 넷플릭스"가 된다.
 */
export function ServiceLogo({
  presetId,
  name,
  cancelUrl,
  fallbackEmoji,
  size = 24,
  className,
}: ServiceLogoProps) {
  const preset = presetId ? undefined : findPresetForSubscription({ name, cancelUrl });
  const id = presetId ?? preset?.id;
  const logo: BrandLogo | undefined = id ? BRAND_LOGOS[id] : undefined;

  if (!logo) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-md bg-muted font-bold leading-none text-muted-foreground",
          className,
        )}
        style={{ width: size, height: size, fontSize: size * (fallbackEmoji ? 0.82 : 0.46) }}
        aria-hidden="true"
      >
        {/* 사용자가 직접 넣은 아이콘은 그대로 쓰고, 없으면 이름 첫 글자로 둔다.
            상자 이모지는 어느 서비스인지 알려주지 않으면서 자리만 차지했다. */}
        {fallbackEmoji || name.trim().charAt(0).toUpperCase()}
      </span>
    );
  }

  if (logo.image) {
    return (
      // 공식 앱 아이콘은 배경까지 담고 있어 브랜드 색 타일을 깔지 않는다. 다만 배경이 비어 있는
      // 아이콘(라프텔 등)이 다크 테마에서 사라지지 않도록 흰 바탕 위에 얹는다.
      // 앱은 정적 내보내기라 next/image의 최적화를 쓸 수 없고, 크기가 고정된 작은 아이콘이라
      // 얻을 것도 없다.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo.image}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className={cn(
          "shrink-0 rounded-[28%] bg-white object-contain ring-1 ring-black/10 dark:ring-white/15",
          className,
        )}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  const background = logo.hex ?? NEUTRAL_LOGO_HEX;
  const foreground = foregroundOn(background);

  return (
    <span
      className={cn(
        // 검은 타일(노션·커서)이 어두운 배경에 묻히지 않도록 테두리를 늘 얹는다.
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[28%]",
        "ring-1 ring-black/10 dark:ring-white/15",
        className,
      )}
      style={{ width: size, height: size, backgroundColor: background, color: foreground }}
      // 로고 옆에는 늘 서비스 이름이 함께 나온다. 이름을 붙이면 스크린리더가 두 번 읽는다.
      aria-hidden="true"
    >
      {logo.path ? (
        <svg
          viewBox={logo.viewBox ?? "0 0 24 24"}
          width={size * 0.6}
          height={size * 0.6}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d={logo.path} />
        </svg>
      ) : (
        <span
          className="font-black leading-none tracking-tight"
          style={{ fontSize: initialFontSize(size, logo.initial ?? "") }}
        >
          {logo.initial}
        </span>
      )}
    </span>
  );
}
