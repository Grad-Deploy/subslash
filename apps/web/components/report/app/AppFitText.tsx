"use client";

import React, { useLayoutEffect, useRef } from "react";
import { cn } from "@lib/utils";

/**
 * 한 줄에 다 들어갈 때까지 글자를 줄인다(앱 전용). 좁은 칸의 금액을 `truncate`로 자르면
 * '₩59,…'처럼 숫자가 사라져 보는 의미가 없었다. `max`에서 시작해 넘치면 0.5px씩 줄이고, `min`에서
 * 멈춘다(그래도 넘치면 그때만 자른다). 칸 너비가 바뀌면(화면 회전·글자 크기 설정) 다시 잰다.
 */
export function AppFitText({
  text,
  className,
  max = 18,
  min = 11,
}: {
  text: string;
  className?: string;
  max?: number;
  min?: number;
}) {
  const ref = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let size = max;
      el.style.fontSize = `${size}px`;
      while (el.scrollWidth > el.clientWidth && size > min) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, max, min]);

  return (
    <p
      ref={ref}
      className={cn("overflow-hidden text-ellipsis whitespace-nowrap", className)}
      style={{ fontSize: max }}
    >
      {text}
    </p>
  );
}
