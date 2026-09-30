"use client";

/**
 * 구독 목록(`/subs`)의 앱 전용 조각. 웹 번들에는 들어가지 않도록 앱 빌드에서만 불러오고, 웹에서는 null이다.
 * `dynamic()`은 호출마다 import 경로가 글자 그대로 있어야 해서 도우미로 감싸지 않고 하나씩 적는다.
 */
import dynamic from "next/dynamic";
import { IS_APP_BUILD } from "@lib/platform";

// 앱에서는 구독을 하나 등록한 뒤 같은 창에서 이번 달 사용 횟수를 묻는다. 웹 번들에는 넣지 않는다.
export const AppDuplicateDialog = IS_APP_BUILD
  ? dynamic(() => import("./AppDuplicateDialog").then((m) => m.AppDuplicateDialog), { ssr: false })
  : null;

// 폰 기록으로 체크인(안드로이드 앱 전용).
export const AppPhoneCheckInButton = IS_APP_BUILD
  ? dynamic(
      () => import("../../usage/app/AppPhoneCheckInButton").then((m) => m.AppPhoneCheckInButton),
      { ssr: false },
    )
  : null;
// 목록 개수와 순서 고르기(앱 전용). 카테고리 칩과 겹치지 않게 글자 버튼 + 시트.
export const AppSortSelect = IS_APP_BUILD
  ? dynamic(() => import("./AppSortSelect").then((m) => m.AppSortSelect), { ssr: false })
  : null;
// 해지 완료 목록 정리(숨기기·삭제·여러 개 선택). 앱 전용.
export const AppKilledList = IS_APP_BUILD
  ? dynamic(() => import("./AppKilledList").then((m) => m.AppKilledList), { ssr: false })
  : null;
// 구독 추가 + 버튼(앱 전용) — 직접 등록·결제 메일·결제 문자 중 고른다.
export const AppAddButton = IS_APP_BUILD
  ? dynamic(() => import("../../layout/app/AppAddButton").then((m) => m.AppAddButton), {
      ssr: false,
    })
  : null;
export const AppAddCheckIn = IS_APP_BUILD
  ? dynamic(() => import("./AppAddCheckIn").then((m) => m.AppAddCheckIn), { ssr: false })
  : null;
