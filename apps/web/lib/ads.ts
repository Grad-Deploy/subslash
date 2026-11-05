import { IS_APP_BUILD } from "./platform";
import { isAdsOpen } from "./privacy";
import { SEARCH_INDEXING } from "./site-metadata";

/** Google AdSense 게시자 ID. 공개 값이다(페이지 소스에 그대로 실린다). */
export const ADSENSE_CLIENT = "ca-pub-2240109785471497";

export const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

/**
 * 광고 스크립트를 싣는지. 웹의 공개 배포에서만 싣는다.
 * - 앱(Capacitor) 웹뷰는 AdSense가 허용하지 않는 환경이고 스토어 앱에 광고가 끼면 데이터 안전 항목도 바뀐다.
 * - 검색에 노출하지 않는 배포(`SEARCH_INDEXING=off`, 미러·테스트)는 광고 심사·집계에 섞이지 않게 뺀다.
 * - 방침에 먼저 게시한 시작일(`ADS_STARTS_ON`) 전에는 켜지 않는다.
 * next.config.ts의 CSP(`ads`)도 같은 조건이다.
 */
export const ADS_ENABLED = !IS_APP_BUILD && SEARCH_INDEXING && isAdsOpen();

/**
 * 광고 단위(슬롯) ID. AdSense 콘솔의 '광고 > 광고 단위별'에서 만든 숫자 ID를 넣는다. 아직 만들지 않았으면 null이고,
 * 그동안 `AdUnit`은 아무것도 그리지 않는다 — 없는 ID를 지어내 빈 칸을 만들지 않는다.
 */
export const AD_SLOTS: { help: string | null } = { help: null };
