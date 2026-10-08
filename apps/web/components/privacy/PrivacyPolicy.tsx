"use client";

import React from "react";
import { useLocale } from "@lib/i18n";
import { PrivacyEn } from "./PrivacyEn";
import { PrivacyKo } from "./PrivacyKo";

/**
 * 개인정보처리방침. 화면 언어가 영어면 영어판을 보인다. 서버 렌더링은 한국어(원문)이고, 그 뒤 기기 언어로
 * 다시 그린다 — 다른 화면과 같다.
 */
export function PrivacyPolicy() {
  return useLocale() === "en" ? <PrivacyEn /> : <PrivacyKo />;
}
