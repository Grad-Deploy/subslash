import type { Widen } from "../types";

/** 계정 페이지들의 제목·한 줄 설명(`AccountPageHeading`). 페이지는 서버 컴포넌트라 제목만 이 칸으로 그린다. */
export const ko = {
  accountPages: {
    me: { title: "내 정보", body: "계정과 기록을 관리해요." },
    forgot: {
      title: "비밀번호 재설정",
      body: "가입한 이메일로 새 비밀번호를 정할 수 있는 링크를 보내드립니다.",
    },
    reset: {
      title: "새 비밀번호 정하기",
      body: "메일로 받은 링크의 계정에 쓸 새 비밀번호를 정하세요.",
    },
    verify: {
      title: "가입 이메일 확인",
      body: "이 주소로 가입한 계정이 본인 것인지 알려주세요.",
    },
  },
};

export const en: Widen<typeof ko> = {
  accountPages: {
    me: { title: "My account", body: "Manage your account and records." },
    forgot: {
      title: "Reset password",
      body: "We'll send a link to the email you signed up with so you can set a new password.",
    },
    reset: {
      title: "Set a new password",
      body: "Set a new password for the account the emailed link belongs to.",
    },
    verify: {
      title: "Confirm sign-up email",
      body: "Let us know whether the account signed up with this address is yours.",
    },
  },
};
