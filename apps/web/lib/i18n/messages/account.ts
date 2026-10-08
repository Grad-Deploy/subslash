import type { Widen } from "../types";
import { MONTHS_SHORT, countOf } from "../english";

/**
 * 내 정보·계정 화면: 이메일 확인 링크, 내 정보(나이·성별), 비밀번호 변경·재설정·찾기, 로그인 방법, 회원 탈퇴,
 * 앱 간편 로그인의 끝 화면, 계정 동기화 충돌 창. 서버가 돌려준 문장은 보여 주는 자리에서 known-text로 바꾼다.
 */
export const ko = {
  account: {
    username: "아이디",
    email: "이메일",
    cancel: "취소",
    home: "홈으로",
    seeMe: "내 정보 보기",
    failedTitle: "처리하지 못했습니다",
    networkFailed: "네트워크에 문제가 있어 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
    linkInvalidTitle: "링크가 만료됐거나 올바르지 않습니다",
    newPassword: "새 비밀번호",
    newPasswordConfirm: "새 비밀번호 확인",
    changing: "바꾸는 중...",
    changePassword: "비밀번호 바꾸기",
    verify: {
      question: "이 계정을 직접 가입하셨나요?",
      yes: "맞아요, 제가 가입했어요",
      no: "제가 가입하지 않았어요",
      declineBefore: "아이디 ",
      declineAfter:
        " 계정을 지웁니다. 되돌릴 수 없고, 이 주소로 다시 가입할 수 있게 됩니다. 이 계정으로 로그인해 있던 기기는 모두 로그아웃됩니다.",
      deleteAccount: "계정 지우기",
      verifiedTitle: "이메일을 확인했습니다",
      verifiedBody: (username: string | null) =>
        username
          ? `아이디 ${username} 계정의 이메일이 확인되었습니다.`
          : "이 계정의 이메일은 확인된 상태입니다.",
      declinedTitle: "계정을 지웠습니다",
      declinedBody:
        "알려주셔서 고맙습니다. 이 주소로 가입된 계정이 없어졌고, 이 주소로 다시 가입할 수 있습니다.",
      signup: "회원가입",
      goneTitle: "이미 지워진 계정입니다",
      goneBody: "이 링크가 가리키는 계정은 더 이상 없습니다. 이 주소로 새로 가입할 수 있습니다.",
      invalidBody: (days: number) =>
        `확인 링크는 보낸 뒤 ${days}일 동안만 쓸 수 있습니다. 로그인한 뒤 '내 정보'에서 확인 메일을 다시 받을 수 있습니다.`,
      goMe: "내 정보로 가기",
      unknownResponse: "알 수 없는 응답입니다.",
      failedRetry: "처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
    },
    profile: {
      guest: "로그인하지 않아도 모든 기록을 쓸 수 있어요. 로그인하면 기기끼리 기록이 맞춰져요.",
      login: "로그인하기",
      saveFailed: "저장하지 못했습니다.",
      saved: "저장했습니다.",
      saveNetwork: "네트워크에 문제가 있어 저장하지 못했습니다. 잠시 후 다시 시도해주세요.",
      verified: "확인됨",
      unverified: "미확인",
      unverifiedNote:
        "이 이메일이 본인 것인지 아직 확인하지 않았습니다. 확인 메일의 링크에서 ‘맞아요’를 누르면 확인됩니다. 확인 전에도 모든 기능을 그대로 쓸 수 있습니다.",
      sendVerification: "확인 메일 보내기",
      optionalTitle: "나이·성별 (선택)",
      optionalBody:
        "적지 않아도 모든 기능을 그대로 쓸 수 있습니다. 지금은 어떤 계산에도 쓰이지 않고, 나중에 ‘비슷한 사용자와 비교’ 기능이 생기면 그때 따로 동의를 받은 경우에만 쓰입니다. 칸을 비우고 저장하면 지워집니다.",
      age: "나이",
      agePlaceholder: "만 나이",
      gender: "성별",
      genderNone: "적지 않음",
      genders: { female: "여성", male: "남성", other: "기타", undisclosed: "밝히지 않음" },
      saving: "저장하는 중...",
      save: "저장하기",
    },
    change: {
      sameAsCurrent: "지금 비밀번호와 다른 비밀번호를 정해주세요.",
      passwordTitle: "비밀번호",
      noPasswordBefore: (username: string) =>
        `간편 로그인으로 가입해 아직 비밀번호가 없어요. 아이디(${username})로도 로그인하고 싶다면 `,
      forgot: "비밀번호 찾기",
      noPasswordAfter: (email: string) => `에서 ${email}로 메일을 받아 비밀번호를 만드세요.`,
      currentRequired: "지금 비밀번호를 입력해주세요.",
      changed: "비밀번호를 바꿨습니다. 다른 기기에서는 새 비밀번호로 다시 로그인해주세요.",
      failed: "비밀번호를 바꾸지 못했습니다. 잠시 후 다시 시도해주세요.",
      network: "네트워크에 문제가 있어 바꾸지 못했습니다. 잠시 후 다시 시도해주세요.",
      title: "비밀번호 변경",
      current: "지금 비밀번호",
      noteBefore:
        "바꾸면 이 계정으로 로그인해 있던 다른 기기는 모두 로그아웃됩니다. 지금 비밀번호가 기억나지 않으면 ",
      resetMail: "재설정 메일",
      noteAfter: "로 바꿀 수 있습니다.",
    },
    reset: {
      checkFailed: "링크를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.",
      logoutNote: "바꾸면 이 계정으로 로그인해 있던 다른 기기는 모두 로그아웃됩니다.",
      doneTitle: "비밀번호를 바꿨습니다",
      doneBody: (username: string) =>
        `${username ? `아이디 ${username} 계정에 ` : ""}새 비밀번호로 로그인했습니다. 다른 기기에서는 새 비밀번호로 다시 로그인해주세요.`,
      invalidBody: (minutes: number) =>
        `재설정 링크는 보낸 뒤 ${minutes}분 동안, 한 번만 쓸 수 있습니다. 비밀번호를 이미 바꿨다면 새 비밀번호로 로그인하세요.`,
      resend: "재설정 메일 다시 받기",
      toLogin: "로그인으로",
    },
    forgot: {
      failed: "재설정 메일을 보내지 못했습니다. 잠시 후 다시 시도해주세요.",
      network: "네트워크에 문제가 있어 요청하지 못했습니다. 잠시 후 다시 시도해주세요.",
      email: "가입한 이메일",
      sending: "보내는 중...",
      submit: "재설정 메일 받기",
      back: "로그인으로 돌아가기",
    },
    methods: {
      linked: (provider: string) =>
        `${provider} 계정을 연결했어요. 다음부터 이것으로도 로그인할 수 있어요.`,
      startFailed: "연결을 시작하지 못했어요.",
      connectNetwork: "네트워크에 문제가 있어 연결하지 못했어요.",
      disconnectFailed: "연결을 끊지 못했어요.",
      disconnected: (provider: string) => `${provider} 연결을 끊었어요.`,
      disconnectNetwork: "네트워크에 문제가 있어 끊지 못했어요.",
      title: "로그인 방법",
      body: (email: string) =>
        `연결해 두면 그 계정으로도 이 계정에 로그인해요. 연결한 계정의 이메일이 달라도 이 계정의 이메일(${email})은 바뀌지 않아요.`,
      password: "이메일·비밀번호",
      inUse: "사용 중",
      noPassword: "비밀번호 없음",
      linkedBadge: "연결됨",
      lastOne: "로그인할 방법이 하나뿐이라 끊을 수 없어요.",
      disconnect: "연결 끊기",
      connect: "연결하기",
      lastOneNote:
        "지금은 로그인할 방법이 하나뿐이라 끊을 수 없어요. 비밀번호를 만들거나 다른 계정을 먼저 연결하면 끊을 수 있어요.",
    },
    remove: {
      doneTitle: "탈퇴했습니다.",
      doneBody:
        "계정과 계정에 저장한 기록을 서버에서 지웠습니다. 이 브라우저의 구독 기록은 그대로 있어 로그인 없이 계속 쓸 수 있습니다.",
      failed: "탈퇴를 처리하지 못했습니다.",
      network: "네트워크에 문제가 있어 탈퇴하지 못했습니다. 잠시 후 다시 시도해주세요.",
      title: "회원 탈퇴",
      what: "계정(아이디·이메일·비밀번호 해시·나이·성별), 로그인 세션, 계정에 저장한 기록을 서버에서 바로 지웁니다. 되돌릴 수 없습니다.",
      kept: "이 브라우저에 있는 구독·체크인 기록은 지워지지 않습니다. 지우려면 내 구독의 ‘전체 초기화’나 브라우저 데이터 삭제를 쓰세요.",
      /** 서버가 받는 확인 글자. 언어와 상관없이 이 글자를 입력해야 한다. */
      typeRequired: (word: string) => `'${word}'를 입력해주세요.`,
      passwordRequired: "비밀번호를 입력해주세요.",
      typeLabel: (word: string) => `확인을 위해 '${word}'를 입력하세요`,
      passwordLabel: "비밀번호 확인",
      deleting: "지우는 중...",
      confirmDescription: (username: string) =>
        `'${username}' 계정을 지우시겠습니까?\n계정과 계정에 저장한 기록은 되돌릴 수 없습니다.`,
      confirm: "탈퇴",
    },
    oauthDone: {
      linkFailed: "연결하지 못했어요",
      loginFailed: "로그인하지 못했어요",
      linked: (provider: string) => `${provider} 계정을 연결했어요`,
      loggedIn: "로그인했어요",
      backToApp: "SubSlash 앱으로 돌아가기",
      closeNote: "이 창을 닫으면 SubSlash 앱으로 돌아갑니다.",
    },
    conflict: {
      counts: (subs: number, killed: number, logs: number) =>
        `구독 ${subs}개 (해지 ${killed}개), 체크인 ${logs}건`,
      unknownTime: "알 수 없는 시각",
      savedAt: (month: number, day: number, time: string) => `${month}월 ${day}일 ${time}`,
      leadFirst: "이 기기와 계정에 서로 다른 기록이 있습니다.",
      leadDiverged: "이 기기와 다른 기기에서 기록이 따로 바뀌었습니다.",
      title: "어느 기록을 쓸까요?",
      description: "두 기록을 합치지 않고 한쪽으로 맞춥니다. 고르지 않은 쪽의 기록은 사라집니다.",
      thisDevice: "이 기기",
      accountSaved: (when: string) => `계정 (마지막 저장 ${when})`,
      useLocal: "이 기기 기록 쓰기 (계정의 기록을 바꿈)",
      useServer: "계정 기록 쓰기 (이 기기의 기록을 바꿈)",
      later: "나중에 — 이 기기의 자동 동기화 끄기",
    },
  },
};

