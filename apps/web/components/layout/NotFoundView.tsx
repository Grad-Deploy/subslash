"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";
import { useT } from "@lib/i18n";

/**
 * 없는 주소의 화면(app/not-found). Next.js 기본 화면은 영어 한 줄("This page could not be found.")뿐이라 한국어 화면에서
 * 낯설고 돌아갈 링크도 없었다. 기록은 기기에 그대로 있다는 것과 돌아갈 곳 두 개만 둔다.
 */
export function NotFoundView() {
  const n = useT().shell.notFound;
  return (
    // 탭 제목: 주소가 제각각이라 LocaleEffects가 이 표시를 보고 '페이지를 찾을 수 없어요'로 맞춘다.
    <div data-page-title="notFound" className="py-16 text-center space-y-3">
      <SearchX className="mx-auto size-10 text-muted-foreground" aria-hidden />
      <p className="text-sm font-bold text-muted-foreground tabular-nums">404</p>
      <h1 className="text-xl font-black tracking-tight">{n.title}</h1>
      <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">{n.body}</p>
      <div className="flex justify-center gap-2 pt-2">
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-xl border px-4 text-sm font-bold hover:bg-muted"
        >
          {n.home}
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          {n.dashboard}
        </Link>
      </div>
    </div>
  );
}
