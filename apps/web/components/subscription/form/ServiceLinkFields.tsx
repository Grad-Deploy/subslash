"use client";

import { Input } from "../../ui/input";
import { useT } from "@lib/i18n";
import { useKnownText } from "@lib/i18n";
import { FIELD_LABEL } from "./fieldLabel";

/**
 * 목록에 없는 서비스(또는 수정할 때)의 웹사이트 주소와 해지 방법 메모. 주소는 제출할 때
 * 폼이 정리·검사하고, 틀리면 `error`로 돌려준다.
 */
export function ServiceLinkFields({
  idPrefix,
  url,
  error,
  onUrlChange,
  cancelGuide,
  onCancelGuideChange,
}: {
  idPrefix: string;
  url: string;
  error: string | null;
  onUrlChange: (url: string) => void;
  cancelGuide?: string;
  onCancelGuideChange: (guide: string | undefined) => void;
}) {
  const f = useT().form.link;
  const known = useKnownText();
  return (
    <>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-url`} className={FIELD_LABEL}>
          {f.url}
        </label>
        <Input
          id={`${idPrefix}-url`}
          name="cancelUrl"
          inputMode="url"
          placeholder={f.urlPlaceholder}
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          aria-invalid={Boolean(error)}
        />
        {error ? (
          <p className="text-[11px] font-medium text-destructive" role="alert">
            {known(error)}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">{f.urlHint}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-guide`} className={FIELD_LABEL}>
          {f.guide}
        </label>
        <textarea
          id={`${idPrefix}-guide`}
          name="cancelGuide"
          rows={3}
          placeholder={f.guidePlaceholder}
          value={cancelGuide ?? ""}
          onChange={(e) => onCancelGuideChange(e.target.value || undefined)}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="text-[11px] text-muted-foreground">{f.guideHint}</p>
      </div>
    </>
  );
}
