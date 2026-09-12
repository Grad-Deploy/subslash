"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { describeSpendingType, formatKRW } from "@subslash/shared";
import { Button } from "@components/ui/button";
import { readSharedReview } from "@lib/share-review";

/**
 * 링크만으로 열리는 연말 결산 카드. 보는 사람의 브라우저에는 공유한 사람의 기록이
 * 없으므로, 링크에 담긴 숫자만 보여준다. 문구는 모두 여기서 숫자로 다시 만든다.
 */
function SharedReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shared = readSharedReview(searchParams);

  if (!shared) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4 space-y-4 text-center">
        <p className="text-lg font-black">올바르지 않은 결산 링크입니다</p>
        <p className="text-sm text-muted-foreground">
          링크가 잘렸거나 형식이 맞지 않아 결산 내용을 보여줄 수 없습니다.
        </p>
        <Link
          href="/"
          className="inline-block text-sm font-semibold text-primary underline underline-offset-4"
        >
          SubSlash 홈으로 가기
        </Link>
      </div>
    );
  }

  const scope = shared.isComplete ? `${shared.year}년` : `${shared.year}년 지금까지`;
  const type = shared.spendingType ? describeSpendingType(shared.spendingType) : null;

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-8 text-center">
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
        📆 SubSlash {shared.year}년 구독 결산
      </div>

      <div className="p-6 sm:p-8 rounded-3xl border bg-card shadow-lg space-y-6">
        <div className="py-6 px-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl space-y-1">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
            {scope} 해지로 막은 결제
          </div>
          <div className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {formatKRW(shared.blocked)}
          </div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
            이 중 결제가 멈춘 것을 확인한 지킨 돈 {formatKRW(shared.confirmed)}
          </p>
        </div>

        <div className="space-y-3 text-left bg-muted/40 p-4 rounded-2xl border">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>{scope} 해지한 구독</span>
            <span className="text-foreground">{shared.killedCount}개 서비스</span>
          </div>
          {shared.names.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {shared.names.map((name, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-card border text-xs font-medium text-foreground line-through opacity-80"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        {type && (
          <div className="text-left p-4 rounded-2xl border bg-card space-y-1">
            <div className="text-[11px] font-bold text-muted-foreground">
              지금 구독 구성으로 본 소비 유형
            </div>
            <div className="text-lg font-black text-foreground">
              {type.emoji} {type.title}
            </div>
            <p className="text-xs text-muted-foreground">{type.detail}</p>
          </div>
        )}
      </div>

      <div className="p-6 rounded-3xl bg-secondary/80 border space-y-4 text-center">
        <div className="space-y-1">
          <h3 className="text-lg font-black">내 구독도 한 해를 정리해 볼까요?</h3>
          <p className="text-xs text-muted-foreground">
            SubSlash에서 1회당 실제 사용 단가를 계산하고, 가성비 낮은 구독을 찾아 해지해 보세요.
          </p>
        </div>
        <Button
          size="lg"
          className="w-full h-13 text-base font-bold shadow-md rounded-xl"
          onClick={() => router.push("/")}
        >
          ✂️ 나도 구독 정리 시작하기 (무료)
        </Button>
        <p className="text-[11px] text-muted-foreground">
          🔒 회원가입 없이 브라우저에서 바로 사용할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

export default function SharedReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin text-3xl">✂️</div>
        </div>
      }
    >
      <SharedReviewContent />
    </Suspense>
  );
}
