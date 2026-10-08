"use client";

import { useEffect, useRef } from "react";
import { messages, type Messages } from "./messages";
import { useLocale } from "./locale";

export { useLocale, useLocalePreference, type Locale, type LocalePreference } from "./locale";
export type { Messages } from "./messages";
export { useKnownText } from "./known-text";

/**
 * 지금 언어의 문구. `const t = useT(); t.shell.nav.dashboard`처럼 쓴다. 문구는 lib/i18n/messages에
 * 영역별로 한국어(원문)와 영어를 나란히 둔다.
 */
export function useT(): Messages {
  return messages[useLocale()];
}

/**
 * 늘 지금 언어의 문구를 가리키는 ref. 첫 화면은 한국어로 그린 뒤 기기 언어로 다시 그리므로, 화면을 연 뒤의
 * 비동기 결과(응답을 받은 뒤 띄우는 안내 등)에 문구를 붙일 때 effect가 잡아 둔 예전 문구 대신 이것을 읽는다.
 */
export function useLatestT() {
  const t = useT();
  const ref = useRef(t);
  useEffect(() => {
    ref.current = t;
  }, [t]);
  return ref;
}
