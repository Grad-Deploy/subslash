"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, Lock, X } from "lucide-react";
import { useIsClient } from "@hooks/useIsClient";
import { useAuth } from "@hooks/useAuth";
import { webUrl } from "@lib/api";
import { GMAIL_AUTO_SCRIPT_MANIFEST, gmailAutoScript } from "@lib/gmail-import";
import { leaveForExternal, openExternal } from "@lib/native";
import {
  createGmailLink,
  deleteGmailLink,
  fetchGmailLink,
  markGmailConnectStarted,
  requestGmailDiscoveriesAfterConnect,
  startGmailConnect,
  type GmailLinkState,
} from "@lib/gmail-auto-client";
import { GmailOlderScanNotice } from "../GmailOlderScanNotice";
import { isGmailAutoImportOpen } from "@lib/privacy";
import { InlineConfirm } from "../../ui/inline-confirm";
import { Spinner } from "../../ui/spinner";
import { AppCopyCode } from "./AppCopyCode";
import { AppImportFlow } from "./AppImportFlow";
import { AppStepper, StepTip, type AppStep } from "./AppStepper";
import { useOverlayLock } from "@hooks/useOverlayLock";
import { useLatestT, useT, useLocale } from "@lib/i18n";

type PendingConfirm = "reconnect" | "rotate" | "disconnect";

/**
 * 앱의 결제 메일 불러오기(/import 안내). 웹의 긴 안내 대신 고를 방법 → 한 단계씩으로 나눈다.
 *
 * 앱에서는 자동 가져오기(계정 연결)만 안내한다. 웹의 '직접 실행해서 가져오기'는 스크립트가 웹 주소
 * (webUrl("/import"))를 열어 가져온 구독이 **웹 브라우저**에 저장되므로, 앱에 담기지 않는다.
 * 자동 가져오기는 서버가 계정으로 후보를 모아 두고, 앱이 열릴 때 GmailDiscoveryInbox가 받아 온다.
 * 연결 로직은 웹의 GmailAutoImportSetup과 같은 API를 쓴다.
 */
