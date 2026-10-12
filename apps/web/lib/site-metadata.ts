import type { Metadata } from "next";
import { ko as PAGE_TITLES } from "./i18n/messages/pageTitles";

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
export const SITE_TITLE = PAGE_TITLES.site;
// 검색 결과의 설명으로 쓰인다. 본문에는 이름이 로고(그림)로만 있어, 이름으로 찾는 사람에게 이 사이트가
// 그 이름의 것임을 글자로 알리려고 앞에 둔다.
export const SITE_DESCRIPTION = `${SITE_NAME}: 구독 1회 사용 단가 분석과 해지 도우미`;

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
export const SITE_METADATA_BASE = productionHost ? new URL(`https://${productionHost}`) : undefined;

/**
 * 이 배포를 검색에 노출하는지. 배포가 둘이라 테스트 서버로 쓰는 쪽(`subslash-web-qki1`)이 공개 웹(www.subslash.me)과
 * 같은 화면을 자기 주소로 내보내, 검색엔진이 같은 사이트를 둘로 모았다. 그 배포에만 `SEARCH_INDEXING=off`를 둔다.
 * 끄는 쪽만 적게 한 것은, 설정을 빠뜨렸을 때 공개 웹이 검색에서 빠지는 것보다 테스트 서버가 남는 편이 덜 나빠서다.
 */
export const SEARCH_INDEXING = process.env.SEARCH_INDEXING !== "off";

/**
 * 검색에 노출하는 화면. app/robots.ts의 허용 목록, app/sitemap.ts, 각 페이지의 대표 주소(`alternates.canonical`)와
 * 함께 고친다. 노출하지 않는 배포(`SEARCH_INDEXING`)에서는 비어 있다.
 */
export const INDEXED_PATHS: readonly string[] = SEARCH_INDEXING ? ["/", "/privacy"] : [];

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

/**
 * 첫 화면에 싣는 구조화 데이터(schema.org `WebSite`). 검색 결과에 보일 사이트 이름을 검색엔진에 알린다 —
 * 이름이 화면에서는 로고 그림이라, 'subslash'로 찾을 때 이 사이트가 그 이름의 것인지 글자로 잇는 곳이 제목뿐이었다.
 * 확인하지 않은 다른 표기(한글 이름 등)는 `alternateName`으로 지어 넣지 않는다.
 */
export function siteJsonLd(): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl("/"),
    description: SITE_DESCRIPTION,
    inLanguage: "ko-KR",
  };
  // JSON.stringify는 `</script>`를 막지 않는다. 지금 값은 모두 코드에 있는 글자지만, 바꿔도 안전하게 둔다.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
