"use client";

import { useEffect, useRef } from "react";
import styles from "./AppBrandSplash.module.css";

/** 로고가 떠 있는 시간(ms). 이 뒤에 화면이 사라진다. */
const HOLD_MS = 700;

/**
 * 다시 실행할 때 보여주는 짧은 로고 화면. 처음 실행의 인트로(AppIntro)처럼 가르는 동작 없이
 * 로고와 이름만 잠깐 보여주고 홈으로 넘긴다. 탭하면 바로 넘어간다.
 */
export function AppBrandSplash({ onDone }: { onDone: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDone);
  const animsRef = useRef<Animation[]>([]);
  const finishedRef = useRef(false);

  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const finish = () => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onDoneRef.current();
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const anims: Animation[] = [];
    animsRef.current = anims;

    const overlay = overlayRef.current;
    const content = contentRef.current;
    if (!overlay || !content) {
      finish();
      return;
    }

    if (!reduce) {
      anims.push(
        content.animate(
          [
            { opacity: 0, transform: "scale(.96)" },
            { opacity: 1, transform: "scale(1)" },
          ],
          { duration: 260, easing: "cubic-bezier(.22,1,.36,1)", fill: "both" },
        ),
      );
    }
    const out = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: reduce ? 200 : 280,
      delay: reduce ? 300 : HOLD_MS,
      easing: "cubic-bezier(.4,0,.2,1)",
      fill: "both",
    });
    anims.push(out);
    out.finished.then(finish).catch(() => {});

    return () => anims.forEach((a) => a.cancel());
  }, []);

  const handleTap = () => {
    if (finishedRef.current) return;
    animsRef.current.forEach((a) => a.cancel());
    finishedRef.current = true;
    onDoneRef.current();
  };

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleTap}>
      <div className={styles.content} ref={contentRef}>
        <div className={styles.mark}>
          {/* icon.svg와 같은 좌표·색(바탕 제외) */}
          <svg viewBox="0 0 512 512" aria-hidden="true">
            <g transform="rotate(-6 256 256)">
              <rect x="63" y="102" width="258" height="213" rx="52" fill="#52525B" />
              <rect x="178" y="197" width="271" height="209" rx="54" fill="#FAFAFA" />
            </g>
            <path
              d="M92 422 L420 102"
              stroke="#EF4444"
              strokeWidth="51"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
        <div className={styles.word} aria-label="SubSlash">
          <span className={styles.sub}>Sub</span>
          <span className={styles.slashTxt}>Slash</span>
        </div>
      </div>
    </div>
  );
}
