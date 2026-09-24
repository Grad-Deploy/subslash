"use client";

import { useEffect, useRef } from "react";
import styles from "./SlashDots.module.css";

/**
 * ③ 버튼 안 로딩: 슬래시 세 개가 차례로 벤다(design-refs/loading-slash-preview.html).
 *
 * 아직 화면에 연결하지 않는다.
 */
export function SlashDots({
  className,
  label = "불러오는 중",
}: {
  className?: string;
  label?: string;
}) {
  const dotRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const anims = dotRefs.current.map((el, i) =>
      el?.animate(
        [
          { transform: "rotate(24deg) scaleY(.35)", opacity: 0.35, offset: 0 },
          { transform: "rotate(24deg) scaleY(1.15)", opacity: 1, offset: 0.25 },
          { transform: "rotate(24deg) scaleY(.35)", opacity: 0.35, offset: 0.6 },
          { transform: "rotate(24deg) scaleY(.35)", opacity: 0.35, offset: 1 },
        ],
        { duration: 900, iterations: Infinity, easing: "cubic-bezier(.3,0,.2,1)", delay: i * 150 },
      ),
    );
    return () => anims.forEach((a) => a?.cancel());
  }, []);

  return (
    <span
      className={[styles.slashes, className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((i) => (
        <i
          key={i}
          aria-hidden
          ref={(el) => {
            dotRefs.current[i] = el;
          }}
        />
      ))}
    </span>
  );
}
