"use client";

import { useEffect } from "react";
import { useLocale } from "@lib/i18n";

/**
 * `<html lang>`을 화면 언어에 맞춘다. 첫 화면은 localeInitScript가 먼저 맞추고, 설정에서 언어를 바꾸면
 * 여기서 바꾼다. 화면 낭독기는 lang으로 읽는 법을 고른다.
 */
export function LocaleEffects() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
