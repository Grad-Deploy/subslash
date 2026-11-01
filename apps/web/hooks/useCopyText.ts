"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { copyText } from "@lib/native";

/**
 * 글을 복사하고 잠시 '복사됨'을 보이는 상태. 복사하지 못했으면(앱 웹뷰·권한 거절) 켜지 않는다 — 띄우면 복사된 줄
 * 안다. `copy`는 복사했는지를 돌려주므로 못 했을 때 따로 할 일(직접 복사할 창 등)은 부르는 곳이 정한다. 다시 누르면
 * 시간을 처음부터 세고, 화면을 떠나면 타이머를 지운다.
 */
export function useCopyText(resetMs = 2000) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const reset = useCallback(() => {
    clearTimeout(timer.current);
    setCopied(false);
  }, []);

  const copy = useCallback(
    async (text: string) => {
      const ok = await copyText(text);
      clearTimeout(timer.current);
      setCopied(ok);
      if (ok) timer.current = setTimeout(() => setCopied(false), resetMs);
      return ok;
    },
    [resetMs],
  );

  return { copied, copy, reset };
}