export const en: Widen<typeof ko> = {
  account: {
    username: "Username",
    email: "Email",
    cancel: "Cancel",
    home: "Home",
    seeMe: "See my account",
    failedTitle: "Couldn't complete this",
    networkFailed: "A network problem stopped this. Please try again shortly.",
    linkInvalidTitle: "This link has expired or isn't valid",
    newPassword: "New password",
    newPasswordConfirm: "Confirm new password",
    changing: "Changing...",
    changePassword: "Change password",
    verify: {
      question: "Did you sign up for this account yourself?",
      yes: "Yes, I signed up",
      no: "I didn't sign up",
      declineBefore: "We'll delete the account with username ",
      declineAfter:
        ". This can't be undone, and the address can be used to sign up again. Every device logged in to this account will be logged out.",
      deleteAccount: "Delete account",
      verifiedTitle: "Email confirmed",
      verifiedBody: (username) =>
        username
          ? `The email for the account ${username} is confirmed.`
          : "This account's email is already confirmed.",
      declinedTitle: "Account deleted",
      declinedBody:
        "Thanks for letting us know. The account signed up with this address is gone, and you can sign up again with it.",
      signup: "Sign up",
      goneTitle: "This account was already deleted",
      goneBody:
        "The account this link points to no longer exists. You can sign up anew with this address.",
      invalidBody: (days) =>
        `A confirmation link works for only ${countOf(days, "day")} after it's sent. Log in and you can get a new confirmation email from “My account”.`,
      goMe: "Go to my account",
      unknownResponse: "Unexpected response.",
      failedRetry: "Couldn't complete this. Please try again shortly.",
    },
    profile: {
      guest:
        "You can use all your records without logging in. Log in to keep your records in sync across devices.",
      login: "Log in",
      saveFailed: "Couldn't save.",
      saved: "Saved.",
      saveNetwork: "A network problem stopped the save. Please try again shortly.",
      verified: "Confirmed",
      unverified: "Unconfirmed",
      unverifiedNote:
        "We haven't confirmed this email is yours yet. Tap “Yes” in the confirmation email to confirm it. Everything works the same before you confirm.",
      sendVerification: "Send confirmation email",
      optionalTitle: "Age · gender (optional)",
      optionalBody:
        "Everything works without them. They aren't used in any calculation now; if a “compare with similar users” feature comes later, they'll be used only with your separate consent. Clear the fields and save to delete them.",
      age: "Age",
      agePlaceholder: "Age in years",
      gender: "Gender",
      genderNone: "Not given",
      genders: { female: "Female", male: "Male", other: "Other", undisclosed: "Prefer not to say" },
      saving: "Saving...",
      save: "Save",
    },
    change: {
      sameAsCurrent: "Choose a password different from your current one.",
      passwordTitle: "Password",
      noPasswordBefore: (username) =>
        `You signed up with social login, so there's no password yet. To also log in with your username (${username}), use `,
      forgot: "Forgot password",
      noPasswordAfter: (email) => ` to get an email at ${email} and create a password.`,
      currentRequired: "Enter your current password.",
      changed: "Password changed. Log in again with the new password on other devices.",
      failed: "Couldn't change the password. Please try again shortly.",
      network: "A network problem stopped the change. Please try again shortly.",
      title: "Change password",
      current: "Current password",
      noteBefore:
        "Changing it logs out every other device logged in to this account. If you don't remember your current password, you can change it with a ",
      resetMail: "reset email",
      noteAfter: ".",
    },
    reset: {
      checkFailed: "Couldn't check the link. Please try again shortly.",
      logoutNote: "Changing it logs out every other device logged in to this account.",
      doneTitle: "Password changed",
      doneBody: (username) =>
        `You're logged in${username ? ` to ${username}` : ""} with the new password. Log in again with it on other devices.`,
      invalidBody: (minutes) =>
        `A reset link works once, for ${countOf(minutes, "minute")} after it's sent. If you already changed your password, log in with the new one.`,
      resend: "Get a new reset email",
      toLogin: "Go to log in",
    },
    forgot: {
      failed: "Couldn't send the reset email. Please try again shortly.",
      network: "A network problem stopped the request. Please try again shortly.",
      email: "Email you signed up with",
      sending: "Sending...",
      submit: "Get a reset email",
      back: "Back to log in",
    },
    methods: {
      linked: (provider) =>
        `Connected your ${provider} account. You can log in with it from now on.`,
      startFailed: "Couldn't start connecting.",
      connectNetwork: "A network problem stopped the connection.",
      disconnectFailed: "Couldn't disconnect.",
      disconnected: (provider) => `Disconnected ${provider}.`,
      disconnectNetwork: "A network problem stopped the disconnect.",
      title: "Login methods",
      body: (email) =>
        `Once connected, you can log in to this account with it. Even if the connected account's email differs, this account's email (${email}) stays the same.`,
      password: "Email · password",
      inUse: "In use",
      noPassword: "No password",
      linkedBadge: "Connected",
      lastOne: "It's your only way to log in, so it can't be disconnected.",
      disconnect: "Disconnect",
      connect: "Connect",
      lastOneNote:
        "You have only one way to log in right now, so it can't be disconnected. Create a password or connect another account first.",
    },
    remove: {
      doneTitle: "Your account is deleted.",
      doneBody:
        "We deleted your account and the records saved to it from the server. Subscription records in this browser stay, so you can keep using them without logging in.",
      failed: "Couldn't delete the account.",
      network: "A network problem stopped the deletion. Please try again shortly.",
      title: "Delete account",
      what: "Your account (username, email, password hash, age, gender), login sessions, and records saved to your account are deleted from the server right away. This can't be undone.",
      kept: "Subscription and check-in records in this browser aren't deleted. To delete them, use “Reset everything” in My subscriptions or clear your browser data.",
      typeRequired: (word) => `Type '${word}'.`,
      passwordRequired: "Enter your password.",
      typeLabel: (word) => `Type '${word}' to confirm`,
      passwordLabel: "Confirm password",
      deleting: "Deleting...",
      confirmDescription: (username) =>
        `Delete the account '${username}'?\nThe account and the records saved to it can't be restored.`,
      confirm: "Delete",
    },
    oauthDone: {
      linkFailed: "Couldn't connect",
      loginFailed: "Couldn't log in",
      linked: (provider) => `Connected your ${provider} account`,
      loggedIn: "You're logged in",
      backToApp: "Back to the SubSlash app",
      closeNote: "Close this window to go back to the SubSlash app.",
    },
    conflict: {
      counts: (subs, killed, logs) =>
        `${countOf(subs, "subscription")} (${killed} cancelled), ${countOf(logs, "check-in")}`,
      unknownTime: "unknown time",
      savedAt: (month, day, time) => `${MONTHS_SHORT[Number(month) - 1] ?? month} ${day}, ${time}`,
      leadFirst: "This device and your account have different records.",
      leadDiverged: "Records changed separately on this device and another device.",
      title: "Which records should we use?",
      description:
        "The two aren't merged; both are set to one side. The records on the side you don't pick are lost.",
      thisDevice: "This device",
      accountSaved: (when) => `Account (last saved ${when})`,
      useLocal: "Use this device's records (replaces the account's)",
      useServer: "Use the account's records (replaces this device's)",
      later: "Later — turn off auto sync on this device",
    },
  },
};
