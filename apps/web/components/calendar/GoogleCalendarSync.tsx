"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { needsBillingMonth } from "@subslash/shared";
import { useAuth } from "@hooks/useAuth";
import { realRecords, useStore } from "@lib/store";
import { startCalendarSync, toCalendarPlanEntries } from "@lib/calendar-sync-client";
import { fetchGmailLink, type GmailLinkState } from "@lib/gmail-auto-client";
import { leaveForExternal } from "@lib/native";
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
      // Google 권한 화면으로 간다. 웹에서는 이 탭이 그대로 가고, 앱에서는 인앱 브라우저로 연다 —
      // 앱 웹뷰가 통째로 나가면 담아 둔 화면을 잃고 돌아올 길이 없다.
      leaveForExternal(await startCalendarSync(entries, reminderDays), () => setBusy(false));
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
          &lsquo;SubSlash 결제일&rsquo; 캘린더를 만들어 결제일을 반복 일정으로 넣어요. 다른 캘린더는
          건드리지 않아요.
        </p>
      </div>

      {loading ? null : !account ? (
        <p className="text-muted-foreground">
          쓰려면{" "}
          <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
            로그인
          </Link>
          이 필요해요.
        </p>
      ) : !link || !link.open ? null : !link.connectAvailable ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          이 서버에는 구글 캘린더 등록이 설정되어 있지 않습니다. 결제 알림의 &lsquo;캘린더에 결제일
          띄우기&rsquo;를 쓰세요.
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
              올릴 구독이 없어요. 연간 구독이라면 상세에서 결제 월을 적어 주세요.
            </p>
          )}
          <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-muted-foreground">
            <li>
              구독 이름·금액·결제일이 Google로 전달돼요. 서버는 최대 10분만 들고 있다가 지워요.
            </li>
            <li>구독을 고쳤다면 다시 누르세요. 자동으로 바뀌지 않아요.</li>
            <li>&lsquo;확인되지 않은 앱&rsquo; 경고가 나오면 &lsquo;고급&rsquo;에서 계속하세요.</li>
            <li>그만두려면 &lsquo;SubSlash 결제일&rsquo; 캘린더를 지우세요.</li>
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
