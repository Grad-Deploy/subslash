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
 *
 * 읽자마자 주소창에서 `#` 뒤를 지운다 — 주소창·방문 기록·기기 간 동기화에 영수증이 남는 것을 줄인다(브라우저가 이미 적어 둔
 * 기록까지 지우지는 못한다). 읽은 값은 이 화면의 메모리에만 두므로, 새로고침하면 받은 링크를 다시 열어 달라고 한다.
 */
export default function SharedReceiptPage() {
  const t = useT();
  const s = t.receiptView.shared;
  // 주소창에서 떼어 낸 `#` 뒤. null이면 아직 읽지 않았고, ""면 열 때 링크가 없었다(지운 뒤 새로고침 등).
  const [hash, setHash] = useState<string | null>(null);
  // undefined: 푸는 중, null: 읽지 못함
  const [shared, setShared] = useState<SharedReceipt | null | undefined>(undefined);

  useEffect(() => {
    const take = () => {
      const current = window.location.hash;
      if (current) {
        window.history.replaceState(
          window.history.state,
          "",
          window.location.pathname + window.location.search,
        );
      }
      // 이미 읽은 뒤에 `#` 없이 바뀐 것(우리가 지운 것)은 받은 링크를 버리지 않는다.
      setHash((previous) => (current ? current : (previous ?? "")));
    };
    take();
    window.addEventListener("hashchange", take);
    return () => window.removeEventListener("hashchange", take);
  }, []);

  // 가린 이름('구독 1')은 화면 언어로 붙인다. 첫 화면은 한국어로 그린 뒤 기기 언어로 바뀌므로 언어가 바뀌면 다시 푼다.
  const { maskedName, maskedKilled } = s;
  useEffect(() => {
    if (!hash) return;
    let cancelled = false;
    void decodeReceiptShare(hash, { masked: maskedName, maskedKilled }).then((value) => {
      if (!cancelled) setShared(value);
    });
    return () => {
      cancelled = true;
    };
  }, [hash, maskedName, maskedKilled]);

  if (hash === null || (hash && shared === undefined)) return <PageSpinner />;

  return (
    <div className="mx-auto max-w-md space-y-5 py-2">
      <header className="space-y-2">
        <p className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold text-muted-foreground">
          <ReceiptText className="size-3.5" aria-hidden />
          {s.badge}
        </p>
        <h1 className="text-2xl font-black tracking-tight">{t.receiptView.title}</h1>
      </header>

      {hash && shared ? (
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
            render={shared.render}
          />
        </>
      ) : (
        <p role="alert" className="rounded-2xl border p-4 text-sm text-muted-foreground">
          {hash ? s.invalid : s.reopen}
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
