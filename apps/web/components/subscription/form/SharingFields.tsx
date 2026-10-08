"use client";

import type React from "react";
import {
  SubscriptionFormData,
  formatAmount,
  getBilledAmount,
  getMyShareAmount,
  getSharingCount,
} from "@subslash/shared";
import { Input } from "../../ui/input";
import { Select } from "../../ui/select";
import { useT } from "@lib/i18n";
import { FIELD_LABEL } from "./fieldLabel";

/**
 * 함께 쓰는 인원과 내 부담금. 4명이 나누는 구독을 해지해도 아끼는 돈은 4분의 1이라, 지출·절약은
 * 여기서 정한 내 몫으로 계산한다.
 */
export function SharingFields({
  idPrefix,
  formData,
  onChange,
}: {
  idPrefix: string;
  formData: Pick<
    Partial<SubscriptionFormData>,
    "amount" | "taxRate" | "currency" | "sharingCount" | "myShareAmount"
  >;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}) {
  const f = useT().form.sharing;
  const sharing = (formData.sharingCount ?? 1) > 1;
  const billed =
    typeof formData.amount === "number"
      ? getBilledAmount({ amount: formData.amount, taxRate: formData.taxRate })
      : 0;

  return (
    <div className="space-y-2 rounded-xl border border-border/80 bg-muted/30 p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor={`${idPrefix}-sharing`} className={FIELD_LABEL}>
            {f.people}
          </label>
          <Select
            id={`${idPrefix}-sharing`}
            name="sharingCount"
            value={String(formData.sharingCount ?? 1)}
            onChange={onChange}
          >
            <option value="1">{f.alone}</option>
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={String(n)}>
                {f.by(n)}
              </option>
            ))}
          </Select>
        </div>

        {sharing && (
          <div className="space-y-1.5">
            <label htmlFor={`${idPrefix}-share`} className={FIELD_LABEL}>
              {f.myShare} <span className="font-normal text-muted-foreground">{f.optional}</span>
            </label>
            <Input
              id={`${idPrefix}-share`}
              type="number"
              name="myShareAmount"
              min="0"
              step="any"
              placeholder={String(
                Math.round(
                  billed /
                    getSharingCount({
                      amount: formData.amount ?? 0,
                      sharingCount: formData.sharingCount,
                    }),
                ),
              )}
              value={formData.myShareAmount ?? ""}
              onChange={onChange}
            />
          </div>
        )}
      </div>

      {sharing && (
        <p className="text-[11px] text-muted-foreground">
          {f.shareBefore}
          <strong className="text-foreground">
            {formatAmount(
              getMyShareAmount({
                amount: formData.amount ?? 0,
                sharingCount: formData.sharingCount,
                myShareAmount: formData.myShareAmount,
                taxRate: formData.taxRate,
              }),
              formData.currency || "KRW",
            )}
          </strong>
          {f.shareAfter}
        </p>
      )}
    </div>
  );
}
