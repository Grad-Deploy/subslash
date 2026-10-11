"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLocale, useT } from "@lib/i18n";

/**
 * `<html lang>`과 탭 제목을 화면 언어에 맞춘다. 첫 화면은 localeInitScript가 lang을 먼저 맞추고, 설정에서
 * 언어를 바꾸면 여기서 바꾼다. 화면 낭독기는 lang으로 읽는 법을 고른다.
 *
 * 탭 제목은 페이지의 metadata가 서버에서 한국어로 정하므로, 화면이 그려진 뒤 `pageTitles` 표로 바꾼다 —
 * 예전에는 영어 화면에서도 탭이 '로그인 · SubSlash'였다. 화면을 옮기면 Next.js가 새 페이지의 한국어 제목을
 * 넣으므로 주소가 바뀔 때마다, 그리고 제목이 바뀔 때마다 다시 맞춘다.
 */
export function LocaleEffects() {
  const locale = useLocale();
  const titles = useT().pageTitles;
  const pathname = usePathname();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  useEffect(() => {
    const path = (pathname ?? "/").replace(/\/+$/, "") || "/";
    const title = (titles.paths as Record<string, string>)[path] ?? titles.site;
    const apply = () => {
      if (document.title !== title) document.title = title;
    };
    apply();
    // Next.js는 메타데이터를 화면보다 늦게 넣기도 해, 맞춘 제목을 서버의 한국어 제목으로 다시 덮는다.
    // 제목이 바뀌면 다시 맞춘다(같으면 쓰지 않으므로 되돌아오는 변화가 없다).
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [titles, pathname]);
  return null;
}
