"use client";

import type React from "react";
import { X } from "lucide-react";
import { GENDER_OPTIONS, MAX_AGE, MIN_AGE } from "@subslash/shared";
import { Input } from "@components/ui/input";
import { Select } from "@components/ui/select";
import { cn } from "@lib/utils";
import type { LiveStatus } from "@lib/signup-status";
import { StatusMessage, statusBorder } from "./LiveStatusMessage";

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

/**
 * 나이·성별은 선택이다. 서비스에 꼭 필요한 정보가 아니라 필수로 받으면 개인정보 보호법
 * 제16조(최소 수집)에 어긋나고, 비웠다고 가입을 막을 수도 없다. 만 14세 확인만은 법정대리인
 * 동의 문제 때문에 필수로 남긴다(Over14Checkbox).
 */
export function OptionalProfileFields({
  age,
  onAgeChange,
  gender,
  onGenderChange,
  ageError,
  genderError,
}: {
  age: string;
  onAgeChange: (value: string) => void;
  gender: string;
  onGenderChange: (value: string) => void;
  ageError?: string;
  genderError?: string;
}) {
  return (
    <fieldset className="space-y-2 rounded-xl border px-3.5 py-3">
      <legend className="px-1 text-xs font-bold text-foreground">
        나이·성별 <span className="font-normal text-muted-foreground">(선택)</span>
      </legend>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="signup-age" className="sr-only">
            나이
          </label>
          <Input
            id="signup-age"
            name="age"
            type="number"
            inputMode="numeric"
            min={MIN_AGE}
            max={MAX_AGE}
            placeholder="만 나이"
            value={age}
            onChange={(e) => onAgeChange(e.target.value)}
            aria-invalid={Boolean(ageError)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="signup-gender" className="sr-only">
            성별
          </label>
          <Select
            id="signup-gender"
            name="gender"
            value={gender}
            onChange={(e) => onGenderChange(e.target.value)}
            aria-invalid={Boolean(genderError)}
          >
            <option value="">성별 선택 안 함</option>
            {GENDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {(ageError || genderError) && (
        <p className="text-[11px] font-medium text-destructive" role="alert">
          {ageError ?? genderError}
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        비워도 가입돼요. &lsquo;내 정보&rsquo;에서 언제든 바꾸거나 지울 수 있어요.
      </p>
    </fieldset>
  );
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
          <strong>만 {MIN_AGE}세 이상입니다.</strong>{" "}
          <span className="text-muted-foreground">(필수)</span>
        </span>
      </label>
      {error && (
        <p
          className="flex items-center gap-1 text-[11px] font-medium text-destructive"
          role="alert"
        >
          <X className="w-3.5 h-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}
