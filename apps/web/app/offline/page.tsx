import type { Metadata } from "next";
import { WifiOff } from "lucide-react";
import { ko as PAGE_TITLES } from "@lib/i18n/messages/pageTitles";

export const metadata: Metadata = {
  title: PAGE_TITLES.paths["/offline"],
};

/**
 * Served by the service worker when a navigation fails with no network.
 *
 * It is precached as plain HTML, so it has to say something useful without its
 * JavaScript ever running — no store access, no interactivity.
 *
 * 화면 언어도 React 없이 고른다. 첫 화면 스크립트(localeInitScript)가 `<html lang>`을 기기 언어로 정하므로,
 * 두 언어를 함께 두고 CSS로 그 언어만 보인다. 번역이 없는 언어(일본어 등)는 영어다(`FALLBACK_LOCALE`) —
 * 예전에는 `lang=en`일 때만 영어를 보여, 다른 언어 화면에 한국어가 나왔다.
 */
const KO = "hidden [html[lang=ko]_&]:block";
const EN = "[html[lang=ko]_&]:hidden";
export default function OfflinePage() {
  return (
    <div className="py-16 text-center space-y-3">
      <WifiOff className="mx-auto size-10 text-muted-foreground" aria-hidden />
      <h1 className={`text-xl font-black tracking-tight ${KO}`}>지금은 오프라인입니다</h1>
      <p className={`text-sm text-muted-foreground leading-relaxed ${KO}`}>
        구독 정보는 이 기기에 그대로 있습니다.
        <br />
        네트워크가 돌아오면 새로고침해주세요.
      </p>
      <h1 className={`text-xl font-black tracking-tight ${EN}`}>You&apos;re offline</h1>
      <p className={`text-sm text-muted-foreground leading-relaxed ${EN}`}>
        Your subscriptions are still on this device.
        <br />
        Refresh once you&apos;re back online.
      </p>
    </div>
  );
}
