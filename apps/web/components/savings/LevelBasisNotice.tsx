"use client";

import React from "react";
import Link from "next/link";
import { useStoredFlag } from "@hooks/useStoredFlag";
import { getDetoxLevel } from "@subslash/shared";

const STORAGE_KEY = "subslash_level_basis_notice_dismissed";

interface LevelBasisNoticeProps {
  /** 예전 레벨 기준: 해지한 구독의 1년치 요금. */
  annualRunRate: number;
  /** 지금 레벨 기준: 결제가 멈춘 것을 확인한 지킨 돈. */
  confirmed: number;
  killCount: number;
}

/**
 * 레벨 기준이 바뀌었다는 한 번짜리 안내.
 *
 * 레벨은 해지한 구독의 1년치 요금으로 매겨졌다 — 해지 버튼 한 번에 Lv.3이 됐다.
 * 이제 결제가 멈춘 것을 확인한 지킨 돈으로 매기므로 기존 사용자는 레벨이 내려갈
 * 수 있다. 말없이 내려가면 고장으로 보이므로, 실제로 내려간 사람에게만 이유를
 * 한 번 알린다.
 */
export function LevelBasisNotice({ annualRunRate, confirmed, killCount }: LevelBasisNoticeProps) {
  // 서버와 하이드레이션 동안은 숨겨 둔다. 닫은 사람에게 한 번 번쩍이지 않게.
  const [dismissed, dismiss] = useStoredFlag(STORAGE_KEY, true);

  const before = getDetoxLevel(annualRunRate, killCount);
  const now = getDetoxLevel(confirmed, killCount);
  if (dismissed || now.level >= before.level) return null;

  return (
    <section
      aria-labelledby="level-basis-heading"
      className="p-4 border rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 space-y-2"
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          id="level-basis-heading"
          className="font-bold text-sm text-amber-900 dark:text-amber-200"
        >
          레벨 기준이 바뀌었습니다
        </h3>
        <button
          type="button"
          onClick={dismiss}
          className="whitespace-nowrap text-xs text-muted-foreground hover:text-foreground font-medium p-1 rounded-lg hover:bg-muted transition-colors shrink-0"
        >
          닫기
        </button>
      </div>
      <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
        해지만 해도 오르던 1년치 요금 대신, 결제가 멈춘 것을 확인한 &lsquo;지킨 돈&rsquo;으로 레벨을
        정합니다.
      </p>
      <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
        예전 기준: {before.levelLabel} {before.title} → 지금: {now.levelLabel} {now.title}
      </p>
      <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed">
        해지 뒤 결제일이 지날 때마다 결제가 멈췄는지 답하면 레벨이 다시 오릅니다.{" "}
        <Link href="/dashboard" className="underline underline-offset-2 font-semibold">
          대시보드에서 답하기 →
        </Link>
      </p>
    </section>
  );
}
