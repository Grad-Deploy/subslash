"use client";

import React, { useState, useEffect } from "react";
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

  const userSelectedDomainRef = React.useRef(false);

  // Sync state if provider changes externally AND user hasn't explicitly chosen a domain
  useEffect(() => {
    if (provider && !userSelectedDomainRef.current) {
      const dom = getDomainForProvider(provider);
      if (dom === "custom") {
        setSelectedPreset("custom");
      } else {
        setSelectedPreset(dom);
        setCustomDomain("");
      }
    }
  }, [provider]);

  // Sync state if value changes externally
  useEffect(() => {
    if (!value) {
      // User erased the input — clear local part but strictly KEEP selectedPreset and customDomain!
      setLocalPart("");
      return;
    }
    const { local, domain, hasDomain } = parseEmailValue(value);
    setLocalPart(local);
    if (hasDomain && domain) {
      const matched = COMMON_EMAIL_DOMAINS.find((d) => d.value === domain);
      if (matched) {
        setSelectedPreset(matched.value);
        setCustomDomain("");
      } else {
        setSelectedPreset("custom");
        setCustomDomain(domain);
      }
      userSelectedDomainRef.current = true;
    }
  }, [value]);

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
        userSelectedDomainRef.current = true;
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
    userSelectedDomainRef.current = true;
    setSelectedPreset(preset);
    emitChange(localPart, preset, customDomain);
  };

  const handleCustomDomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dom = e.target.value;
    userSelectedDomainRef.current = true;
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
