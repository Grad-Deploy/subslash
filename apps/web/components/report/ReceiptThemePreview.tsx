"use client";

import React, { useEffect, useState } from "react";
import type { Receipt } from "@subslash/shared";
import { useLatestT, useLocale, useT } from "@lib/i18n";
import { renderReceiptImage } from "@lib/receipt-image";
import { formatReceiptPeriodText, type ReceiptRenderOptions } from "@lib/receipt-view";
import { RECEIPT_THEMES, type ReceiptTheme } from "@lib/receipt-theme";
import { Spinner } from "@components/ui/spinner";
import { cn } from "@lib/utils";
import { ReceiptPaper } from "./ReceiptPaper";

/** 영수증 디자인 고르기. 고른 것은 이미지로 저장할 때 그 모양으로 그린다. */
export function ReceiptThemePicker({
  theme,
  onChange,
}: {
  theme: ReceiptTheme;
  onChange: (theme: ReceiptTheme) => void;
}) {
  const p = useT().receiptView.page;
  return (
    <div role="radiogroup" aria-label={p.design} className="flex flex-wrap gap-1.5">
      {RECEIPT_THEMES.map((value) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          onClick={() => onChange(value)}
          className={cn(
            "flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-center text-xs font-semibold leading-tight",
            theme === value
              ? "border-foreground bg-foreground text-background"
              : "bg-card text-muted-foreground hover:bg-muted",
          )}
        >
          <span aria-hidden className={cn("size-3 shrink-0 rounded-full", SWATCH[value])} />
          {p.themes[value]}
        </button>
      ))}
    </div>
  );
}

/** 기본값을 매번 새로 만들면 그림을 다시 그리는 effect가 렌더마다 돈다. */
const NO_OPTIONS: ReceiptRenderOptions = {};

/** 고르는 칸의 색 점 — 각 디자인의 종이와 배경. */
const SWATCH: Record<ReceiptTheme, string> = {
  classic: "bg-[#fbfaf7] ring-1 ring-zinc-300",
  color: "bg-[#FFE24A] ring-2 ring-[#1F3BFF]",
  pass: "bg-white ring-2 ring-[#0E1B2C]",
  tag: "bg-[#C9A574] ring-2 ring-[#1E2B24]",
  chat: "bg-[#FFE94D] ring-2 ring-[#BFD3E6]",
};

/**
 * 고른 디자인의 영수증. 기본은 화면에 그린 종이이고, 다른 디자인은 저장할 그림을 그대로 보여 준다 — 화면용을 따로
 * 그리면 저장한 그림과 모양이 어긋난다. 그림에는 글을 읽는 기계가 읽을 글이 없어, 같은 내용의 종이를 숨겨 둔다.
 */
export function ReceiptThemePreview({
  receipt,
  issuedAt,
  theme,
  render = NO_OPTIONS,
}: {
  receipt: Receipt;
  issuedAt: Date;
  theme: ReceiptTheme;
  /** 공유 링크로 받은 영수증이면 그림 안에도 '확인되지 않은 내용'·가린 줄의 요약을 그린다. */
  render?: ReceiptRenderOptions;
}) {
  const t = useT();
  const tRef = useLatestT();
  const locale = useLocale();
  // 그린 결과는 어느 디자인의 것인지와 함께 둔다 — 디자인을 바꾸면 다른 디자인의 그림·실패를 보이지 않는다.
  const [image, setImage] = useState<{ theme: ReceiptTheme; url: string | null } | null>(null);

  useEffect(() => {
    if (theme === "classic") return;
    let url: string | null = null;
    let cancelled = false;
    renderReceiptImage(receipt, issuedAt, tRef.current, theme, render)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setImage({ theme, url });
      })
      .catch(() => {
        if (!cancelled) setImage({ theme, url: null });
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
    // locale: 언어를 바꾸면 그림의 문구도 다시 그린다.
  }, [receipt, issuedAt, theme, tRef, locale, render]);

  if (theme === "classic") {
    return (
      <div className="drop-shadow-md">
        <ReceiptPaper receipt={receipt} issuedAt={issuedAt} render={render} />
      </div>
    );
  }
  const current = image?.theme === theme ? image : null;
  const ready = current?.url ?? null;
  const failed = current !== null && current.url === null;
  return (
    <div>
      <div className="sr-only">
        <ReceiptPaper receipt={receipt} issuedAt={issuedAt} render={render} />
      </div>
      {ready ? (
        // eslint-disable-next-line @next/next/no-img-element -- 기기에서 그린 그림(blob:)이라 next/image로 줄일 것이 없다.
        <img
          src={ready}
          alt=""
          aria-hidden
          className="mx-auto w-full max-w-md rounded-lg shadow-md"
          title={t.receiptView.page.previewAlt(formatReceiptPeriodText(t, receipt.period))}
        />
      ) : failed ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t.receiptView.page.imageFailed}
        </p>
      ) : (
        <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-muted/40">
          <Spinner className="size-6" />
        </div>
      )}
    </div>
  );
}
