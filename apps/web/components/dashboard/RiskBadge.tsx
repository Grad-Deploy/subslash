import React from "react";
import { Badge, BadgeProps } from "../ui/badge";
import { RiskLevel } from "@subslash/shared";
import { useT } from "@lib/i18n";

export function RiskBadge({
  level,
  showLabel = true,
  size = "md",
  free = false,
}: {
  level: RiskLevel;
  /** 내 몫이 0원인 구독. 내지 않는 돈을 두고 해지를 권하지 않는다. */
  free?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const t = useT().overview;
  const config: Record<RiskLevel, { label: string; color: BadgeProps["variant"] }> = {
    green: { label: t.risk.green, color: "success" },
    yellow: { label: t.risk.yellow, color: "warning" },
    red: { label: free ? t.risk.redFree : t.risk.red, color: "destructive" },
  };

  const selected = config[level] || config.green;

  return (
    <Badge
      variant={selected.color}
      className={size === "sm" ? "text-[10px] px-1.5" : size === "lg" ? "text-sm px-3 py-1" : ""}
      title={t.risk.title(selected.label)}
    >
      {/* 배지가 이미 색으로 말한다. 색 이모지는 같은 말을 기기마다 다른 그림으로 되풀이했다. */}
      {showLabel ? selected.label : <span className="block size-2 rounded-full bg-current" />}
    </Badge>
  );
}
