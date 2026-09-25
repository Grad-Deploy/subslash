"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { formatKRW } from "@subslash/shared";
import { useIsClient } from "@hooks/useIsClient";
import styles from "./AppKillCelebration.module.css";

const BURST_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const AUTO_CLOSE_MS = 2600;

/**
 * 계산서에서 이어서 해지하다가 쉬어갈 구독을 모두 정리했을 때 잠깐 뜨는 축하 화면.
 * 몇 개를 정리했고 매달 얼마를 아끼게 됐는지 보여주고, 잠시 뒤 저절로 닫힌다(누르면 바로 닫힌다).
 * 이모지 대신 체크와 빨간 슬래시 조각으로 그린다.
 */
export function AppKillCelebration({
  count,
  monthlyKRW,
  onDone,
}: {
  count: number;
  monthlyKRW: number;
  onDone: () => void;
}) {
  const isClient = useIsClient();
  // 부모가 다시 그려질 때마다 새 함수가 와도 타이머가 처음부터 다시 돌지 않게 최신 것만 기억한다.
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const timer = setTimeout(() => doneRef.current(), AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!isClient) return null;

  return createPortal(
    <div
      className={`${styles.backdrop} fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-6`}
      onClick={onDone}
      role="status"
      aria-live="polite"
    >
      <div
        className={`${styles.card} w-full max-w-xs rounded-3xl border bg-background px-6 pt-8 pb-7 text-center shadow-2xl`}
      >
        <div className="relative mx-auto size-20">
          {BURST_ANGLES.map((angle) => (
            <span
              key={angle}
              className={styles.burst}
              style={{ "--a": `${angle}deg` } as CSSProperties}
              aria-hidden
            />
          ))}
          <div
            className={`${styles.ring} grid size-20 place-items-center rounded-full bg-emerald-500 text-white dark:bg-emerald-600`}
          >
            <svg viewBox="0 0 24 24" className="size-10" fill="none" aria-hidden>
              <path
                className={styles.check}
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className={styles.text}>
          <p className="mt-5 text-xl font-black tracking-tight">구독 {count}개를 정리했어요</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            매달{" "}
            {/* 본문과 같은 글꼴로 두고(고정폭 글꼴은 이 문장에서 혼자 튄다), 색과 크기로 금액을 띄운다. */}
            <b className="text-lg font-black tracking-tight text-emerald-700 tabular-nums dark:text-emerald-400">
              {formatKRW(monthlyKRW).replace(/^₩\s*/, "₩ ")}
            </b>
            을 아껴요
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
