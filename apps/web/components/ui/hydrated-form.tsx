"use client";

import React from "react";
import { useIsClient } from "@hooks/useIsClient";
import { cn } from "@lib/utils";

/**
 * React가 페이지를 넘겨받기(하이드레이션) 전까지 잠가 두는 폼.
 *
 * 서버가 그린 폼은 자바스크립트가 붙기 전에도 입력할 수 있다. 느린 기기에서 그때 입력한 글자는
 * React 상태에 들어가지 않아, 화면에는 글자가 있는데 폼은 비어 있다고 판정한다. 그 사이 Enter를
 * 누르면 브라우저가 기본 방식(GET)으로 제출해 비밀번호가 주소창과 서버 기록에 남을 수 있다.
 * 하이드레이션이 끝날 때까지 fieldset을 꺼 두면 두 가지 모두 막힌다.
 *
 * `className`은 fieldset에 붙인다. 폼의 `space-y-*` 같은 클래스는 바로 아래 자식에 간격을 주는데,
 * 이제 그 자식들은 fieldset 안에 있기 때문이다.
 */
export function HydratedForm({
  children,
  className,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement>) {
  const hydrated = useIsClient();
  return (
    <form {...props}>
      <fieldset disabled={!hydrated} className={cn("min-w-0", className)}>
        {children}
      </fieldset>
    </form>
  );
}
