"use client";

import React, { useSyncExternalStore } from "react";
import { oauthErrorMessageFrom } from "@lib/oauth-messages";

const LINKED_LABEL: Record<string, string> = { google: "구글", kakao: "카카오", naver: "네이버" };

const subscribe = () => () => {};
const readSearch = () => window.location.search;

/**
 * 앱 소셜 로그인의 끝 화면 내용. 실패했으면 이유를, 아니면 창을 닫으라고 말한다. '내 정보'에서 로그인
 * 방법을 이은 것이면(`oauthLinked`) 연결했다고 말한다.
 */
export function OAuthDone() {
  const search = useSyncExternalStore(subscribe, readSearch, () => "");
  const params = new URLSearchParams(search);
  const error = search ? oauthErrorMessageFrom(params) : null;
  const linked = params.get("oauthLinked");
  // 로그인 방법을 잇다가 실패했으면 서버가 oauthLink=1을 붙인다.
  const title = error
    ? params.has("oauthLink")
      ? "연결하지 못했어요"
      : "로그인하지 못했어요"
    : linked
      ? `${LINKED_LABEL[linked] ?? linked} 계정을 연결했어요`
      : "로그인했어요";
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-6 text-center" role="status">
      <p className="text-lg font-black">{title}</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-sm text-muted-foreground">이 창을 닫으면 SubSlash 앱으로 돌아갑니다.</p>
    </div>
  );
}
