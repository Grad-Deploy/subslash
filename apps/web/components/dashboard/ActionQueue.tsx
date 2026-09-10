"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, type ActionItem, type ActionVerb } from "@subslash/shared";
import { Button } from "../ui/button";

interface ActionQueueProps {
  items: ActionItem[];
  /** 큐가 비었을 때 보여줄 다음 결제. 결제일을 아는 구독이 없으면 null. */
  nextBilling: { name: string; daysUntilBilling: number } | null;
  activeCount: number;
  onCheckIn: (subscriptionId: string) => void;
  onCancelGuide: (subscriptionId: string) => void;
  /** `newAmount`를 주면 그 금액으로 갱신하고, 없으면 현재 금액을 확인만 한다. */
  onConfirmPrice: (subscriptionId: string, newAmount?: number) => void;
  onAddFirst: () => void;
}

const VERB_LABEL: Record<ActionVerb, string> = {
  "cancel-guide": "해지 가이드",
  "check-in": "체크인하기",
  "confirm-price": "✅ 요금 유지",
  "set-billing-month": "결제 월 입력",
};

/** 급한 정도를 색으로만 구분한다. 문구는 이유가 이미 말해준다. */
const TONE: Record<number, string> = {
  1: "border-destructive/40 bg-destructive/5",
  2: "border-amber-500/40 bg-amber-500/5",
  3: "border-destructive/30 bg-destructive/5",
};

/**
 * "지금 결정할 것" 큐.
 *
 * 구독 목록을 다시 보여주지 않는다. 그건 /subs가 하는 일이고, 여기서는
 * 행동이 필요한 것만 한 줄씩 쌓는다. 각 줄은 왜 떴는지 한 문장과 버튼 하나다.
 */
export function ActionQueue({
  items,
  nextBilling,
  activeCount,
  onCheckIn,
  onCancelGuide,
  onConfirmPrice,
  onAddFirst,
}: ActionQueueProps) {
  const router = useRouter();

  const run = (item: ActionItem) => {
    switch (item.verb) {
      case "check-in":
        return onCheckIn(item.subscriptionId);
      case "cancel-guide":
        return onCancelGuide(item.subscriptionId);
      case "confirm-price":
        return onConfirmPrice(item.subscriptionId);
      case "set-billing-month":
        return router.push(`/subs/${item.subscriptionId}`);
    }
  };

  if (activeCount === 0) {
    return (
      <section className="text-center py-14 border border-dashed rounded-2xl space-y-4">
        <div className="text-4xl">✂️</div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold">아직 등록된 구독이 없습니다</h2>
          <p className="text-sm text-muted-foreground">
            매달 빠져나가는 구독을 하나만 등록해도, 여기에 무엇을 결정해야 할지 뜹니다.
          </p>
        </div>
        <Button onClick={onAddFirst}>+ 첫 구독 등록하기</Button>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="p-6 border rounded-2xl bg-card text-center space-y-2">
        <div className="text-3xl">✅</div>
        <h2 className="font-bold">지금 결정할 것이 없습니다</h2>
        <p className="text-sm text-muted-foreground">
          {nextBilling
            ? `다음 결제는 ${nextBilling.name} D-${nextBilling.daysUntilBilling}입니다.`
            : "결제일을 아는 구독이 아직 없습니다. 구독 상세에서 결제일을 채워주세요."}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold tracking-tight">⚡ 지금 결정할 것 ({items.length})</h2>
        <span className="text-xs text-muted-foreground">급한 순으로 정렬됩니다</span>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.subscriptionId}
            className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-2xl ${
              TONE[item.priority] ?? "bg-card"
            }`}
          >
            <span className="text-2xl leading-none shrink-0">{item.iconEmoji}</span>

            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">{item.name}</span>
                {item.daysUntilBilling !== null && item.daysUntilBilling <= 7 && (
                  <span className="text-[11px] font-black text-destructive">
                    D-{item.daysUntilBilling}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.reason}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {/* 해지 가이드가 주 버튼일 때만, 체크인을 곁들여 판단할 여지를 남긴다. */}
              {item.verb === "cancel-guide" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => onCheckIn(item.subscriptionId)}
                >
                  체크인
                </Button>
              )}

              {/*
                요금 확인은 답이 셋이다 — 그대로다 / 프리셋 값으로 맞춘다 / 직접 고친다.
                프리셋 기준 요금을 모를 때는 가운데 버튼을 내밀지 않는다.
              */}
              {item.verb === "confirm-price" && item.presetAmount !== null && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() =>
                    onConfirmPrice(item.subscriptionId, item.presetAmount ?? undefined)
                  }
                >
                  🔄 {formatCurrency(item.presetAmount, "KRW")}으로 갱신
                </Button>
              )}
              {item.verb === "confirm-price" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => router.push(`/subs/${item.subscriptionId}`)}
                >
                  ✏️ 수정
                </Button>
              )}

              <Button
                size="sm"
                variant={item.verb === "cancel-guide" ? "destructive" : "default"}
                className="text-xs font-bold"
                onClick={() => run(item)}
              >
                {VERB_LABEL[item.verb]}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
