"use client";

import React, { useState } from "react";
import { useIsClient } from "@hooks/useIsClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "../../lib/store";
import {
  formatCurrency,
  formatKRW,
  getBilledAmount,
  getMyAnnualAmountKRW,
  getMyMonthlyAmountKRW,
  getSavingsEquivalents,
  getSavingsTiers,
  getDetoxLevel,
} from "@subslash/shared";
import { SavingsPot } from "../../components/dashboard/SavingsPot";
import { SavingsBreakdownChart } from "../../components/savings/SavingsBreakdownChart";
import { DetoxLevelBadge } from "../../components/savings/DetoxLevelBadge";
import { LevelBasisNotice } from "../../components/savings/LevelBasisNotice";
import { buildShareSearchParams } from "../../lib/share-savings";
import { MonthlyDefenseWidget } from "../../components/dashboard/MonthlyDefenseWidget";
import { MonthlyDefenseChart } from "../../components/savings/MonthlyDefenseChart";
import { KillCheckLabel } from "../../components/savings/KillCheckLabel";
import { webUrl } from "@lib/api";
import { shareText } from "@lib/native";
import { Button } from "../../components/ui/button";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { useExchangeRate } from "../../hooks/useExchangeRate";
import { Subscription } from "@subslash/shared";
import { ServiceLogo } from "@components/subscription/ServiceLogo";
import { Spinner } from "../../components/ui/spinner";
import { PiggyBank } from "lucide-react";
import { copyText } from "@lib/native";
import { IS_APP_BUILD } from "@lib/platform";
import { useT } from "@lib/i18n";
import { rewardHeadline } from "@lib/i18n/savings-text";
import dynamic from "next/dynamic";

// 앱에서는 좁은 화면용 절약 현황을 쓴다. 웹 사용자가 이 코드를 받지 않도록 앱 빌드에서만 불러온다.
const AppSavings = IS_APP_BUILD
  ? dynamic(() => import("../../components/savings/app/AppSavings").then((m) => m.AppSavings), {
      ssr: false,
    })
  : null;

export default function SavingsPage() {
  return AppSavings ? <AppSavings /> : <SavingsDashboard />;
}

