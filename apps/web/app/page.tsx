import type { Metadata } from "next";
import { HomePage } from "@components/home/HomePage";
import { siteJsonLd } from "@lib/site-metadata";

/**
 * 대표 주소. 같은 화면이 http·www 없는 주소·끝의 `/`로도 열리므로(모두 리디렉션) 검색엔진이 고를 주소를
 * 밝힌다. 상대 주소라 레이아웃의 `metadataBase`(배포마다의 운영 주소)를 기준으로 풀린다. 레이아웃에 두면
 * 모든 화면이 물려받아 대표 주소가 첫 화면이 되므로, 검색에 노출하는 화면(`INDEXED_PATHS`)마다 적는다.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteJsonLd() }} />
      <HomePage />
    </>
  );
}
