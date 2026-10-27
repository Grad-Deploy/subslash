"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@hooks/useAuth";
import { useLatestT, useLocale, type Messages } from "@lib/i18n";
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

export type GmailLinkConfirm = "reconnect" | "rotate" | "disconnect";

interface GmailLinkFailures {
  readFailed: string;
  tokenFailed: string;
  connectFailed: string;
  disconnectFailed: string;
}

/**
 * Gmail 자동 가져오기의 연결 상태와 연결·토큰 발급·끊기. 웹(`GmailAutoImportSetup`)과 앱(`AppImportGuide`)이
 * 같은 API를 같은 순서로 부르므로 한 곳에 둔다 — 따로 두면 연결 뒤 찾은 구독을 받으라고 알리는 것처럼 앱에서
 * 꼭 필요한 단계를 한쪽만 고치게 된다. 화면마다 다른 것은 오류 문구(`failures`, 화면의 말투)와 토큰을 받거나
 * 끊은 뒤 화면이 할 일(`onTokenIssued`·`onDisconnected`)뿐이다.
 */
export function useGmailLink({
  failures,
  onTokenIssued,
  onDisconnected,
}: {
  failures: (t: Messages) => GmailLinkFailures;
  onTokenIssued?: () => void;
  onDisconnected?: () => void;
}) {
  const tRef = useLatestT();
  const locale = useLocale();
  const { account, loading } = useAuth();
  const [link, setLink] = useState<GmailLinkState | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<GmailLinkConfirm | null>(null);

  const failed = (e: unknown, key: keyof GmailLinkFailures) =>
    setError(e instanceof Error ? e.message : failures(tRef.current)[key]);

  useEffect(() => {
    if (!account) return;
    fetchGmailLink()
      .then(setLink)
      .catch((e: unknown) => failed(e, "readFailed"));
    // failures는 부를 때마다 새 함수라 넣지 않는다. 문구는 tRef로 그때의 것을 읽는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, tRef]);

  // 연결 상태를 다시 읽는다. 방금 한 일(발급·끊기)은 이미 됐으므로 읽지 못해도 그 일의 실패로 보이지 않는다.
  const refresh = () =>
    fetchGmailLink()
      .then(setLink)
      .catch(() => undefined);

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
        void refresh();
        // 웹 앱이 최근 메일 검사까지 마쳤다. 앱은 화면이 새로 열리지 않으므로 찾은 구독을 받으라고
        // 알려야 한다 — 알리지 않으면 앱을 껐다 켤 때까지 등록되지 않았다. 나머지 1년 치는 1분쯤 뒤에
        // 오므로 조금 뒤에 다시 받는다.
        requestGmailDiscoveriesAfterConnect();
      });
    } catch (e) {
      failed(e, "connectFailed");
      setBusy(false);
    }
  };

  const issueToken = async () => {
    setBusy(true);
    setError(null);
    try {
      setToken(await createGmailLink());
      onTokenIssued?.();
      void refresh();
    } catch (e) {
      failed(e, "tokenFailed");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    setError(null);
    try {
      await deleteGmailLink();
      setToken(null);
      onDisconnected?.();
      await refresh();
    } catch (e) {
      failed(e, "disconnectFailed");
    } finally {
      setBusy(false);
    }
  };

  /** 확인 창에서 '확인'을 눌렀을 때. 물어 둔 일을 한다. */
  const runConfirm = () => {
    const kind = pendingConfirm;
    setPendingConfirm(null);
    if (kind === "reconnect") void connect();
    else if (kind === "rotate") void issueToken();
    else if (kind === "disconnect") void disconnect();
  };

  return {
    account,
    loading,
    link,
    token,
    /** 토큰을 다 쓴 뒤(앱의 단계 안내를 마침) 화면에서 치운다. */
    clearToken: () => setToken(null),
    busy,
    error,
    pendingConfirm,
    setPendingConfirm,
    refresh,
    connect,
    issueToken,
    runConfirm,
  };
}
