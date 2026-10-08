import type { Widen } from "../types";

/** 도움말(/help) 화면의 틀. FAQ 질문과 답은 `lib/help/faq`(한국어)·`lib/help/faq-en`(영어)에 있다. */
export const ko = {
  helpPage: {
    title: "도움말",
    subtitle: "자주 묻는 질문과 문의하는 곳이에요.",
    contact: "문의하기",
    contactBody:
      "찾는 답이 없으면 메일로 알려 주세요. 오류라면 어느 화면에서 무엇을 눌렀는지 함께 적어 주시면 빨리 확인할 수 있어요.",
    mailApp: "메일 앱으로 문의하기",
    gmail: "Gmail로 쓰기",
    copyAddress: "주소 복사",
    copied: "복사했어요",
    mailFallback:
      "메일 앱이 열리지 않으면 ‘Gmail로 쓰기’를 누르거나, 주소를 복사해 쓰는 메일에서 보내 주세요.",
    privacyBefore: "개인정보에 관한 요청도 같은 주소로 받아요(",
    privacyLink: "개인정보처리방침",
    privacyAfter: ").",
    noContact: "아직 문의 창구를 정하지 못했어요.",
    mailSubject: "[SubSlash 문의] ",
    mailBody: (app: boolean) => `문의 내용:\n\n\n---\n사용 환경: ${app ? "앱" : "웹"}`,
    search: {
      label: "도움말 검색",
      placeholder: "무엇이 궁금하세요?",
      unavailable: "지금은 답할 수 없어요.",
      aiFound: "AI가 도움말에서 찾았어요",
      aiNone: "AI도 도움말에서 찾지 못했어요",
      aiEmpty: "도움말에 없는 내용이에요. 아래 ‘문의하기’로 알려 주세요.",
      closest: "가장 비슷한 질문",
      similar: "비슷할 수 있는 질문",
      noMatch: "비슷한 질문을 찾지 못했어요.",
      askAiNotThis: "원하는 답이 아니면 AI에게 찾아 달라고 하기",
      askAi: "AI에게 찾아 달라고 하기",
      aiPrivacy: "AI에는 적은 질문만 보내요. 이름·연락처 같은 개인정보는 적지 마세요.",
    },
  },
};

export const en: Widen<typeof ko> = {
  helpPage: {
    title: "Help",
    subtitle: "Frequently asked questions and where to contact us.",
    contact: "Contact us",
    contactBody:
      "If you can't find an answer, email us. For an error, tell us which screen you were on and what you tapped and we can check quickly.",
    mailApp: "Email us from your mail app",
    gmail: "Write in Gmail",
    copyAddress: "Copy address",
    copied: "Copied",
    mailFallback:
      "If your mail app doesn't open, tap “Write in Gmail”, or copy the address and send from the mail you use.",
    privacyBefore: "Requests about personal information go to the same address (",
    privacyLink: "Privacy policy",
    privacyAfter: ").",
    noContact: "We haven't set up a contact channel yet.",
    mailSubject: "[SubSlash inquiry] ",
    mailBody: (app) => `Your question:\n\n\n---\nEnvironment: ${app ? "app" : "web"}`,
    search: {
      label: "Search help",
      placeholder: "What would you like to know?",
      unavailable: "Can't answer right now.",
      aiFound: "The AI found this in Help",
      aiNone: "The AI couldn't find it in Help either",
      aiEmpty: "That isn't covered in Help. Tell us through “Contact us” below.",
      closest: "Closest question",
      similar: "Questions that may be similar",
      noMatch: "Couldn't find a similar question.",
      askAiNotThis: "If that's not the answer, ask the AI to look for it",
      askAi: "Ask the AI to look for it",
      aiPrivacy:
        "Only the question you wrote goes to the AI. Don't include personal details such as your name or contacts.",
    },
  },
};
