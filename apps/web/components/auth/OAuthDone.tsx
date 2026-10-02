"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { appReturnUrl, isAppReturnScheme } from "@lib/app-return";
import { oauthErrorMessageFrom } from "@lib/oauth-messages";
import { providerLabel } from "@lib/oauth-providers";

const subscribe = () => () => {};
const readSearch = () => window.location.search;

/**
 * 앱 소셜 로그인의 끝 화면 내용. 실패했으면 이유를, 아니면 로그인했다고 말한다. '내 정보'에서 로그인
 * 방법을 이은 것이면(`oauthLinked`) 연결했다고 말한다.
 *
 * 앱이 돌아갈 스킴을 보냈으면(`app`) 곧바로 그 앱을 연다(lib/app-return). 이 화면은 인앱 브라우저나,
 * 카카오톡이 돌려보낸 Chrome에 뜬다 — 창을 닫으라고만 하면 Chrome에 뜬 사람은 웹에 남았다. 브라우저가
 * 사용자 동작 없이 다른 앱을 여는 것을 막을 수 있어 같은 주소로 가는 버튼도 둔다. 결과는 앱 주소에 실어
 * 앱이 같은 문구를 보인다. 예전 앱(스킴을 보내지 않음)에는 창을 닫으라고만 말한다.
 */
export function OAuthDone() {
  const search = useSyncExternalStore(subscribe, readSearch, () => "");
  const params = new URLSearchParams(search);
  const error = search ? oauthErrorMessageFrom(params) : null;
  const linked = params.get("oauthLinked");
  const scheme = params.get("app");
  const result = new URLSearchParams(params);
  result.delete("app");
  const returnUrl = isAppReturnScheme(scheme) ? appReturnUrl(scheme, result) : null;

  useEffect(() => {
    // 앱 주소(다른 스킴)로 가는 것이라 이 페이지를 다시 부르지 않는다. 이 화면은 웹에만 있다.
    if (returnUrl) window.location.href = returnUrl;
  }, [returnUrl]);

  // 로그인 방법을 잇다가 실패했으면 서버가 oauthLink=1을 붙인다.
  const title = error
    ? params.has("oauthLink")
      ? "연결하지 못했어요"
      : "로그인하지 못했어요"
    : linked
      ? `${providerLabel(linked)} 계정을 연결했어요`
      : "로그인했어요";
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-6 text-center" role="status">
      <p className="text-lg font-black">{title}</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {returnUrl ? (
        <a
          href={returnUrl}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
        >
          SubSlash 앱으로 돌아가기
        </a>
      ) : (
        <p className="text-sm text-muted-foreground">이 창을 닫으면 SubSlash 앱으로 돌아갑니다.</p>
      )}
    </div>
  );
}
