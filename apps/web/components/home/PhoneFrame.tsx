import React from "react";
import { cn } from "@lib/utils";

/**
 * 앱 화면 캡처(1080×1920, `public/landing/`)를 담는 검은 폰 테두리. 웹 소개와 앱 소개가 같이 쓴다. 모서리·크기·
 * 잘라 보일 부분(윗부분만 등)은 부르는 쪽이 `className`·`screenClassName`으로 정한다.
 */
export function PhoneFrame({
  src,
  alt,
  className,
  screenClassName,
  style,
  loading,
  draggable,
}: {
  src: string;
  alt: string;
  className?: string;
  screenClassName?: string;
  style?: React.CSSProperties;
  loading?: "lazy";
  /** 옆으로 넘기는 화면(앱 소개)에서는 끌어도 그림이 딸려 오지 않게 false로 둔다. */
  draggable?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-zinc-950 p-2.5 shadow-[0_60px_100px_-40px_rgba(9,9,11,0.5)] ring-1 ring-transparent dark:ring-zinc-700",
        className,
      )}
      style={style}
    >
      {/* 앱 빌드는 정적 내보내기라 next/image의 최적화를 쓸 수 없다(ServiceLogo와 같다). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={1080}
        height={1920}
        loading={loading}
        draggable={draggable}
        className={cn("block w-full bg-white object-cover", screenClassName)}
      />
    </div>
  );
}
