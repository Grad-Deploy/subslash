"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@components/ui/button";
import { cn } from "@lib/utils";
import type { VerificationNotice } from "@lib/signup-request";

/** 가입을 마친 뒤의 화면. 확인 메일을 보냈는지(또는 못 보냈는지)를 여기서 알린다. */
export function SignupDone({ notice }: { notice: VerificationNotice }) {
  const router = useRouter();
  return (
    <div className="space-y-4 text-center" role="status">
      <p className="text-lg font-black">가입했습니다</p>
      <p
        className={cn(
          "text-sm leading-relaxed",
          notice.sent ? "text-foreground" : "text-destructive",
        )}
      >
        {notice.message}
      </p>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        이메일 확인은 나중에 해도 됩니다. 확인 전에도 모든 기능을 그대로 쓸 수 있고, &lsquo;내
        정보&rsquo;에서 확인 메일을 다시 받을 수 있습니다.
      </p>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="w-full h-11 font-bold rounded-xl"
          onClick={() => {
            router.push("/dashboard");
            router.refresh();
          }}
        >
          대시보드로 가기
        </Button>
        <Link
          href="/me"
          className="text-xs font-semibold text-primary underline underline-offset-4"
        >
          내 정보 보기
        </Link>
      </div>
    </div>
  );
}
