import React from "react";
import type { SubscriptionFormData } from "@subslash/shared";
import { Input } from "../../ui/input";
import { Select } from "../../ui/select";
import { useT } from "@lib/i18n";
import { FIELD_LABEL } from "./fieldLabel";

/** 결제 금액과 통화. 이름표는 주기와 세금 여부를 따라 바뀐다. */
export function AmountFields({
  idPrefix,
  formData,
  onChange,
}: {
  idPrefix: string;
  formData: Partial<SubscriptionFormData>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  const f = useT().form.amount;
  const yearly = (formData.billingCycle ?? "monthly") === "yearly";
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        {/* 연간 구독에 '월 결제 금액'이라고 물으면 월 환산액을 적게 되고, 앱이 그걸 다시 12로 나눈다. */}
        <label htmlFor={`${idPrefix}-amount`} className={FIELD_LABEL}>
          {formData.taxRate
            ? yearly
              ? f.yearlyExTax
              : f.monthlyExTax
            : yearly
              ? f.yearly
              : f.monthly}
        </label>
        {/* step="any": 없으면 브라우저가 $9.99 같은 소수 금액을 입력 오류로 막는다. */}
        <Input
          id={`${idPrefix}-amount`}
          type="number"
          name="amount"
          min="0"
          step="any"
          placeholder={f.placeholder}
          value={formData.amount ?? ""}
          onChange={onChange}
          required
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-currency`} className={FIELD_LABEL}>
          {f.currency}
        </label>
        <Select
          id={`${idPrefix}-currency`}
          name="currency"
          value={formData.currency || "KRW"}
          onChange={onChange}
        >
          <option value="KRW">KRW (₩)</option>
          <option value="USD">USD ($)</option>
        </Select>
      </div>
    </div>
  );
}
