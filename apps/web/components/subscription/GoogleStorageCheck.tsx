"use client";

import React, { useEffect, useRef, useState } from "react";
import { Gauge } from "lucide-react";
import type { Subscription } from "@subslash/shared";
import { IS_APP_BUILD } from "@lib/platform";
import { appReturnScheme, leaveForExternal, openExternal } from "@lib/native";
import { webUrl } from "@lib/api";
import {
  STORAGE_QUOTA_RESULT_KEY,
  canCheckGoogleStorage,
  newMeasureState,
  parseStorageQuotaResult,
  storageCheckInFrom,
  storageQuotaCheckUrl,
  storageQuotaWebAppUrl,
  type StorageQuotaResult,
} from "@lib/storage-quota";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

type Sub = Pick<Subscription, "name" | "cancelUrl" | "planId" | "sharingCount">;

/**
 * 구글 원 저장 공간 체크인의 '사용량 측정'. Google 계정 용량을 읽는 웹 앱(lib/storage-quota)을 열고, 돌아온
 * 값으로 체크인 칸을 채운다(`onMeasured`). 채우지 않는 경우에는 그 이유를 적는다. 웹 앱 주소가 정해지지
 * 않았거나 구글 원이 아니면 그리지 않는다.
 */
export function GoogleStorageCheck({
  subscription,
  onMeasured,
}: {
  subscription: Sub;
  onMeasured: (quantity: number) => void;
}) {
  const base = storageQuotaWebAppUrl();
  const [waiting, setWaiting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // 이번에 누른 측정. 다른 측정(예전 탭)의 값은 받지 않는다.
  const stateRef = useRef<string | null>(null);
  const latest = useRef({ subscription, onMeasured });
  useEffect(() => {
    latest.current = { subscription, onMeasured };
  });

  const apply = (result: StorageQuotaResult | null) => {
    if (!result || result.state !== stateRef.current) return;
    stateRef.current = null;
    setWaiting(false);
    const checkIn = storageCheckInFrom(latest.current.subscription, result);
    setMessage(checkIn.message);
    if (checkIn.quantity !== null) latest.current.onMeasured(checkIn.quantity);
  };
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  });

  // 웹: 새 탭의 끝 화면(/storage-quota/done)이 남긴 값을 받는다.
  useEffect(() => {
    if (IS_APP_BUILD) return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_QUOTA_RESULT_KEY || !event.newValue) return;
      try {
        const stored = JSON.parse(event.newValue) as Record<string, unknown>;
        const params = new URLSearchParams({ flow: "storage" });
        for (const key of ["state", "usage", "limit"] as const) {
          if (stored[key] !== null && stored[key] !== undefined)
            params.set(key, String(stored[key]));
        }
        if (stored.ok === false) params.set("error", "1");
        applyRef.current(parseStorageQuotaResult(params));
      } catch {
        return;
      } finally {
        try {
          window.localStorage.removeItem(STORAGE_QUOTA_RESULT_KEY);
        } catch {
          // 지우지 못해도 다음 측정은 state가 달라 섞이지 않는다.
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!base || !canCheckGoogleStorage(subscription)) return null;

  const measure = async () => {
    const state = newMeasureState();
    stateRef.current = state;
    setMessage(null);
    setWaiting(true);
    if (IS_APP_BUILD) {
      const scheme = await appReturnScheme();
      leaveForExternal(storageQuotaCheckUrl(base, { state, scheme }), (result) => {
        if (stateRef.current !== state) return;
        const parsed = parseStorageQuotaResult(result);
        if (parsed) return apply(parsed);
        // 값 없이 창을 닫았다(예전 앱이라 돌아올 주소가 없거나, 측정 전에 닫음).
        stateRef.current = null;
        setWaiting(false);
        setMessage("측정값을 받지 못했어요. 웹 앱 화면의 비율을 직접 적거나 다시 측정해 주세요.");
      });
      return;
    }
    openExternal(storageQuotaCheckUrl(base, { state, origin: webUrl("/").replace(/\/$/, "") }));
  };

  return (
    <div className="space-y-1.5 rounded-xl bg-secondary/60 px-3 py-2.5 text-center">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-lg text-xs"
        onClick={() => void measure()}
      >
        {waiting ? (
          <Spinner className="mr-1 h-3.5 w-3.5" />
        ) : (
          <Gauge className="mr-1 h-3.5 w-3.5" aria-hidden />
        )}
        Google 계정에서 사용량 측정
      </Button>
      <p className="text-[11px] leading-relaxed text-muted-foreground" aria-live="polite">
        {message ??
          (waiting
            ? "열린 화면에서 Google 권한을 허용하면 비율을 채워요."
            : "Google 계정의 저장 용량을 읽어 비율을 채워요. 숫자는 SubSlash 서버로 보내지 않아요.")}
      </p>
    </div>
  );
}
