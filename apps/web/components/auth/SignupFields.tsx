"use client";

import type React from "react";
import { X } from "lucide-react";
import { MIN_AGE } from "@subslash/shared";
import { cn } from "@lib/utils";
import type { LiveStatus } from "@lib/signup-status";
import { StatusMessage, statusBorder } from "./LiveStatusMessage";
import { useKnownText, useT } from "@lib/i18n";

/** 회원가입 폼(SignupForm)의 칸들. 상태는 useSignupForm이 갖고, 여기는 그리기만 한다. */

export function Field({
  label,
  htmlFor,
  status,
  children,
}: {
  label: string;
  htmlFor: string;
  status: LiveStatus;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-bold text-foreground">
        {label}
      </label>
      {children}
      <StatusMessage id={`${htmlFor}-status`} status={status} />
    </div>
  );
}

/** 칸의 테두리 색과 화면 낭독기용 속성. 문구는 Field가 칸 아래에 붙인다. */
export function statusProps(id: string, status: LiveStatus) {
  return {
    "aria-invalid": status?.tone === "error",
    "aria-describedby": `${id}-status`,
    className: statusBorder(status),
  };
}

export function Over14Checkbox({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}) {
  const t = useT().auth.signup;
  const known = useKnownText();
  return (
    <div className="space-y-1.5">
      <label
        htmlFor="isOver14"
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 text-sm cursor-pointer transition-colors",
          error ? "border-destructive" : "border-border",
        )}
      >
        <input
          id="isOver14"
          name="isOver14"
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={Boolean(error)}
        />
        <span>
          <strong>{t.over14(MIN_AGE)}</strong>{" "}
          <span className="text-muted-foreground">{t.required}</span>
        </span>
      </label>
      {error && (
        <p
          className="flex items-center gap-1 text-[11px] font-medium text-destructive"
          role="alert"
        >
          <X className="w-3.5 h-3.5 shrink-0" aria-hidden />
          {known(error)}
        </p>
      )}
    </div>
  );
}
