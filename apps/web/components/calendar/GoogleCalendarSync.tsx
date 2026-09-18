"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { needsBillingMonth } from "@subslash/shared";
import { useAuth } from "@hooks/useAuth";
import { realRecords, useStore } from "@lib/store";
import { startCalendarSync, toCalendarPlanEntries } from "@lib/calendar-sync-client";
import { fetchGmailLink, type GmailLinkState } from "@lib/gmail-auto-client";
import { Button } from "../ui/button";

/**
 * 구독의 결제일을 내 구글 캘린더에 반복 일정으로 넣는다.
 *
 * '내 구독' 맨 아래에 둔다 — 목록에서 금액·결제일을 확인하고 고친 뒤 마지막에 누르는 버튼이다.
 *
 * SubSlash는 캘린더 권한을 받지 않는다. 버튼을 누르면 SubSlash의 Apps Script 웹 앱으로 가고, 그
 * 웹 앱이 **접속한 사람의 권한으로** 그 사람의 'SubSlash 결제일' 캘린더에 쓴다. 알림 설정의 캘린더
 * 구독과 다른 점은 두 가지다 — 누른 그 자리에서 들어가고, 일정에 적은 알림이 그대로 뜬다.
 */
export function GoogleCalendarSync() {
  const { account, loading } = useAuth();
  const subscriptions = useStore((state) => realRecords(state).subscriptions);
  const reminderDays = useStore((state) => state.notify.reminderDays);
  const [link, setLink] = useState<GmailLinkState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!account) return;
    fetchGmailLink()
      .then(setLink)
      .catch(() => setLink(null));
  }, [account]);

  const entries = useMemo(() => toCalendarPlanEntries(subscriptions), [subscriptions]);
  // 결제 월을 모르는 연간 구독은 올릴 날짜가 없다. 매달 결제가 있는 것처럼 열한 번 더 찍히는
  // 대신 빼고, 몇 건을 뺐는지 말한다.
  const undated = useMemo(
    () =>
      entries.filter((entry) =>
        needsBillingMonth({
          billingDay: entry.billingDay,
          billingCycle: entry.billingCycle as "monthly" | "yearly",
          billingMonth: entry.billingMonth ?? undefined,
        }),
      ).length,
    [entries],
  );
  const willSync = entries.length - undated;

  const sync = async () => {
    setBusy(true);
    setError(null);
    try {
      // Google 권한 화면으로 간다. 끝나면 웹 앱의 'SubSlash로 돌아가기'로 이 화면에 돌아온다.
      window.location.assign(await startCalendarSync(entries, reminderDays));
    } catch (e) {
      setError(e instanceof Error ? e.message : "캘린더 등록을 시작하지 못했습니다.");
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border p-4">
      <div className="space-y-1">
        <h2 className="text-base font-bold">구글 캘린더에 결제일 등록</h2>
        <p className="text-muted-foreground">
          내 구글 캘린더에 &lsquo;SubSlash 결제일&rsquo; 캘린더를 만들고, 구독 중인 구독의 결제일을
          반복 일정으로 넣습니다. 쓰는 것은 SubSlash가 아니라 허용한 내 Google 권한이고, 다른
          캘린더는 건드리지 않습니다.
        </p>
      </div>

      {loading ? null : !account ? (
        <p className="text-muted-foreground">
          결제일을 넘기는 동안 잠깐 맡아 둘 곳이 계정이라{" "}
          <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
            로그인
          </Link>
          이 필요합니다.
        </p>
      ) : !link || !link.open ? null : !link.connectAvailable ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          이 서버에는 구글 캘린더 등록이 설정되어 있지 않습니다. 결제 알림의 &lsquo;캘린더에 결제일
          띄우기&rsquo;로 캘린더 주소를 만들어 구독하면 같은 결제일을 볼 수 있습니다(반영이 늦고,
          알림은 캘린더 설정을 따릅니다).
        </p>
      ) : (
        <>
          <p className="rounded-xl bg-muted/50 p-3 text-xs leading-relaxed">
            지금 올릴 결제일 <strong>{willSync}건</strong>
            {undated > 0 && ` · 결제 월을 적지 않은 연간 구독 ${undated}건은 뺍니다`}
            {reminderDays > 0 ? ` · 결제 ${reminderDays}일 전에 알림` : " · 결제일 아침에 알림"}
          </p>
          <Button disabled={busy || willSync === 0} onClick={() => void sync()}>
            구글 캘린더에 등록하기
          </Button>
          {willSync === 0 && (
            <p className="text-xs text-muted-foreground">
              캘린더에 올릴 구독이 없습니다. 구독을 등록하거나, 연간 구독이라면 상세에서 결제 월을
              적어 주세요.
            </p>
          )}
          <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-muted-foreground">
            <li>
              구독 이름·금액·결제일이 Google(Apps Script)로 전달됩니다. SubSlash 서버는 이 목록을
              넘겨주는 10분 동안만 들고 있다가 지웁니다.
            </li>
            <li>
              구독을 고친 뒤 다시 누르면 이 캘린더를 통째로 새로 씁니다. 자동으로 따라 바뀌지는
              않습니다.
            </li>
            <li>
              SubSlash가 아직 Google 심사를 받지 않아 &lsquo;확인되지 않은 앱&rsquo; 경고가 먼저
              나오며, &lsquo;고급&rsquo;에서 계속할 수 있습니다. 허용한 권한은 Google 계정의
              &lsquo;타사 앱 및 서비스&rsquo;에서 언제든 없앨 수 있습니다.
            </li>
            <li>
              그만두려면 구글 캘린더에서 &lsquo;SubSlash 결제일&rsquo; 캘린더를 지우면 됩니다.
            </li>
          </ul>
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
