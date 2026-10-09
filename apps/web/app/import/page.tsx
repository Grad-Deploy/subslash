"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  countMembershipOrders,
  parseReceiptEmails,
  type DiscoveredSubscription,
} from "@subslash/shared";
import { useStore } from "@lib/store";
import { useAuth } from "@hooks/useAuth";
import { useIsClient } from "@hooks/useIsClient";
import { webUrl } from "@lib/api";
import {
  GMAIL_APPS_SCRIPT_MANIFEST,
  GMAIL_HASH_PREFIX,
  GmailImportError,
  decodeGmailImport,
  gmailAppsScript,
} from "@lib/gmail-import";
import { isGmailAutoImportOpen } from "@lib/privacy";
import { AutoImportModal } from "../../components/import/AutoImportModal";
import { CopyBlock } from "../../components/gmail/CopyBlock";
import { GmailAutoImportSetup } from "../../components/gmail/GmailAutoImportSetup";
import { Button } from "../../components/ui/button";
import { Spinner } from "../../components/ui/spinner";
import { Inbox, SearchX } from "lucide-react";
import { IS_APP_BUILD } from "@lib/platform";
import dynamic from "next/dynamic";
import { useKnownText, useT, useLocale } from "@lib/i18n";

// 앱에서만 쓰는 안내. 웹 사용자가 이 코드를 받지 않도록 앱 빌드에서만 불러온다.
const AppImportGuide = IS_APP_BUILD
  ? dynamic(
      () => import("../../components/gmail/app/AppImportGuide").then((m) => m.AppImportGuide),
      { ssr: false },
    )
  : null;

type ImportState =
  | { kind: "checking" }
  | { kind: "guide" }
  | { kind: "error"; message: string }
  | { kind: "ready"; emailCount: number; items: DiscoveredSubscription[] };

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner className="size-8" />
    </div>
  );
}

function Guide() {
  const p = useT().importing.page;
  const locale = useLocale();
  // 로그인했고 원클릭 연결(Gmail 자동 가져오기)을 쓸 수 있으면 스크립트를 붙여 넣는 방법은 접어 둔다. 붙여
  // 넣고 실행하는 사람은 드물지만, 로그인 없이 쓰거나 원클릭이 막혔을 때(Google 심사 전 100명 제한) 유일한
  // 길이라 남긴다. 로그인하지 않았으면 원클릭을 쓸 수 없으므로 펼쳐 둔다.
  const autoOpen = isGmailAutoImportOpen();
  const { account, loading } = useAuth();
  const [directOpen, setDirectOpen] = useState<boolean | null>(null);
  const showDirect = directOpen ?? (!autoOpen || (!loading && !account));
  // 앱에서는 짧은 안내(고를 방법 → 한 단계씩)를 쓴다. 웹의 직접 실행 방법은 가져온 구독이 웹
  // 브라우저에 저장돼 앱에 담기지 않으므로, 앱은 계정으로 받는 자동 가져오기만 안내한다.
  if (AppImportGuide) return <AppImportGuide />;
  const script = gmailAppsScript(webUrl("/import"), locale);

  return (
    <article className="mx-auto max-w-2xl space-y-6 py-6 text-sm leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight">{p.title}</h1>
        <p className="text-muted-foreground">{p.intro}</p>
      </header>

      {autoOpen && <GmailAutoImportSetup />}

      {autoOpen && account && (
        <div className="space-y-1">
          <Button
            variant="link"
            className="h-auto px-0 text-sm"
            aria-expanded={showDirect}
            onClick={() => setDirectOpen(!showDirect)}
          >
            {showDirect ? p.directHide : p.directShow}
          </Button>
          {!showDirect && <p className="text-xs text-muted-foreground">{p.directNote}</p>}
        </div>
      )}

      {showDirect && (
        <>
          {autoOpen && <h2 className="text-base font-bold">{p.direct}</h2>}

          <ol className="list-decimal space-y-2 pl-5">
            <li>
              <a
                href="https://script.new"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                {p.step1Link}
              </a>
              {p.step1After}
            </li>
            <li>{p.step2}</li>
            <li>{p.step3}</li>
            <li>{p.step4}</li>
            <li>{p.step5}</li>
            <li>{p.step6}</li>
          </ol>

          <CopyBlock label={p.manifest} code={GMAIL_APPS_SCRIPT_MANIFEST} />
          <CopyBlock label={p.script} code={script} />

          <ul className="list-disc space-y-1.5 pl-5 text-xs text-muted-foreground">
            <li>{p.note1}</li>
            <li>{p.note2}</li>
            <li>
              {p.note3Before}
              <code>SEARCH_QUERY</code>
              {p.note3After}
            </li>
          </ul>
        </>
      )}
    </article>
  );
}

