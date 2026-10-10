"use client";

import React, { useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import {
  METRIC_SPECS,
  type Subscription,
  type ValueMetric,
  clampQuantity,
  calculateCostPerUse,
  getMyMonthlyShareAmount,
  storagePlanFit,
  asksFreeTier,
} from "@subslash/shared";
import { cn } from "@lib/utils";
import { IS_APP_BUILD } from "@lib/platform";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useServiceNames, useT } from "@lib/i18n";
import { unitCostText } from "@lib/i18n/check-in-text";
import { unitCostPart } from "@subslash/shared";
import { FreeTierQuestion } from "./FreeTierQuestion";
import { GoogleStorageCheck } from "./GoogleStorageCheck";

// 폰 기록 한 줄(안드로이드 앱 전용). 웹 번들에 들어가지 않게 앱 빌드에서만 불러온다.
const AppPhoneMetricHint = IS_APP_BUILD
  ? dynamic(() => import("../usage/app/AppPhoneMetricHint").then((m) => m.AppPhoneMetricHint), {
      ssr: false,
    })
  : null;

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
  const t = useT();
  const names = useServiceNames();
  const c = t.checkin;
  const text = c.metric[metric];
  /** 빠른 선택 버튼의 글자. 혜택은 '1만'처럼 줄인다. */
  const presetLabel = (preset: number) =>
    metric === "benefit" ? c.input.presetBenefit(preset) : c.input.presetLabel(preset, text.unit);
  const quantity = value ?? 0;
  const step = metric === "benefit" ? 1000 : 1;
  const monthly = getMyMonthlyShareAmount(subscription);
  const unitCost =
    value === null
      ? null
      : unitCostText(
          t,
          unitCostPart(metric, calculateCostPerUse(monthly, quantity), quantity),
          subscription.currency,
        );
  // 저장 공간: 요금제를 알면 비율을 용량으로 바꿔 옆에 보여 준다. 설정 화면에는 GB로 나오기 때문이다.
  const storageFit = metric === "storage" ? storagePlanFit(subscription, quantity) : null;
  const storageLine = storageFit
    ? c.input.storageOf(names.plan(storageFit.planName), c.input.storageGB(storageFit.usedGB))
    : null;
  // 사용자가 손댄 뒤에는 폰 기록으로 덮지 않는다.
  const touched = useRef(false);
  const set = (next: number) => {
    touched.current = true;
    onChange(clampQuantity(metric, next));
  };
  // 폰 기록(리포트와 같은 계산)이 오면 한 번만 미리 채운다. 비어 있거나 0일 때만, 0시간은 채우지 않는다.
  const prefilled = useRef(false);
  const handleMeasured = useCallback(
    (measured: number | null) => {
      if (prefilled.current || touched.current || !measured) return;
      if (value !== null && value !== 0) return;
      prefilled.current = true;
      onChange(clampQuantity(metric, measured));
    },
    [value, onChange, metric],
  );
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
          {metric === "benefit" ? quantity.toLocaleString(c.input.benefitNumberLocale) : quantity}
          <span className="ml-0.5 text-[15px] font-extrabold">
            {c.input.unitFor(quantity, text.unit)}
          </span>
        </p>
        <p className="min-h-4 text-xs text-muted-foreground">
          {value === null ? c.input.choose : (unitCost ?? storageLine)}
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-xl text-lg font-bold"
          aria-label={c.input.decrease(step, text.unit)}
          onClick={() => set(quantity - step)}
        >
          -
        </Button>
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          max={spec.max}
          aria-label={text.question}
          className="w-32 text-center text-xl font-black h-12 rounded-xl"
          value={value === null ? "" : quantity}
          onChange={(e) => set(Number(e.target.value.replace(/[^0-9]/g, "")) || 0)}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 rounded-xl text-lg font-bold"
          aria-label={c.input.increase(step, text.unit)}
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
            {presetLabel(preset)}
          </Button>
        ))}
      </div>

      {text.hint && (
        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">{text.hint}</p>
      )}

      {metric === "storage" && <GoogleStorageCheck subscription={subscription} onMeasured={set} />}

      {/* 무료 요금제가 있는 AI·업무 도구는 쓴 날만으로 판단하지 않는다. */}
      {metric === "days" && asksFreeTier(subscription) && (
        <FreeTierQuestion subscriptionId={subscription.id} />
      )}

      {AppPhoneMetricHint && (metric === "days" || metric === "hours") && (
        <AppPhoneMetricHint
          subscription={subscription}
          metric={metric}
          onMeasured={handleMeasured}
        />
      )}

      {/* 멤버십: Gmail 가져오기에서 센 최근 주문 메일 수. 금액으로 바꾸지 않고 근거로만 보여 준다. */}
      {metric === "benefit" && evidence && (
        <p className="rounded-xl bg-secondary/60 px-3 py-2 text-center text-[11px] leading-relaxed">
          <b>
            {c.input.orderEvidence(
              c.input.sinceDate(
                Number(evidence.since.slice(5, 7)),
                Number(evidence.since.slice(8, 10)),
              ),
              evidence.count,
            )}
          </b>
          {c.input.orderEvidenceNote}
        </p>
      )}
    </div>
  );
}
