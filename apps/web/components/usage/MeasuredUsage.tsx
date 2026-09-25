"use client";

import React from "react";
import Link from "next/link";
import {
  findPresetForSubscription,
  type ServiceUsageSummary,
  type Subscription,
} from "@subslash/shared";
import { useAccountDeviceUsage } from "@hooks/useAccountDeviceUsage";
import { isMeasurableService } from "@lib/device-usage";
import { IS_APP_BUILD } from "@lib/platform";
import type { DeviceUsageView } from "@lib/device-usage-server";

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

function minutesText(minutes: number): string {
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}시간` : `${hours}시간 ${rest}분`;
}

function PartialNote({ view }: { view: DeviceUsageView }) {
  if (!view.summary.partial) return null;
  return (
    <p className="text-xs text-muted-foreground">
      30일을 다 잰 기기가 아직 없어서, 잰 기간만의 숫자예요.
    </p>
  );
}

/**
 * 리포트의 '측정한 기기에서' 칸. 체크인 순위를 바꾸지 않고 옆에 놓는다 — 측정은 잴 수 있는 기기에서의
 * 최소치라, 체크인(사용자가 센 횟수)을 대신하지 않는다.
 */
export function MeasuredUsageSection({ subscriptions }: { subscriptions: Subscription[] }) {
  const { available, view, error } = useAccountDeviceUsage();
  if (!available) return null;

  if (error) {
    return (
      <section className="rounded-2xl border p-4 text-xs text-muted-foreground">
        측정한 사용 기록을 불러오지 못했어요. {error}
      </section>
    );
  }
  if (!view) return null;

  if (view.summary.measuredDeviceCount === 0) {
    // 켤 수 있는 곳은 앱뿐이라, 웹에서는 켜라고 말하지 않는다.
    if (!IS_APP_BUILD) return null;
    return (
      <section className="space-y-1 rounded-2xl border p-4 text-sm">
        <p className="font-bold">기기를 오가며 쓴 횟수</p>
        <p className="text-xs text-muted-foreground">
          <Link href="/subs" className="underline underline-offset-2">
            내 구독
          </Link>{" "}
          아래 &lsquo;여러 기기 사용 측정&rsquo;을 켜면, 휴대폰과 태블릿에서 쓴 횟수를 이어서 세
          드려요.
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
  rows.sort((a, b) => b.usage.sessionCount - a.usage.sessionCount);

  return (
    <section className="space-y-3">
      <div className="space-y-0.5">
        <h2 className="text-base font-bold">모든 기기 합쳐서 쓴 횟수</h2>
        <p className="text-xs text-muted-foreground">
          최근 30일 · 기기 {view.summary.measuredDeviceCount}대 · 30분 안에 이어 쓰면 기기가 달라도
          1번
        </p>
      </div>
      <ul className="divide-y rounded-2xl border">
        {rows.map(({ sub, usage }) => (
          <li key={sub.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-semibold">{sub.name}</p>
              {usage.handoffCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  기기를 바꿔 이어 쓴 {usage.handoffCount}번은 한 번으로 셌어요
                </p>
              )}
            </div>
            <div className="shrink-0 text-right">
              {usage.sessionCount === 0 ? (
                <p className="text-xs text-muted-foreground">측정한 기기에선 0번</p>
              ) : (
                <>
                  <p className="font-bold tabular-nums">최소 {usage.sessionCount}번</p>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    {minutesText(usage.activeMinutes)}
                  </p>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      <PartialNote view={view} />
      <p className="text-xs text-muted-foreground">
        TV·PC·iPhone에서 본 것은 들어 있지 않아요. 1회 단가는 체크인한 횟수로 계산해요.
        {IS_APP_BUILD &&
          " 위의 '이 폰' 숫자와 다를 수 있어요 — 휴대폰과 태블릿을 오가며 이어 쓴 것은 한 번으로 세요."}
      </p>
    </section>
  );
}

/** 구독 상세의 한 줄. 잴 수 있는 구독이고 측정한 기기가 있을 때만 보인다. */
export function MeasuredUsageLine({ sub }: { sub: Subscription }) {
  const { available, view } = useAccountDeviceUsage();
  const serviceId = measurableServiceId(sub);
  if (!available || !view || !serviceId) return null;
  const usage = usageFor(view, serviceId);
  if (!usage) return null;

  return (
    <div className="space-y-1 rounded-xl border p-3 text-sm">
      <p>
        측정한 기기에서 최근 30일{" "}
        <b className="tabular-nums">
          {usage.sessionCount === 0
            ? "0번"
            : `최소 ${usage.sessionCount}번 · ${minutesText(usage.activeMinutes)}`}
        </b>
      </p>
      <p className="text-xs text-muted-foreground">
        기기 {view.summary.measuredDeviceCount}대를 이어서 셌어요
        {usage.handoffCount > 0 && ` (기기를 바꿔 이어 쓴 ${usage.handoffCount}번 포함)`}. TV·PC에서
        본 것은 없어서 체크인할 때 더해 주세요.
      </p>
      <PartialNote view={view} />
    </div>
  );
}
