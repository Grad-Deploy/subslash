import React from "react";
import { useT } from "@lib/i18n";

/**
 * 공유 카드의 '해지한 구독' 칸: 개수와 줄을 그은 서비스 이름들. 절약 공유와 연말 결산 공유가 같은 칸을
 * 따로 그리던 것을 모았다.
 */
export function KilledServicesCard({
  label,
  count,
  names,
}: {
  label: string;
  count: number;
  names: string[];
}) {
  const t = useT();
  return (
    <div className="space-y-3 text-left bg-muted/40 p-4 rounded-2xl border">
      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground">{t.savings.killedCard.services(count)}</span>
      </div>
      {names.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {names.map((name, idx) => (
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
  );
}
