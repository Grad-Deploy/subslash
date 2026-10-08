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
import { useLocale, useT } from "@lib/i18n";

/**
 * 도움말(자주 묻는 질문 + 문의하기, 웹·앱). 웹은 설정 화면과 하단 푸터에서, 앱은 설정 탭에서 들어온다.
 * 문의 주소는 개인정보 보호책임자 연락처와 같은 곳(lib/privacy.ts)에서 가져온다 — 주소를 두 군데 적지 않는다.
 */
export default function HelpPage() {
  const t = useT();
  const h = t.helpPage;
  const locale = useLocale();
  const groups = faqGroups(
    {
      gmailOpen: isGmailAutoImportOpen(),
      socialOpen: isSocialLoginOpen(),
      aiOpen: isAiAskOpen(),
    },
    locale,
  );
  const email = PRIVACY_OFFICER?.email ?? null;
  const subject = h.mailSubject;
  const body = h.mailBody(IS_APP_BUILD);
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
        <h1 className="text-2xl font-black tracking-tight">{h.title}</h1>
        <p className="text-sm text-muted-foreground">{h.subtitle}</p>
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
          {h.contact}
        </h2>
        <div className="space-y-3 rounded-2xl border bg-card p-4 text-sm">
          {email && mailto && gmailCompose ? (
            <>
              <p className="leading-relaxed text-muted-foreground">{h.contactBody}</p>
              <p className="font-semibold">{email}</p>
              <div className="flex flex-wrap gap-2">
                {/* 메일 앱을 여는 링크(mailto:). openExternal은 http(s)만 열기 때문에 쓰지 않는다. */}
                <a
                  href={mailto}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-bold text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Mail className="size-4" aria-hidden />
                  {h.mailApp}
                </a>
                <Button type="button" variant="outline" onClick={() => openExternal(gmailCompose)}>
                  {h.gmail}
                </Button>
                <Button type="button" variant="outline" onClick={() => void copyEmail()}>
                  {copied ? h.copied : h.copyAddress}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{h.mailFallback}</p>
              <p className="text-xs text-muted-foreground">
                {h.privacyBefore}
                <Link href="/privacy" className="underline underline-offset-4">
                  {h.privacyLink}
                </Link>
                {h.privacyAfter}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">{h.noContact}</p>
          )}
        </div>
      </section>
    </div>
  );
}