export function AppImportGuide() {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const g = t.importing.guide;
  const tRef = useLatestT();
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(g.dateFormat, { month: "long", day: "numeric" });
  const confirmCopy = {
    reconnect: g.confirmReconnect,
    rotate: g.confirmRotate,
    disconnect: g.confirmDisconnect,
  };
  const { account, loading } = useAuth();
  const [link, setLink] = useState<GmailLinkState | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [manual, setManual] = useState(false);
  const [pcSheet, setPcSheet] = useState(false);

  useEffect(() => {
    if (!account) return;
    fetchGmailLink()
      .then(setLink)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : tRef.current.importing.guide.readFailed),
      );
  }, [account, tRef]);

  const refresh = () =>
    fetchGmailLink()
      .then(setLink)
      .catch(() => undefined);

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      // 앱 웹뷰가 통째로 나가면 담아 둔 화면을 잃으므로 인앱 브라우저로 열고, 닫히면 다시 읽는다.
      const url = await startGmailConnect(locale);
      markGmailConnectStarted();
      leaveForExternal(url, () => {
        setBusy(false);
        void refresh();
        // 웹 앱이 최근 메일 검사까지 마쳤다. 앱은 화면이 새로 열리지 않으므로 찾은 구독을
        // 받으라고 알려야 한다 — 알리지 않으면 앱을 껐다 켤 때까지 등록되지 않았다. 나머지 1년 치는
        // 1분쯤 뒤에 오므로 조금 뒤에 다시 받는다.
        requestGmailDiscoveriesAfterConnect();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : tRef.current.importing.guide.connectFailed);
      setBusy(false);
    }
  };

  const issueToken = async () => {
    setBusy(true);
    setError(null);
    try {
      setToken(await createGmailLink());
      setStepIndex(0);
      setManual(true);
      void refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : tRef.current.importing.guide.tokenFailed);
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
      setManual(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : tRef.current.importing.guide.disconnectFailed);
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

  const confirmBox = pendingConfirm && (
    <InlineConfirm
      message={confirmCopy[pendingConfirm].message}
      confirmText={confirmCopy[pendingConfirm].action}
      disabled={busy}
      onCancel={() => setPendingConfirm(null)}
      onConfirm={runConfirm}
    />
  );

  const errorBox = error && (
    <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
      {error}
    </p>
  );

  // 직접 설치(경고 없이): 토큰이 든 스크립트를 한 단계씩 붙여 넣는다.
  if (manual && token) {
    const steps: AppStep[] = [
      {
        title: g.step1Title,
        next: g.step1Next,
        body: (
          <>
            <p>{g.step1Body}</p>
            <button
              type="button"
              onClick={() => openExternal("https://script.new")}
              className="h-11 w-full rounded-xl border text-sm font-bold text-foreground"
            >
              {g.step1Open}
            </button>
          </>
        ),
      },
      {
        title: g.step2Title,
        next: g.step2Next,
        body: (
          <p>
            {g.step2Before}
            <b className="text-foreground">{g.step2Gear}</b>
            {g.step2Mid}
            <b className="text-foreground">{g.step2Setting}</b>
            {g.step2After}
          </p>
        ),
      },
      {
        title: g.step3Title,
        next: g.step3Next,
        body: (
          <>
            <p>{g.step3Body}</p>
            <AppCopyCode label="appsscript.json" code={GMAIL_AUTO_SCRIPT_MANIFEST} />
            <AppCopyCode
              label="Code.gs"
              code={gmailAutoScript(webUrl("/api/gmail/ingest"), token)}
            />
            <StepTip title={g.step3Tip}>{g.step3TipBody}</StepTip>
          </>
        ),
      },
      {
        title: g.step4Title,
        next: g.step4Next,
        body: (
          <>
            <p>
              {g.step4Before}
              <b className="text-foreground">setup</b>
              {g.step4After}
            </p>
            <StepTip title={g.step4Tip}>
              {g.step4TipBefore}
              <b>{g.step4TipBold}</b>
              {g.step4TipAfter}
            </StepTip>
          </>
        ),
      },
      {
        title: g.step5Title,
        next: g.step5Next,
        body: <p>{g.step5Body}</p>,
      },
    ];
    return (
      <article className="mx-auto w-full max-w-md min-w-0 py-4">
        <AppStepper
          steps={steps}
          index={stepIndex}
          onIndex={setStepIndex}
          onDone={() => {
            setManual(false);
            setToken(null);
            void refresh();
          }}
        />
      </article>
    );
  }

  const linked = link?.open && link.linked ? link : null;

  return (
    <article className="mx-auto w-full max-w-md min-w-0 space-y-4 py-4 text-sm">
      <header className="space-y-2">
        <h1 className="text-[22px] leading-tight font-black tracking-tight">
          {g.headline1}
          <br />
          {g.headline2}
        </h1>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11.5px] font-semibold">
          <Lock className="size-3" aria-hidden />
          {g.privacy}
        </p>
      </header>

      {errorBox}

      {!isGmailAutoImportOpen() ? (
        <section className="rounded-2xl border bg-card p-4">
          <p className="font-bold">{g.unavailableTitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">{g.unavailableBody}</p>
        </section>
      ) : loading || (account && !link && !error) ? (
        <div className="flex justify-center py-10">
          <Spinner className="size-6" />
        </div>
      ) : linked ? (
        <>
          <section className="flex items-center gap-3 rounded-2xl border bg-card p-4">
            <span className="size-2.5 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            <div>
              <p className="font-bold">{g.connected}</p>
              <p className="text-xs text-muted-foreground">{g.connectedNote}</p>
            </div>
          </section>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground">{g.lastScan}</p>
              <p className="text-lg font-black tracking-tight">
                {linked.lastIngestAt ? formatDate(linked.lastIngestAt) : g.never}
              </p>
            </div>
            <div className="rounded-2xl border px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground">{g.candidates}</p>
              <p className="text-lg font-black tracking-tight">
                {g.candidateCount(linked.pendingCount)}
              </p>
            </div>
          </div>
          <GmailOlderScanNotice createdAt={linked.createdAt} />
          {!linked.lastIngestAt && <p className="text-xs text-muted-foreground">{g.noScript}</p>}
          {linked.pendingCount > 0 && (
            <p className="rounded-xl bg-secondary px-3 py-2 text-xs">{g.goConfirm}</p>
          )}
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground"
          >
            {g.goDashboard}
          </button>
          {confirmBox}
          <div className="flex justify-center gap-4 text-xs font-medium text-muted-foreground">
            {linked.connectAvailable && (
              <button type="button" disabled={busy} onClick={() => setPendingConfirm("reconnect")}>
                {g.reconnect}
              </button>
            )}
            <button type="button" disabled={busy} onClick={() => setPendingConfirm("rotate")}>
              {g.rotate}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setPendingConfirm("disconnect")}
              className="underline underline-offset-4"
            >
              {g.disconnect}
            </button>
          </div>
        </>
      ) : (
        <>
          <AppImportFlow />
          {!account ? (
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="h-12 w-full rounded-xl bg-primary text-sm font-extrabold text-primary-foreground"
            >
              {g.loginConnect}
            </button>
          ) : link?.open && link.connectAvailable ? (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => void connect()}
                className="h-12 w-full rounded-xl bg-primary text-sm font-extrabold text-primary-foreground disabled:opacity-50"
              >
                {busy ? g.connecting : g.connect}
              </button>
              <p className="px-0.5 text-[11px] leading-relaxed text-muted-foreground">
                {g.warningBefore}
                <b className="text-foreground">{g.warningBold}</b>
                {g.warningAfter}
              </p>
              <button
                type="button"
                onClick={() => setPcSheet(true)}
                className="mx-auto block pt-1 text-[12.5px] font-semibold text-muted-foreground underline underline-offset-4"
              >
                {g.installPc}
              </button>
            </>
          ) : link?.open ? (
            // 서버에서 계정 연결을 열지 않았으면 직접 설치가 유일한 방법이다.
            <button
              type="button"
              onClick={() => setPcSheet(true)}
              className="h-12 w-full rounded-xl bg-primary text-sm font-extrabold text-primary-foreground"
            >
              {g.installDirect}
            </button>
          ) : null}
        </>
      )}

      <PcInstallSheet
        open={pcSheet}
        onClose={() => setPcSheet(false)}
        busy={busy}
        onPhone={() => {
          setPcSheet(false);
          void issueToken();
        }}
      />

      <details className="group border-t pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[13px] font-bold">
          {g.whatTitle}
          <ChevronDown
            className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed break-words text-muted-foreground">
          <li>{g.what1}</li>
          <li>{g.what2}</li>
          <li>{g.what3}</li>
          <li>{g.what4}</li>
          <li>{g.what5}</li>
        </ul>
      </details>
    </article>
  );
}

