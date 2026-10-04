import { useEffect, type RefObject } from "react";
import { prefersReducedMotion } from "@lib/motion";

/**
 * 소개 슬라이드의 움직임. 움직일 요소는 data 속성으로 고르고(아래 ENTER·FLOAT), 움직임 줄이기를 켜면
 * 아무것도 하지 않아 처음부터 끝 모습이 보인다.
 *
 * - 장이 들어올 때 ENTER를 붙인 요소가 위에서부터 차례로 떠오른다.
 * - 첫 장의 FLOAT 타일이 천천히 떠다닌다.
 * - 마지막 장에 들어오면 앱 아이콘의 슬래시를 긋는다(`slashRef`).
 */

const EASE = "cubic-bezier(.22,1,.36,1)";

/** 장이 들어올 때 떠오를 요소에 펼쳐 붙인다(`<p {...ENTER}>`). */
export const ENTER = { "data-enter": "" } as const;
/** 떠다닐 요소에 펼쳐 붙인다. */
export const FLOAT = { "data-float": "" } as const;

/** 장 요소에 붙이는 번호(`data-slide`). 들어오는 장을 이 값으로 찾는다. */
export const slideAttr = (index: number) => ({ "data-slide": index });

export function useOnboardingMotion({
  rootRef,
  index,
  slashIndex,
  slashRef,
}: {
  rootRef: RefObject<HTMLElement | null>;
  /** 지금 보이는 장. */
  index: number;
  /** 슬래시를 긋는 장. */
  slashIndex: number;
  slashRef: RefObject<SVGPathElement | null>;
}) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;
    const anims = [...root.querySelectorAll("[data-float]")].map((el, i) =>
      el.animate(
        [
          { transform: "translateY(0)" },
          { transform: "translateY(-12px)" },
          { transform: "translateY(0)" },
        ],
        { duration: 3200 + i * 420, delay: -i * 600, iterations: Infinity, easing: "ease-in-out" },
      ),
    );
    return () => anims.forEach((a) => a.cancel());
  }, [rootRef]);

  useEffect(() => {
    const slide = rootRef.current?.querySelector(`[data-slide="${index}"]`);
    if (!slide || prefersReducedMotion()) return;
    const anims = [...slide.querySelectorAll("[data-enter]")].map((el, k) =>
      el.animate(
        [
          { opacity: 0, transform: "translateY(28px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 700, delay: 60 + k * 90, easing: EASE, fill: "backwards" },
      ),
    );
    const path = slashRef.current;
    if (index === slashIndex && path) {
      const len = path.getTotalLength();
      anims.push(
        path.animate(
          [
            { strokeDasharray: `${len}`, strokeDashoffset: `${len}` },
            { strokeDasharray: `${len}`, strokeDashoffset: "0" },
          ],
          { duration: 650, delay: 300, easing: EASE, fill: "backwards" },
        ),
      );
    }
    return () => anims.forEach((a) => a.cancel());
  }, [rootRef, index, slashIndex, slashRef]);
}
