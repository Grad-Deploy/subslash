"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";
import type { VerificationNotice } from "@lib/signup-request";
import { useKnownText, useT } from "@lib/i18n";

/** 가입을 마친 뒤의 화면. 확인 메일을 보냈는지(또는 못 보냈는지)를 여기서 알린다. */
export function SignupDone({ notice }: { notice: VerificationNotice }) {
  const router = useRouter();
  const t = useT().auth.signup;
  // 확인 메일 안내는 서버가 한국어로 준다(describeSendOutcome). 보여 줄 때 화면 언어로 바꾼다.
  const known = useKnownText();
  return (
    <div className="space-y-4 text-center" role="status">
      <p className="text-lg font-black">{t.done}</p>
      <p
        className={cn(
          "text-sm leading-relaxed",
          notice.sent ? "text-foreground" : "text-destructive",
        )}
      >
        {known(notice.message)}
      </p>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{t.doneNote}</p>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="w-full h-11 font-bold rounded-xl"
          onClick={() => {
            router.push("/dashboard");
            router.refresh();
          }}
        >
          {t.toDashboard}
        </Button>
        <Link
          href="/me"
          className="text-xs font-semibold text-primary underline underline-offset-4"
        >
          {t.toMe}
        </Link>
      </div>
    </div>
  );
}
