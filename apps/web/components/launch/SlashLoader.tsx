"use client";

import { useEffect, useRef } from "react";
import styles from "./SlashLoader.module.css";

/**
 * ④ 앱 아이콘에서 슬래시가 반복되는 전체 화면 로더(design-refs/loading-slash-preview.html).
 * 인트로와 같은 동작(그어짐 → 움찔 → 빠짐)을 반복한다.
 *
 * 아직 화면에 연결하지 않는다.
 */
export function SlashLoader({ message = "불러오는 중…" }: { message?: string }) {
  const markRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<SVGSVGElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const anims: Animation[] = [];

    anims.push(
      markRef.current!.animate(
        [
          { transform: "translateY(0)" },
          { transform: "translateY(-4px)", offset: 0.5 },
          { transform: "translateY(0)" },
        ],
        { duration: 2400, iterations: Infinity, easing: "ease-in-out" },
      ),
    );

    anims.push(
      cardsRef.current!.animate(
        [
          { transform: "scale(1)", offset: 0 },
          { transform: "scale(1)", offset: 0.2 },
          { transform: "scale(.93) rotate(-2deg)", offset: 0.24 },
          { transform: "scale(1.02) rotate(.5deg)", offset: 0.34 },
          { transform: "scale(1)", offset: 0.42 },
          { transform: "scale(1)", offset: 1 },
        ],
        { duration: 1200, iterations: Infinity, easing: "ease" },
      ),
    );

    // 들어옴(가속) → 멈춤 → 빠져나감 → 쉼
    anims.push(
      barRef.current!.animate(
        [
          { transform: "translateX(-101%)", offset: 0, easing: "cubic-bezier(.55,0,.9,.35)" },
          { transform: "translateX(0)", offset: 0.22, easing: "linear" },
          { transform: "translateX(0)", offset: 0.62, easing: "cubic-bezier(.5,0,.75,0)" },
          { transform: "translateX(101%)", offset: 0.82 },
          { transform: "translateX(101%)", offset: 1 },
        ],
        { duration: 1200, iterations: Infinity },
      ),
    );

    return () => anims.forEach((a) => a.cancel());
  }, []);

  return (
    <div className={styles.full} role="status" aria-live="polite">
      <div className={styles.mark} ref={markRef}>
        <svg viewBox="0 0 512 512" aria-hidden="true">
          <rect width="512" height="512" rx="123" fill="#09090B" />
        </svg>
        <svg className={styles.cards} ref={cardsRef} viewBox="0 0 512 512" aria-hidden="true">
          <g transform="rotate(-6 256 256)">
            <rect x="63" y="102" width="258" height="213" rx="52" fill="#52525B" />
            <rect x="178" y="197" width="271" height="209" rx="54" fill="#FAFAFA" />
          </g>
        </svg>
        <div className={styles.wrap}>
          <div className={styles.bar} ref={barRef} />
        </div>
      </div>
      <p>{message}</p>
    </div>
  );
}
