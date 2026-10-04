import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@lib/motion";

/**
 * 옆으로 넘기는 장들. 넘기는 것은 브라우저의 스크롤 스냅이 맡고, 이 훅은 지금 몇 번째 장인지를 읽고
 * 버튼으로 옮겨 준다. 장은 모두 트랙 폭과 같다고 본다.
 */
export function useCarousel(lastIndex: number) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  // 넘긴 만큼을 지금 장으로 본다.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      if (track.clientWidth === 0) return;
      setIndex(Math.round(track.scrollLeft / track.clientWidth));
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = useCallback(
    (i: number) => {
      const track = trackRef.current;
      if (!track) return;
      const target = Math.max(0, Math.min(lastIndex, i));
      track.scrollTo({
        left: target * track.clientWidth,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    },
    [lastIndex],
  );

  return { trackRef, index, goTo };
}
