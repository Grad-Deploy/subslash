import Link from "next/link";
import dynamic from "next/dynamic";
import { ReceiptText } from "lucide-react";
import { formatKRW, previousMonth, serviceNameOf, type findBundleOverlaps } from "@subslash/shared";
import { IS_APP_BUILD } from "@lib/platform";
import { receiptHref } from "@lib/receipt-view";

// 요약 칸의 금액을 칸에 맞춰 줄인다(앱 전용). 웹은 지금처럼 자른다.
const AppFitText = IS_APP_BUILD
  ? dynamic(() => import("../app/AppFitText").then((m) => m.AppFitText), { ssr: false })
  : null;

/** 지난달 영수증과 올해 결산 영수증으로 가는 칸. */
export function ReceiptLinks({ now }: { now: Date }) {
  const last = previousMonth(now);
  const links = [
    { href: receiptHref({ kind: "month", ...last }), label: `${last.month}월 영수증` },
    {
      href: receiptHref({ kind: "year", year: now.getFullYear() }),
      label: `${now.getFullYear()}년 결산 영수증`,
    },
  ];
  return (
    <section aria-label="구독 영수증" className="grid grid-cols-2 gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="flex items-center gap-2 rounded-2xl border p-3 hover:bg-muted/50"
        >
          <ReceiptText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 text-sm font-semibold">{link.label}</span>
        </Link>
      ))}
    </section>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {AppFitText ? (
        <AppFitText text={value} className="font-black leading-7 tabular-nums" />
      ) : (
        <p className="truncate text-lg font-black tabular-nums">{value}</p>
      )}
    </div>
  );
}

/** 한 달·1년·구독 개수. 금액은 내 몫(sumMyMonthlyKRW)이다. */
export function SpendSummary({
  monthly,
  annual,
  count,
}: {
  monthly: number;
  annual: number;
  count: number;
}) {
  return (
    // 앱은 '구독 N개' 칸을 내용만큼만 두고 금액 두 칸을 넓힌다.
    <section
      aria-label="지출 요약"
      className={
        IS_APP_BUILD
          ? "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2"
          : "grid grid-cols-3 gap-2"
      }
    >
      <SummaryTile label="한 달" value={formatKRW(monthly)} />
      <SummaryTile label="1년이면" value={formatKRW(annual)} />
      <SummaryTile label="구독" value={`${count}개`} />
    </section>
  );
}

/** 결합 상품에 든 서비스를 따로도 내고 있으면 먼저 알린다 — 증거가 있는 절약 기회다. 없으면 그리지 않는다. */
export function BundleOverlapNotice({
  overlaps,
}: {
  overlaps: ReturnType<typeof findBundleOverlaps>;
}) {
  if (overlaps.length === 0) return null;
  return (
    <section
      aria-label="결합 상품과 겹치는 구독"
      className="space-y-1.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
    >
      <p className="font-bold">두 번 내고 있을 수 있어요</p>
      {overlaps.map(({ bundle, other, serviceIds }) => (
        <p key={`${bundle.id}-${other.id}`} className="text-xs leading-relaxed">
          <b>{bundle.name}</b>에 {serviceIds.map(serviceNameOf).join(", ")}이(가) 들어 있는데{" "}
          <b>{other.name}</b>도 따로 구독 중이에요. 다른 계정으로 쓰는 게 아니라면 한 쪽을 해지해도
          돼요.
        </p>
      ))}
    </section>
  );
}
