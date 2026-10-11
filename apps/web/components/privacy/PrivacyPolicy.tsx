"use client";

import React from "react";
import { useLocale, type Locale } from "@lib/i18n";
import { PrivacyEn } from "./PrivacyEn";
import { PrivacyKo } from "./PrivacyKo";

/**
 * 언어마다의 방침. 원문은 한국어판이고 번역판에는 다르면 한국어판이 우선한다고 적는다. 번역판이 없는 언어는
 * 영어판을 보인다 — 법률 문서를 확인 없이 옮기지 않는다.
 */
const POLICIES: Partial<Record<Locale, () => React.JSX.Element>> = { ko: PrivacyKo, en: PrivacyEn };

/**
 * 개인정보처리방침. 서버 렌더링은 한국어(원문)이고, 그 뒤 기기 언어로 다시 그린다 — 다른 화면과 같다.
 */
export function PrivacyPolicy() {
  const Policy = POLICIES[useLocale()] ?? PrivacyEn;
  return <Policy />;
}
