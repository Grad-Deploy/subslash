import React from "react";
import { OAuthDone } from "@components/auth/OAuthDone";

export const metadata = {
  title: "로그인 · SubSlash",
};

/**
 * 앱에서 시작한 소셜 로그인이 인앱 브라우저에서 끝나는 화면. 로그인은 이미 서버에 적혀 있고, 창을
 * 닫으면 앱이 받아 간다. 웹사이트로 가는 링크는 두지 않는다 — 인앱 브라우저에 웹이 열리면 앱으로
 * 돌아가는 길을 헷갈린다(CLAUDE.md '앱에 담을 화면').
 */
export default function OAuthDonePage() {
  return (
    <div className="max-w-md mx-auto py-12">
      <OAuthDone />
    </div>
  );
}
