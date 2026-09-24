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
import { IS_APP_BUILD } from "@lib/platform";
import dynamic from "next/dynamic";

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
  // 앱에서는 짧은 안내(고를 방법 → 한 단계씩)를 쓴다. 웹의 직접 실행 방법은 가져온 구독이 웹
  // 브라우저에 저장돼 앱에 담기지 않으므로, 앱은 계정으로 받는 자동 가져오기만 안내한다.
  if (AppImportGuide) return <AppImportGuide />;
  const script = gmailAppsScript(webUrl("/import"));

  return (
    <article className="mx-auto max-w-2xl space-y-6 py-6 text-sm leading-relaxed">
      <header className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight">Gmail 결제 메일에서 구독 찾기</h1>
        <p className="text-muted-foreground">
          내 Google 계정에 Apps Script를 한 번 만들어 두면, 열 때마다 최근 결제 메일을 찾아
          SubSlash로 넘깁니다. 메일 내용은 SubSlash 서버를 거치지 않고 이 브라우저 안에서만 읽히고,
          목록을 보고 직접 고른 구독만 등록됩니다.
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
          를 만듭니다.
        </li>
        <li>
          왼쪽의 톱니바퀴(프로젝트 설정)에서 <code>appsscript.json</code> 매니페스트 파일을 편집기에
          표시하도록 켭니다.
        </li>
        <li>
          편집기의 <code>appsscript.json</code> 내용을 지우고 아래 매니페스트를 붙여 넣습니다. 메일
          읽기 권한 하나만 요청하도록 적혀 있습니다.
        </li>
        <li>
          <code>Code.gs</code> 내용을 지우고 아래 스크립트를 붙여 넣은 뒤 저장합니다.
        </li>
        <li>
          배포 → 새 배포 → 유형 &lsquo;웹 앱&rsquo;으로 배포하고, 권한 화면에서 메일 읽기를
          허용합니다. 직접 만든 스크립트라 Google이 확인하지 않은 앱이라는 경고가 나오며,
          &lsquo;고급&rsquo;에서 계속할 수 있습니다.
        </li>
        <li>
          받은 웹 앱 주소를 열고 &lsquo;SubSlash로 가져오기&rsquo;를 누릅니다. 다음부터는 그 주소만
          열면 됩니다.
        </li>
      </ol>

      <CopyBlock label="매니페스트" code={GMAIL_APPS_SCRIPT_MANIFEST} />
      <CopyBlock label="스크립트" code={script} />

      <ul className="list-disc space-y-1.5 pl-5 text-xs text-muted-foreground">
        <li>
          메일 형식은 서비스마다 달라 금액·결제일·연간 여부가 틀리게 읽힐 수 있습니다. 등록 전에
          목록에서 확인하고, 등록한 뒤에도 구독 상세에서 고칠 수 있습니다.
        </li>
        <li>
          가져온 구독은 버튼을 연 브라우저의 SubSlash에 저장됩니다. 결제 알림에서 캘린더 구독을 켜
          두었다면 등록한 구독도 캘린더에 들어갑니다(캘린더 앱이 주소를 다시 읽을 때 반영됩니다).
        </li>
        <li>
          찾는 메일은 스크립트의 <code>SEARCH_QUERY</code>에 적혀 있습니다. 빠지는 결제 메일이
          있으면 그 메일 제목의 단어를 더하세요.
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
          {state.kind === "error" ? "메일을 가져오지 못했습니다" : "구독 결제를 찾지 못했습니다"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {state.kind === "error"
            ? state.message
            : `메일 ${state.emailCount}통에서 금액이 적힌 결제 메일을 찾지 못했습니다. 스크립트의 SEARCH_QUERY에 결제 메일 제목의 단어를 더해 보세요.`}
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
      <h1 className="text-xl font-black tracking-tight">Gmail에서 찾은 구독을 확인하세요</h1>
      <Button variant="outline" onClick={() => router.replace("/subs")}>
        구독 목록으로 이동
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
