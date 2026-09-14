"use client";

import React, { useState } from "react";
import { Input } from "./input";
import { Select } from "./select";
import { cn } from "../../lib/utils";

export const COMMON_EMAIL_DOMAINS = [
  { label: "naver.com (네이버)", value: "naver.com", provider: "naver" as const },
  { label: "gmail.com (구글)", value: "gmail.com", provider: "google" as const },
  { label: "kakao.com (카카오)", value: "kakao.com", provider: "kakao" as const },
  { label: "daum.net (다음)", value: "daum.net", provider: "kakao" as const },
  { label: "icloud.com (애플)", value: "icloud.com", provider: "apple" as const },
  { label: "outlook.com (MS)", value: "outlook.com", provider: "email" as const },
  { label: "직접 입력", value: "custom", provider: "email" as const },
];

export function getDomainForProvider(
  provider?: "google" | "naver" | "kakao" | "apple" | "email",
): string {
  switch (provider) {
    case "google":
      return "gmail.com";
    case "kakao":
      return "kakao.com";
    case "naver":
      return "naver.com";
    case "apple":
      return "icloud.com";
    case "email":
      return "custom";
    default:
      return "gmail.com";
  }
}

export interface EmailDomainInputProps {
  value?: string;
  provider?: "google" | "naver" | "kakao" | "apple" | "email";
  onChange: (fullEmail: string, localPart: string, domain: string) => void;
  placeholderId?: string;
  className?: string;
  size?: "sm" | "default";
  onProviderChange?: (provider: "google" | "naver" | "kakao" | "apple" | "email") => void;
  required?: boolean;
}

// Helper to parse value without defaulting domain to naver
export const parseEmailValue = (val: string) => {
  if (!val) return { local: "", domain: "", hasDomain: false };
  if (val.includes("@")) {
    const [local, ...rest] = val.split("@");
    return { local: local || "", domain: rest.join("@") || "", hasDomain: true };
  }
  return { local: val, domain: "", hasDomain: false };
};

