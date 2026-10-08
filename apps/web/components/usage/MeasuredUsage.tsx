"use client";

import React from "react";
import Link from "next/link";
import {
  findPresetForSubscription,
  metricForSubscription,
  type ServiceUsageSummary,
  type Subscription,
} from "@subslash/shared";
import { useAccountDeviceUsage } from "@hooks/useAccountDeviceUsage";
import { isMeasurableService } from "@lib/device-usage";
import { IS_APP_BUILD } from "@lib/platform";
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

function PartialNote({ view }: { view: DeviceUsageView }) {
  const t = useT();
  if (!view.summary.partial) return null;
  return <p className="text-xs text-muted-foreground">{t.measured.partial}</p>;
}

/**
 * 리포트의 '측정한 기기에서' 칸. 체크인 순위를 바꾸지 않고 옆에 놓는다 — 측정은 잴 수 있는 기기에서의
 * 최소치라, 체크인(사용자가 센 횟수)을 대신하지 않는다.
 */
export function MeasuredUsageSection({ subscriptions }: { subscriptions: Subscription[] }) {
  const t = useT();
  const m = t.measured;
  const { available, view, error } = useAccountDeviceUsage();
  if (!available) return null;

  if (error) {
    return (
      <section className="rounded-2xl border p-4 text-xs text-muted-foreground">
        {m.loadFailed(error)}
      </section>
    );
  }
  if (!view) return null;

  if (view.summary.measuredDeviceCount === 0) {
    // 켤 수 있는 곳은 앱뿐이라, 웹에서는 켜라고 말하지 않는다.
    if (!IS_APP_BUILD) return null;
    return (
      <section className="space-y-1 rounded-2xl border p-4 text-sm">
        <p className="font-bold">{m.offTitle}</p>
        <p className="text-xs text-muted-foreground">
          <Link href="/subs" className="underline underline-offset-2">
            {m.offLink}
          </Link>
          {m.offAfter}
        </p>
      </section>
    );
  }

  const rows = subscriptions.flatMap((sub) => {
    const serviceId = measurableServiceId(sub);
    const usage = serviceId ? usageFor(view, serviceId) : null;
    return usage ? [{ sub, usage }] : [];
  });
  if (rows.length === 0) return null;
  // 단위가 다른 줄이 섞이므로 모두 가진 쓴 시간으로 줄 세운다.
  rows.sort((a, b) => b.usage.activeMinutes - a.usage.activeMinutes);
  const anyHours = rows.some(({ sub }) => byHours(sub));

  return (
    <section className="space-y-3">
      <div className="space-y-0.5">
        <h2 className="text-base font-bold">{anyHours ? m.titleAmount : m.titleCount}</h2>
        <p className="text-xs text-muted-foreground">
          {m.subtitle(view.summary.measuredDeviceCount)}
        </p>
      </div>
      <ul className="divide-y rounded-2xl border">
        {rows.map(({ sub, usage }) => {
          const text = usageTexts(t, sub, usage);
          return (
            <li key={sub.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-semibold">{sub.name}</p>
                {usage.handoffCount > 0 && (
                  <p className="text-xs text-muted-foreground">{m.handoff(usage.handoffCount)}</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                {usage.sessionCount === 0 ? (
                  <p className="text-xs text-muted-foreground">{m.zeroOn(text.zero)}</p>
                ) : (
                  <>
                    <p className="font-bold tabular-nums">{text.main}</p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">{text.sub}</p>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <PartialNote view={view} />
      <p className="text-xs text-muted-foreground">
        {m.notIncluded}
        {anyHours && m.screenOff}
        {m.unitCost}
        {IS_APP_BUILD && m.differs}
      </p>
    </section>
  );
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
        {m.lineAfter}
      </p>
      <PartialNote view={view} />
    </div>
  );
}
