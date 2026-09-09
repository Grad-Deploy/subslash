"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Subscription,
  formatCurrency,
  formatSettlementMessage,
  getMonthlyAmountKRW,
  getMyMonthlyAmountKRW,
  getSharingCount,
  isShared,
} from "@subslash/shared";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DdayCountdown } from "../dashboard/DdayCountdown";
import { cn } from "@lib/utils";
import { useExchangeRate } from "../../hooks/useExchangeRate";

interface SubCardProps {
  subscription: Subscription;
  onCheckIn?: (id: string) => void;
  onKill?: (id: string) => void;
  onRevive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function SubCard({ subscription, onCheckIn, onKill, onRevive, onDelete }: SubCardProps) {
  const isKilled = subscription.status === "killed";
  const rate = useExchangeRate();
  const [copied, setCopied] = useState(false);
  const shared = isShared(subscription);

  const copySettlementMessage = async () => {
    try {
      await navigator.clipboard.writeText(formatSettlementMessage(subscription));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused (insecure context, denied permission);
      // saying nothing would look like the copy silently worked.
      setCopied(false);
      window.prompt("아래 문구를 복사해 보내세요", formatSettlementMessage(subscription));
    }
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all",
        isKilled ? "opacity-60 bg-gray-50 dark:bg-gray-900 grayscale" : "hover:shadow-md",
      )}
    >
      <CardContent className="p-5 flex flex-col gap-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="text-3xl bg-secondary w-12 h-12 flex items-center justify-center rounded-xl shadow-inner">
              {subscription.iconUrl || "📦"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/subs/${subscription.id}`}
                  className="font-bold text-lg leading-none hover:underline hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <span>{subscription.name}</span>
                  <span className="text-xs text-muted-foreground opacity-70">⚙️</span>
                </Link>
                {isKilled && (
                  <Badge variant="secondary" className="text-[10px]">
                    해지 완료
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {subscription.billingCycle === "yearly" ? "연 " : "월 "}
                {formatCurrency(subscription.amount, subscription.currency)}
                {(subscription.currency !== "KRW" || subscription.billingCycle === "yearly") && (
                  <span className="text-xs opacity-80">
                    {" "}
                    (월 ₩{getMonthlyAmountKRW(subscription, rate).toLocaleString()})
                  </span>
                )}
              </p>
              {shared && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  👥 {getSharingCount(subscription)}명이서 나눔 · 내 몫 월 ₩
                  {getMyMonthlyAmountKRW(subscription, rate).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {!isKilled && (
            <div className="flex flex-col items-end gap-2">
              <DdayCountdown billingDay={subscription.billingDay} />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{subscription.category}</Badge>
            {subscription.linkedAccountName && (
              <Badge variant="secondary" className="text-[11px]">
                👤 {subscription.linkedAccountName}
              </Badge>
            )}
            {shared && !isKilled && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[11px] text-muted-foreground"
                onClick={copySettlementMessage}
              >
                {copied ? "✅ 복사됨" : "💬 정산 문구 복사"}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {isKilled ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onRevive?.(subscription.id)}>
                  다시 살리기
                </Button>
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => onDelete?.(subscription.id)}
                  >
                    삭제
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => onCheckIn?.(subscription.id)}>
                  체크인
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onKill?.(subscription.id)}>
                  해지하기
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
