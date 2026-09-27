"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, PiggyBank } from "lucide-react";
import {
  type Subscription,
  formatKRW,
  formatKillCheckDate,
  getDetoxLevel,
  getKillCheckStatus,
  getMyAnnualAmountKRW,
  getMyMonthlyAmountKRW,
  getNextBillingDateFor,
  getSavingsEquivalent,
  getSavingsEquivalents,
  getSavingsTiers,
  sumMyMonthlyKRW,
} from "@subslash/shared";
import { useIsClient } from "@hooks/useIsClient";
import { useExchangeRate } from "@hooks/useExchangeRate";
import { useStore } from "@lib/store";
import { webUrl } from "@lib/api";
import { copyText, shareText } from "@lib/native";
import { buildShareSearchParams } from "@lib/share-savings";
import { ServiceLogo } from "../../subscription/ServiceLogo";
import { ConfirmDialog } from "../../ui/confirm-dialog";
import { SubjectChip } from "../../subscription/SubjectChip";
import { Spinner } from "../../ui/spinner";
import { AppDefenseChart } from "./AppDefenseChart";
import { AppIncomeRate } from "./AppIncomeRate";

const DAY = 24 * 60 * 60 * 1000;
/** 목록이 이보다 길면 앞의 몇 개만 보이고 '더 보기'로 펼친다. */
const LIST_LIMIT = 5;

/** 해지한 구독 하나가 한 번 결제될 때의 내 몫. 연간은 1년치 한 번이다. */
function perChargeKRW(sub: Subscription, rate: number): number {
  return sub.billingCycle === "yearly"
    ? getMyAnnualAmountKRW(sub, rate)
    : getMyMonthlyAmountKRW(sub, rate);
}

/**
 * 앱의 절약 현황. 웹 화면(app/savings/page.tsx)과 같은 숫자(@subslash/shared)를 좁은 화면에 맞게
 * 한 줄 흐름으로 다시 놓는다: 지킨 돈·레벨 → 해지 확인 → 월 수입 대비 구독비 → 월별 방어액 →
 * 서비스별 → 다가오는 방어 → 보상 → 해지한 구독.
 */
