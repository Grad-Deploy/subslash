import React from "react";
import type { ServicePreset, SubscriptionFormData } from "@subslash/shared";
import { Input } from "../../ui/input";
import { Select } from "../../ui/select";
import { FIELD_LABEL } from "./fieldLabel";

/** 결제일 칸 아래의 빠른 선택. 결제 문자를 보고 바로 등록하는 사람이 많다. */
const PAID_ON_CHOICES = [
  { label: "오늘 결제했어요", daysAgo: 0 },
  { label: "어제", daysAgo: 1 },
] as const;

/**
 * 결제일·주기, 연간이면 결제 월, 무료 체험 종료일. 결제일·결제 월은 미리 채우지 않는다 — 손대지 않은 사람의
 * D-day가 지어낸 날짜로 계산된다. '오늘 결제했어요'·'어제'는 사용자가 고른 날이라 채운다(`onPaidOn`).
 */
export function BillingFields({
  idPrefix,
  formData,
  preset,
  onChange,
  onPaidOn,
}: {
  idPrefix: string;
  formData: Partial<SubscriptionFormData>;
  preset: ServicePreset | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onPaidOn: (date: Date) => void;
}) {
  const cycle = formData.billingCycle ?? "monthly";
  const plans = preset?.plans ?? [];
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor={`${idPrefix}-day`} className={FIELD_LABEL}>
            결제일 (1-31)
          </label>
          <Input
            id={`${idPrefix}-day`}
            type="number"
            min="1"
            max="31"
            name="billingDay"
            placeholder="예: 15"
            value={formData.billingDay ?? ""}
            onChange={onChange}
            required
          />
          <div className="flex flex-wrap gap-1.5">
            {PAID_ON_CHOICES.map(({ label, daysAgo }) => {
              const date = new Date();
              date.setDate(date.getDate() - daysAgo);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onPaidOn(date)}
                  className="rounded-full border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:bg-secondary"
                >
                  {label}({date.getDate()}일)
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${idPrefix}-cycle`} className={FIELD_LABEL}>
            주기
          </label>
          <Select
            id={`${idPrefix}-cycle`}
            name="billingCycle"
            value={formData.billingCycle || "monthly"}
            onChange={onChange}
          >
            <option value="monthly">매월 결제</option>
            <option value="yearly">매년 결제</option>
          </Select>
        </div>
      </div>

      {/* 연간 구독은 결제 월도 있어야 다음 결제일을 셀 수 있다. */}
      {cycle === "yearly" && (
        <div className="space-y-1.5">
          <label htmlFor={`${idPrefix}-month`} className={FIELD_LABEL}>
            결제 월
          </label>
          <Select
            id={`${idPrefix}-month`}
            name="billingMonth"
            value={String(formData.billingMonth ?? "")}
            onChange={onChange}
          >
            <option value="">선택해주세요</option>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
              <option key={month} value={String(month)}>
                {month}월
              </option>
            ))}
          </Select>
          <p className="text-[11px] text-muted-foreground">
            결제 월을 넣어야 D-day·알림·캘린더가 맞아요.
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-trial`} className={FIELD_LABEL}>
          무료 체험 종료일 <span className="font-normal text-muted-foreground">(선택)</span>
        </label>
        <Input
          id={`${idPrefix}-trial`}
          type="date"
          name="trialEndsAt"
          value={formData.trialEndsAt ?? ""}
          onChange={onChange}
        />
        <p className="text-[11px] text-muted-foreground break-keep">
          유료로 바뀌는 날이에요. 그전까지는 지출에서 빼고, 끝나기 전에 알려 드려요. 모르면 비워
          두세요(지금 결제 중으로 봐요).
        </p>
      </div>

      {cycle === "yearly" && preset && !formData.planId && (
        <p className="text-[11px] text-muted-foreground break-keep">
          {plans.length > 0 ? `${preset.nameKo}의 연 요금은 목록에 없어요. ` : ""}
          1년치 결제액을 적어 주세요(월 요금 × 12와 다를 수 있어요).
        </p>
      )}
    </>
  );
}
