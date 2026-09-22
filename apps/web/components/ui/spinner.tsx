import React from "react";
import { cn } from "@lib/utils";

/**
 * 기다리는 중을 알리는 표시.
 *
 * 예전에는 가위 이모지()를 돌렸다. 기기마다 다른 그림이 나오고, 돌아가는 가위는 무엇을
 * 기다리는지와 아무 상관이 없었다. 읽는 기계에는 '불러오는 중'으로 들리게 한다.
 */
export function Spinner({
  className,
  label = "불러오는 중",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground",
        className,
      )}
    />
  );
}
