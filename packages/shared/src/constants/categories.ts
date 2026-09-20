import type { SubscriptionCategory } from "../types";

/** 카테고리를 화면에 적을 이름. 구독 목록의 필터와 같은 말을 쓴다. */
export const CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  ott: "OTT",
  music: "음악",
  cloud: "클라우드",
  shopping: "쇼핑",
  ai: "AI 툴",
  other: "기타",
};

/**
 * 더 쓰지 않는 분류. 값만 남아 있을 수 있어 `currentCategory`가 '기타'로 옮긴다.
 *
 * '뉴스'·'피트니스'는 서비스 목록의 어느 서비스도 쓰지 않았고 실제로 등록되지도 않아
 * 2026년 9월 20일에 없앴다.
 */
const RETIRED_CATEGORIES = new Set(["news", "fitness"]);

/**
 * 저장된 분류를 지금 쓰는 분류로 옮긴다.
 *
 * 구독은 등록할 때의 분류를 그대로 저장하므로, 목록에서 분류를 빼기만 하면 그 분류로
 * 저장해 둔 구독이 남는다. 그 구독은 '내 구독'의 어느 분류로도 걸러지지 않고, 등록 정보를
 * 고칠 때 분류 칸에 고를 것이 없어 엉뚱한 분류로 저장된다. 불러올 때 '기타'로 옮긴다 —
 * 분류를 잃을 뿐, 구독과 금액은 그대로다.
 *
 * 아는 분류는 그대로 돌려준다. 모르는 값(옛 백업이나 손으로 고친 파일)도 '기타'로 둔다.
 */
export function currentCategory(category: string): SubscriptionCategory {
  if (RETIRED_CATEGORIES.has(category)) return "other";
  return Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, category)
    ? (category as SubscriptionCategory)
    : "other";
}
