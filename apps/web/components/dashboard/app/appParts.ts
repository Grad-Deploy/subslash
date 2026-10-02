"use client";

/**
 * 대시보드(`/dashboard`)의 앱 전용 조각. 웹 번들에는 들어가지 않도록 앱 빌드에서만 불러오고, 웹에서는 null이다.
 * `dynamic()`은 호출마다 import 경로가 글자 그대로 있어야 해서 도우미로 감싸지 않고 하나씩 적는다(내 구독의
 * `subscription/app/appParts`와 같은 방식). 구독 추가 + 버튼은 그쪽 것을 같이 쓴다.
 */
import dynamic from "next/dynamic";
import { IS_APP_BUILD } from "@lib/platform";

export { AppAddButton } from "../../subscription/app/appParts";

// 가성비 리포트와 월 고정지출을 계산서 카드 하나로 보여준다.
export const AppValueReceipt = IS_APP_BUILD
  ? dynamic(() => import("./AppValueReceipt").then((m) => m.AppValueReceipt), { ssr: false })
  : null;

// 계산서에서 이어서 해지를 마쳤을 때의 축하 화면과, 다음 구독을 이어서 해지할지 묻는 창.
export const AppKillCelebration = IS_APP_BUILD
  ? dynamic(() => import("./AppKillCelebration").then((m) => m.AppKillCelebration), {
      ssr: false,
    })
  : null;
export const AppNextKillDialog = IS_APP_BUILD
  ? dynamic(() => import("./AppNextKillDialog").then((m) => m.AppNextKillDialog), { ssr: false })
  : null;

// 폰 사용 기록으로 본 알림(안드로이드 앱 전용).
export const AppUnusedAlerts = IS_APP_BUILD
  ? dynamic(() => import("../../usage/app/AppUnusedAlerts").then((m) => m.AppUnusedAlerts), {
      ssr: false,
    })
  : null;
// 폰 사용 기록으로 찾은 '등록하지 않았는데 쓰고 있는 구독'(안드로이드 앱 전용).
export const AppSubscriptionSuggestions = IS_APP_BUILD
  ? dynamic(
      () =>
        import("../../usage/app/AppSubscriptionSuggestions").then(
          (m) => m.AppSubscriptionSuggestions,
        ),
      { ssr: false },
    )
  : null;
// 첫 화면의 '폰 사용 기록으로 찾기'(안드로이드 앱 전용). 구독 추가 메뉴(AppAddButton)의 것과 같다.
export const AppUsageFindSheet = IS_APP_BUILD
  ? dynamic(() => import("../../usage/app/AppUsageFindSheet").then((m) => m.AppUsageFindSheet), {
      ssr: false,
    })
  : null;

// 결제 달력(앱은 상단 아이콘 + 여기 '다음 결제' 한 줄).
export const AppNextBilling = IS_APP_BUILD
  ? dynamic(() => import("./AppBillingCalendar").then((m) => m.AppNextBilling), { ssr: false })
  : null;
// '지금 결정할 것'을 접었다 펴기. 접으면 아래 결제 달력이 바로 보인다.
export const AppDecisionFold = IS_APP_BUILD
  ? dynamic(() => import("./AppDecisionFold").then((m) => m.AppDecisionFold), { ssr: false })
  : null;
