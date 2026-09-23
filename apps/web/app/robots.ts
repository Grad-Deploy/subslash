import type { MetadataRoute } from "next";
import { siteUrl } from "@lib/site-metadata";

/**
 * /robots.txt. 검색에 노출하는 것은 첫 화면과 개인정보처리방침뿐이다. 나머지 화면(대시보드·내 구독·
 * 로그인 등)은 브라우저에 저장된 사용자 기록을 보여 주는 곳이라, 로봇에게는 빈 화면이고 검색 결과에
 * 둘 이유가 없다. 허용한 화면이 쓰는 아이콘·로고·스크립트·스타일은 함께 허용한다 — 검색 로봇은 이것도
 * 문서의 일부로 보고, 막혀 있으면 규칙을 무시하고 가져가기도 한다.
 *
 * `public/robots.txt`로 두지 않는 이유: 저장소는 `*.txt`를 작업 메모로 보고 무시하며, Grad-Deploy
 * 미러는 히스토리에서도 지운다(.github/workflows/mirror.yml). 앱 빌드는 `.ts`를 경로로 읽지 않아
 * 이 파일이 빠지는데, 앱에는 robots.txt가 필요 없다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/$",
        "/privacy$",
        "/sitemap.xml",
        "/icon.svg",
        "/manifest.json",
        "/logos/",
        "/_next/static/",
      ],
      disallow: "/",
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
