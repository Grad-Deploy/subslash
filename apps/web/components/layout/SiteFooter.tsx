"use client";

import Link from "next/link";
import { BrandWordmark } from "../brand/Brand";
import { useT } from "@lib/i18n";

/**
 * 모든 화면 아래의 푸터. 모바일 하단 탭에 가려지지 않게, 본문 대신 푸터가 아래 여백을 갖는다. 하단 탭이
 * 홈 표시줄만큼 높아지므로 그 높이도 더한다.
 */
export function SiteFooter() {
  const t = useT().shell.footer;
  return (
    <footer className="container max-w-6xl mx-auto px-4 pt-2 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8 text-xs text-muted-foreground">
      <div className="space-y-2 border-t pt-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <BrandWordmark className="text-xs" />
          <Link href="/help" className="underline-offset-4 hover:text-foreground hover:underline">
            {t.help}
          </Link>
          <Link
            href="/privacy"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            {t.privacy}
          </Link>
        </div>
        {/*
          화면에 보이는 서비스 이름과 로고는 남의 상표다. 구독을 알아볼 수 있게 쓸 뿐이고
          SubSlash가 그 서비스와 제휴한 것이 아니라는 것을 로고가 보이는 곳에서 밝힌다.
        */}
        <p className="text-[11px] leading-relaxed text-muted-foreground/80">{t.trademarks}</p>
      </div>
    </footer>
  );
}
