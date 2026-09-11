"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import {
  formatKRW,
  getDetoxLevel,
  getSavingsEquivalent,
  getSavingsEquivalents,
} from "@subslash/shared";
import { readSharedSavings } from "../../../lib/share-savings";

function SharedSavingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const shared = readSharedSavings(searchParams);
  const annual = shared.annual ?? 0;
  // 환산은 1년치 요금에서 한다. 보상 제목도 "1년 동안 아끼면"이다.
  const headlineEquivalent = getSavingsEquivalent(annual)[0] ?? "";
  const equivalents = getSavingsEquivalents(annual);

  // 머리 숫자는 지킨 돈이다. 아직 지킨 돈이 없거나 예전 링크면 1년치 예상액을
  // '예상'이라고 적어 보여준다.
  const showConfirmed = shared.format === "confirmed" && shared.confirmed > 0;
  // 레벨은 지킨 돈으로 매긴다. 예전 링크에는 지킨 돈이 없으므로 레벨을 짐작하지 않는다.
  const detoxLevel =
    shared.format === "confirmed" ? getDetoxLevel(shared.confirmed, shared.count) : null;

  return (
    <div className="max-w-xl mx-auto py-8 px-4 space-y-8 text-center">
      {/* Header Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
        🛡️ SubSlash 구독 디톡스 인증서
      </div>

      {/* Main Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl border bg-card shadow-lg space-y-6 relative overflow-hidden">
        <div className="text-5xl animate-bounce">🎉</div>

        {/* Detox level & title */}
        {detoxLevel && (
          <div className="flex flex-col items-center gap-2">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-black bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm">
              <span className="text-lg leading-none">{detoxLevel.emoji}</span>
              <span>
                {detoxLevel.levelLabel} {detoxLevel.title}
              </span>
            </span>
            {detoxLevel.nextThreshold !== null && (
              <span className="text-[11px] text-muted-foreground">
                다음 레벨 &lsquo;{detoxLevel.nextTitle}&rsquo;까지{" "}
                {formatKRW(detoxLevel.remainingToNext ?? 0)} 더 지키면 됩니다
              </span>
            )}
          </div>
        )}

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            잠든 구독을 찾아 해지했습니다!
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            매달 자동 결제되던 구독을 찾아내 해지했습니다.
          </p>
        </div>

        {/* Savings Amount Box */}
        <div className="py-6 px-4 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 rounded-2xl space-y-1">
          {showConfirmed && shared.format === "confirmed" ? (
            <>
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                지킨 돈
              </div>
              <div className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatKRW(shared.confirmed)}
              </div>
              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                해지 뒤 결제일에 결제가 멈춘 것을 확인한 금액 · 결제 멈춤 확인{" "}
                {shared.verifiedCount}건
              </p>
              {shared.annual !== null && (
                <p className="text-sm font-semibold text-emerald-700/80 dark:text-emerald-300/80 pt-2">
                  해지를 유지하면 1년에 {formatKRW(shared.annual)}을 아낍니다
                  {headlineEquivalent && ` · ${headlineEquivalent}`}
                </p>
              )}
            </>
          ) : (
            <>
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                해지를 유지하면 1년에 아끼는 금액 (예상)
              </div>
              <div className="text-4xl sm:text-5xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {formatKRW(annual)}
              </div>
              {headlineEquivalent && (
                <p className="text-sm font-semibold text-emerald-700/80 dark:text-emerald-300/80 pt-1">
                  {headlineEquivalent}
                </p>
              )}
            </>
          )}
        </div>

        {shared.format === "legacy" && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            예전 형식의 공유 링크입니다. 결제가 멈춘 것을 확인한 금액은 담겨 있지 않아, 1년치
            예상액만 보여줍니다.
          </p>
        )}

        {/* Defended count & services */}
        <div className="space-y-3 text-left bg-muted/40 p-4 rounded-2xl border">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>해지한 구독</span>
            <span className="text-foreground">{shared.count}개 서비스</span>
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

        {/* Equivalents Cards */}
        {equivalents.length > 0 && (
          <div className="space-y-2.5 text-left pt-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              🎁 1년 동안 아끼면 누릴 수 있는 보상
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
            SubSlash에서 1회당 실제 사용 단가를 계산하고, 가성비 낮은 구독을 찾아 해지해 보세요.
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