function SavingsDashboard() {
  const router = useRouter();
  const t = useT();
  const p = t.savings.page;
  const { getKilledSubscriptions, reviveSubscription } = useStore();
  const rate = useExchangeRate();
  const mounted = useIsClient();
  const [copied, setCopied] = useState(false);
  const [reviveTarget, setReviveTarget] = useState<Subscription | null>(null);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner className="size-8" />
      </div>
    );
  }

  const killedSubs = getKilledSubscriptions();
  const now = new Date();
  const tiers = getSavingsTiers(killedSubs, now, rate);
  const annualSavings = tiers.annualRunRate;
  const equivalents = getSavingsEquivalents(annualSavings);
  const headlineEquivalent = rewardHeadline(t, annualSavings);
  // 레벨은 지킨 돈으로 매긴다. 1년치 요금으로 매기면 해지 버튼 한 번에 오른다.
  const detoxLevel = getDetoxLevel(tiers.confirmed, killedSubs.length);

  const copyToClipboard = async (text: string) => {
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      console.error("Failed to copy share text");
    }
  };

  const getShareUrl = () => {
    const params = buildShareSearchParams({
      confirmed: tiers.confirmed,
      annual: annualSavings,
      count: killedSubs.length,
      verifiedCount: tiers.verifiedCount,
      names: killedSubs.map((sub) => sub.name),
    });
    return webUrl(`/savings/share?${params.toString()}`);
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    // 남에게 보이는 문장이라 지킨 돈이 없으면 1년치 요금을 '아낄 예정'으로만 적는다.
    const savingsLine =
      tiers.confirmed > 0
        ? t.savings.share.confirmedLine(formatKRW(tiers.confirmed), formatKRW(annualSavings))
        : t.savings.share.plannedLine(formatKRW(annualSavings));
    const text = t.savings.share.text(
      `${detoxLevel.levelLabel} ${t.value.detoxTitle[detoxLevel.level as 0 | 1 | 2 | 3 | 4 | 5]}`,
      savingsLine,
      headlineEquivalent,
      shareUrl,
    );
    // 공유 창을 열었거나 사용자가 닫았으면 끝이다. 공유할 수 없는 환경이면 복사로 넘어간다.
    if (await shareText({ title: t.savings.share.title, text, url: shareUrl })) return;
    await copyToClipboard(text);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{p.title}</h1>
          <p className="text-sm text-muted-foreground">{p.subtitle}</p>
        </div>
        <Link
          href="/savings/review"
          className="text-sm font-semibold text-foreground underline underline-offset-4 hover:text-muted-foreground"
        >
          {p.reviewLink}
        </Link>
      </div>

      {killedSubs.length === 0 ? (
        <div className="text-center py-20 border border-dashed rounded-2xl space-y-4">
          <PiggyBank className="mx-auto size-12 text-muted-foreground" aria-hidden />
          <div className="space-y-1">
            <h3 className="text-xl font-bold">{p.emptyTitle}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">{p.emptyHint}</p>
          </div>
          <Button onClick={() => router.push("/dashboard")}>{p.goDashboard}</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 머리 숫자: 지킨 돈 / 확인 대기 / 앞으로 */}
          <SavingsPot killedSubscriptions={killedSubs} />

          {/* 레벨 기준이 1년치 요금에서 지킨 돈으로 바뀌어 내려간 사람에게만 한 번 알린다 */}
          <LevelBasisNotice
            annualRunRate={annualSavings}
            confirmed={tiers.confirmed}
            killCount={killedSubs.length}
          />

          {/* Detox level & title (Phase 3) */}
          <DetoxLevelBadge savings={tiers.confirmed} killCount={killedSubs.length} />

          {/*
            넓은 화면에서는 두 칸으로 놓는다. 키가 큰 달별 그래프가 오른쪽 두 줄을 차지하고,
            왼쪽에 이번 달과 서비스별이 쌓이며, 보상은 맨 아래 한 줄 전체다. DOM 순서는
            좁은 화면에서 쌓이는 순서 그대로다(이번 달 → 달별 → 서비스별 → 보상).
          */}
          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
            {/* This month's defended spend (Issue 8) */}
            <MonthlyDefenseWidget killedSubscriptions={killedSubs} />

            {/* 올해 달별 방어액 — 지킨 달과 예정인 달을 나눠 보여준다 */}
            <div className="min-w-0 lg:row-span-2">
              <MonthlyDefenseChart killedSubscriptions={killedSubs} exchangeRate={rate} />
            </div>

            {/* Breakdown by Cancelled Service (Issue 7) */}
            <SavingsBreakdownChart killedSubscriptions={killedSubs} exchangeRate={rate} />

            {/* Reward Equivalent Cards — only the tiers the savings actually cover */}
            <div className="min-w-0 space-y-3 lg:col-span-2">
              <h3 className="font-bold text-base">{p.rewardsTitle}</h3>
              {equivalents.length === 0 ? (
                <div className="p-4 border border-dashed rounded-2xl text-sm text-muted-foreground">
                  {p.rewardsEmpty}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-3">
                  {equivalents.map((item) => (
                    <div key={item.key} className="p-4 border rounded-2xl bg-card space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {p.rewardOf(t.savings.rewardNames[item.key])}
                      </p>
                      <p className="text-lg font-bold text-foreground">
                        {t.value.reward[item.key](item.count)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Defended Subscriptions List with Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">{p.killedTitle(killedSubs.length)}</h3>
              <Button size="sm" variant="outline" onClick={handleShare}>
                {copied ? p.copied : p.share}
              </Button>
            </div>

            <div className="space-y-2">
              {killedSubs.map((sub) => (
                // 좁은 화면에서는 금액·버튼을 아랫줄로 내린다. 한 줄에 몰아 두면 금액과 문구가
                // 글자 단위로 꺾였다.
                <div
                  key={sub.id}
                  className="flex flex-col gap-3 p-4 border rounded-2xl bg-card hover:shadow-sm transition-all sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <ServiceLogo
                      name={sub.name}
                      cancelUrl={sub.cancelUrl}
                      fallbackEmoji={sub.iconUrl}
                      fallbackColor={sub.iconColor}
                      size={28}
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm line-through text-muted-foreground">
                        {sub.name}
                      </h4>
                      <p className="text-xs text-emerald-600 font-medium">
                        {p.annualSaving(formatKRW(getMyAnnualAmountKRW(sub, rate)))}
                      </p>
                      <KillCheckLabel subscription={sub} now={now} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <span className="text-sm font-bold whitespace-nowrap">
                      {sub.billingCycle === "yearly" || sub.currency === "USD" ? (
                        <>
                          {formatCurrency(getBilledAmount(sub), sub.currency)}
                          <span className="text-xs font-normal text-muted-foreground">
                            {" "}
                            {p.monthlyBilled(formatKRW(getMyMonthlyAmountKRW(sub, rate)))}
                          </span>
                        </>
                      ) : (
                        <>{p.perMonth(formatCurrency(getBilledAmount(sub), sub.currency))}</>
                      )}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => setReviveTarget(sub)}
                    >
                      {p.revive}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reviveTarget && (
        <ConfirmDialog
          isOpen={!!reviveTarget}
          onClose={() => setReviveTarget(null)}
          onConfirm={() => {
            if (reviveTarget) {
              reviveSubscription(reviveTarget.id);
              setReviveTarget(null);
            }
          }}
          title={t.subs.confirm.reviveHeading}
          description={t.subs.confirm.reviveBody(reviveTarget.name)}
          confirmText={t.subs.confirm.reviveConfirm}
          cancelText={t.subs.confirm.cancel}
        />
      )}
    </div>
  );
}
