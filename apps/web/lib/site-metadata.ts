import type { Metadata } from "next";

/**
 * 검색·공유 미리보기에 쓰는 사이트 공통 값. 검색에 노출하는 화면은 첫 화면과 개인정보처리방침뿐이다
 * (app/robots.ts).
 *
 * 페이지에서 `openGraph`를 적으면 Next.js는 레이아웃의 것과 합치지 않고 통째로 바꾼다. 그래서 페이지는
 * `siteOpenGraph`를 펼친 뒤 제목·설명·주소만 바꾼다 — 안 그러면 사이트 이름·언어가 빠진다.
 *
 * `og:url`은 절대 주소여야 한다. 기준 주소(`metadataBase`)를 적지 않으면 Next.js는 `/`를 그대로
 * 내보낸다(Vercel 주소로 채워 주는 것은 공유 이미지뿐이다). 배포가 둘(leesean2의 `subslash-web-qki1`,
 * www.subslash.me를 가진 Grad-Deploy 미러 `subslash-web`)이라 주소를 코드에 적으면 한쪽이 남의 주소를
 * 가리키므로, Vercel이 배포마다 넣어 주는 운영 주소를 쓴다. Vercel 밖(로컬·앱 빌드)에서는 비워 둔다.
 *
 * `og:image`는 아직 없다. 가이드는 페이지마다 고유한 그림을 권하고, 사이트 로고처럼 모든 페이지에
 * 되풀이되는 그림은 검색엔진이 쓰지 않는다.
 */
export const SITE_NAME = "SubSlash";
export const SITE_TITLE = "SubSlash - 구독, 끊을 용기";
export const SITE_DESCRIPTION = "구독 1회 사용 단가 분석과 해지 도우미";

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const SITE_METADATA_BASE = productionHost ? new URL(`https://${productionHost}`) : undefined;

/** 검색에 노출하는 화면. app/robots.ts의 허용 목록, app/sitemap.ts와 함께 고친다. */
export const INDEXED_PATHS = ["/", "/privacy"] as const;

/**
 * 사이트맵·robots.txt에 적는 절대 주소. Vercel 밖(로컬)에서는 Next.js가 메타데이터에 쓰는 것처럼
 * localhost를 기준으로 한다.
 */
export function siteUrl(path: string): string {
  return new URL(path, SITE_METADATA_BASE ?? "http://localhost:3000").toString();
}

export const siteOpenGraph = {
  type: "website",
  siteName: SITE_NAME,
  locale: "ko_KR",
} satisfies Metadata["openGraph"];
