"use client";

import { ServiceLogo } from "../ServiceLogo";
import { CUSTOM_ICON_COLORS, CUSTOM_ICON_EMOJIS } from "@lib/custom-icon";
import { useT } from "@lib/i18n";
import { FIELD_LABEL } from "./fieldLabel";

/**
 * 앱에서 목록에 없는 서비스를 직접 등록할 때 아이콘(이모지)과 타일 색을 고른다. 브랜드 마크를
 * 지어내지 않는 대신, 사용자가 고른 것으로 목록에서 알아보게 한다(lib/custom-icon). 같은 것을
 * 다시 누르면 고른 것을 푼다.
 */
export function CustomIconPicker({
  name,
  iconUrl,
  iconColor,
  onChange,
}: {
  name?: string;
  iconUrl?: string;
  iconColor?: string;
  onChange: (change: { iconUrl?: string } | { iconColor?: string }) => void;
}) {
  const f = useT().form.icon;
  return (
    <div className="space-y-3 rounded-xl border bg-muted/40 p-3">
      <div className="flex items-center gap-2.5">
        <ServiceLogo
          name={name || "?"}
          fallbackEmoji={iconUrl}
          fallbackColor={iconColor}
          size={36}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{name || f.placeholderName}</p>
          <p className="text-[11px] text-muted-foreground">{f.preview}</p>
        </div>
      </div>
      <fieldset className="space-y-1.5">
        <legend className={`${FIELD_LABEL} mb-1.5`}>{f.icon}</legend>
        <div className="grid grid-cols-8 gap-1">
          {CUSTOM_ICON_EMOJIS.map((emoji) => {
            const on = iconUrl === emoji;
            return (
              <button
                key={emoji}
                type="button"
                aria-pressed={on}
                onClick={() => onChange({ iconUrl: on ? undefined : emoji })}
                className={`grid aspect-square place-items-center rounded-lg border text-lg transition-colors ${
                  on ? "border-primary bg-background" : "border-transparent hover:bg-background"
                }`}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset className="space-y-1.5">
        <legend className={`${FIELD_LABEL} mb-1.5`}>{f.color}</legend>
        <div className="flex flex-wrap gap-2">
          {CUSTOM_ICON_COLORS.map((color) => {
            const on = iconColor === color.id;
            return (
              <button
                key={color.id}
                type="button"
                aria-label={f.colors[color.id]}
                aria-pressed={on}
                onClick={() => onChange({ iconColor: on ? undefined : color.id })}
                className={`size-7 rounded-full ring-offset-2 ring-offset-background transition ${
                  on ? "ring-2 ring-foreground" : "ring-1 ring-black/10 dark:ring-white/15"
                }`}
                style={{ backgroundColor: color.hex }}
              />
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}
