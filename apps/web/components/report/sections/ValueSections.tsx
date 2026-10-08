import { formatKRW } from "@subslash/shared";
import { useT } from "@lib/i18n";
import { describeCheckInText } from "@lib/i18n/check-in-text";
import type { OtherMetricRow, ValueRow } from "../valueRows";
import { ReportRowList } from "./ReportRowList";

/** 1회 단가 순위. 비싼 것부터, 체크인 전은 뒤. */
export function CostPerUseRanking({ rows }: { rows: ValueRow[] }) {
  const r = useT().reportPage.ranking;
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold">{r.title}</h2>
      <ReportRowList
        rows={rows}
        detail={(row) => (
          <>
            {r.monthly(formatKRW(row.monthlyKRW))}
            {row.usageCount !== null && r.used(row.usageCount)}
          </>
        )}
        trailing={(row) => (
          <div className="text-right">
            {row.costPerUse === null ? (
              <span className="text-xs text-muted-foreground">{r.beforeCheckIn}</span>
            ) : row.usageCount === 0 ? (
              // 0번 쓴 구독에 '1회 ₩17,000'을 적으면 한 번은 쓴 것처럼 읽힌다.
              <span className="text-xs font-bold text-destructive">{r.unused}</span>
            ) : (
              <>
                <p className="font-bold tabular-nums">{formatKRW(row.costPerUse)}</p>
                <p className="text-[11px] text-muted-foreground">{r.perUse}</p>
              </>
            )}
          </div>
        )}
      />
      {rows.some((row) => row.costPerUse === null) && (
        <p className="text-xs text-muted-foreground">{r.note}</p>
      )}
    </section>
  );
}

/** 색만으로 말하지 않게 글자를 붙인다(계산서와 같은 말). 글자는 앱 체크인 결과의 말을 그대로 쓴다. */
const LEVEL_CLASS = {
  red: "text-destructive",
  yellow: "text-amber-700 dark:text-amber-400",
  green: "text-emerald-700 dark:text-emerald-400",
} as const;

/** 횟수 말고 다른 기준(시간·쓴 날·혜택·용량)으로 재는 구독. 없으면 그리지 않는다. */
export function OtherMetricList({ rows }: { rows: OtherMetricRow[] }) {
  const t = useT();
  const o = t.reportPage.other;
  const levelLabel = {
    red: t.checkin.appResult.red,
    yellow: t.checkin.appResult.yellow,
    green: t.checkin.appResult.green,
  };
  if (rows.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold">{o.title}</h2>
      <p className="text-xs text-muted-foreground">{o.note}</p>
      <ReportRowList
        rows={rows}
        detail={({ sub, log }) =>
          log ? describeCheckInText(t, log, sub.currency) : t.reportPage.ranking.beforeCheckIn
        }
        trailing={({ log }) =>
          log && (
            <span className={`text-xs font-bold ${LEVEL_CLASS[log.riskLevel]}`}>
              {levelLabel[log.riskLevel]}
            </span>
          )
        }
      />
    </section>
  );
}
