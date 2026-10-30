"use client";

import { useT } from "@lib/i18n";
import { IS_APP_BUILD } from "@lib/platform";
import { PLAY_STORE_URL } from "@lib/play-store";
import { cn } from "@lib/utils";

/**
 * 'Google Play에서 앱 받기' 글자 링크. 푸터와, 안드로이드 앱에서만 되는 기능을 웹에서 안내하는 문장 끝에 둔다.
 * 앱 안에서는 이미 앱을 쓰고 있으므로 그리지 않는다.
 */
export function PlayStoreLink({ className }: { className?: string }) {
  const t = useT();
  if (IS_APP_BUILD) return null;
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("underline underline-offset-4 hover:text-foreground", className)}
    >
      {t.shell.footer.getApp}
    </a>
  );
}
