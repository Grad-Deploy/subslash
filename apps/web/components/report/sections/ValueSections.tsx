import { describeCheckIn, formatKRW } from "@subslash/shared";
import type { OtherMetricRow, ValueRow } from "../valueRows";
import { ReportRowList } from "./ReportRowList";

/** 1회 단가 순위. 비싼 것부터, 체크인 전은 뒤. */
export function CostPerUseRanking({ rows }: { rows: ValueRow[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold">1회 단가 순위</h2>
      <ReportRowList
        rows={rows}
        detail={(row) => (
          <>
            한 달 {formatKRW(row.monthlyKRW)}
            {row.usageCount !== null && ` · ${row.usageCount}번 사용`}
          </>
        )}
        trailing={(row) => (
          <div className="text-right">
            {row.costPerUse === null ? (
              <span className="text-xs text-muted-foreground">체크인 전</span>
            ) : row.usageCount === 0 ? (
              // 0번 쓴 구독에 '1회 ₩17,000'을 적으면 한 번은 쓴 것처럼 읽힌다.
              <span className="text-xs font-bold text-destructive">안 썼어요</span>
            ) : (
              <>
                <p className="font-bold tabular-nums">{formatKRW(row.costPerUse)}</p>
                <p className="text-[11px] text-muted-foreground">1회</p>
              </>
            )}
          </div>
        )}
      />
      {rows.some((row) => row.costPerUse === null) && (
        <p className="text-xs text-muted-foreground">
          &lsquo;체크인 전&rsquo;인 구독은 대시보드에서 이번 달 사용 횟수를 알려 주면 1회 단가가
          나와요.
        </p>
      )}
    </section>
  );
}

/** 색만으로 말하지 않게 글자를 붙인다(계산서와 같은 말). */
const LEVEL_TEXT = {
  red: { label: "쉬어가도 될 구독", className: "text-destructive" },
  yellow: { label: "애매해요", className: "text-amber-700 dark:text-amber-400" },
  green: { label: "뽕 뽑는 중", className: "text-emerald-700 dark:text-emerald-400" },
} as const;

/** 횟수 말고 다른 기준(시간·쓴 날·혜택·용량)으로 재는 구독. 없으면 그리지 않는다. */
export function OtherMetricList({ rows }: { rows: OtherMetricRow[] }) {
  if (rows.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold">횟수 말고 다른 기준으로 재는 구독</h2>
      <p className="text-xs text-muted-foreground">
        음악은 들은 시간, AI·업무 도구는 쓴 날, 멤버십은 받은 혜택, 저장 공간은 쓰는 용량으로 봐요.
      </p>
      <ReportRowList
        rows={rows}
        detail={({ sub, log }) => (log ? describeCheckIn(log, sub.currency) : "체크인 전")}
        trailing={({ log }) =>
          log && (
            <span className={`text-xs font-bold ${LEVEL_TEXT[log.riskLevel].className}`}>
              {LEVEL_TEXT[log.riskLevel].label}
            </span>
          )
        }
      />
    </section>
  );
}
