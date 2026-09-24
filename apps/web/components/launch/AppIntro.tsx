"use client";

import { useEffect, useRef } from "react";
import styles from "./AppIntro.module.css";

/** icon.svg와 같은 좌표·색의 카드 두 장(바탕 제외). */
function CardShape() {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true">
      <g transform="rotate(-6 256 256)">
        <rect x="63" y="102" width="258" height="213" rx="52" fill="#52525B" />
        <rect x="178" y="197" width="271" height="209" rx="54" fill="#FAFAFA" />
      </g>
    </svg>
  );
}

// 파편: 슬래시 위의 점에서 선과 수직 방향으로 튄다(시안과 같은 좌표계).
const SHARD_NORMAL = { x: -0.698, y: -0.716 };
const SHARD_ALONG = { x: 0.716, y: -0.698 };
const SHARD_COLORS = ["#EF4444", "#FAFAFA", "#EF4444", "#A1A1AA"];

const SHARDS = Array.from({ length: 12 }, (_, i) => {
  const t = 0.25 + (i / 11) * 0.5;
  const side = i % 2 ? 1 : -1;
  const dist = 90 + ((i * 37) % 60);
  const drift = ((i * 53) % 40) - 20;
  return {
    left: `${((92 + 328 * t) / 512) * 100}%`,
    top: `${((422 - 320 * t) / 512) * 100}%`,
    color: SHARD_COLORS[i % 4],
    dx: SHARD_NORMAL.x * side * dist + SHARD_ALONG.x * drift,
    dy: SHARD_NORMAL.y * side * dist + SHARD_ALONG.y * drift,
    rot: side * (120 + ((i * 29) % 180)),
  };
});

// 충격 시점(ms). 모든 타이밍은 여기를 기준으로 맞춘다(시안과 같은 값).
const T = 520;

