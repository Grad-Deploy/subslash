import React from "react";
import type { SubscriptionFormData } from "@subslash/shared";
import { Input } from "../../ui/input";
import { Select } from "../../ui/select";
import { useLocale, useT } from "@lib/i18n";
import { paymentMethodOptions } from "@lib/payment-method";
import { FIELD_LABEL } from "./fieldLabel";

/**
 * '자세히 입력' 아래의 가입한 계정·결제 수단. 가입한 계정(이메일·아이디)은 해지할 때 '이 계정으로 로그인해야
 * 해지 버튼이 보여요'로 쓴다.
 */
export function AccountPaymentFields({
  idPrefix,
  account,
  onAccountChange,
  paymentMethod,
  onChange,
}: {
  idPrefix: string;
  account: string;
  onAccountChange: (account: string) => void;
  paymentMethod: SubscriptionFormData["paymentMethod"] | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  const f = useT().form.account;
  const locale = useLocale();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-account`} className={FIELD_LABEL}>
          {f.label}
        </label>
        <Input
          id={`${idPrefix}-account`}
          name="linkedAccountName"
          value={account}
          onChange={(e) => onAccountChange(e.target.value)}
          placeholder={f.placeholder}
          autoComplete="off"
          maxLength={120}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-payment`} className={FIELD_LABEL}>
          {f.payment}
        </label>
        <Select
          id={`${idPrefix}-payment`}
          name="paymentMethod"
          value={paymentMethod || "credit_card"}
          onChange={onChange}
        >
          {paymentMethodOptions(locale).map((pm) => (
            <option key={pm.value} value={pm.value}>
              {pm.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
