"use client";

import React from "react";
import { useLocale, useT, type Locale } from "@lib/i18n";
import { PrivacyEn } from "./PrivacyEn";
import { PrivacyKo } from "./PrivacyKo";

/**
 * 언어마다의 방침. 원문은 한국어판이고 번역판에는 다르면 한국어판이 우선한다고 적는다. 번역판이 없는 언어는
 * 영어판을 보인다 — 법률 문서를 확인 없이 옮기지 않는다.
 */
const POLICIES: Partial<Record<Locale, () => React.JSX.Element>> = { ko: PrivacyKo, en: PrivacyEn };

/**
 * 개인정보처리방침. 서버 렌더링은 한국어(원문)이고, 그 뒤 기기 언어로 다시 그린다 — 다른 화면과 같다.
 * 번역판이 없어 영어판을 보일 때는 그 사실을 화면 언어로 맨 위에 한 줄 적는다.
 */
export function PrivacyPolicy() {
  const Policy = POLICIES[useLocale()];
  const t = useT();
  if (Policy) return <Policy />;
  return (
    <>
      <p
        role="note"
        className="mx-auto mt-6 max-w-2xl rounded-xl border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground"
      >
        {t.privacyPage.englishOnly}
      </p>
      {/* 화면 낭독기가 영어 본문을 화면 언어(<html lang>)의 음성으로 읽지 않게 한다. */}
      <div lang="en">
        <PrivacyEn />
      </div>
    </>
  );
}
