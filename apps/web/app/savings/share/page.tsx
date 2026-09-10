"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { getSavingsEquivalents, getDetoxLevel } from "@subslash/shared";

function SharedSavingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const savedParam = searchParams.get("saved");
  const countParam = searchParams.get("count");
  const equivParam = searchParams.get("equiv");
  const namesParam = searchParams.get("names");

  const annualSavings = savedParam ? parseInt(savedParam, 10) : 0;
  const count = countParam ? parseInt(countParam, 10) : 0;
  const headlineEquivalent = equivParam || "";
  const serviceNames = namesParam ? namesParam.split(",").filter(Boolean) : [];

  const equivalents = getSavingsEquivalents(annualSavings);
  const detoxLevel = getDetoxLevel(annualSavings, count);

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-8 text-center">
      {/* Header Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
        🛡️ SubSlash 구독 디톡스 방어 인증서
      </div>

      {/* Main Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl border bg-card shadow-lg space-y-6 relative overflow-hidden">
        <div className="text-5xl animate-bounce">🎉</div>

        {/* Detox level & title */}
        <div className="flex flex-col items-center gap-2">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm">
            <span className="text-lg leading-none">{detoxLevel.emoji}</span>
            <span>
              {detoxLevel.levelLabel} {detoxLevel.title}
            </span>
          </span>
          {detoxLevel.nextThreshold !== null && (
            <span className="text-[11px] text-muted-foreground">
              다음 레벨 &lsquo;{detoxLevel.nextTitle}&rsquo;까지 ₩
              {(detoxLevel.remainingToNext ?? 0).toLocaleString()}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            불필요한 구독을 성공적으로 차단했습니다!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            매달 자동 결제되던 잠든 구독을 찾아내 소중한 자산을 지켜냈습니다.
          </p>
        </div>

        {/* Savings Amount Box */}
        <div className="py-6 px-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl space-y-1">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
            연간 방어 성공 금액
          </div>
          <div className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            ₩{annualSavings > 0 ? annualSavings.toLocaleString() : "0"}
          </div>
          {headlineEquivalent && (
            <p className="text-sm font-semibold text-emerald-700/80 dark:text-emerald-300/80 pt-1">
              {headlineEquivalent}
            </p>
          )}
        </div>

        {/* Defended count & services */}
        <div className="space-y-3 text-left bg-muted/40 p-4 rounded-2xl border">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>차단한 구독</span>
            <span className="text-foreground">{count}개 서비스 해지 완료</span>
          </div>
          {serviceNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {serviceNames.map((name, idx) => (
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

        {/* Equivalents Cards */}
        {equivalents.length > 0 && (
          <div className="space-y-2.5 text-left pt-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              🎁 방어한 자산으로 누릴 수 있는 보상
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {equivalents.slice(0, 4).map((item) => (
                <div key={item.label} className="p-3 border rounded-xl bg-card space-y-0.5">
                  <div className="text-[11px] text-muted-foreground">{item.label}</div>
                  <div className="text-sm font-bold text-foreground">
                    {item.emoji} {item.count.toLocaleString()} {item.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Call to Action for Visitors */}
      <div className="p-6 rounded-3xl bg-secondary/80 border space-y-4 text-center">
        <div className="space-y-1">
          <h3 className="text-lg font-black">나도 모르게 새어나가는 구독료가 있다면?</h3>
          <p className="text-xs text-muted-foreground">
            SubSlash에서 1회당 실제 사용 단가를 계산하고, 가성비 낮은 구독을 1초 만에 차단하세요.
          </p>
        </div>

        <Button
          size="lg"
          className="w-full h-13 text-base font-bold shadow-md rounded-xl"
          onClick={() => router.push("/")}
        >
          ✂️ 나도 구독 디톡스 시작하기 (무료)
        </Button>

        <p className="text-[11px] text-muted-foreground">
          🔒 회원가입 없이 브라우저에서 바로 사용할 수 있습니다.
        </p>
      </div>

      <div>
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          SubSlash 홈으로 가기
        </Link>
      </div>
    </div>
  );
}

export default function SharedSavingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin text-3xl">✂️</div>
        </div>
      }
    >
      <SharedSavingsContent />
    </Suspense>
  );
}
