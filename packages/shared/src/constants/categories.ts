import type { SubscriptionCategory } from "../types";

/** 카테고리를 화면에 적을 이름. 구독 목록의 필터와 같은 말을 쓴다. */
export const CATEGORY_LABELS: Record<SubscriptionCategory, string> = {
  ott: "OTT",
  music: "음악",
  cloud: "클라우드",
  news: "뉴스",
  fitness: "피트니스",
  shopping: "쇼핑",
  ai: "AI 툴",
  other: "기타",
};
