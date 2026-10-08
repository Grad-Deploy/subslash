"use client";

import { ServicePreset, type Currency, formatAmount, getBilledAmount } from "@subslash/shared";
import { Select } from "../../ui/select";
import { useServiceNames, useT } from "@lib/i18n";
import { FIELD_LABEL } from "./fieldLabel";

/**
 * 해외 서비스는 요금표 가격에 부가세가 더해져 청구되기도 한다. 금액 칸에는 요금표 가격을 두고
 * 세금은 따로 고르게 해, 카드에 찍히는 금액과 가격 확인(요금표 가격끼리 비교)이 둘 다 맞게 한다.
 */
export function TaxField({
  id,
  preset,
  amount,
  taxRate,
  currency,
  onChange,
}: {
  id: string;
  preset?: ServicePreset;
  amount?: number;
  taxRate?: number;
  currency: Currency;
  onChange: (taxRate: number | undefined) => void;
}) {
  const f = useT().form.tax;
  const names = useServiceNames();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={FIELD_LABEL}>
        {f.label}
      </label>
      <Select
        id={id}
        name="taxRate"
        value={taxRate ? String(taxRate) : "none"}
        onChange={(e) => {
          const { value } = e.target;
          onChange(value === "none" ? undefined : Number(value));
        }}
      >
        <option value="none">{f.none}</option>
        <option value="10">{f.vat10}</option>
        {/* 백업 등으로 들어온 다른 세율도 고친 적 없이 사라지지 않게 보여준다. */}
        {taxRate && taxRate !== 10 ? (
          <option value={String(taxRate)}>{f.other(taxRate)}</option>
        ) : null}
      </Select>
      <p className="text-[11px] text-muted-foreground break-keep">
        {preset?.taxRate ? f.hintPreset(names.preset(preset), preset.taxRate) : f.hintOverseas}
      </p>
      {taxRate && typeof amount === "number" ? (
        <p className="text-[11px] font-semibold text-foreground">
          {f.billed(
            formatAmount(getBilledAmount({ amount, taxRate }), currency),
            formatAmount(amount, currency),
            taxRate,
          )}
        </p>
      ) : null}
    </div>
  );
}
