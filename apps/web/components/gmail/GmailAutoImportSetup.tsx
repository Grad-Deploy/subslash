"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@hooks/useAuth";
import { webUrl } from "@lib/api";
import { GMAIL_AUTO_SCRIPT_MANIFEST, gmailAutoScript } from "@lib/gmail-import";
import {
  createGmailLink,
  deleteGmailLink,
  fetchGmailLink,
  startGmailConnect,
  type GmailLinkState,
} from "@lib/gmail-auto-client";
import { Button } from "../ui/button";
import { InlineConfirm } from "../ui/inline-confirm";
import { CopyBlock } from "./CopyBlock";

type PendingConfirm = "reconnect" | "rotate" | "disconnect";

const CONFIRM_COPY: Record<PendingConfirm, { message: string; action: string }> = {
  reconnect: {
    message: "다시 연결하면 지금 연결된 검사는 거절되고, 새로 허용한 Google 계정으로 검사합니다.",
    action: "다시 연결",
  },
  rotate: {
    message: "스크립트를 새로 받으면 지금 Apps Script에 붙여 둔 스크립트는 거절됩니다.",
    action: "새로 받기",
  },
  disconnect: {
    message:
      "연결을 끊을까요? 서버에 남은 구독 후보를 지우고, Apps Script가 보내는 메일은 그때부터 거절합니다.",
    action: "연결 끊기",
  },
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("ko-KR");
}

/**
 * Gmail 자동 가져오기 켜기. 로그인한 사람에게만 연결 토큰이 든 스크립트를 준다 — 찾은 구독을
 * 받아 갈 곳이 계정이기 때문이다. 토큰은 발급한 순간에만 보이고 서버에는 해시만 남는다.
 */
export function GmailAutoImportSetup() {
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
        setError(e instanceof Error ? e.message : "연결 상태를 읽지 못했습니다."),
      );
  }, [account]);

  const issueToken = async () => {
    setBusy(true);
    setError(null);
    try {
      setToken(await createGmailLink());
      setLink(await fetchGmailLink());
    } catch (e) {
      setError(e instanceof Error ? e.message : "연결 토큰을 만들지 못했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      // Google 권한 화면으로 간다. 허용하면 웹 앱의 'SubSlash로 돌아가기'로 이 화면에 돌아온다.
      window.location.assign(await startGmailConnect());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gmail 연결을 시작하지 못했습니다.");
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
      setError(e instanceof Error ? e.message : "연결을 끊지 못했습니다.");
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
        <h2 className="text-base font-bold">2주마다 자동으로 가져오기</h2>
        <p className="text-muted-foreground">
          내 Google 계정에서 Apps Script가 2주마다 새 결제 메일을 찾아 SubSlash로 보냅니다.
          SubSlash는 메일에서 구독 후보(서비스·금액·결제일·보낸 사람)만 남기고 메일 제목·본문은
          저장하지 않습니다. 알려진 서비스의 최근 결제는 SubSlash를 열 때 바로 등록되고, 확실하지
          않은 것은 확인을 받습니다.
        </p>
      </div>

      {loading ? null : !account ? (
        <p className="text-muted-foreground">
          찾은 구독을 계정으로 받아 오므로{" "}
          <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
            로그인
          </Link>
          이 필요합니다.
        </p>
      ) : !link ? (
        error ? null : (
          <p className="text-muted-foreground">연결 상태를 확인하는 중입니다…</p>
        )
      ) : !link.open ? null : (
        <>
          {link.linked && (
            <div className="rounded-xl bg-muted/50 p-3 text-xs leading-relaxed">
              <p className="font-semibold">연결됨 · {formatDateTime(link.createdAt)}에 연결</p>
              <p className="text-muted-foreground">
                {link.lastIngestAt
                  ? `마지막 검사 ${formatDateTime(link.lastIngestAt)} · 메일 ${link.lastEmailCount ?? 0}통`
                  : "아직 스크립트가 보낸 적이 없습니다. Apps Script에서 setup을 실행했는지 확인하세요."}
                {link.pendingCount > 0 && ` · 받아 오기를 기다리는 후보 ${link.pendingCount}건`}
              </p>
            </div>
          )}

          {link.connectAvailable && !token && (
            <div className="space-y-2">
              <Button
                disabled={busy}
                onClick={() => (link.linked ? setPendingConfirm("reconnect") : void connect())}
              >
                {link.linked ? "Gmail 다시 연결하기" : "Gmail 연결하기"}
              </Button>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Google 권한 화면에서 메일 읽기, SubSlash로 보내기, 2주마다 실행을 허용하면 끝입니다.
                SubSlash가 아직 Google 심사를 받지 않아 &lsquo;확인되지 않은 앱&rsquo; 경고가 먼저
                나오며, &lsquo;고급&rsquo;에서 계속할 수 있습니다. 허용한 권한은 Google 계정의
                &lsquo;타사 앱 및 서비스&rsquo;에서 언제든 없앨 수 있습니다.
              </p>
              {!showManual && (
                <Button
                  variant="link"
                  className="h-auto px-0 text-xs"
                  onClick={() => setShowManual(true)}
                >
                  경고 없이 직접 설치하기(스크립트 복사)
                </Button>
              )}
            </div>
          )}

          {(!link.connectAvailable || showManual || token) && (
            <div className="space-y-3">
              {link.connectAvailable && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  직접 설치하면 내 계정에 내가 만든 스크립트라 Google 심사 대상이 아닙니다. 대신
                  매니페스트와 스크립트를 붙여 넣고 한 번 실행해야 합니다.
                </p>
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
                        Apps Script 새 프로젝트
                      </a>
                      를 만듭니다.
                    </li>
                    <li>
                      왼쪽의 톱니바퀴(프로젝트 설정)에서 <code>appsscript.json</code> 매니페스트
                      파일을 편집기에 표시하도록 켭니다.
                    </li>
                    <li>
                      <code>appsscript.json</code> 내용을 아래 매니페스트로, <code>Code.gs</code>{" "}
                      내용을 아래 스크립트로 바꾸고 저장합니다.
                    </li>
                    <li>
                      위쪽 함수 목록에서 <code>setup</code>을 골라 실행하고 권한을 허용합니다. 직접
                      만든 스크립트라 Google이 확인하지 않은 앱이라는 경고가 나오며,
                      &lsquo;고급&rsquo;에서 계속할 수 있습니다.
                    </li>
                    <li>
                      끝입니다. 지금 한 번 검사하고, 그 뒤로 2주마다 월요일 오전 9시대에 검사합니다.
                    </li>
                  </ol>
                  <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
                    이 스크립트에는 내 계정의 연결 토큰이 들어 있어 지금만 보입니다. 다른 사람과
                    공유하지 마세요. 잃어버리면 새로 받으면 됩니다.
                  </p>
                  <CopyBlock label="매니페스트" code={GMAIL_AUTO_SCRIPT_MANIFEST} />
                  <CopyBlock
                    label="스크립트"
                    code={gmailAutoScript(webUrl("/api/gmail/ingest"), token)}
                  />
                </div>
              ) : (
                <Button
                  disabled={busy}
                  onClick={() => (link.linked ? setPendingConfirm("rotate") : void issueToken())}
                >
                  {link.linked ? "스크립트 새로 받기" : "자동 가져오기 켜기"}
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
              연결 끊기
            </Button>
          )}

          {pendingConfirm && (
            <InlineConfirm
              message={CONFIRM_COPY[pendingConfirm].message}
              confirmText={CONFIRM_COPY[pendingConfirm].action}
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
