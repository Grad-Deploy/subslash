"use client";

import React from "react";
import type { Subscription } from "@subslash/shared";
import { ServiceLogo } from "./ServiceLogo";

/**
 * 확인 창에서 '무엇을' 바꾸는지 보여 주는 칩(로고 + 이름 한 줄). 이름을 제목에 넣으면 긴 이름(쿠팡 와우
 * (쿠팡플레이))이 제목 안에서 꺾였다. 여기서는 한 줄로 두고 넘치면 말줄임한다.
 */
export function SubjectChip({
  sub,
}: {
  sub: Pick<Subscription, "name" | "cancelUrl" | "iconUrl" | "iconColor">;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-xl bg-secondary px-2.5 py-1.5 text-sm font-bold">
      <ServiceLogo
        name={sub.name}
        cancelUrl={sub.cancelUrl}
        fallbackEmoji={sub.iconUrl}
        fallbackColor={sub.iconColor}
        size={20}
      />
      <span className="truncate">{sub.name}</span>
    </span>
  );
}
