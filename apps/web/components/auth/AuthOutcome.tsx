import React from "react";
import Link from "next/link";

/**
 * 메일 링크로 온 화면(가입 확인·비밀번호 재설정)의 끝 화면: 제목, 설명, 다음으로 갈 링크 하나. 두 화면이
 * 같은 모양을 따로 들고 있던 것을 모았다.
 */
export function AuthOutcome({
  title,
  body,
  link,
}: {
  title: string;
  body: string;
  link: { href: string; label: string };
}) {
  return (
    <div className="space-y-3 text-center" role="status">
      <p className="text-lg font-black">{title}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Link
        href={link.href}
        className="inline-block text-sm font-semibold text-primary underline underline-offset-4"
      >
        {link.label}
      </Link>
    </div>
  );
}
