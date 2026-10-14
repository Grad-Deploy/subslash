"use client";

import React from "react";
import {
  findPresetForSubscription,
  metricForSubscription,
  type ServiceUsageSummary,
  type Subscription,
} from "@subslash/shared";
import { useAccountDeviceUsage } from "@hooks/useAccountDeviceUsage";
import { isMeasurableService } from "@lib/device-usage";
import type { DeviceUsageView } from "@lib/device-usage-server";
import { useT, type Messages } from "@lib/i18n";
import { formatDurationText } from "@lib/i18n/duration";

/** 이 구독을 잴 수 있으면 서비스 id. 앱으로 쓰지 않는 구독(멤버십 등)은 재지 않는다. */
function measurableServiceId(sub: Subscription): string | null {
  const id = findPresetForSubscription(sub)?.id;
  return id && isMeasurableService(id) ? id : null;
}

/**
 * 측정한 기기가 있으면 이 서비스의 요약. 측정한 기기가 있는데 요약에 없으면 그 기간에 세션이 없었던
 * 것이라 0회다. 측정한 기기가 없으면 null — 모르는 것을 0회로 읽지 않는다.
 */
function usageFor(view: DeviceUsageView, serviceId: string): ServiceUsageSummary | null {
  if (view.summary.measuredDeviceCount === 0) return null;
  return (
    view.summary.services.find((service) => service.serviceId === serviceId) ?? {
      serviceId,
      sessionCount: 0,
      activeMinutes: 0,
      handoffCount: 0,
      deviceCount: 0,
    }
  );
}

/**
 * AI 서비스인지. 측정은 안드로이드 앱이 화면에 떠 있던 것만 재는데, AI 구독은 PC·웹에서 많이 써서 'TV·PC에서 본 것'이
 * 아니라 PC·웹에서 쓴 것이 빠졌다고 말해야 한다 — PC 기록으로 30일 중 30일 쓴 구독 옆에 '0번'만 있으면 둘 중 하나가
 * 틀린 숫자로 읽힌다.
 */
function isAiService(sub: Subscription): boolean {
  return findPresetForSubscription(sub)?.category === "ai";
}

/**
 * 시간으로 재는 구독(유튜브 프리미엄·음악·독서, utils/valueMetric)은 시간을 앞에 둔다. 체크인이 시간을
 * 묻는데 여기서만 '번'으로 말하면 같은 리포트에 두 단위가 섞인다.
 */
function byHours(sub: Subscription): boolean {
  return metricForSubscription(sub) === "hours";
}

/** '최소 3시간 20분'·'최소 12번'과 작은 글자의 다른 단위. */
function usageTexts(t: Messages, sub: Subscription, usage: ServiceUsageSummary) {
  const m = t.measured;
  const time = formatDurationText(t, usage.activeMinutes * 60_000);
  const count = m.count(usage.sessionCount);
  return byHours(sub)
    ? { main: m.atLeast(time), sub: count, zero: m.zeroTime }
    : { main: m.atLeast(count), sub: time, zero: m.zeroCount };
}

/** 구독 상세의 한 줄. 잴 수 있는 구독이고 측정한 기기가 있을 때만 보인다. */
export function MeasuredUsageLine({ sub }: { sub: Subscription }) {
  const t = useT();
  const m = t.measured;
  const { available, view } = useAccountDeviceUsage();
  const serviceId = measurableServiceId(sub);
  if (!available || !view || !serviceId) return null;
  const usage = usageFor(view, serviceId);
  if (!usage) return null;
  const text = usageTexts(t, sub, usage);

  return (
    <div className="space-y-1 rounded-xl border p-3 text-sm">
      <p>
        {m.lineBefore}
        <b className="tabular-nums">
          {usage.sessionCount === 0 ? text.zero : `${text.main} · ${text.sub}`}
        </b>
      </p>
      <p className="text-xs text-muted-foreground">
        {m.lineDevices(view.summary.measuredDeviceCount)}
        {usage.handoffCount > 0 && m.lineHandoff(usage.handoffCount)}
        {isAiService(sub) ? m.lineAfterPc : m.lineAfter}
      </p>
      {usage.sessionCount === 0 && <p className="text-xs text-muted-foreground">{m.zeroWhy}</p>}
      {view.summary.partial && <p className="text-xs text-muted-foreground">{m.partial}</p>}
    </div>
  );
}
