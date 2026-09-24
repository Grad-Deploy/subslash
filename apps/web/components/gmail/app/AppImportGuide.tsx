"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Lock } from "lucide-react";
import { useAuth } from "@hooks/useAuth";
import { webUrl } from "@lib/api";
import { GMAIL_AUTO_SCRIPT_MANIFEST, gmailAutoScript } from "@lib/gmail-import";
import { leaveForExternal, openExternal } from "@lib/native";
import {
  createGmailLink,
  deleteGmailLink,
  fetchGmailLink,
  startGmailConnect,
  type GmailLinkState,
} from "@lib/gmail-auto-client";
import { isGmailAutoImportOpen } from "@lib/privacy";
import { InlineConfirm } from "../../ui/inline-confirm";
import { Spinner } from "../../ui/spinner";
import { AppCopyCode } from "./AppCopyCode";
import { AppStepper, StepTip, type AppStep } from "./AppStepper";

type PendingConfirm = "reconnect" | "rotate" | "disconnect";

const CONFIRM_COPY: Record<PendingConfirm, { message: string; action: string }> = {
  reconnect: {
    message: "다시 연결하면 지금 연결된 검사는 거절되고, 새로 허용한 Google 계정으로 검사해요.",
    action: "다시 연결",
  },
  rotate: {
    message: "스크립트를 새로 받으면 지금 Apps Script에 붙여 둔 스크립트는 거절돼요.",
    action: "새로 받기",
  },
  disconnect: {
    message: "연결을 끊을까요? 서버에 남은 구독 후보를 지우고, 그때부터 보내는 메일은 거절해요.",
    action: "연결 끊기",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

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
  const { account, loading } = useAuth();
  const [link, setLink] = useState<GmailLinkState | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    if (!account) return;
    fetchGmailLink()
      .then(setLink)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "연결 상태를 읽지 못했어요."),
      );
  }, [account]);

  const refresh = () =>
    fetchGmailLink()
      .then(setLink)
      .catch(() => undefined);

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      // 앱 웹뷰가 통째로 나가면 담아 둔 화면을 잃으므로 인앱 브라우저로 열고, 닫히면 다시 읽는다.
      leaveForExternal(await startGmailConnect(), () => {
        setBusy(false);
        void refresh();
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gmail 연결을 시작하지 못했어요.");
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
      setError(e instanceof Error ? e.message : "연결 토큰을 만들지 못했어요.");
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
      setError(e instanceof Error ? e.message : "연결을 끊지 못했어요.");
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
      message={CONFIRM_COPY[pendingConfirm].message}
      confirmText={CONFIRM_COPY[pendingConfirm].action}
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
        title: "Apps Script 새 프로젝트 열기",
        next: "열었어요",
        body: (
          <>
            <p>내 Google 계정에 스크립트를 담을 새 프로젝트를 만들어요.</p>
            <button
              type="button"
              onClick={() => openExternal("https://script.new")}
              className="h-11 w-full rounded-xl border text-sm font-bold text-foreground"
            >
              Apps Script 열기
            </button>
            <StepTip title="이 스크립트는 지금만 보여요">
              내 계정의 연결 토큰이 들어 있어요. 다른 사람과 공유하지 마세요. 잃어버리면 새로 받으면
              돼요.
            </StepTip>
          </>
        ),
      },
      {
        title: "설정 파일 보이게 켜기",
        next: "켰어요",
        body: (
          <p>
            왼쪽 <b className="text-foreground">톱니바퀴(프로젝트 설정)</b>에서{" "}
            <b className="text-foreground">
              &lsquo;appsscript.json 매니페스트 파일을 편집기에 표시&rsquo;
            </b>
            를 켜요.
          </p>
        ),
      },
      {
        title: "코드 두 개 붙여넣기",
        next: "붙여 넣었어요",
        body: (
          <>
            <p>편집기에서 각 파일 내용을 지우고, 아래 코드를 복사해 붙여 넣은 뒤 저장해요.</p>
            <AppCopyCode label="appsscript.json" code={GMAIL_AUTO_SCRIPT_MANIFEST} />
            <AppCopyCode
              label="Code.gs"
              code={gmailAutoScript(webUrl("/api/gmail/ingest"), token)}
            />
          </>
        ),
      },
      {
        title: "setup 실행하고 허용하기",
        next: "허용했어요",
        body: (
          <>
            <p>
              위쪽 함수 목록에서 <b className="text-foreground">setup</b>을 골라 실행하고, 권한
              화면에서 허용해요.
            </p>
            <StepTip title="'확인되지 않은 앱' 경고가 나와도 괜찮아요">
              내가 직접 만든 스크립트라 Google이 검사하지 않았다는 뜻이에요. <b>고급 › 계속</b>을
              누르면 돼요.
            </StepTip>
          </>
        ),
      },
      {
        title: "끝났어요",
        next: "완료",
        body: (
          <p>
            지금 한 번 검사하고, 그 뒤로 2주마다 월요일 오전 9시대에 새 결제 메일을 찾아요. 찾은
            구독은 SubSlash를 열 때 확인 창으로 보여드려요.
          </p>
        ),
      },
    ];
    return (
      <article className="mx-auto max-w-md py-4">
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
    <article className="mx-auto max-w-md space-y-4 py-4 text-sm">
      <header className="space-y-2">
        <h1 className="text-[22px] leading-tight font-black tracking-tight">
          Gmail 결제 메일로
          <br />
          구독을 한 번에 찾아요
        </h1>
        <p className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11.5px] font-semibold">
          <Lock className="size-3" aria-hidden />
          메일 제목·본문은 저장하지 않아요
        </p>
      </header>

      {errorBox}

      {!isGmailAutoImportOpen() ? (
        <section className="rounded-2xl border bg-card p-4">
          <p className="font-bold">아직 앱에서 쓸 수 없어요</p>
          <p className="mt-1 text-xs text-muted-foreground">
            결제 메일 불러오기가 열리기 전이에요. 그동안은 대시보드의 &lsquo;문자 붙여넣기&rsquo;로
            등록할 수 있어요.
          </p>
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
              <p className="font-bold">Gmail 연결됨</p>
              <p className="text-xs text-muted-foreground">
                2주마다 월요일 오전에 새 결제 메일을 찾아요.
              </p>
            </div>
          </section>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground">마지막 검사</p>
              <p className="text-lg font-black tracking-tight">
                {linked.lastIngestAt ? formatDate(linked.lastIngestAt) : "아직 없음"}
              </p>
            </div>
            <div className="rounded-2xl border px-3 py-2.5">
              <p className="text-[11px] text-muted-foreground">확인할 후보</p>
              <p className="text-lg font-black tracking-tight">{linked.pendingCount}건</p>
            </div>
          </div>
          {!linked.lastIngestAt && (
            <p className="text-xs text-muted-foreground">
              아직 스크립트가 보낸 적이 없어요. 직접 설치했다면 Apps Script에서 setup을 실행했는지
              확인해 주세요.
            </p>
          )}
          {linked.pendingCount > 0 && (
            <p className="rounded-xl bg-secondary px-3 py-2 text-xs">
              찾은 구독은 대시보드로 돌아가면 확인 창으로 보여드려요.
            </p>
          )}
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground"
          >
            대시보드로 가기
          </button>
          {confirmBox}
          <div className="flex justify-center gap-4 text-xs font-medium text-muted-foreground">
            {linked.connectAvailable && (
              <button type="button" disabled={busy} onClick={() => setPendingConfirm("reconnect")}>
                다시 연결
              </button>
            )}
            <button type="button" disabled={busy} onClick={() => setPendingConfirm("rotate")}>
              스크립트 새로 받기
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setPendingConfirm("disconnect")}
              className="underline underline-offset-4"
            >
              연결 끊기
            </button>
          </div>
        </>
      ) : (
        <>
          <section className="rounded-2xl border border-primary bg-card p-4 ring-1 ring-primary">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-extrabold tracking-tight">자동으로 가져오기</h2>
              <span className="rounded-full bg-primary px-2 py-0.5 text-[10.5px] font-extrabold text-primary-foreground">
                추천
              </span>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
              2주마다 새 결제 메일을 찾아 등록 후보로 모아둬요.
            </p>
            <p className="mt-2 text-[11.5px] text-muted-foreground">1분 · 로그인 필요</p>
            {!account ? (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="mt-3 h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground"
              >
                로그인하고 연결하기
              </button>
            ) : link?.open && link.connectAvailable ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void connect()}
                className="mt-3 h-11 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {busy ? "연결하는 중…" : "Gmail 연결하기"}
              </button>
            ) : null}
            {account && link?.open && link.connectAvailable && (
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                권한 화면에서 &lsquo;확인되지 않은 앱&rsquo; 경고가 나오면 &lsquo;고급 ›
                계속&rsquo;을 눌러요.
              </p>
            )}
          </section>

          {account && link?.open && (
            <section className="rounded-2xl border bg-card p-4">
              <h2 className="text-[15px] font-extrabold tracking-tight">
                {link.connectAvailable ? "경고 없이 직접 설치하기" : "직접 설치해서 연결하기"}
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                내 계정에 내가 만든 스크립트라 Google 심사 대상이 아니에요. 코드를 붙여 넣고 한 번
                실행해요.
              </p>
              <p className="mt-2 text-[11.5px] text-muted-foreground">약 5분</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void issueToken()}
                className="mt-3 h-10 w-full rounded-xl border text-[13px] font-bold disabled:opacity-50"
              >
                단계별로 따라하기
              </button>
            </section>
          )}
        </>
      )}

      <details className="group border-t pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[13px] font-bold">
          어떤 정보를 가져가나요?
          <ChevronDown
            className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
          <li>결제 메일에서 서비스·금액·결제일·보낸 사람만 구독 후보로 남겨요.</li>
          <li>메일 제목과 본문은 저장하지 않아요.</li>
          <li>알려진 서비스의 최근 결제는 바로 등록되고, 확실하지 않은 것은 확인을 받아요.</li>
          <li>메일마다 형식이 달라 금액·결제일이 틀릴 수 있어요. 등록한 뒤에도 고칠 수 있어요.</li>
          <li>
            허용한 권한은 Google 계정의 &lsquo;타사 앱 및 서비스&rsquo;에서 언제든 없앨 수 있어요.
          </li>
        </ul>
      </details>
    </article>
  );
}
