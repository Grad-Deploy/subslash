import type { MetadataRoute } from "next";
import { INDEXED_PATHS, siteUrl } from "@lib/site-metadata";

/**
 * /sitemap.xml. 검색에 노출하는 화면(robots.txt가 허용한 것)만 적는다 — 막은 주소를 적으면 로봇이
 * 서로 어긋난 신호를 받는다.
 *
 * `lastModified`는 적지 않는다. 빌드 시각을 넣으면 배포할 때마다 내용이 바뀐 것처럼 알리게 된다.
 * 앱 빌드는 `.ts`를 경로로 읽지 않아 이 파일이 빠지는데, 앱에는 사이트맵이 필요 없다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXED_PATHS.map((path) => ({ url: siteUrl(path) }));
}
