import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { formatKRW, type findBundleOverlaps } from "@subslash/shared";
import { IS_APP_BUILD } from "@lib/platform";
import { receiptHref, type ReceiptMonth } from "@lib/receipt-view";
import { useServiceNames, useT } from "@lib/i18n";
import { FitText } from "@components/ui/fit-text";

/**
 * 달 영수증과 올해 결산 영수증으로 가는 칸. 달은 영수증 화면이 처음 여는 달과 같다(`defaultReceiptMonth` — 지난달,
 * 지난달이 구독을 등록하기 전이면 이번 달). 버튼에 '9월'이라 적고 '결제된 구독이 없어요'를 열지 않게.
 */
export function ReceiptLinks({ now, month }: { now: Date; month: ReceiptMonth }) {
  const r = useT().reportPage.receipts;
  const links = [
    { href: receiptHref(month), label: r.month(month.month) },
    {
      href: receiptHref({ kind: "year", year: now.getFullYear() }),
      label: r.year(now.getFullYear()),
    },
  ];
  return (
    <section aria-label={r.label} className="grid grid-cols-2 gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="flex items-center gap-2 rounded-2xl border p-3 hover:bg-muted/50"
        >
          <ReceiptText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          {/* 좁은 칸에서 '결산 영수 / 증'처럼 낱말 가운데서 끊지 않는다. */}
          <span className="min-w-0 break-keep text-sm font-semibold">{link.label}</span>
        </Link>
      ))}
    </section>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      {/* 좁은 칸에서는 금액을 자르지 않고 글자를 줄인다(웹·앱). */}
      <FitText text={value} className="font-black leading-7 tabular-nums" />
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
  const s = useT().reportPage.summary;
  return (
    // 앱은 '구독 N개' 칸을 내용만큼만 두고 금액 두 칸을 넓힌다.
    <section
      aria-label={s.label}
      className={
        IS_APP_BUILD
          ? "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2"
          : "grid grid-cols-3 gap-2"
      }
    >
      <SummaryTile label={s.month} value={formatKRW(monthly)} />
      <SummaryTile label={s.year} value={formatKRW(annual)} />
      <SummaryTile label={s.subs} value={s.count(count)} />
    </section>
  );
}

/** 지출·구독 수에서 뺀 무료 체험. 빼기만 하면 '내 구독'의 개수와 왜 다른지 알 수 없다. 대시보드와 같은 문구다. */
export function TrialExcludedNote({ count, monthly }: { count: number; monthly: number }) {
  const o = useT().overview.totalSpend;
  if (count === 0) return null;
  return <p className="text-xs text-muted-foreground">{o.inTrial(count, formatKRW(monthly))}</p>;
}

/** 결합 상품에 든 서비스를 따로도 내고 있으면 먼저 알린다 — 증거가 있는 절약 기회다. 없으면 그리지 않는다. */
export function BundleOverlapNotice({
  overlaps,
}: {
  overlaps: ReturnType<typeof findBundleOverlaps>;
}) {
  const o = useT().reportPage.overlap;
  const names = useServiceNames();
  if (overlaps.length === 0) return null;
  return (
    <section
      aria-label={o.label}
      className="space-y-1.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
    >
      <p className="font-bold">{o.title}</p>
      {overlaps.map(({ bundle, other, serviceIds }) => (
        <p key={`${bundle.id}-${other.id}`} className="text-xs leading-relaxed">
          <b>{bundle.name}</b>
          {o.middle(serviceIds.map(names.id).join(", "))}
          <b>{other.name}</b>
          {o.after}
        </p>
      ))}
    </section>
  );
}
