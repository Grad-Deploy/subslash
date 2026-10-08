import React from "react";
import { formatCurrency } from "@subslash/shared";
import { cn } from "@lib/utils";
import { useLocale, useT } from "@lib/i18n";
import { ServiceLogo } from "@components/subscription/ServiceLogo";
import { sampleName, type Sample } from "./samples";

/**
 * 소개 첫 장면의 결제 알림 하나(웹 `/`의 첫 칸, 앱 소개의 첫 장). 서비스 목록 기준 요금으로 만든 예시다 —
 * 합계 아래에 '예시예요'(`landing.sampleNote`)를 함께 적는다. 움직임용 클래스·data 속성은 부르는 쪽이 넘긴다.
 */
export function SampleChargeCard({
  sample,
  className,
  ...rest
}: { sample: Sample } & React.LiHTMLAttributes<HTMLLIElement>) {
  const s = useT().landing.sample;
  const locale = useLocale();
  return (
    <li
      className={cn(
        "flex items-center gap-3.5 rounded-[20px] border bg-card px-4 py-3.5 shadow-[0_16px_32px_-20px_rgba(9,9,11,0.25)]",
        className,
      )}
      {...rest}
    >
      <ServiceLogo presetId={sample.preset.id} name={sample.preset.nameKo} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2 text-[15px] font-bold">
          <span className="truncate">{sampleName(sample, locale)}</span>
          <span className="shrink-0 text-[13px] font-medium text-muted-foreground">{s.due}</span>
        </div>
        <p className="mt-0.5 text-[15px] tabular-nums text-muted-foreground">
          {s.paid(formatCurrency(sample.amount, sample.currency))}
        </p>
      </div>
    </li>
  );
}
