"use client";

import React, { useMemo } from "react";
import {
  METRIC_SPECS,
  type Subscription,
  type ValueMetric,
  clampQuantity,
  calculateCostPerUse,
  formatUnitCost,
  getMyMonthlyShareAmount,
} from "@subslash/shared";
import { cn } from "@lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

/** 빠른 선택 버튼의 글자. 혜택은 '1만'처럼 줄인다. */
function presetLabel(metric: ValueMetric, value: number): string {
  if (metric === "benefit") {
    return value === 0 ? "0원" : value % 10000 === 0 ? `${value / 10000}만` : `${value / 1000}천`;
  }
  return `${value}${METRIC_SPECS[metric].unit}`;
}

/**
 * 횟수가 아닌 것으로 재는 구독의 체크인 입력(쓴 날·시간·혜택 금액·용량 %). 웹과 앱이 같이 쓴다. 횟수는
 * 예전 입력(웹의 ± 칸, 앱의 단계 막대)을 그대로 쓴다.
 *
 * 입력값은 지표의 범위(METRIC_SPECS.max)로 자른다 — 31일, 120%처럼 사실일 수 없는 값을 받지 않는다.
 * 질문 제목은 부르는 쪽이 그린다(checkInQuestion). 여기는 숫자·단가·설명·빠른 선택이다.
 */
export function MetricQuantityInput({
  subscription,
  metric,
  value,
  onChange,
}: {
  subscription: Subscription;
  metric: ValueMetric;
  value: number | null;
  onChange: (quantity: number) => void;
}) {
  const spec = METRIC_SPECS[metric];
  const quantity = value ?? 0;
  const step = metric === "benefit" ? 1000 : 1;
  const monthly = getMyMonthlyShareAmount(subscription);
  const unitCost =
    value === null
      ? null
      : formatUnitCost(
          metric,
          calculateCostPerUse(monthly, quantity),
          quantity,
          subscription.currency,
        );
  const set = (next: number) => onChange(clampQuantity(metric, next));
  // 45일이 지난 근거는 '최근 30일'이 아니게 되어 보이지 않는다.
  const openedAt = useMemo(() => new Date().getTime(), []);
  const evidence =
    subscription.orderEvidence &&
    openedAt - Date.parse(subscription.orderEvidence.checkedAt) < 45 * 24 * 60 * 60 * 1000
      ? subscription.orderEvidence
      : null;

  return (
    <div className="space-y-3">
      <div className="text-center" aria-live="polite">
        <p
          className={cn(
            "text-[40px] leading-tight font-black tracking-tight tabular-nums",
            value === null && "text-muted-foreground/50",
          )}
        >
          {metric === "benefit" ? quantity.toLocaleString("ko-KR") : quantity}
          <span className="ml-0.5 text-[15px] font-extrabold">{spec.unit}</span>
        </p>
        <p className="min-h-4 text-xs text-muted-foreground">
          {value === null ? "골라 주세요" : unitCost}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-xl text-lg font-bold"
          aria-label={`${step}${spec.unit} 빼기`}
          onClick={() => set(quantity - step)}
        >
          -
        </Button>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          max={spec.max}
          aria-label={spec.question}
          className="w-32 text-center text-xl font-black h-12 rounded-xl"
          value={value === null ? "" : quantity}
          onChange={(e) => set(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-xl text-lg font-bold"
          aria-label={`${step}${spec.unit} 더하기`}
          onClick={() => set(quantity + step)}
        >
          +
        </Button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {spec.presets.map((preset) => (
          <Button
            key={preset}
            type="button"
            variant={value === preset ? "default" : "outline"}
            size="sm"
            className="rounded-lg text-xs"
            onClick={() => set(preset)}
          >
            {presetLabel(metric, preset)}
          </Button>
        ))}
      </div>

      {spec.hint && (
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">{spec.hint}</p>
      )}

      {/* 멤버십: Gmail 가져오기에서 센 최근 주문 메일 수. 금액으로 바꾸지 않고 근거로만 보여 준다. */}
      {metric === "benefit" && evidence && (
        <p className="rounded-xl bg-secondary/60 px-3 py-2 text-center text-[11px] leading-relaxed">
          <b>
            Gmail에서 {evidence.since.slice(5).replace("-", "월 ")}일 이후 주문 메일{" "}
            {evidence.count}통
          </b>
          을 찾았어요. 가져온 메일 안에서 센 것이라 실제보다 적을 수 있어요. 그 주문에서 받은 무료
          배송·할인을 더해 주세요.
        </p>
      )}
    </div>
  );
}
