"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import type { Subscription } from "@subslash/shared";
import { IS_APP_BUILD } from "@lib/platform";
import { openExternal } from "@lib/native";
import {
  canCheckGoogleStorage,
  storageQuotaCheckUrl,
  storageQuotaWebAppUrl,
} from "@lib/storage-quota";
import { Button } from "../ui/button";

/**
 * 구글 원 저장 공간 체크인: Google 계정 용량을 보여 주는 웹 앱(lib/storage-quota)을 연다. 값은 받아 오지
 * 않는다 — 사용자가 본 비율을 적는다. 웹 앱 주소가 정해지지 않았거나 구글 원이 아니면 그리지 않는다.
 */
export function GoogleStorageCheck({
  subscription,
}: {
  subscription: Pick<Subscription, "name" | "cancelUrl">;
}) {
  const base = storageQuotaWebAppUrl();
  if (!base || !canCheckGoogleStorage(subscription)) return null;

  return (
    <div className="space-y-1.5 rounded-xl bg-secondary/60 px-3 py-2.5 text-center">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-lg text-xs"
        onClick={() => openExternal(storageQuotaCheckUrl(base, IS_APP_BUILD))}
      >
        Google 계정에서 확인
        <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden />
      </Button>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Google 계정의 저장 용량을 읽어 보여 주는 화면이 열려요. 나온 비율을 여기에 적어 주세요.
        숫자는 SubSlash로 보내지 않아요. 가족 요금제나 회사 계정이면 한도가 내 요금제와 다를 수
        있어요.
      </p>
    </div>
  );
}
