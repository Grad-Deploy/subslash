"use client";

import { Globe, Languages } from "lucide-react";
import { useLocale, useT } from "@lib/i18n";
import { SOURCE_LOCALE } from "@lib/i18n/config";
import { cn } from "@lib/utils";

const HANGUL = /[가-힣]/;

/**
 * 한국어로 적힌 글이면 그 언어 태그. 번역하지 않은 원문(서비스 목록의 해지 안내·요금 설명)에 달아, 영어 화면에서도
 * 화면 낭독기가 한국어로 읽게 한다. 사용자가 다른 언어로 고쳐 적었으면 달지 않는다.
 */
export function sourceLang(text: string | undefined): "ko" | undefined {
  return text && HANGUL.test(text) ? "ko" : undefined;
}

/**
 * 원문 언어가 아닌 화면에서, 번역하지 않은 원문 옆에 '원문(한국어)'이라고 적는다. 해지 안내·요금 설명은 서비스
 * 화면에서 확인한 그대로라, 옮기면 확인하지 않은 문장을 사실처럼 보이게 된다(CLAUDE.md 제1원칙). 글에 한글이
 * 없으면(사용자가 다른 언어로 적은 안내) 아무것도 그리지 않는다.
 */
export function SourceTextNote({
  text,
  className,
}: {
  text: string | undefined;
  className?: string;
}) {
  const locale = useLocale();
  const label = useT().shell.common.sourceText;
  if (locale === SOURCE_LOCALE || !sourceLang(text)) return null;
  return (
    <p className={cn("flex items-start gap-1 text-[11px] text-muted-foreground", className)}>
      <Languages className="mt-px size-3 shrink-0" aria-hidden />
      <span>{label}</span>
    </p>
  );
}

/**
 * 원문 언어가 아닌 화면에서, 서비스 목록의 요금 옆에 '한국에서 확인한 요금'이라고 적는다. 목록 요금은 한국 판매 화면에서
 * 확인한 값이고 언어는 사는 나라가 아니라서, 언어를 바꿔도 요금·통화를 바꾸지 않는다 — 다른 나라 요금을 짐작해 채우면
 * 내지 않는 돈을 사실처럼 보이게 된다(CLAUDE.md 제1원칙). 다르게 내는 사람은 실제 금액을 적으면 된다.
 */
export function KoreanPriceNote({ className }: { className?: string }) {
  const locale = useLocale();
  const label = useT().shell.common.koreanPrice;
  if (locale === SOURCE_LOCALE) return null;
  return (
    <p className={cn("flex items-start gap-1 text-[11px] text-muted-foreground", className)}>
      <Globe className="mt-px size-3 shrink-0" aria-hidden />
      <span>{label}</span>
    </p>
  );
}
