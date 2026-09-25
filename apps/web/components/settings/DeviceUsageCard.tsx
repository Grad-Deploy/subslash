"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { POPULAR_SERVICES } from "@subslash/shared";
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

const MEASURED_SERVICE_NAMES = Object.keys(ANDROID_PACKAGES).map(
  (id) => POPULAR_SERVICES.find((service) => service.id === id)?.name ?? id,
);

function shortDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
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
      onMessage("이 기기에서 사용 측정을 켰습니다.");
    } catch (caught) {
      // 켠 것은 그대로 둔다. 올리기는 다음에 앱으로 돌아올 때 다시 한다.
      setProblem(errorText(caught, "사용 측정을 켜지 못했습니다."));
    } finally {
      setBusy(false);
    }
  }, [accountId, onMessage]);

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
      onMessage("이 기기의 측정을 끄고 올린 기록을 지웠습니다.");
    } catch (caught) {
      setProblem(errorText(caught, "측정을 끄지 못했습니다."));
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
      onMessage("이 계정의 모든 기기 사용 기록을 지웠습니다.");
    } catch (caught) {
      setProblem(errorText(caught, "사용 기록을 지우지 못했습니다."));
    } finally {
      setBusy(false);
    }
  };

  if (!accountId) return null;

  const devices = view?.devices ?? [];

  return (
    <div className="space-y-4 text-sm">
      <section className="space-y-2 rounded-xl bg-muted/40 p-3 leading-relaxed">
        <p className="font-bold">켜면 이렇게 재요</p>
        <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
          <li>
            이 기기에서 아래 서비스의 앱이 화면 맨 앞에 있던 시작·끝 시각을 로그인한 계정에 올려요.
            다른 앱과 앱 안에서 본 콘텐츠는 올리지 않아요. (리포트의 &lsquo;이 폰&rsquo; 사용 기록은
            켜지 않아도 이 폰 안에만 있어요.)
          </li>
          <li>
            같은 계정의 기기끼리 이어서 세요. 휴대폰에서 보다가 30분 안에 태블릿에서 이어 보면
            1번이에요.
          </li>
          <li>
            TV·PC·iPhone에서 본 것과 화면을 끈 재생은 잴 수 없어서, 숫자는 &lsquo;측정한 기기에서
            최소 몇 번&rsquo;이에요. 체크인은 지금처럼 직접 해요.
          </li>
          <li>
            기록은 {USAGE_RETENTION_DAYS}일이 지나면 지워지고, 언제든 끄거나 지울 수 있어요.{" "}
            <Link href="/privacy#device-usage" className="underline underline-offset-2">
              개인정보처리방침
            </Link>
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          재는 서비스: {MEASURED_SERVICE_NAMES.join(", ")}
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
              <p className="font-bold">이 기기에서 재는 중</p>
              {access === false && (
                <p className="text-xs text-destructive">
                  기기 설정에서 &lsquo;사용 정보 접근&rsquo;이 꺼져 있어 지금은 재지 못해요. 다시
                  허용하면 이어서 재요.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {access === false && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={turnOn}>
                    사용 정보 접근 허용하기
                  </Button>
                )}
                <Button size="sm" variant="outline" disabled={busy} onClick={turnOff}>
                  이 기기 측정 끄기
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                끄면 이 기기가 올린 기록도 함께 지워요.
              </p>
            </>
          ) : (
            <>
              {otherAccountMeasuring && (
                <p className="text-xs text-muted-foreground">
                  이 기기는 다른 계정으로 재고 있었어요. 이 계정으로는 켜기 전까지 올리지 않아요.
                </p>
              )}
              <Button disabled={busy} onClick={turnOn} className="w-full">
                {busy ? <Spinner className="size-4" /> : "사용 측정 켜기"}
              </Button>
              {waitingForAccess && (
                <p className="text-xs text-muted-foreground">
                  기기 설정에서 SubSlash의 &lsquo;사용 정보 접근&rsquo;을 허용한 뒤 돌아오면 켜져요.
                </p>
              )}
            </>
          )}
        </section>
      ) : (
        <p className="rounded-xl border p-3 text-xs text-muted-foreground">
          측정은 안드로이드 앱에서만 켤 수 있어요. iPhone과 웹 브라우저는 다른 앱의 사용 시간을 알려
          주지 않아요. 여기서는 계정에 모인 기기를 보고 지울 수 있어요.
        </p>
      )}

      <section className="space-y-2">
        <p className="font-bold">측정한 기기</p>
        {loading && !view ? (
          <Spinner className="size-4" />
        ) : error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : devices.length === 0 ? (
          <p className="text-xs text-muted-foreground">아직 이 계정에 올린 기기가 없어요.</p>
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
                      ? "이 기기"
                      : `안드로이드 기기 ${index + 1}`)}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {shortDate(device.measuredFrom)} ~ {shortDate(device.measuredUntil)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {devices.length > 0 &&
          (confirmDeleteAll ? (
            <InlineConfirm
              message="이 계정에 모인 모든 기기의 사용 기록을 지울까요? 다른 기기는 측정이 켜진 채라, 그 기기에서 앱을 열면 그때부터 다시 올라와요."
              confirmText="모두 지우기"
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
              모든 기기 기록 지우기
            </Button>
          ))}
      </section>

      {problem && <p className="text-xs text-destructive">{problem}</p>}
    </div>
  );
}
