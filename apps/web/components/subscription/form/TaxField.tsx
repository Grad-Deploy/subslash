"use client";

import { ServicePreset, type Currency, formatAmount, getBilledAmount } from "@subslash/shared";
import { Select } from "../../ui/select";
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
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={FIELD_LABEL}>
        세금
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
        <option value="none">금액에 포함 · 따로 붙지 않음</option>
        <option value="10">부가세 10% 별도</option>
        {/* 백업 등으로 들어온 다른 세율도 고친 적 없이 사라지지 않게 보여준다. */}
        {taxRate && taxRate !== 10 ? (
          <option value={String(taxRate)}>세금 {taxRate}% 별도</option>
        ) : null}
      </Select>
      <p className="text-[11px] text-muted-foreground break-keep">
        {preset?.taxRate
          ? `한국 결제 시 ${preset.nameKo}에 부가세 ${preset.taxRate}%가 붙어요. 사업자 결제라 안 붙으면 '금액에 포함'으로 바꾸세요.`
          : "해외 서비스는 부가세 10%가 붙기도 해요. 카드 명세서와 비교해 고르세요."}
      </p>
      {taxRate && typeof amount === "number" ? (
        <p className="text-[11px] font-semibold text-foreground">
          카드에 청구되는 금액: {formatAmount(getBilledAmount({ amount, taxRate }), currency)} (요금{" "}
          {formatAmount(amount, currency)} + 부가세 {taxRate}%)
        </p>
      ) : null}
    </div>
  );
}