/**
 * '직접 설치하기'를 누르면 먼저 PC를 권한다. Apps Script 편집기는 PC용이라 폰의 인앱 브라우저에서는
 * 설정 켜기·파일 두 개 붙여넣기·setup 실행이 불편하다. 연결은 계정 단위로 서버에 있으므로 PC 웹에서
 * 같은 계정으로 설치해도 앱에 그대로 반영된다. 그래도 폰에서 하겠다면 단계 안내로 넘어간다.
 */
function PcInstallSheet({
  open,
  onClose,
  onPhone,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onPhone: () => void;
  busy: boolean;
}) {
  const g = useT().importing.guide;
  const pcSteps = [
    [g.pcStep1, g.pcStep1Sub],
    [g.pcStep2, g.pcStep2Sub],
    [g.pcStep3, g.pcStep3Sub],
  ] as const;
  const isClient = useIsClient();
  const address = webUrl("/import");

  useOverlayLock(open, onClose);

  if (!open || !isClient) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex h-[100dvh] items-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pc-install-title"
        className="relative flex max-h-[88dvh] w-full flex-col rounded-t-3xl border-t bg-background shadow-2xl animate-in slide-in-from-bottom-8 fade-in"
      >
        <div className="flex h-6 shrink-0 items-center justify-center">
          <span className="h-1 w-9 rounded-full bg-border" aria-hidden />
        </div>
        <header className="flex shrink-0 items-start justify-between gap-3 px-5 pb-2">
          <div>
            <h2 id="pc-install-title" className="text-lg font-black tracking-tight">
              {g.pcTitle}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{g.pcHint}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="size-5" />
            <span className="sr-only">{g.close}</span>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-3">
          <ol>
            {pcSteps.map(([title, sub], i) => (
              <li key={title} className="flex items-center gap-3 py-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-secondary text-[13px] font-extrabold">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-bold">{title}</span>
                  <span className="block text-[11px] text-muted-foreground">{sub}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-2">
            <AppCopyCode label={g.webAddress} code={address} />
          </div>
        </div>
        <div className="grid shrink-0 gap-2 border-t px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="h-12 w-full rounded-xl bg-primary text-sm font-extrabold text-primary-foreground"
          >
            {g.understood}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onPhone}
            className="h-11 w-full rounded-xl border text-[13px] font-bold disabled:opacity-50"
          >
            {g.stayPhone}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
