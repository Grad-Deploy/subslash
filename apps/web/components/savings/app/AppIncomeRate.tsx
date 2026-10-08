"use client";

import { useState, type ReactNode } from "react";
import { formatKRW } from "@subslash/shared";
import { AppSheet } from "../../settings/app/AppSheet";
import { useMonthlyIncome } from "./useMonthlyIncome";
import { useT } from "@lib/i18n";

/**
 * 색. 구독비는 중립 잉크, 해지로 줄인 몫은 절약 그래프와 같은 에메랄드다. 빨강·초록 조합은
 * 색약 검증에서 떨어져 쓰지 않는다. 색만으로 구분하지 않도록 범례에 글자와 금액을 함께 적는다.
 */
const SPEND = "stroke-zinc-600 dark:stroke-zinc-400";
const SAVED = "stroke-emerald-500 dark:stroke-emerald-600";
const SPEND_BG = "bg-zinc-600 dark:bg-zinc-400";
const SAVED_BG = "bg-emerald-500 dark:bg-emerald-600";

function pct(part: number, whole: number): string {
  const value = (part / whole) * 100;
  return `${value < 10 ? value.toFixed(1) : Math.round(value)}%`;
}

/**
 * 단위 버튼. 숫자를 친 바로 뒤에 누르면 그 숫자에 단위를 붙이고(3 → 십만 = 30만 원),
 * 그렇지 않으면 한 단위를 더한다(30만 원 → 십만 = 40만 원). 토스의 금액 입력과 같은 방식이다.
 */
const UNIT_VALUES = [10_000, 100_000, 1_000_000, 10_000_000] as const;

/** 입력 상한(100억 원). 자릿수를 잘못 붙여 비율이 무의미해지는 것을 막는다. */
const MAX_INCOME = 10_000_000_000;

/** 3,450,000 → "345만 원", 12,345,678 → "1,234만 5,678원". 입력 칸 아래에 읽기 쉬운 금액으로 보여준다. */
/**
 * 월 수입 대비 구독비. 지금 내는 구독비(활성 구독 월 환산)와 해지로 줄인 몫(해지한 구독 월 환산)을
 * 사용자가 넣은 월 수입에 견준다. 수입을 넣지 않았으면 비율 대신 입력 안내만 보여준다.
 * 평균·권장 비율 같은 기준선은 근거가 없어 두지 않는다.
 */
export function AppIncomeRate({
  activeMonthly,
  killedMonthly,
}: {
  activeMonthly: number;
  killedMonthly: number;
}) {
  const t = useT();
  const n = t.savings.income;
  const [income, setIncome] = useMonthlyIncome();
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[14.5px] font-extrabold tracking-tight">{n.title}</h2>
        {income && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[11px] font-bold text-muted-foreground underline underline-offset-4"
          >
            {n.edit}
          </button>
        )}
      </div>

      {!income ? (
        <div className="py-2 text-center">
          <p className="mt-1 text-[13.5px] font-bold">{n.askTitle}</p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">{n.askHint}</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 h-10 rounded-xl bg-primary px-4 text-[13px] font-extrabold text-primary-foreground"
          >
            {n.enter}
          </button>
        </div>
      ) : (
        <Rate
          income={income}
          activeMonthly={activeMonthly}
          killedMonthly={killedMonthly}
          onEditIncome={() => setOpen(true)}
        />
      )}

      <IncomeSheet
        open={open}
        initial={income}
        onClose={() => setOpen(false)}
        onSave={(value) => {
          setIncome(value);
          setOpen(false);
        }}
      />
    </section>
  );
}