export function EmailDomainInput({
  value = "",
  provider,
  onChange,
  placeholderId = "아이디 입력",
  className,
  size = "default",
  onProviderChange,
  required = false,
}: EmailDomainInputProps) {
  const initialDomain = provider ? getDomainForProvider(provider) : "gmail.com";
  const parsed = parseEmailValue(value);

  const [localPart, setLocalPart] = useState(parsed.local);
  const [selectedPreset, setSelectedPreset] = useState(() => {
    if (parsed.hasDomain && parsed.domain) {
      const matched = COMMON_EMAIL_DOMAINS.find((d) => d.value === parsed.domain);
      return matched ? matched.value : "custom";
    }
    return initialDomain;
  });
  const [customDomain, setCustomDomain] = useState(() => {
    if (parsed.hasDomain && parsed.domain) {
      const matched = COMMON_EMAIL_DOMAINS.find((d) => d.value === parsed.domain);
      return matched ? "" : parsed.domain;
    }
    return "";
  });

  // 사용자가 도메인을 직접 골랐는지. 골랐으면 계정 종류(provider)가 바뀌어도 덮어쓰지 않는다.
  // 처음부터 값에 도메인이 있으면 고른 것으로 친다 — 예전 effect도 첫 렌더 뒤 그렇게 표시했다.
  const [userSelectedDomain, setUserSelectedDomain] = useState(parsed.hasDomain && !!parsed.domain);

  // 부모가 바꾼 value·provider를 따라간다. effect로 맞추면 렌더링이 한 번 더 일어나므로, 바뀐
  // 것을 렌더링 중에 알아차려 바로 맞춘다(React 문서의 'prop이 바뀌면 state 조정하기').
  const [prevValue, setPrevValue] = useState(value);
  const [prevProvider, setPrevProvider] = useState(provider);
  let domainChosen = userSelectedDomain;

  if (value !== prevValue) {
    setPrevValue(value);
    if (!value) {
      // User erased the input — clear local part but strictly KEEP selectedPreset and customDomain!
      setLocalPart("");
    } else {
      const next = parseEmailValue(value);
      setLocalPart(next.local);
      if (next.hasDomain && next.domain) {
        const matched = COMMON_EMAIL_DOMAINS.find((d) => d.value === next.domain);
        setSelectedPreset(matched ? matched.value : "custom");
        setCustomDomain(matched ? "" : next.domain);
        setUserSelectedDomain(true);
        domainChosen = true;
      }
    }
  }

  // Follow the provider only while the user hasn't explicitly chosen a domain.
  if (provider !== prevProvider) {
    setPrevProvider(provider);
    if (provider && !domainChosen) {
      const dom = getDomainForProvider(provider);
      setSelectedPreset(dom);
      if (dom !== "custom") setCustomDomain("");
    }
  }

  const emitChange = (newLocal: string, preset: string, custom: string) => {
    const finalDomain = preset === "custom" ? custom.trim() : preset;
    const full = newLocal.trim() ? `${newLocal.trim()}@${finalDomain}` : "";
    onChange(full, newLocal.trim(), finalDomain);

    if (onProviderChange && finalDomain) {
      const matched = COMMON_EMAIL_DOMAINS.find((d) => d.value === finalDomain);
      if (matched && matched.value !== "custom") {
        onProviderChange(matched.provider);
      } else if (finalDomain.includes("naver")) {
        onProviderChange("naver");
      } else if (finalDomain.includes("gmail") || finalDomain.includes("google")) {
        onProviderChange("google");
      } else if (finalDomain.includes("kakao") || finalDomain.includes("daum")) {
        onProviderChange("kakao");
      } else if (finalDomain.includes("icloud") || finalDomain.includes("apple")) {
        onProviderChange("apple");
      } else {
        onProviderChange("email");
      }
    }
  };

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    // Handle user pasting or typing an email address with '@'
    if (val.includes("@")) {
      const [pastedLocal, ...rest] = val.split("@");
      const pastedDomain = rest.join("@").trim();
      const newLocal = pastedLocal.trim();
      setLocalPart(newLocal);

      if (pastedDomain) {
        setUserSelectedDomain(true);
        const matched = COMMON_EMAIL_DOMAINS.find((d) => d.value === pastedDomain);
        if (matched) {
          setSelectedPreset(matched.value);
          setCustomDomain("");
          emitChange(newLocal, matched.value, "");
        } else {
          setSelectedPreset("custom");
          setCustomDomain(pastedDomain);
          emitChange(newLocal, "custom", pastedDomain);
        }
      } else {
        emitChange(newLocal, selectedPreset, customDomain);
      }
      return;
    }

    setLocalPart(val);
    emitChange(val, selectedPreset, customDomain);
  };

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value;
    setUserSelectedDomain(true);
    setSelectedPreset(preset);
    emitChange(localPart, preset, customDomain);
  };

  const handleCustomDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dom = e.target.value;
    setUserSelectedDomain(true);
    setCustomDomain(dom);
    emitChange(localPart, "custom", dom);
  };

  const isSmall = size === "sm";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-1.5 w-full">
        <Input
          type="text"
          placeholder={placeholderId}
          value={localPart}
          onChange={handleLocalChange}
          required={required}
          className={cn(
            "flex-1 min-w-0 font-mono",
            isSmall ? "h-8 text-xs px-2.5" : "text-sm px-3",
          )}
        />
        <span className="text-muted-foreground font-bold text-sm select-none">@</span>
        <Select
          value={selectedPreset}
          onChange={handlePresetChange}
          className={cn("w-40 shrink-0 font-mono", isSmall ? "h-8 text-xs py-1" : "text-sm")}
        >
          {COMMON_EMAIL_DOMAINS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Select>
      </div>

      {selectedPreset === "custom" && (
        <div className="flex items-center gap-1.5 pt-0.5">
          <Input
            type="text"
            placeholder="도메인 직접 입력 (예: company.com)"
            value={customDomain}
            onChange={handleCustomDomainChange}
            required={required && selectedPreset === "custom"}
            className={cn("font-mono text-xs", isSmall ? "h-8 text-xs px-2.5" : "h-9 px-3")}
          />
        </div>
      )}
    </div>
  );
}
