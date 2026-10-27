"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGmailLink } from "@hooks/useGmailLink";
import { webUrl } from "@lib/api";
import { GMAIL_AUTO_SCRIPT_MANIFEST, gmailAutoScript } from "@lib/gmail-import";
import { Button } from "../ui/button";
import { InlineConfirm } from "../ui/inline-confirm";
import { CopyBlock } from "./CopyBlock";
import { GmailOlderScanNotice } from "./GmailOlderScanNotice";
import { ScriptNewStep } from "./ScriptNewStep";
import { useKnownText, useLocale, useT } from "@lib/i18n";
import { appsScriptLocale } from "@lib/i18n/config";

/**
 * Gmail 자동 가져오기 켜기. 로그인한 사람에게만 연결 토큰이 든 스크립트를 준다 — 찾은 구독을
 * 받아 갈 곳이 계정이기 때문이다. 토큰은 발급한 순간에만 보이고 서버에는 해시만 남는다.
 */
export function GmailAutoImportSetup() {
  const t = useT();
  const known = useKnownText();
  const locale = useLocale();
  const s = t.importing.setup;
  const formatDateTime = (iso: string) => new Date(iso).toLocaleString(t.importing.locale);
  const {
    account,
    loading,
    link,
    token,
    busy,
    error,
    pendingConfirm,
    setPendingConfirm,
    connect,
    issueToken,
    runConfirm,
  } = useGmailLink({ failures: (m) => m.importing.setup });
  // 원클릭 연결이 있을 때 복사 방식은 접어 둔다.
  const [showManual, setShowManual] = useState(false);

  return (
    <section className="space-y-3 rounded-2xl border p-4">
      <div className="space-y-1">
        <h2 className="text-base font-bold">{s.title}</h2>
        <p className="text-muted-foreground">{s.body}</p>
      </div>

      {loading ? null : !account ? (
        <p className="text-muted-foreground">
          {s.needLoginBefore}
          <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
            {s.login}
          </Link>
          {s.needLoginAfter}
        </p>
      ) : !link ? (
        error ? null : (
          <p className="text-muted-foreground">{s.checking}</p>
        )
      ) : !link.open ? null : (
        <>
          {link.linked && (
            <div className="rounded-xl bg-muted/50 p-3 text-xs leading-relaxed">
              <p className="font-semibold">{s.linked(formatDateTime(link.createdAt))}</p>
              <p className="text-muted-foreground">
                {link.lastIngestAt
                  ? s.lastScan(formatDateTime(link.lastIngestAt), link.lastEmailCount ?? 0)
                  : s.noMail}
                {link.pendingCount > 0 && s.pending(link.pendingCount)}
              </p>
            </div>
          )}
          {link.linked && <GmailOlderScanNotice createdAt={link.createdAt} />}

          {link.connectAvailable && !token && (
            <div className="space-y-2">
              <Button
                disabled={busy}
                onClick={() => (link.linked ? setPendingConfirm("reconnect") : void connect())}
              >
                {link.linked ? s.reconnectButton : s.connectButton}
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">{s.permissionNote}</p>
              {!showManual && (
                <Button
                  variant="link"
                  className="h-auto px-0 text-xs"
                  onClick={() => setShowManual(true)}
                >
                  {s.manual}
                </Button>
              )}
            </div>
          )}

          {(!link.connectAvailable || showManual || token) && (
            <div className="space-y-3">
              {link.connectAvailable && (
                <p className="text-xs leading-relaxed text-muted-foreground">{s.manualNote}</p>
              )}
              {token ? (
                <div className="space-y-3">
                  <ol className="list-decimal space-y-2 pl-5">
                    <ScriptNewStep />
                    <li>{s.manualStep2}</li>
                    <li>{s.manualStep3}</li>
                    <li>{s.manualStep4}</li>
                    <li>{s.manualStep5}</li>
                  </ol>
                  <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                    {s.tokenWarning}
                  </p>
                  <CopyBlock label={t.importing.page.manifest} code={GMAIL_AUTO_SCRIPT_MANIFEST} />
                  <CopyBlock
                    label={t.importing.page.script}
                    code={gmailAutoScript(
                      webUrl("/api/gmail/ingest"),
                      token,
                      appsScriptLocale(locale),
                    )}
                  />
                </div>
              ) : (
                <Button
                  disabled={busy}
                  onClick={() => (link.linked ? setPendingConfirm("rotate") : void issueToken())}
                >
                  {link.linked ? s.rotateButton : s.enableButton}
                </Button>
              )}
            </div>
          )}

          {link.linked && (
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              disabled={busy}
              onClick={() => setPendingConfirm("disconnect")}
            >
              {s.disconnectButton}
            </Button>
          )}

          {pendingConfirm && (
            <InlineConfirm
              message={s[pendingConfirm].message}
              confirmText={s[pendingConfirm].action}
              disabled={busy}
              onCancel={() => setPendingConfirm(null)}
              onConfirm={runConfirm}
            />
          )}
        </>
      )}

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {known(error)}
        </p>
      )}
    </section>
  );
}
