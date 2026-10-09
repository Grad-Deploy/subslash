"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@hooks/useAuth";
import { useAccountDeviceUsage } from "@hooks/useAccountDeviceUsage";
import { ANDROID_PACKAGES, USAGE_RETENTION_DAYS } from "@lib/device-usage";
import {
  canMeasureOnThisDevice,
  deleteAllDeviceUsage,
  hasUsageAccess,
  isMeasuringFor,
  openUsageAccessSettings,
  refreshDeviceUsageView,
  stopMeasuringThisDevice,
  uploadThisDevice,
  useDeviceUsage,
} from "@lib/device-usage-client";
import { Button } from "../ui/button";
import { InlineConfirm } from "../ui/inline-confirm";
import { Spinner } from "../ui/spinner";
import { useKnownText, useLocale, useServiceNames, useT } from "@lib/i18n";

const MEASURED_SERVICE_IDS = Object.keys(ANDROID_PACKAGES);

function shortDate(epochMs: number, locale: string): string {
  return new Date(epochMs).toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
    month: "long",
    day: "numeric",
  });
}

const errorText = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

/**
 * 여러 기기 사용 측정 설정(lib/device-usage). 켜기 전에 무엇을 어디로 보내는지 먼저 보여 준다 — 사용
 * 정보 접근은 Play 정책상 '눈에 띄는 안내'와 동의가 있어야 하는 권한이고, 앱은 권한 창을 띄울 수
 * 없어 설정 화면을 연다. 설정에서 허용하고 돌아오면 이어서 켠다.
 *
 * 잴 수 있는 곳은 안드로이드 앱뿐이다. 웹·iPhone에서도 이 카드는 보인다 — 계정에 모인 기기를 보고
 * 지울 곳이 있어야 한다.
 */
