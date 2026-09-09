"use client";

import React, { useState } from "react";
import { DEFAULT_EXCHANGE_RATE } from "@subslash/shared";
import { useStore, isValidExchangeRate, type ExchangeRateSource } from "@lib/store";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const SOURCE_LABEL: Record<ExchangeRateSource, string> = {
  default: "기본값",
  manual: "직접 입력",
  ecb: "ECB 고시 환율",
};

function formatUpdatedAt(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Says which USD → KRW rate the totals on this page were built with, and lets
 * the user replace it.
 *
 * Rendered only when a USD subscription exists: with an all-KRW list the rate
 * changes nothing on screen, and a control that has no effect is noise.
 */
export function ExchangeRateNote() {
  const subscriptions = useStore((state) => state.subscriptions);
  const exchangeRate = useStore((state) => state.exchangeRate);
  const setExchangeRate = useStore((state) => state.setExchangeRate);
  const resetExchangeRate = useStore((state) => state.resetExchangeRate);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const hasUSD = subscriptions.some((sub) => sub.currency === "USD" && sub.status === "active");
  if (!hasUSD) return null;

  const rate = exchangeRate.rate ?? DEFAULT_EXCHANGE_RATE;
  const updatedAt = formatUpdatedAt(exchangeRate.updatedAt);

  const openEditor = () => {
    setDraft(String(rate));
    setError(null);
    setIsEditing(true);
  };

  const save = () => {
    const parsed = Number(draft.replace(/,/g, "").trim());
    if (!isValidExchangeRate(parsed)) {
      setError("1보다 크고 100,000 이하인 숫자를 입력해주세요.");
      return;
    }
    setExchangeRate(parsed, "manual");
    setIsEditing(false);
  };

  const fetchLatest = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const response = await fetch("/api/fx");
      if (!response.ok) throw new Error(`status ${response.status}`);
      const body = (await response.json()) as { rate?: number };
      if (typeof body.rate !== "number" || !isValidExchangeRate(body.rate)) {
        throw new Error("unusable rate");
      }
      setExchangeRate(body.rate, "ecb");
      setDraft(String(body.rate));
      setIsEditing(false);
    } catch {
      // The rate already in use stays in use; saying so beats a silent no-op.
      setError("환율을 불러오지 못했습니다. 지금 값을 그대로 사용합니다.");
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card px-4 py-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground">
          USD 구독은 <strong className="text-foreground">$1 = ₩{rate.toLocaleString()}</strong>{" "}
          기준으로 환산했습니다
          <span className="opacity-70">
            {" "}
            ({SOURCE_LABEL[exchangeRate.source]}
            {updatedAt && ` · ${updatedAt}`})
          </span>
        </p>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={openEditor}>
            환율 변경
          </Button>
        )}
      </div>

      {isEditing && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">$1 =</span>
            <Input
              type="number"
              inputMode="decimal"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="h-8 w-32 text-xs"
              aria-label="USD 대비 원화 환율"
            />
            <Button size="sm" onClick={save}>
              저장
            </Button>
            <Button variant="outline" size="sm" onClick={fetchLatest} disabled={isFetching}>
              {isFetching ? "불러오는 중..." : "최신 환율 불러오기"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetExchangeRate();
                setIsEditing(false);
              }}
            >
              기본값(₩{DEFAULT_EXCHANGE_RATE.toLocaleString()})으로
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              취소
            </Button>
          </div>
          <p className="text-muted-foreground opacity-80">
            고시 환율은 카드사 청구액과 다릅니다. 카드사는 자체 수수료를 더해 청구하므로, 명세서와
            맞추려면 그 금액에서 역산한 값을 직접 넣는 편이 정확합니다.
          </p>
          {error && <p className="text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