function Rate({
  income,
  activeMonthly,
  killedMonthly,
  onEditIncome,
}: {
  income: number;
  activeMonthly: number;
  killedMonthly: number;
  onEditIncome: () => void;
}) {
  // 구독비가 월 수입을 넘으면 원은 꽉 찬 채 주황으로 칠하고, 비율보다 할 일을 먼저 보여준다.
  // 대개 수입을 잘못 넣었거나(자릿수·단위) 정말 구독이 많은 경우라, 둘 다 고를 수 있게 한다.
  const n = useT().savings.income;
  const over = activeMonthly > income;
  const before = activeMonthly + killedMonthly;
  // 원은 둘레 100을 기준으로 그린다. 조각 사이에 표면색 틈을 둔다.
  const spendLen = Math.min(100, (activeMonthly / income) * 100);
  const savedLen = Math.min(100 - spendLen, (killedMonthly / income) * 100);
  const gap = spendLen > 0 && savedLen > 0 ? 0.6 : 0;
  const diff = before > 0 ? ((before - activeMonthly) / income) * 100 : 0;

  return (
    <>
      <p className="mt-0.5 text-[11.5px] text-muted-foreground">{n.basis(formatKRW(income))}</p>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative size-[104px] shrink-0">
          <svg viewBox="0 0 36 36" className="size-full -rotate-90" aria-hidden>
            <circle
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              strokeWidth="3.6"
              className="stroke-secondary"
            />
            {spendLen > 0 && (
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                strokeWidth="3.6"
                pathLength={100}
                strokeDasharray={`${spendLen} ${100 - spendLen}`}
                className={over ? "stroke-amber-500 dark:stroke-amber-400" : SPEND}
              />
            )}
            {savedLen > gap && (
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                strokeWidth="3.6"
                pathLength={100}
                strokeDasharray={`${savedLen - gap} ${100 - savedLen + gap}`}
                strokeDashoffset={-(spendLen + gap)}
                className={SAVED}
              />
            )}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="text-[22px] leading-none font-black tracking-tight tabular-nums">
                {pct(activeMonthly, income)}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">{n.now}</p>
            </div>
          </div>
        </div>
        <dl className="grid min-w-0 flex-1 gap-1.5 text-[11.5px]">
          <LegendRow swatch={SPEND_BG} label={n.now} value={activeMonthly} />
          {killedMonthly > 0 && (
            <LegendRow swatch={SAVED_BG} label={n.savedPart} value={killedMonthly} />
          )}
          <LegendRow
            swatch="bg-secondary ring-1 ring-border"
            label={n.rest}
            value={Math.max(0, income - activeMonthly - killedMonthly)}
          />
        </dl>
      </div>

      {over && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-950/40">
          <p className="font-bold text-amber-800 dark:text-amber-300">
            {n.over(formatKRW(activeMonthly - income))}
          </p>
          <p className="mt-1 leading-relaxed text-amber-900/80 dark:text-amber-200/80">
            {n.overHint}
          </p>
          <button
            type="button"
            onClick={onEditIncome}
            className="mt-2 rounded-lg border border-amber-300 bg-background px-2.5 py-1 font-bold text-amber-900 dark:border-amber-700 dark:text-amber-200"
          >
            {n.reenter}
          </button>
        </div>
      )}

      {killedMonthly > 0 && before > 0 && (
        <>
          {/* 막대 길이는 해지 전 구독비를 끝으로 둔다. 비율은 오른쪽 글자로 읽는다. */}
          <div className="mt-3 grid gap-2 text-[11px]">
            <CompareRow label={n.before} rate={pct(before, income)}>
              <span className={SPEND_BG} style={{ width: `${(activeMonthly / before) * 100}%` }} />
              <span className={SAVED_BG} style={{ width: `${(killedMonthly / before) * 100}%` }} />
            </CompareRow>
            <CompareRow label={n.current} rate={pct(activeMonthly, income)}>
              <span className={SPEND_BG} style={{ width: `${(activeMonthly / before) * 100}%` }} />
            </CompareRow>
          </div>
          <p className="mt-2.5 text-[11.5px] font-bold text-emerald-700 dark:text-emerald-300">
            {n.lowered(diff < 10 ? diff.toFixed(1) : String(Math.round(diff)))}
          </p>
        </>
      )}
    </>
  );
}

function LegendRow({ swatch, label, value }: { swatch: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`size-2.5 shrink-0 rounded-[3px] ${swatch}`} aria-hidden />
      <dt className="flex-1 truncate text-muted-foreground">{label}</dt>
      <dd className="font-bold tabular-nums">{formatKRW(value)}</dd>
    </div>
  );
}

