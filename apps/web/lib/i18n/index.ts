"use client";

import { messages, type Messages } from "./messages";
import { useLocale } from "./locale";

export { useLocale, useLocalePreference, type Locale, type LocalePreference } from "./locale";
export type { Messages } from "./messages";

/**
 * 지금 언어의 문구. `const t = useT(); t.shell.nav.dashboard`처럼 쓴다. 문구는 lib/i18n/messages에
 * 영역별로 한국어(원문)와 영어를 나란히 둔다.
 */
export function useT(): Messages {
  return messages[useLocale()];
}
