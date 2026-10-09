"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@hooks/useAuth";
import { webUrl } from "@lib/api";
import { GMAIL_AUTO_SCRIPT_MANIFEST, gmailAutoScript } from "@lib/gmail-import";
import { leaveForExternal } from "@lib/native";
import {
  createGmailLink,
  deleteGmailLink,
  fetchGmailLink,
  markGmailConnectStarted,
  requestGmailDiscoveriesAfterConnect,
  startGmailConnect,
  type GmailLinkState,
} from "@lib/gmail-auto-client";
import { Button } from "../ui/button";
import { InlineConfirm } from "../ui/inline-confirm";
import { CopyBlock } from "./CopyBlock";
import { GmailOlderScanNotice } from "./GmailOlderScanNotice";
import { useLatestT, useT, useLocale } from "@lib/i18n";

type PendingConfirm = "reconnect" | "rotate" | "disconnect";

/**
 * Gmail 자동 가져오기 켜기. 로그인한 사람에게만 연결 토큰이 든 스크립트를 준다 — 찾은 구독을
 * 받아 갈 곳이 계정이기 때문이다. 토큰은 발급한 순간에만 보이고 서버에는 해시만 남는다.
 */
export function GmailAutoImportSetup() {
  const t = useT();
  const locale = useLocale();
  const s = t.importing.setup;
  const tRef = useLatestT();
  const formatDateTime = (iso: string) => new Date(iso).toLocaleString(t.importing.locale);
  const { account, loading } = useAuth();
  const [link, setLink] = useState<GmailLinkState | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  // 원클릭 연결이 있을 때 복사 방식은 접어 둔다.
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    if (!account) return;
    fetchGmailLink()
      .then(setLink)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : tRef.current.importing.setup.readFailed),
      );
  }, [account, tRef]);

  const issueToken = async () => {
    setBusy(true);
    setError(null);
    try {
      setToken(await createGmailLink());
      setLink(await fetchGmailLink());
    } catch (e) {
      setError(e instanceof Error ? e.message : tRef.current.importing.setup.tokenFailed);
    } finally {
      setBusy(false);
    }
  };

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      // Google 권한 화면으로 간다. 웹에서는 이 탭이 그대로 가고(돌아오면 화면이 다시 그려진다),
      // 앱에서는 인앱 브라우저로 열고 닫힐 때 연결 상태를 다시 읽는다 — 앱 웹뷰가 통째로 나가면
      // 담아 둔 화면을 잃는다.
      const url = await startGmailConnect(locale);
      markGmailConnectStarted();
      leaveForExternal(url, () => {
        setBusy(false);
        fetchGmailLink()
          .then(setLink)
          .catch(() => undefined);
        // 연결하면서 최근 메일 검사가 끝났으니 찾은 구독을 바로 받고, 1분쯤 뒤에 오는 나머지 1년 치도
        // 이어서 받는다.
        requestGmailDiscoveriesAfterConnect();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : tRef.current.importing.setup.connectFailed);
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteGmailLink();
      setToken(null);
      setLink(await fetchGmailLink());
    } catch (e) {
      setError(e instanceof Error ? e.message : tRef.current.importing.setup.disconnectFailed);
    } finally {
      setBusy(false);
    }
  };

  const runConfirm = () => {
    const kind = pendingConfirm;
    setPendingConfirm(null);
    if (kind === "reconnect") void connect();
    else if (kind === "rotate") void issueToken();
    else if (kind === "disconnect") void disconnect();
  };

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
                    <li>
                      <a
                        href="https://script.new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline underline-offset-2"
                      >
                        {t.importing.page.step1Link}
                      </a>
                      {t.importing.page.step1After}
                    </li>
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
                    code={gmailAutoScript(webUrl("/api/gmail/ingest"), token)}
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
          {error}
        </p>
      )}
    </section>
  );
}
