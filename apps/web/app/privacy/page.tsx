import React from "react";
import type { Metadata } from "next";
import { PrivacyPolicy } from "@components/privacy/PrivacyPolicy";
import { siteOpenGraph } from "@lib/site-metadata";

const TITLE = "개인정보처리방침 · SubSlash";
const DESCRIPTION =
  "SubSlash가 무엇을, 왜, 얼마나 저장하는지 적었습니다. 구독 기록은 기본적으로 기기 안에만 저장됩니다.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { ...siteOpenGraph, title: TITLE, description: DESCRIPTION, url: "/privacy" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

/**
 * 개인정보처리방침. 내용은 components/privacy의 한국어판(PrivacyKo, 원문)과 영어판(PrivacyEn)에 있고 화면 언어로
 * 고른다. 이 방침의 문장은 코드가 실제로 하는 일과 맞아야 한다(CLAUDE.md '데이터 위치') — 저장하는 칸·보관 기간·
 * 삭제 경로를 바꾸면 두 판을 함께 고친다.
 */
export default function PrivacyPage() {
  return <PrivacyPolicy />;
}