function CompareRow({
  label,
  rate,
  children,
}: {
  label: string;
  rate: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[40px_1fr_40px] items-center gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-secondary [&>span]:h-full [&>span:first-child]:rounded-l-full [&>span:last-child]:rounded-r-full">
        {children}
      </span>
      <b className="text-right tabular-nums">{rate}</b>
    </div>
  );
}

function IncomeSheet({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: number | null;
  onClose: () => void;
  onSave: (value: number | null) => void;
}) {
  return (
    <AppSheet open={open} onClose={onClose} label={useT().savings.income.sheet}>
      {/* 열 때마다 저장된 값에서 새로 시작하도록 key로 다시 만든다. */}
      {open && <IncomeForm key={initial ?? 0} initial={initial} onSave={onSave} />}
    </AppSheet>
  );
}

function IncomeForm({
  initial,
  onSave,
}: {
  initial: number | null;
  onSave: (value: number | null) => void;
}) {
  const n = useT().savings.income;
  const [value, setValue] = useState(initial ?? 0);
  // 방금 친 숫자가 만 원보다 작으면(3, 250 같은 '몇 만'의 숫자) 단위 버튼이 곱하고, 아니면 더한다.
  // 이미 원 단위로 다 친 금액(2,500,000)에 단위를 곱해 자릿수가 튀지 않게 한다.
  const [justTyped, setJustTyped] = useState(false);
  const multiplies = justTyped && value > 0 && value < 10_000;

  const applyUnit = (unit: number) => {
    setValue((v) => Math.min(MAX_INCOME, multiplies ? v * unit : v + unit));
    setJustTyped(false);
  };

  return (
    <div className="pt-1">
      <h2 className="text-lg font-black tracking-tight">{n.formTitle}</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{n.formHint}</p>
      <label className="mt-4 flex items-center gap-1.5 rounded-2xl border px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring">
        <span className="text-xl font-black text-muted-foreground">₩</span>
        <input
          inputMode="numeric"
          autoFocus
          value={value ? value.toLocaleString(n.numberLocale) : ""}
          onChange={(e) => {
            setValue(Math.min(MAX_INCOME, Number(e.target.value.replace(/[^0-9]/g, "")) || 0));
            setJustTyped(true);
          }}
          placeholder="0"
          aria-label={n.ariaLabel}
          className="min-w-0 flex-1 bg-transparent text-[22px] font-black tabular-nums outline-none placeholder:text-muted-foreground"
        />
        <span className="text-xs text-muted-foreground">{n.perMonth}</span>
      </label>
      <p
        className="mt-1.5 min-h-4 px-1 text-xs font-semibold text-muted-foreground"
        aria-live="polite"
      >
        {value > 0 ? n.readout(n.won(value)) : n.unitHint}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {UNIT_VALUES.map((unitValue, index) => (
          <button
            key={unitValue}
            type="button"
            onClick={() => applyUnit(unitValue)}
            className="rounded-full border px-3 py-1 text-[11.5px] font-bold"
          >
            {multiplies ? n.units[index] : `+${n.units[index]}`}
          </button>
        ))}
        {value > 0 && (
          <button
            type="button"
            onClick={() => {
              setValue(0);
              setJustTyped(false);
            }}
            className="rounded-full border px-3 py-1 text-[11.5px] font-bold text-muted-foreground"
          >
            {n.clear}
          </button>
        )}
      </div>
      <button
        type="button"
        disabled={value <= 0}
        onClick={() => onSave(value)}
        className="mt-5 h-12 w-full rounded-xl bg-primary text-sm font-extrabold text-primary-foreground disabled:opacity-40"
      >
        {n.save}
      </button>
      {initial && (
        <button
          type="button"
          onClick={() => onSave(null)}
          className="mt-1 h-10 w-full text-[12.5px] font-semibold text-muted-foreground"
        >
          {n.removeSaved}
        </button>
      )}
    </div>
  );
}
