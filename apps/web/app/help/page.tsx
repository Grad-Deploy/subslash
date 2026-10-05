"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { ChevronDown, Mail } from "lucide-react";
import {
  PRIVACY_OFFICER,
  isAiAskOpen,
  isGmailAutoImportOpen,
  isSocialLoginOpen,
} from "@lib/privacy";
import { faqGroups } from "@lib/help/faq";
import { HelpSearch } from "@components/help/HelpSearch";
import { copyText, openExternal } from "@lib/native";
import { IS_APP_BUILD } from "@lib/platform";
import { Button } from "../../components/ui/button";

/**
 * 도움말(자주 묻는 질문 + 문의하기, 웹·앱). 웹은 설정 화면과 하단 푸터에서, 앱은 설정 탭에서 들어온다.
 * 문의 주소는 개인정보 보호책임자 연락처와 같은 곳(lib/privacy.ts)에서 가져온다 — 주소를 두 군데 적지 않는다.
 */
export default function HelpPage() {
  const groups = faqGroups({
    gmailOpen: isGmailAutoImportOpen(),
    socialOpen: isSocialLoginOpen(),
    aiOpen: isAiAskOpen(),
  });
  const email = PRIVACY_OFFICER?.email ?? null;
  const subject = "[SubSlash 문의] ";
  const body = `문의 내용:\n\n\n---\n사용 환경: ${IS_APP_BUILD ? "앱" : "웹"}`;
  const mailto = email
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;
  // mailto:는 기기에 기본 메일 앱이 정해져 있어야 열린다. 메일을 웹(Gmail)으로만 쓰는 PC에서는 눌러도 아무것도
  // 열리지 않았고, 열리지 않은 것을 페이지는 알 수 없다. 그래서 웹 주소로 여는 Gmail 쓰기 화면을 함께 둔다.
  const gmailCompose = email
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;
  const [copied, setCopied] = React.useState(false);

  const copyEmail = async () => {
    if (!email) return;
    // 복사하지 못했으면 '복사됨'을 띄우지 않는다. 주소는 화면에 그대로 보인다.
    if (await copyText(email)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-black tracking-tight">도움말</h1>
        <p className="text-sm text-muted-foreground">자주 묻는 질문과 문의하는 곳이에요.</p>
      </header>

      <Suspense fallback={null}>
        <HelpSearch faqs={groups.flatMap((group) => group.items)} aiOpen={isAiAskOpen()} />
      </Suspense>

      {groups.map((group) => (
        <section key={group.title} className="space-y-2" aria-label={group.title}>
          <h2 className="px-1 text-xs font-bold text-muted-foreground">{group.title}</h2>
          <div className="divide-y overflow-hidden rounded-2xl border bg-card">
            {group.items.map((item) => (
              <details key={item.q} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-3 px-3.5 py-3 text-sm font-bold hover:bg-muted/60 [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">{item.q}</span>
                  <ChevronDown
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <div className="px-3.5 pb-3.5 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}

      <section aria-labelledby="contact-heading" className="space-y-2">
        <h2 id="contact-heading" className="px-1 text-xs font-bold text-muted-foreground">
          문의하기
        </h2>
        <div className="space-y-3 rounded-2xl border bg-card p-4 text-sm">
          {email && mailto && gmailCompose ? (
            <>
              <p className="leading-relaxed text-muted-foreground">
                찾는 답이 없으면 메일로 알려 주세요. 오류라면 어느 화면에서 무엇을 눌렀는지 함께
                적어 주시면 빨리 확인할 수 있어요.
              </p>
              <p className="font-semibold">{email}</p>
              <div className="flex flex-wrap gap-2">
                {/* 메일 앱을 여는 링크(mailto:). openExternal은 http(s)만 열기 때문에 쓰지 않는다. */}
                <a
                  href={mailto}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Mail className="size-4" aria-hidden />
                  메일 앱으로 문의하기
                </a>
                <Button type="button" variant="outline" onClick={() => openExternal(gmailCompose)}>
                  Gmail로 쓰기
                </Button>
                <Button type="button" variant="outline" onClick={() => void copyEmail()}>
                  {copied ? "복사했어요" : "주소 복사"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                메일 앱이 열리지 않으면 &lsquo;Gmail로 쓰기&rsquo;를 누르거나, 주소를 복사해 쓰는
                메일에서 보내 주세요.
              </p>
              <p className="text-xs text-muted-foreground">
                개인정보에 관한 요청도 같은 주소로 받아요(
                <Link href="/privacy" className="underline underline-offset-4">
                  개인정보처리방침
                </Link>
                ).
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">아직 문의 창구를 정하지 못했어요.</p>
          )}
        </div>
      </section>
    </div>
  );
}
