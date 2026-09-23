"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseReceiptEmails, type DiscoveredSubscription } from "@subslash/shared";
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
  const script = gmailAppsScript(webUrl("/import"));

  return (
    <article className="mx-auto max-w-2xl space-y-6 py-6 text-sm leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight">Gmail 결제 메일에서 구독 찾기</h1>
        <p className="text-muted-foreground">
          한 번 설정하면 최근 결제 메일에서 구독을 찾아 줘요. 메일은 서버를 거치지 않고 이
          브라우저에서만 읽어요.
        </p>
      </header>

      {isGmailAutoImportOpen() && <GmailAutoImportSetup />}

      {isGmailAutoImportOpen() && <h2 className="text-base font-bold">직접 실행해서 가져오기</h2>}

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
          를 만드세요.
        </li>
        <li>
          톱니바퀴(프로젝트 설정)에서 <code>appsscript.json</code> 표시를 켜세요.
        </li>
        <li>
          <code>appsscript.json</code>에 아래 매니페스트를 붙여 넣으세요(메일 읽기 권한만 요청).
        </li>
        <li>
          <code>Code.gs</code>에 아래 스크립트를 붙여 넣고 저장하세요.
        </li>
        <li>
          배포 → 새 배포 → &lsquo;웹 앱&rsquo;으로 배포하고 메일 읽기를 허용하세요. 경고가 나오면
          &lsquo;고급&rsquo;에서 계속하세요.
        </li>
        <li>
          웹 앱 주소를 열고 &lsquo;SubSlash로 가져오기&rsquo;를 누르세요. 다음부터는 주소만 열면
          돼요.
        </li>
      </ol>

      <CopyBlock label="매니페스트" code={GMAIL_APPS_SCRIPT_MANIFEST} />
      <CopyBlock label="스크립트" code={script} />

      <ul className="list-disc space-y-1.5 pl-5 text-xs text-muted-foreground">
        <li>금액·결제일이 틀리게 읽힐 수 있어요. 등록 전에 확인하세요.</li>
        <li>가져온 구독은 버튼을 연 브라우저에 저장돼요.</li>
        <li>
          빠진 메일이 있으면 스크립트의 <code>SEARCH_QUERY</code>에 그 메일 제목의 단어를 더하세요.
        </li>
      </ul>
    </article>
  );
}

/**
 * Gmail 가져오기. Apps Script의 버튼이 `/import#gmail=…`로 열고, 그냥 열면 설치 안내를 보여준다.
 */
export default function ImportPage() {
  const router = useRouter();
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
      .then((emails) =>
        setState({ kind: "ready", emailCount: emails.length, items: parseReceiptEmails(emails) }),
      )
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
          {state.kind === "error" ? "메일을 가져오지 못했어요" : "구독 결제를 찾지 못했어요"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {state.kind === "error"
            ? state.message
            : `메일 ${state.emailCount}통에서 결제 메일을 찾지 못했어요. SEARCH_QUERY에 결제 메일 제목의 단어를 더해 보세요.`}
        </p>
        <Button variant="outline" onClick={() => setState({ kind: "guide" })}>
          설치 안내 보기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-10 text-center">
      <Inbox className="mx-auto size-10 text-muted-foreground" aria-hidden />
      <h1 className="text-xl font-black tracking-tight">찾은 구독을 확인하세요</h1>
      <Button variant="outline" onClick={() => router.replace("/subs")}>
        구독 목록
      </Button>
      <AutoImportModal
        isOpen
        onClose={() => router.replace("/subs")}
        initialDiscovered={state.items}
        initialResultsNote={`Gmail 메일 ${state.emailCount}통에서`}
      />
    </div>
  );
}
