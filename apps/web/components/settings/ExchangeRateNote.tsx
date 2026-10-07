"use client";

import React, { useState } from "react";
import { DEFAULT_EXCHANGE_RATE } from "@subslash/shared";
import { useStore, isValidExchangeRate, type ExchangeRateSource } from "@lib/store";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { apiUrl } from "@lib/api";
import { useLocale, useT } from "@lib/i18n";

function formatUpdatedAt(iso: string | null, locale: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(locale === "ko" ? "ko-KR" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
  const t = useT().settings.exchangeRate;
  const locale = useLocale();

  const hasUSD = subscriptions.some((sub) => sub.currency === "USD" && sub.status === "active");
  if (!hasUSD) return null;

  const rate = exchangeRate.rate ?? DEFAULT_EXCHANGE_RATE;
  const updatedAt = formatUpdatedAt(exchangeRate.updatedAt, locale);
  const sourceLabel: Record<ExchangeRateSource, string> = t.sources;

  const openEditor = () => {
    setDraft(String(rate));
    setError(null);
    setIsEditing(true);
  };

  const save = () => {
    const parsed = Number(draft.replace(/,/g, "").trim());
    if (!isValidExchangeRate(parsed)) {
      setError(t.invalid);
      return;
    }
    setExchangeRate(parsed, "manual");
    setIsEditing(false);
  };

  const fetchLatest = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const response = await fetch(apiUrl("/api/fx"));
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
      setError(t.fetchFailed);
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-card px-4 py-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground">
          {t.convertedAt(rate.toLocaleString())}
          <span className="opacity-70">
            {" "}
            ({sourceLabel[exchangeRate.source]}
            {updatedAt && ` · ${updatedAt}`})
          </span>
        </p>
        {!isEditing && (
          <Button variant="outline" size="sm" onClick={openEditor}>
            {t.change}
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
              aria-label={t.inputLabel}
            />
            <Button size="sm" onClick={save}>
              {t.save}
            </Button>
            <Button variant="outline" size="sm" onClick={fetchLatest} disabled={isFetching}>
              {isFetching ? t.fetching : t.fetchLatest}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                resetExchangeRate();
                setIsEditing(false);
              }}
            >
              {t.reset(DEFAULT_EXCHANGE_RATE.toLocaleString())}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              {t.cancel}
            </Button>
          </div>
          <p className="text-muted-foreground opacity-80">{t.cardNote}</p>
          {error && <p className="text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
