"use client";

import { Check } from "lucide-react";
import { cn } from "@lib/utils";
import { useLocalePreference, useT, type LocalePreference } from "@lib/i18n";

/**
 * 설정의 언어 고르기. 처음에는 기기 언어를 따르고, 고르면 이 기기에 남긴다. 언어 이름은 화면 언어와
 * 관계없이 그 언어로 적는다 — 읽지 못하는 언어로 바꿔 버린 사람도 돌아올 수 있게.
 */
export function LanguagePicker() {
  const t = useT().settings.language;
  const [preference, setPreference] = useLocalePreference();
  const options: { value: LocalePreference; label: string }[] = [
    { value: null, label: t.system },
    { value: "ko", label: "한국어" },
    { value: "en", label: "English" },
  ];

  return (
    <section className="space-y-1.5" aria-labelledby="language-heading">
      <h2 id="language-heading" className="px-1 text-xs font-bold text-muted-foreground">
        {t.title}
      </h2>
      <div
        role="radiogroup"
        aria-labelledby="language-heading"
        className="divide-y overflow-hidden rounded-2xl border bg-card"
      >
        {options.map(({ value, label }) => {
          const selected = preference === value;
          return (
            <button
              key={value ?? "system"}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setPreference(value)}
              className={cn(
                "flex w-full items-center gap-3 px-3.5 py-3 text-left text-sm transition-colors hover:bg-muted/60 active:bg-secondary",
                selected && "font-bold",
              )}
            >
              <span className="flex-1">{label}</span>
              {selected && <Check className="size-4" aria-hidden />}
            </button>
          );
        })}
      </div>
      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">{t.note}</p>
    </section>
  );
}
