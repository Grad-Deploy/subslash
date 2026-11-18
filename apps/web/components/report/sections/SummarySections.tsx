import { useEffect, useState } from "react";
import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { formatKRW, type findBundleOpportunities, type findBundleOverlaps } from "@subslash/shared";
import { IS_APP_BUILD } from "@lib/platform";
import { receiptHref, type ReceiptMonth } from "@lib/receipt-view";
import { useServiceNames, useT } from "@lib/i18n";
import { ownerScopedKey } from "@lib/owner-scoped";
import { dismissUntil } from "@lib/usage/suggest";
import { dayKey } from "@lib/usage/history";
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
          {/* 좁은 칸에서 '결산 영수 / 증'처럼 낱말 가운데서 끊지 않는다. 다만 띄어쓰기 없는 일본어는 낱말이 칸보다 길어 칸을 넘으므로(375px에서 5px) 그때만 끊는다. */}
          <span className="min-w-0 break-keep text-sm font-semibold [overflow-wrap:anywhere]">
            {link.label}
          </span>
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

const range = (min: number, max: number) =>
  min === max ? formatKRW(min) : `${formatKRW(min)}~${formatKRW(max)}`;

const DISMISSED_KEY = "subslash-bundle-saving-dismissed";

/** 결합 상품 id → 이 날(YYYY-MM-DD)까지 보이지 않는다. 기기에만 두고(기록 주인별), 쓸 수 없으면 이번 화면에서만 숨긴다. */
function readDismissed(): Record<string, string> {
  try {
    const raw = localStorage.getItem(ownerScopedKey(DISMISSED_KEY));
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/**
 * 따로 내는 구독을 결합 상품 하나로 바꾸면 덜 내는 경우. 같은 요금제끼리 견준 것만 온다(`findBundleOpportunities`).
 * 가입 조건(`requires`)은 사용자가 갖췄는지 모르므로 조건으로 적고, '해당 안 돼요'로 90일 숨길 수 있다.
 */
export function BundleSavingNotice({
  opportunities,
}: {
  opportunities: ReturnType<typeof findBundleOpportunities>;
}) {
  const b = useT().reportPage.bundleSaving;
  const names = useServiceNames();
  const [dismissed, setDismissed] = useState<Record<string, string>>({});
  useEffect(() => setDismissed(readDismissed()), []);
  const today = dayKey(new Date());
  const shown = opportunities.filter(
    // 앱은 안드로이드뿐이라 Apple 기기 상품은 맞지 않는다.
    (o) =>
      (dismissed[o.bundle.id] ?? "") <= today &&
      !(IS_APP_BUILD && o.requires.includes("apple-device")),
  );
  if (shown.length === 0) return null;
  const dismiss = (id: string) => {
    const next = { ...dismissed, [id]: dismissUntil(new Date()) };
    setDismissed(next);
    try {
      localStorage.setItem(ownerScopedKey(DISMISSED_KEY), JSON.stringify(next));
    } catch {
      // 저장하지 못해도 이번 화면에서는 숨긴다.
    }
  };
  return (
    <section
      aria-label={b.label}
      className="space-y-1.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm"
    >
      <p className="font-bold">{b.title}</p>
      {shown.map(({ bundle, replaced, bundleMonthly, saving, extraServiceIds, requires }) => (
        <div key={bundle.id} className="space-y-0.5 text-xs leading-relaxed">
          <p>
            {b.line(
              replaced.map((sub) => sub.name).join(", "),
              names.id(bundle.id),
              range(bundleMonthly.min, bundleMonthly.max),
              range(saving.min, saving.max),
            )}
            {extraServiceIds.length > 0 && ` ${b.extra(extraServiceIds.map(names.id).join(", "))}`}
            {requires.map((need) => ` ${b.requires[need]}`).join("")}
          </p>
          <button
            type="button"
            onClick={() => dismiss(bundle.id)}
            className="text-muted-foreground underline underline-offset-2"
          >
            {b.dismiss}
          </button>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">{b.note}</p>
    </section>
  );
}