export function DeviceUsageCard({ onMessage }: { onMessage: (message: string) => void }) {
  const { account } = useAuth();
  const t = useT().deviceUsage;
  const known = useKnownText();
  const names = useServiceNames();
  const locale = useLocale();
  const accountId = account?.id ?? null;
  const measuring = useDeviceUsage((state) => isMeasuringFor(state, accountId));
  const otherAccountMeasuring = useDeviceUsage(
    (state) => state.enabled && state.accountId !== null && state.accountId !== accountId,
  );
  const thisDeviceKey = useDeviceUsage((state) => state.deviceKey);
  const { view, loading, error } = useAccountDeviceUsage();

  const [canMeasure, setCanMeasure] = useState<boolean | null>(null);
  const [access, setAccess] = useState<boolean | null>(null);
  const [waitingForAccess, setWaitingForAccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const can = await canMeasureOnThisDevice().catch(() => false);
      if (!alive) return;
      setCanMeasure(can);
      if (can) setAccess(await hasUsageAccess().catch(() => false));
    })();
    return () => {
      alive = false;
    };
  }, []);

  const turnOn = useCallback(async () => {
    if (!accountId) return;
    setBusy(true);
    setProblem(null);
    try {
      const granted = await hasUsageAccess();
      setAccess(granted);
      if (!granted) {
        setWaitingForAccess(true);
        await openUsageAccessSettings();
        return;
      }
      setWaitingForAccess(false);
      useDeviceUsage.getState().enableFor(accountId);
      await uploadThisDevice(accountId);
      await refreshDeviceUsageView(accountId, { force: true });
      onMessage(t.turnedOn);
    } catch (caught) {
      // 켠 것은 그대로 둔다. 올리기는 다음에 앱으로 돌아올 때 다시 한다.
      setProblem(errorText(caught, t.turnOnFailed));
    } finally {
      setBusy(false);
    }
  }, [accountId, onMessage, t]);

  // 설정 화면에서 돌아오면 허용했는지 다시 본다. 켜려던 중이었으면 이어서 켠다.
  useEffect(() => {
    if (!canMeasure) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void hasUsageAccess().then((granted) => {
        setAccess(granted);
        if (granted && waitingForAccess) void turnOn();
      });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [canMeasure, waitingForAccess, turnOn]);

  const turnOff = async () => {
    if (!accountId) return;
    setBusy(true);
    setProblem(null);
    try {
      await stopMeasuringThisDevice();
      await refreshDeviceUsageView(accountId, { force: true });
      onMessage(t.turnedOff);
    } catch (caught) {
      setProblem(errorText(caught, t.turnOffFailed));
    } finally {
      setBusy(false);
    }
  };

  const deleteAll = async () => {
    if (!accountId) return;
    setBusy(true);
    setProblem(null);
    try {
      await deleteAllDeviceUsage(accountId);
      setConfirmDeleteAll(false);
      await refreshDeviceUsageView(accountId, { force: true });
      onMessage(t.deletedAll);
    } catch (caught) {
      setProblem(errorText(caught, t.deleteFailed));
    } finally {
      setBusy(false);
    }
  };

  if (!accountId) return null;

  const devices = view?.devices ?? [];

  return (
    <div className="space-y-4 text-sm">
      <section className="space-y-2 rounded-xl bg-muted/40 p-3 leading-relaxed">
        <p className="font-bold">{t.howTitle}</p>
        <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
          <li>{t.howUpload}</li>
          <li>{t.howLink}</li>
          <li>{t.howLimits}</li>
          <li>
            {t.howRetention(USAGE_RETENTION_DAYS)}{" "}
            <Link href="/privacy#device-usage" className="underline underline-offset-2">
              {t.privacy}
            </Link>
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          {t.services(MEASURED_SERVICE_IDS.map(names.id).join(", "))}
        </p>
      </section>

      {canMeasure === null ? (
        <div className="flex justify-center py-2">
          <Spinner className="size-5" />
        </div>
      ) : canMeasure ? (
        <section className="space-y-2">
          {measuring ? (
            <>
              <p className="font-bold">{t.measuring}</p>
              {access === false && <p className="text-xs text-destructive">{t.accessOff}</p>}
              <div className="flex flex-wrap gap-2">
                {access === false && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={turnOn}>
                    {t.allowAccess}
                  </Button>
                )}
                <Button size="sm" variant="outline" disabled={busy} onClick={turnOff}>
                  {t.turnOff}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t.turnOffNote}</p>
            </>
          ) : (
            <>
              {otherAccountMeasuring && (
                <p className="text-xs text-muted-foreground">{t.otherAccount}</p>
              )}
              <Button disabled={busy} onClick={turnOn} className="w-full">
                {busy ? <Spinner className="size-4" /> : t.turnOn}
              </Button>
              {waitingForAccess && (
                <p className="text-xs text-muted-foreground">{t.waitingForAccess}</p>
              )}
            </>
          )}
        </section>
      ) : (
        <p className="rounded-xl border p-3 text-xs text-muted-foreground">{t.androidOnly}</p>
      )}

      <section className="space-y-2">
        <p className="font-bold">{t.devices}</p>
        {loading && !view ? (
          <Spinner className="size-4" />
        ) : error ? (
          <p className="text-xs text-destructive">{known(error)}</p>
        ) : devices.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t.noDevices}</p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {devices.map((device, index) => (
              <li
                key={device.deviceKey}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <span className="truncate">
                  {device.label ??
                    (device.deviceKey === thisDeviceKey
                      ? t.thisDevice
                      : t.androidDevice(index + 1))}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {shortDate(device.measuredFrom, locale)} ~{" "}
                  {shortDate(device.measuredUntil, locale)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {devices.length > 0 &&
          (confirmDeleteAll ? (
            <InlineConfirm
              message={t.deleteAllConfirm}
              confirmText={t.deleteAll}
              disabled={busy}
              onCancel={() => setConfirmDeleteAll(false)}
              onConfirm={deleteAll}
            />
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => setConfirmDeleteAll(true)}
            >
              {t.deleteAllButton}
            </Button>
          ))}
      </section>

      {problem && <p className="text-xs text-destructive">{known(problem)}</p>}
    </div>
  );
}
