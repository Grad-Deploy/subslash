"use client";

import React, { useSyncExternalStore } from "react";
import { oauthErrorMessage } from "@lib/oauth-messages";

const subscribe = () => () => {};
const readError = () =>
  oauthErrorMessage(new URLSearchParams(window.location.search).get("oauthError"));

/** 앱 소셜 로그인의 끝 화면 내용. 실패했으면 이유를, 아니면 창을 닫으라고 말한다. */
export function OAuthDone() {
  const error = useSyncExternalStore(subscribe, readError, () => null);
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-6 text-center" role="status">
      <p className="text-lg font-black">{error ? "로그인하지 못했어요" : "로그인했어요"}</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-sm text-muted-foreground">이 창을 닫으면 SubSlash 앱으로 돌아갑니다.</p>
    </div>
  );
}
