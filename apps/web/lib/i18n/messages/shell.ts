import type { Widen } from "../types";

/** 모든 화면에 걸리는 틀: 상단 바, 하단 탭, 계정 메뉴, 화면 모드, 샘플 체험 띠, 푸터. */
export const ko = {
  nav: {
    label: "주요 메뉴",
    dashboard: "대시보드",
    subs: "내 구독",
    /** 하단 탭은 칸이 좁아 '내 구독' 대신 이 이름을 쓴다. */
    subsTab: "구독 관리",
    report: "리포트",
    settings: "설정",
  },
  theme: {
    label: "화면 모드",
    current: (label: string) => `화면 모드 (${label})`,
    system: "자동",
    systemDetail: "기기 설정 따라",
    light: "라이트",
    dark: "다크",
  },
  account: {
    menu: "계정 메뉴",
    menuFor: (username: string) => `계정 메뉴 (${username})`,
    signedOut: "로그인하지 않음",
    storedInBrowser: "기록은 이 브라우저에 저장돼요.",
    me: "내 정보",
    loginOrSignup: "로그인 / 회원가입",
    backup: "데이터 백업",
    syncHint: "로그인하면 여러 기기에서 같은 기록을 쓸 수 있어요.",
    help: "도움말 · 문의",
    logout: "로그아웃",
  },
  demo: {
    title: "샘플로 체험하는 중입니다.",
    body: (minutes: number) =>
      `지금 보이는 구독은 예시이고 내 구독과 섞이지 않습니다. 여기서 바꾼 내용은 저장되지 않고, 새로고침하거나 ${minutes}분이 지나면 체험이 끝납니다.`,
    end: "체험 끝내기",
  },
  footer: {
    help: "도움말 · 문의",
    privacy: "개인정보처리방침",
    trademarks:
      "서비스 이름과 로고는 각 소유자의 상표이며, 구독을 알아볼 수 있게 쓸 뿐입니다. SubSlash는 해당 서비스와 제휴하거나 보증받지 않았습니다.",
  },
};

export const en: Widen<typeof ko> = {
  nav: {
    label: "Main menu",
    dashboard: "Dashboard",
    subs: "My subscriptions",
    subsTab: "Subscriptions",
    report: "Report",
    settings: "Settings",
  },
  theme: {
    label: "Appearance",
    current: (label) => `Appearance (${label})`,
    system: "Auto",
    systemDetail: "Follows device",
    light: "Light",
    dark: "Dark",
  },
  account: {
    menu: "Account menu",
    menuFor: (username) => `Account menu (${username})`,
    signedOut: "Not signed in",
    storedInBrowser: "Your records are saved in this browser.",
    me: "My account",
    loginOrSignup: "Log in / Sign up",
    backup: "Data backup",
    syncHint: "Log in to use the same records on several devices.",
    help: "Help & contact",
    logout: "Log out",
  },
  demo: {
    title: "You're trying SubSlash with sample data.",
    body: (minutes) =>
      `The subscriptions shown are examples and are kept apart from yours. Changes here aren't saved, and the trial ends when you refresh or after ${minutes} minutes.`,
    end: "End trial",
  },
  footer: {
    help: "Help & contact",
    privacy: "Privacy policy",
    trademarks:
      "Service names and logos are trademarks of their owners and are used only to identify subscriptions. SubSlash is not affiliated with or endorsed by these services.",
  },
};