export function AppSavings() {
  const router = useRouter();
  const mounted = useIsClient();
  const rate = useExchangeRate();
  const {
    getKilledSubscriptions,
    getActiveSubscriptions,
    reviveSubscription,
    confirmKillVerified,
  } = useStore();
  const [reviveTarget, setReviveTarget] = useState<Subscription | null>(null);
  const [chargedTarget, setChargedTarget] = useState<Subscription | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAllBreakdown, setShowAllBreakdown] = useState(false);
  const [showAllKilled, setShowAllKilled] = useState(false);

  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  const now = new Date();
  const killed = getKilledSubscriptions();
  const active = getActiveSubscriptions();
  const activeMonthly = sumMyMonthlyKRW(active, rate);
  const killedMonthly = sumMyMonthlyKRW(killed, rate);
  const tiers = getSavingsTiers(killed, now, rate);
  const level = getDetoxLevel(tiers.confirmed, killed.length);
  const equivalents = getSavingsEquivalents(tiers.annualRunRate);
  const due = killed.filter((sub) => getKillCheckStatus(sub, now)?.state === "due");

  const breakdown = killed
    .map((sub) => ({ sub, annual: getMyAnnualAmountKRW(sub, rate) }))
    .filter((item) => item.annual > 0)
    .sort((a, b) => b.annual - a.annual);
  const topAnnual = breakdown[0]?.annual ?? 0;

  // 해지하지 않았다면 결제됐을 다음 날짜. 결제월을 모르는 연간 구독은 날짜를 만들지 않고 따로 센다.
  const upcoming = killed
    .map((sub) => ({ sub, date: getNextBillingDateFor(sub, now) }))
    .filter((item): item is { sub: Subscription; date: Date } => item.date !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const undated = killed.length - upcoming.length;

  const handleShare = async () => {
    const params = buildShareSearchParams({
      confirmed: tiers.confirmed,
      annual: tiers.annualRunRate,
      count: killed.length,
      verifiedCount: tiers.verifiedCount,
      names: killed.map((sub) => sub.name),
    });
    const shareUrl = webUrl(`/savings/share?${params.toString()}`);
    const headline = getSavingsEquivalent(tiers.annualRunRate)[0] ?? "";
    // 웹과 같은 문장. 지킨 돈이 없으면 1년치 요금을 '아낄 예정'으로만 적는다.
    const savingsLine =
      tiers.confirmed > 0
        ? `구독을 해지해 ${formatKRW(tiers.confirmed)}을 지켰고, 해지를 유지하면 1년에 ${formatKRW(tiers.annualRunRate)}을 아낍니다!`
        : `구독을 해지해 1년에 ${formatKRW(tiers.annualRunRate)}을 아낄 예정입니다!`;
    const text = `SubSlash 구독 디톡스 ${level.levelLabel} ${level.title} ${level.emoji}\n${savingsLine} ${headline}\n결과 보기: ${shareUrl}`;
    if (await shareText({ title: "SubSlash 구독 디톡스 결과", text, url: shareUrl })) return;
    // 앱 웹뷰에서는 navigator.clipboard가 막혀 있어 네이티브 복사(copyText)를 쓴다. 실패하면
    // '복사했어요'를 띄우지 않는다(#114와 같은 기준).
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md min-w-0 space-y-3 pb-4 text-sm">
      <header className="flex items-baseline justify-between pt-1 pb-1">
        <h1 className="text-[22px] font-black tracking-tight">절약 현황</h1>
        <Link
          href="/savings/review"
          className="text-xs font-bold text-muted-foreground underline underline-offset-4"
        >
          올해 결산 →
        </Link>
      </header>

      {killed.length === 0 ? (
        <section className="space-y-3 rounded-2xl border border-dashed px-4 py-8 text-center">
          <PiggyBank className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <div>
            <p className="text-base font-bold">아직 해지한 구독이 없어요</p>
            <p className="mt-1 text-xs text-muted-foreground">
              잘 안 쓰는 구독을 해지하면 여기에 지킨 돈이 쌓여요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="h-10 rounded-xl bg-primary px-4 text-[13px] font-extrabold text-primary-foreground"
          >
            대시보드로 가기
          </button>
        </section>
      ) : (
        <section className="rounded-[20px] border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/70 p-4 text-emerald-900 dark:border-emerald-800 dark:from-emerald-950 dark:to-emerald-900/70 dark:text-emerald-200">
          <p className="text-xs font-bold">지금까지 지킨 돈</p>
          <p className="mt-0.5 text-[34px] leading-tight font-black tracking-tight text-foreground tabular-nums">
            {formatKRW(tiers.confirmed)}
          </p>
          <dl className="mt-2.5 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-background/55 px-2.5 py-2">
              <dt className="text-[10.5px]">확인 대기</dt>
              <dd className="text-sm font-extrabold text-foreground tabular-nums">
                {formatKRW(tiers.pending)}
              </dd>
            </div>
            <div className="rounded-xl bg-background/55 px-2.5 py-2">
              <dt className="text-[10.5px]">해지 유지하면 1년</dt>
              <dd className="text-sm font-extrabold text-foreground tabular-nums">
                {formatKRW(tiers.annualRunRate)}
              </dd>
            </div>
          </dl>
          <div className="mt-3 flex items-center gap-2.5">
            <span className="text-xs font-extrabold whitespace-nowrap text-foreground">
              {level.emoji} {level.levelLabel} {level.title}
            </span>
            <div className="min-w-0 flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-background/60">
                <span
                  className="block h-full rounded-full bg-emerald-700 dark:bg-emerald-400"
                  style={{ width: `${level.progressPercent}%` }}
                />
              </div>
              <p className="mt-1 text-[10.5px]">
                {level.remainingToNext === null
                  ? "최고 레벨이에요"
                  : `Lv.${level.level + 1}까지 ${formatKRW(level.remainingToNext)}`}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 답해야 지킨 돈에 들어가므로 위에 둔다. */}
      {due.map((sub) => {
        const check = getKillCheckStatus(sub, now);
        if (check?.state !== "due") return null;
        return (
          <section
            key={sub.id}
            className="rounded-2xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40"
          >
            <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-amber-800 dark:text-amber-300">
              <Bell className="size-3.5 shrink-0" aria-hidden />
              {sub.name} · {formatKillCheckDate(check.billingDate, now)} 결제가 멈췄나요?
            </p>
            <div className="mt-2 flex gap-1.5">
              <button
                type="button"
                onClick={() => confirmKillVerified(sub.id)}
                className="h-9 flex-1 rounded-[10px] bg-primary text-xs font-extrabold text-primary-foreground"
              >
                멈췄어요
              </button>
              <button
                type="button"
                onClick={() => setChargedTarget(sub)}
                className="h-9 flex-1 rounded-[10px] border bg-card text-xs font-extrabold"
              >
                결제됐어요
              </button>
            </div>
          </section>
        );
      })}

      <AppIncomeRate activeMonthly={activeMonthly} killedMonthly={killedMonthly} />

      {killed.length > 0 && (
        <>
          <AppDefenseChart killedSubscriptions={killed} exchangeRate={rate} />

          {breakdown.length > 0 && (
            <section className="rounded-2xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[14.5px] font-extrabold tracking-tight">어디서 아끼고 있나</h2>
                <span className="text-[11px] font-semibold text-muted-foreground">1년 기준</span>
              </div>
              <ul className="mt-2.5 space-y-2.5">
                {(showAllBreakdown ? breakdown : breakdown.slice(0, LIST_LIMIT)).map(
                  ({ sub, annual }) => (
                    <li key={sub.id} className="grid grid-cols-[28px_1fr_auto] items-center gap-2">
                      <ServiceLogo
                        name={sub.name}
                        cancelUrl={sub.cancelUrl}
                        fallbackEmoji={sub.iconUrl}
                        fallbackColor={sub.iconColor}
                        size={28}
                      />
                      <div className="min-w-0">
                        <p className="flex justify-between gap-2 text-[12.5px] font-bold">
                          <span className="truncate">{sub.name}</span>
                          <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                            {Math.round((annual / tiers.annualRunRate) * 100)}%
                          </span>
                        </p>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                          <span
                            className="block h-full rounded-full bg-emerald-700 dark:bg-emerald-400"
                            style={{ width: `${(annual / topAnnual) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[12.5px] font-extrabold tabular-nums">
                        {formatKRW(annual)}
                      </span>
                    </li>
                  ),
                )}
              </ul>
              {breakdown.length > LIST_LIMIT && (
                <MoreToggle
                  open={showAllBreakdown}
                  hidden={breakdown.length - LIST_LIMIT}
                  onToggle={() => setShowAllBreakdown((v) => !v)}
                />
              )}
            </section>
          )}

          {(upcoming.length > 0 || undated > 0) && (
            <section className="rounded-2xl border bg-card p-4">
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="text-[14.5px] font-extrabold tracking-tight">다가오는 방어</h2>
                <span className="text-[11px] text-muted-foreground">해지 안 했으면 나갔을 날</span>
              </div>
              <ul className="mt-1.5">
                {upcoming.slice(0, 4).map(({ sub, date }) => {
                  const days = Math.ceil((date.getTime() - now.getTime()) / DAY);
                  return (
                    <li
                      key={sub.id}
                      className="grid grid-cols-[44px_1fr_auto] items-center gap-2.5 border-b py-2 last:border-b-0"
                    >
                      <span className="rounded-[10px] bg-secondary py-1 text-center">
                        <b className="block text-sm leading-tight font-black tabular-nums">
                          {date.getDate()}
                        </b>
                        <span className="text-[9.5px] text-muted-foreground">
                          {date.getMonth() + 1}월
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] font-bold">{sub.name}</span>
                        <span className="block text-[10.5px] text-muted-foreground">
                          {days <= 0 ? "오늘" : `${days}일 뒤`}
                        </span>
                      </span>
                      <span className="text-[12.5px] font-extrabold text-emerald-700 tabular-nums dark:text-emerald-300">
                        +{formatKRW(perChargeKRW(sub, rate))}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {undated > 0 && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  결제월 미설정 {undated}개는 날짜를 몰라 빠져 있어요.
                </p>
              )}
            </section>
          )}

          <section className="rounded-2xl border bg-card p-4">
            <h2 className="text-[14.5px] font-extrabold tracking-tight">1년 아끼면 이만큼</h2>
            {equivalents.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                연간 ₩5,000부터 여기에 보여드려요.
              </p>
            ) : (
              <div className="-mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none]">
                {equivalents.map((item) => (
                  <div
                    key={item.label}
                    className="min-w-[108px] shrink-0 rounded-2xl border px-3 py-2.5"
                  >
                    <p className="text-xl" aria-hidden>
                      {item.emoji}
                    </p>
                    <p className="mt-0.5 text-sm font-black tabular-nums">
                      {item.count.toLocaleString()}
                      {item.unit}
                    </p>
                    <p className="text-[10.5px] text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-4">
            <h2 className="text-[14.5px] font-extrabold tracking-tight">
              해지한 구독 {killed.length}
            </h2>
            <ul className="mt-1">
              {(showAllKilled ? killed : killed.slice(0, LIST_LIMIT)).map((sub) => {
                const state = getKillCheckStatus(sub, now)?.state;
                return (
                  <li
                    key={sub.id}
                    className="grid grid-cols-[28px_1fr_auto] items-center gap-2.5 border-b py-2 last:border-b-0"
                  >
                    <ServiceLogo
                      name={sub.name}
                      cancelUrl={sub.cancelUrl}
                      fallbackEmoji={sub.iconUrl}
                      fallbackColor={sub.iconColor}
                      size={28}
                    />
                    <span className="min-w-0">
                      <s className="block truncate text-[12.5px] font-bold text-muted-foreground">
                        {sub.name}
                      </s>
                      <span className="block text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-300">
                        연 {formatKRW(getMyAnnualAmountKRW(sub, rate))} 아끼는 중
                        {state === "verified" && " · 확인됨"}
                        {state === "due" && " · 확인 대기"}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReviveTarget(sub)}
                      className="rounded-lg px-2 py-1 text-[11px] font-bold text-muted-foreground hover:bg-secondary"
                    >
                      되살리기
                    </button>
                  </li>
                );
              })}
            </ul>
            {killed.length > LIST_LIMIT && (
              <MoreToggle
                open={showAllKilled}
                hidden={killed.length - LIST_LIMIT}
                onToggle={() => setShowAllKilled((v) => !v)}
              />
            )}
            <button
              type="button"
              onClick={() => void handleShare()}
              className="mt-3 h-11 w-full rounded-xl border text-[13px] font-extrabold"
            >
              {copied ? "클립보드에 복사했어요" : "결과 공유하기"}
            </button>
          </section>
        </>
      )}

      {reviveTarget && (
        <ConfirmDialog
          isOpen
          onClose={() => setReviveTarget(null)}
          onConfirm={() => {
            reviveSubscription(reviveTarget.id);
            setReviveTarget(null);
          }}
          centered
          subject={<SubjectChip sub={reviveTarget} />}
          title="다시 살릴까요?"
          description={"구독 중으로 돌아가고,\n절약 기록에서는 빠져요."}
          confirmText="다시 살리기"
          cancelText="취소"
        />
      )}

      {chargedTarget && (
        <ConfirmDialog
          isOpen
          onClose={() => setChargedTarget(null)}
          onConfirm={() => {
            // 대시보드와 같은 처리: 결제가 됐다면 아직 돈이 나가는 구독이라 해지 기록을 되돌린다.
            reviveSubscription(chargedTarget.id);
            setChargedTarget(null);
            router.push("/subs");
          }}
          centered
          subject={<SubjectChip sub={chargedTarget} />}
          title="해지가 안 됐을 수 있어요"
          description={
            "첫 결제일에 결제가 됐다면\n구독 중으로 되돌릴게요.\n해지를 마친 뒤 다시 '해지 완료'를\n누르면 그날부터 절약으로 세요."
          }
          confirmText="되돌리기"
          cancelText="취소"
        />
      )}
    </div>
  );
}

/** 긴 목록 아래의 'N개 더 보기 / 접기'. */
function MoreToggle({
  open,
  hidden,
  onToggle,
}: {
  open: boolean;
  hidden: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-bold text-muted-foreground hover:bg-secondary"
    >
      {open ? "접기" : `${hidden}개 더 보기`}
      <ChevronDown
        className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        aria-hidden
      />
    </button>
  );
}
