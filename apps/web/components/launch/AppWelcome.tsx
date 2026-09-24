"use client";

import { useEffect, useRef } from "react";
import { Clapperboard, Headphones, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStore } from "@lib/store";
import { markWelcomeSeen } from "@lib/welcome";
import styles from "./AppWelcome.module.css";

/** 예시 카드 가르기 시점(ms). 카드가 다 올라온 뒤 한 번(시안과 같은 값). */
const CUT_AT = 1250;

export function AppWelcome({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const startDemo = useStore((state) => state.startDemo);

  const inRefs = useRef<(HTMLElement | null)[]>([]);
  const dimmableRefs = useRef<(HTMLElement | null)[]>([]);
  const badCardRef = useRef<HTMLDivElement>(null);
  const cutBarRef = useRef<HTMLDivElement>(null);
  const tagcutRef = useRef<HTMLSpanElement>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const anims: Animation[] = [];
    const animate = (
      el: Element | null,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => {
      if (!el) return;
      anims.push(el.animate(keyframes, { fill: "both", ...options }));
    };

    if (reduce) {
      inRefs.current.forEach((el) => {
        if (el) el.style.opacity = "1";
      });
      return;
    }

    // 위에서부터 차례로 떠오름
    inRefs.current.forEach((el, i) => {
      animate(
        el,
        [
          { opacity: 0, transform: "translateY(14px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 560, delay: 80 + i * 70, easing: "cubic-bezier(.22,1,.36,1)" },
      );
    });

    // 예시 카드 가르기: 카드가 다 올라온 뒤 한 번
    animate(
      cutBarRef.current,
      [{ transform: "translateX(-101%)" }, { transform: "translateX(0)" }],
      { duration: 220, delay: CUT_AT, easing: "cubic-bezier(.55,0,.9,.35)" },
    );
    animate(
      badCardRef.current,
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-3px) rotate(-.6deg)", offset: 0.3 },
        { transform: "translateX(2px)", offset: 0.6 },
        { transform: "translateX(0)" },
      ],
      { duration: 260, delay: CUT_AT + 220, easing: "ease-out", fill: "none" },
    );
    dimmableRefs.current.forEach((el) => {
      animate(el, [{ opacity: 1 }, { opacity: 0.45 }], {
        duration: 300,
        delay: CUT_AT + 200,
        easing: "ease-out",
      });
    });
    animate(
      tagcutRef.current,
      [
        { opacity: 0, transform: "translateY(4px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 320, delay: CUT_AT + 300, easing: "cubic-bezier(.22,1,.36,1)" },
    );

    return () => anims.forEach((a) => a.cancel());
  }, []);

  const finish = async (after: () => void) => {
    if (busyRef.current) return;
    busyRef.current = true;
    await markWelcomeSeen();
    onDone();
    after();
  };

  return (
    <div className={styles.overlay}>
      <div
        className={`${styles.brand} ${styles.in}`}
        ref={(el) => {
          inRefs.current[0] = el;
        }}
      >
        <svg viewBox="0 0 512 512" aria-hidden="true">
          <rect width="512" height="512" rx="123" fill="#1C1C20" />
          <g transform="rotate(-6 256 256)">
            <rect x="63" y="102" width="258" height="213" rx="52" fill="#52525B" />
            <rect x="178" y="197" width="271" height="209" rx="54" fill="#FAFAFA" />
          </g>
          <path d="M92 422 L420 102" stroke="#EF4444" strokeWidth="51" strokeLinecap="round" />
        </svg>
        <span>
          Sub<b>Slash</b>
        </span>
      </div>

      <div className={styles.hero}>
        <h2
          className={styles.in}
          ref={(el) => {
            inRefs.current[1] = el;
          }}
        >
          구독, <em>한 번 쓸 때</em>
          <br />
          얼마인지 아세요?
        </h2>
        <p
          className={styles.in}
          ref={(el) => {
            inRefs.current[2] = el;
          }}
        >
          월 구독료를 실제 사용 횟수로 계산해서
          <br />
          내 구독이 정말 가치 있는지 확인해보세요.
          <br />안 쓰는 구독은 찾아서 해지까지 도와드릴게요.
        </p>
      </div>

      <div className={styles.spacerHalf} />

      <div className={styles.preview}>
        <span
          className={`${styles.chip} ${styles.in}`}
          ref={(el) => {
            inRefs.current[3] = el;
          }}
        >
          예시
        </span>
        <div
          className={`${styles.sub} ${styles.bad} ${styles.in}`}
          ref={(el) => {
            inRefs.current[4] = el;
            badCardRef.current = el;
          }}
        >
          <div
            className={`${styles.ico} ${styles.dimmable}`}
            style={{ background: "#2A1416" }}
            ref={(el) => {
              dimmableRefs.current[0] = el;
            }}
          >
            <Clapperboard size={17} aria-hidden="true" />
          </div>
          <div className={styles.meta}>
            <div className={styles.name}>
              영상 OTT
              <span className={styles.tagcut} ref={tagcutRef}>
                해지
              </span>
            </div>
            <div
              className={`${styles.info} ${styles.dimmable}`}
              ref={(el) => {
                dimmableRefs.current[1] = el;
              }}
            >
              월 13,500원 · 이번 달 2번
            </div>
          </div>
          <div className={styles.per}>
            <div className={styles.v}>6,750원</div>
            <div className={styles.k}>1회당</div>
          </div>
          <div className={styles.cut}>
            <div className={styles.cutBar} ref={cutBarRef} />
          </div>
        </div>
        <div
          className={`${styles.sub} ${styles.in}`}
          ref={(el) => {
            inRefs.current[5] = el;
          }}
        >
          <div className={styles.ico} style={{ background: "#14202A" }}>
            <Headphones size={17} aria-hidden="true" />
          </div>
          <div className={styles.meta}>
            <div className={styles.name}>음악</div>
            <div className={styles.info}>월 10,900원 · 이번 달 28번</div>
          </div>
          <div className={styles.per}>
            <div className={styles.v}>389원</div>
            <div className={styles.k}>1회당</div>
          </div>
        </div>
      </div>

      <div className={styles.spacer} />

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.btn} ${styles.primary} ${styles.in}`}
          ref={(el) => {
            inRefs.current[6] = el;
          }}
          onClick={() => void finish(() => router.push("/dashboard"))}
        >
          내 구독 등록하기
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.secondary} ${styles.in}`}
          ref={(el) => {
            inRefs.current[7] = el;
          }}
          onClick={() =>
            void finish(() => {
              startDemo();
              router.push("/dashboard");
            })
          }
        >
          샘플로 둘러보기
        </button>
      </div>
      <div
        className={`${styles.fine} ${styles.in}`}
        ref={(el) => {
          inRefs.current[8] = el;
        }}
      >
        <span className={styles.lock}>
          <Lock size={12} aria-hidden="true" />
          로그인 없이 이 기기에만 저장돼요
        </span>
        <br />
        이미 계정이 있나요?{" "}
        <button type="button" onClick={() => void finish(() => router.push("/login"))}>
          로그인
        </button>
      </div>
    </div>
  );
}
