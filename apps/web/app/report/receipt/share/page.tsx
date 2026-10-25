"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { useT } from "@lib/i18n";
import { decodeReceiptShare, type SharedReceipt } from "@lib/receipt-share";
import { ReceiptThemePreview } from "@components/report/ReceiptThemePreview";
import { PageSpinner } from "@components/ui/spinner";

/**
 * 공유받은 구독 영수증. 영수증은 주소의 `#` 뒤에만 있다(lib/receipt-share) — 서버는 이 화면의 껍데기만 주고 내용을 모른다.
 * 받는 사람의 기록과 섞지 않고, 링크에 담긴 값을 그대로 그린다. 링크는 누구나 지어 만들 수 있으므로 화면과 그림 모두에
 * '확인되지 않은 내용'이라고 적고, 이 화면에서는 아무것도 입력받지 않는다.
 */
export default function SharedReceiptPage() {
  const t = useT();
  const s = t.receiptView.shared;
  // undefined: 읽는 중, null: 읽지 못함
  const [shared, setShared] = useState<SharedReceipt | null | undefined>(undefined);

  // 가린 이름('구독 1')은 화면 언어로 붙인다. 첫 화면은 한국어로 그린 뒤 기기 언어로 바뀌므로 언어가 바뀌면 다시 푼다.
  const { maskedName, maskedKilled } = s;
  useEffect(() => {
    let cancelled = false;
    const read = () => {
      void decodeReceiptShare(window.location.hash, {
        masked: maskedName,
        maskedKilled,
      }).then((value) => {
        if (!cancelled) setShared(value);
      });
    };
    read();
    window.addEventListener("hashchange", read);
    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", read);
    };
  }, [maskedName, maskedKilled]);

  if (shared === undefined) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-md space-y-5 py-2">
      <header className="space-y-2">
        <p className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">
          <ReceiptText className="size-3.5" aria-hidden />
          {s.badge}
        </p>
        <h1 className="text-2xl font-black tracking-tight">{t.receiptView.title}</h1>
      </header>

      {shared ? (
        <>
          <p
            role="note"
            className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
          >
            {s.note}
          </p>
          <ReceiptThemePreview
            receipt={shared.receipt}
            issuedAt={shared.issuedAt}
            theme={shared.theme}
            unverified
          />
        </>
      ) : (
        <p role="alert" className="rounded-2xl border p-4 text-sm text-muted-foreground">
          {s.invalid}
        </p>
      )}

      <Link
        href="/"
        className="flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
      >
        {s.cta}
      </Link>
    </div>
  );
}
