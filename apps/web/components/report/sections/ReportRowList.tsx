import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Subscription } from "@subslash/shared";
import { ServiceLogo } from "@components/subscription/ServiceLogo";
import { subscriptionDetailHref } from "@lib/routes";

/** 리포트의 구독 목록 한 줄. 누르면 구독 상세로 간다. */
function ReportRow({
  sub,
  detail,
  trailing,
}: {
  sub: Subscription;
  detail: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <li>
      <Link
        href={subscriptionDetailHref(sub.id)}
        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
      >
        <ServiceLogo
          name={sub.name}
          cancelUrl={sub.cancelUrl}
          fallbackEmoji={sub.iconUrl}
          fallbackColor={sub.iconColor}
          size={32}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{sub.name}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
        {trailing}
        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}

/** 테두리 안에 구독 줄을 늘어놓는다. */
export function ReportRowList<T extends { sub: Subscription }>({
  rows,
  detail,
  trailing,
}: {
  rows: T[];
  detail: (row: T) => ReactNode;
  trailing?: (row: T) => ReactNode;
}) {
  return (
    <ul className="divide-y rounded-2xl border">
      {rows.map((row) => (
        <ReportRow key={row.sub.id} sub={row.sub} detail={detail(row)} trailing={trailing?.(row)} />
      ))}
    </ul>
  );
}
