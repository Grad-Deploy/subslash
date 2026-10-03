"use client";

import { Input } from "../../ui/input";
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
  return (
    <>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-url`} className={FIELD_LABEL}>
          서비스 웹사이트 또는 해지 페이지 주소
        </label>
        <Input
          id={`${idPrefix}-url`}
          name="cancelUrl"
          inputMode="url"
          placeholder="예: service.com"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          aria-invalid={Boolean(error)}
        />
        {error ? (
          <p className="text-[11px] font-medium text-destructive" role="alert">
            {error}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            도메인만 적어도 돼요. 해지 가이드에 이 주소와 추정한 계정 관리 링크(/account)가 생겨요.
            추정이라 없는 페이지일 수 있어요.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-guide`} className={FIELD_LABEL}>
          해지 방법 메모
        </label>
        <textarea
          id={`${idPrefix}-guide`}
          name="cancelGuide"
          rows={3}
          placeholder={"예:\n1. 앱 실행 → 설정\n2. 구독 관리 → 해지"}
          value={cancelGuide ?? ""}
          onChange={(e) => onCancelGuideChange(e.target.value || undefined)}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="text-[11px] text-muted-foreground">
          한 줄에 한 단계씩 적으면 해지 가이드에 보여요.
        </p>
      </div>
    </>
  );
}