export function AppIntro({ onDone }: { onDone: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const wholeRef = useRef<HTMLDivElement>(null);
  const upperRef = useRef<HTMLDivElement>(null);
  const lowerRef = useRef<HTMLDivElement>(null);
  const slashWrapRef = useRef<HTMLDivElement>(null);
  const slashBarRef = useRef<HTMLDivElement>(null);
  const glintRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const shardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const introRef = useRef<HTMLDivElement>(null);
  const w1Ref = useRef<HTMLSpanElement>(null);
  const w2Ref = useRef<HTMLSpanElement>(null);

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

    const animate = (
      el: Element | null,
      keyframes: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => {
      if (!el) return null;
      const anim = el.animate(keyframes, { fill: "both", ...options });
      anims.push(anim);
      return anim;
    };

    if (reduce) {
      const introAnim = animate(introRef.current, [{ opacity: 1 }, { opacity: 0 }], {
        duration: 300,
      });
      if (introAnim) introAnim.finished.then(finish).catch(() => {});
      else finish();
      return () => anims.forEach((a) => a.cancel());
    }

    // 1) 카드 등장: 튀어나오며 살짝 넘치고, 충격 직전 움츠림(예비 동작)
    animate(
      cardsRef.current,
      [
        { transform: "scale(.55) rotate(-10deg)", opacity: 0, offset: 0 },
        { transform: "scale(1.06) rotate(2deg)", opacity: 1, offset: 0.5 },
        { transform: "scale(1) rotate(0deg)", offset: 0.72 },
        { transform: "scale(.95) rotate(-1deg)", offset: 0.96 },
        { transform: "scale(1) rotate(0deg)", offset: 1 },
      ],
      { duration: T + 40, easing: "cubic-bezier(.25,.8,.35,1)" },
    );

    // 2) 슬래시: 점점 빨라지다 충격에서 멈춤
    animate(
      slashBarRef.current,
      [{ transform: "translateX(-101%)" }, { transform: "translateX(0)" }],
      { duration: 170, delay: T - 170, easing: "cubic-bezier(.55,0,.9,.35)" },
    );
    animate(
      glintRef.current,
      [{ transform: "translateX(-120%)" }, { transform: "translateX(520%)" }],
      { duration: 300, delay: T - 120, easing: "cubic-bezier(.3,0,.2,1)" },
    );
    // 충격 순간 선이 한 번 굵어졌다 돌아옴
    animate(
      slashWrapRef.current,
      [
        { transform: "translate(-50%,-50%) rotate(-44.29deg) scaleY(1)" },
        { transform: "translate(-50%,-50%) rotate(-44.29deg) scaleY(1.35)", offset: 0.25 },
        { transform: "translate(-50%,-50%) rotate(-44.29deg) scaleY(1)" },
      ],
      { duration: 260, delay: T, easing: "cubic-bezier(.2,.8,.3,1)" },
    );

    // 3) 갈라짐: 온전한 카드를 반쪽 둘로 바꿔치기(슬래시가 이음매를 덮은 순간)
    animate(wholeRef.current, [{ opacity: 1 }, { opacity: 0 }], { duration: 1, delay: T });
    animate(upperRef.current, [{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: T });
    animate(lowerRef.current, [{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: T });
    const split = { duration: 520, delay: T, easing: "cubic-bezier(.2,.9,.3,1)" };
    animate(
      upperRef.current,
      [
        { transform: "translate(0,0) rotate(0deg)" },
        { transform: "translate(-10%,-10.3%) rotate(-7deg)", offset: 0.45 },
        { transform: "translate(-7%,-7.2%) rotate(-4.5deg)" },
      ],
      split,
    );
    animate(
      lowerRef.current,
      [
        { transform: "translate(0,0) rotate(0deg)" },
        { transform: "translate(10%,10.3%) rotate(7deg)", offset: 0.45 },
        { transform: "translate(7%,7.2%) rotate(4.5deg)" },
      ],
      split,
    );

    // 4) 충격 효과
    // 파동·파편은 첫 키프레임이 보이는 상태(불투명)라, 기본값 fill: "both"로 두면 충격 전 지연
    // 동안에도 그 모습으로 떠 있다(작은 원과 점선이 좌표축처럼 보였다). 끝난 뒤만 붙잡아 둔다.
    animate(
      flashRef.current,
      [
        { opacity: 0, transform: "translate(-50%,-50%) rotate(-44.29deg) scale(.6,.4)" },
        {
          opacity: 1,
          transform: "translate(-50%,-50%) rotate(-44.29deg) scale(1,1)",
          offset: 0.15,
        },
        { opacity: 0, transform: "translate(-50%,-50%) rotate(-44.29deg) scale(1.15,1.6)" },
      ],
      { duration: 360, delay: T - 10, easing: "ease-out" },
    );
    animate(
      ringRef.current,
      [
        { opacity: 0.9, transform: "scale(.25)" },
        { opacity: 0, transform: "scale(1.9)" },
      ],
      { duration: 460, delay: T, easing: "cubic-bezier(.1,.7,.3,1)", fill: "forwards" },
    );
    SHARDS.forEach((s, i) => {
      animate(
        shardRefs.current[i] ?? null,
        [
          { opacity: 1, transform: "translate(-50%,-50%) rotate(-44deg) scale(1)" },
          {
            opacity: 0,
            transform: `translate(calc(-50% + ${s.dx}px), calc(-50% + ${s.dy}px)) rotate(${s.rot}deg) scale(.4)`,
          },
        ],
        { duration: 520, delay: T, easing: "cubic-bezier(.1,.8,.3,1)", fill: "forwards" },
      );
    });
    animate(
      stageRef.current,
      [
        { transform: "translate(0,0)" },
        { transform: "translate(-6px,5px)", offset: 0.15 },
        { transform: "translate(5px,-4px)", offset: 0.35 },
        { transform: "translate(-3px,2px)", offset: 0.6 },
        { transform: "translate(1px,-1px)", offset: 0.8 },
        { transform: "translate(0,0)" },
      ],
      { duration: 260, delay: T, easing: "linear" },
    );

    // 5) 워드마크: 아래에서 밀려 올라옴(Sub → Slash 순)
    animate(w1Ref.current, [{ transform: "translateY(110%)" }, { transform: "translateY(0)" }], {
      duration: 380,
      delay: T + 220,
      easing: "cubic-bezier(.2,1.2,.4,1)",
    });
    animate(w2Ref.current, [{ transform: "translateY(110%)" }, { transform: "translateY(0)" }], {
      duration: 380,
      delay: T + 290,
      easing: "cubic-bezier(.2,1.2,.4,1)",
    });

    // 6) 퇴장: 인트로가 확대되며 사라진다
    const outAt = T + 1600;
    const introAnim = animate(
      introRef.current,
      [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0, transform: "scale(1.15)" },
      ],
      { duration: 320, delay: outAt, easing: "cubic-bezier(.5,0,.75,0)" },
    );
    if (introAnim) introAnim.finished.then(finish).catch(() => {});

    return () => {
      anims.forEach((a) => a.cancel());
    };
  }, []);

  const handleTap = () => {
    if (finishedRef.current) return;
    animsRef.current.forEach((a) => a.cancel());
    finishedRef.current = true;
    onDoneRef.current();
  };

  return (
    <div className={styles.overlay} onClick={handleTap}>
      <div className={styles.intro} ref={introRef}>
        <div className={styles.stage} ref={stageRef}>
          <div className={styles.layer} ref={cardsRef}>
            <div className={styles.layer} ref={wholeRef}>
              <CardShape />
            </div>
            <div className={`${styles.layer} ${styles.upper}`} ref={upperRef}>
              <CardShape />
            </div>
            <div className={`${styles.layer} ${styles.lower}`} ref={lowerRef}>
              <CardShape />
            </div>
          </div>
          <div className={styles.flash} ref={flashRef} />
          <div className={styles.ring} ref={ringRef} />
          <div className={styles.slashWrap} ref={slashWrapRef}>
            <div className={styles.slashBar} ref={slashBarRef} />
            <div className={styles.glint} ref={glintRef} />
          </div>
          {SHARDS.map((s, i) => (
            <div
              key={i}
              ref={(el) => {
                shardRefs.current[i] = el;
              }}
              className={styles.shard}
              style={{ left: s.left, top: s.top, background: s.color }}
            />
          ))}
        </div>
        <div className={styles.word} aria-label="SubSlash">
          <span className={styles.sub} ref={w1Ref}>
            Sub
          </span>
          <span className={styles.slashTxt} ref={w2Ref}>
            Slash
          </span>
        </div>
      </div>
    </div>
  );
}