/**
 * Gmail 가져오기. Apps Script의 버튼이 `/import#gmail=…`로 열고, 그냥 열면 설치 안내를 보여준다.
 */
export default function ImportPage() {
  const router = useRouter();
  const t = useT();
  const p = t.importing.page;
  const known = useKnownText();
  const mounted = useIsClient();
  const [state, setState] = useState<ImportState>({ kind: "checking" });
  // 개발 모드의 StrictMode는 effect를 두 번 돌린다. 첫 번째가 주소의 # 뒤를 지우므로 두 번째가
  // 안내 화면으로 덮어쓰지 않게 한 번만 읽는다.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const { hash } = window.location;
    if (!hash.startsWith(GMAIL_HASH_PREFIX)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 주소는 브라우저에서만 읽을 수 있고, 한 번만 돈다.
      setState({ kind: "guide" });
      return;
    }

    // 메일 내용이 주소창과 방문 기록에 남지 않게 곧바로 지운다.
    window.history.replaceState(null, "", window.location.pathname);
    decodeGmailImport(hash.slice(GMAIL_HASH_PREFIX.length))
      .then((emails) => {
        // 멤버십 혜택을 적을 때 볼 근거(최근 30일 주문 메일 수)를 이미 등록한 멤버십에 적는다. 메일
        // 내용은 여기서만 읽고 수만 남긴다.
        useStore.getState().recordOrderEvidence(countMembershipOrders(emails, new Date()));
        const items = parseReceiptEmails(emails);
        // 이미 등록한 구독에는 찾은 결제 메일들을 곧바로 적는다(영수증이 등록 전 달을 채운다). 새로
        // 등록하는 후보는 등록 창이 등록한 뒤에 적는다.
        useStore.getState().recordChargeHistory(items);
        // 구독 중인 서비스의 마지막 메일이 해지 알림이면 대시보드에서 해지했는지 묻는다(해지로 기록하지 않는다).
        useStore.getState().recordCancelNotices(items);
        setState({ kind: "ready", emailCount: emails.length, items });
      })
      .catch((error: unknown) =>
        setState({
          kind: "error",
          message:
            error instanceof GmailImportError ? error.message : new GmailImportError().message,
        }),
      );
  }, []);

  if (!mounted || state.kind === "checking") return <LoadingScreen />;
  if (state.kind === "guide") return <Guide />;

  if (state.kind === "error" || state.items.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-10 text-center">
        <SearchX className="mx-auto size-10 text-muted-foreground" aria-hidden />
        <h1 className="text-xl font-black tracking-tight">
          {state.kind === "error" ? p.errorTitle : p.noneTitle}
        </h1>
        <p className="text-sm text-muted-foreground">
          {state.kind === "error" ? known(state.message) : p.noneBody(state.emailCount)}
        </p>
        <Button variant="outline" onClick={() => setState({ kind: "guide" })}>
          {p.showGuide}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-10 text-center">
      <Inbox className="mx-auto size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-black tracking-tight">{p.foundTitle}</h1>
      <Button variant="outline" onClick={() => router.replace("/subs")}>
        {p.toList}
      </Button>
      <AutoImportModal
        isOpen
        onClose={() => router.replace("/subs")}
        initialDiscovered={state.items}
        initialResultsNote={p.foundNote(state.emailCount)}
      />
    </div>
  );
}
