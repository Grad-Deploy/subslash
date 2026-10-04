/**
 * 앱 소개 슬라이드의 내용과 장 순서. 첫 장(소개)과 마지막 장(시작) 사이에 기능 소개가 FEATURES 순서대로
 * 들어간다. 화면 캡처는 웹 소개와 같은 샘플 데이터 캡처(`public/landing/`)다.
 */

export interface OnboardingFeature {
  /** 장 제목이자 아래 점(몇 번째 장)의 이름. */
  name: string;
  title: string;
  image: string;
  alt: string;
}

export const FEATURES: readonly OnboardingFeature[] = [
  {
    name: "한눈에 보기",
    title: "결정할 구독만 골라 보여 줘요",
    image: "/landing/dashboard.png",
    alt: "대시보드 화면 — 결제일이 다가오는 구독과 1회당 금액",
  },
  {
    name: "해지 안내",
    title: "해지하는 곳까지 데려다줘요",
    image: "/landing/cancel-guide.png",
    alt: "구독 상세 화면 — 다음 결제까지 남은 날과 해지 경로 안내",
  },
  {
    name: "메일로 찾기",
    title: "결제 메일로 구독을 찾아요",
    image: "/landing/gmail-import.png",
    alt: "결제 메일 가져오기 화면",
  },
  {
    name: "지킨 돈",
    title: "해지로 지킨 돈이 쌓여요",
    image: "/landing/savings.png",
    alt: "절약 현황 화면 — 해지로 지킨 돈",
  },
];

/** 장마다의 이름(읽는 기계와 아래 점에 쓴다). 순서가 곧 장 순서다. */
export const SLIDE_LABELS: readonly string[] = [
  "소개",
  ...FEATURES.map((feature) => feature.name),
  "시작하기",
];

export const LAST_SLIDE = SLIDE_LABELS.length - 1;
