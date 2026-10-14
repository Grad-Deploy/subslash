import type { Widen } from "../types";
import { MONTHS_SHORT, countOf } from "../english";
import { monthName } from "../months";

/**
 * 내 정보·계정 화면: 이메일 확인 링크, 내 정보, 비밀번호 변경·재설정·찾기, 로그인 방법, 회원 탈퇴,
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
      verified: "확인됨",
      unverified: "미확인",
      unverifiedNote:
        "이 이메일이 본인 것인지 아직 확인하지 않았습니다. 확인 메일의 링크에서 ‘맞아요’를 누르면 확인됩니다. 확인 전에도 모든 기능을 그대로 쓸 수 있습니다.",
      sendVerification: "확인 메일 보내기",
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
      what: "계정(아이디·이메일·비밀번호 해시), 로그인 세션, 계정에 저장한 기록을 서버에서 바로 지웁니다. 되돌릴 수 없습니다.",
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
      verified: "Confirmed",
      unverified: "Unconfirmed",
      unverifiedNote:
        "We haven't confirmed this email is yours yet. Tap “Yes” in the confirmation email to confirm it. Everything works the same before you confirm.",
      sendVerification: "Send confirmation email",
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
      what: "Your account (username, email, password hash), login sessions, and records saved to your account are deleted from the server right away. This can't be undone.",
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

const acPl = (n: number, one: string, many: string) => (Number(n) === 1 ? one : many);

export const zh: Widen<typeof ko> = {
  account: {
    username: "用户名",
    email: "邮箱",
    cancel: "取消",
    home: "首页",
    seeMe: "查看我的信息",
    failedTitle: "无法完成",
    networkFailed: "因网络问题中断。请稍后再试。",
    linkInvalidTitle: "链接已过期或无效",
    newPassword: "新密码",
    newPasswordConfirm: "确认新密码",
    changing: "正在修改...",
    changePassword: "修改密码",
    verify: {
      question: "这个账户是你本人注册的吗？",
      yes: "是，我注册的",
      no: "我没有注册",
      declineBefore: "将删除用户名为 ",
      declineAfter:
        " 的账户。此操作无法撤销，这个地址可以再次用于注册。所有登录此账户的设备都会退出登录。",
      deleteAccount: "删除账户",
      verifiedTitle: "邮箱已确认",
      verifiedBody: (username) =>
        username ? `账户 ${username} 的邮箱已确认。` : "这个账户的邮箱已经确认过了。",
      declinedTitle: "账户已删除",
      declinedBody: "感谢告知。用这个地址注册的账户已删除，你可以用它重新注册。",
      signup: "注册",
      goneTitle: "这个账户已经被删除",
      goneBody: "这个链接指向的账户已不存在。可以用这个地址重新注册。",
      invalidBody: (days) =>
        `确认链接只在发送后 ${days} 天内有效。登录后可以在“我的信息”中重新获取确认邮件。`,
      goMe: "前往我的信息",
      unknownResponse: "意外的响应。",
      failedRetry: "无法完成。请稍后再试。",
    },
    profile: {
      guest: "不登录也能使用所有记录。登录后可以让记录在各设备间保持同步。",
      login: "登录",
      verified: "已确认",
      unverified: "未确认",
      unverifiedNote:
        "我们还没有确认这个邮箱是你的。在确认邮件中点“是”即可确认。确认之前所有功能照常使用。",
      sendVerification: "发送确认邮件",
    },
    change: {
      sameAsCurrent: "请设置一个与当前密码不同的密码。",
      passwordTitle: "密码",
      noPasswordBefore: (username) =>
        `你是通过快捷登录注册的，还没有密码。若也想用用户名（${username}）登录，请用`,
      forgot: "找回密码",
      noPasswordAfter: (email) => `向 ${email} 获取邮件并设置密码。`,
      currentRequired: "请输入当前密码。",
      changed: "密码已修改。请在其他设备上用新密码重新登录。",
      failed: "无法修改密码。请稍后再试。",
      network: "因网络问题无法修改。请稍后再试。",
      title: "修改密码",
      current: "当前密码",
      noteBefore: "修改后，所有登录此账户的其他设备都会退出登录。如果不记得当前密码，可以用",
      resetMail: "重置邮件",
      noteAfter: "修改。",
    },
    reset: {
      checkFailed: "无法确认链接。请稍后再试。",
      logoutNote: "修改后，所有登录此账户的其他设备都会退出登录。",
      doneTitle: "密码已修改",
      doneBody: (username) =>
        `已用新密码登录${username ? ` ${username}` : ""}。请在其他设备上用新密码重新登录。`,
      invalidBody: (minutes) =>
        `重置链接只能在发送后 ${minutes} 分钟内使用一次。如果已经修改过密码，请用新密码登录。`,
      resend: "重新获取重置邮件",
      toLogin: "前往登录",
    },
    forgot: {
      failed: "无法发送重置邮件。请稍后再试。",
      network: "因网络问题无法请求。请稍后再试。",
      email: "注册时的邮箱",
      sending: "正在发送...",
      submit: "获取重置邮件",
      back: "返回登录",
    },
    methods: {
      linked: (provider) => `已连接 ${provider} 账户。以后可以用它登录。`,
      startFailed: "无法开始连接。",
      connectNetwork: "因网络问题无法连接。",
      disconnectFailed: "无法断开连接。",
      disconnected: (provider) => `已断开 ${provider}。`,
      disconnectNetwork: "因网络问题无法断开。",
      title: "登录方式",
      body: (email) =>
        `连接后可以用它登录这个账户。即使连接的账户邮箱不同，这个账户的邮箱（${email}）也不会变。`,
      password: "邮箱 · 密码",
      inUse: "使用中",
      noPassword: "无密码",
      linkedBadge: "已连接",
      lastOne: "这是唯一的登录方式，无法断开。",
      disconnect: "断开",
      connect: "连接",
      lastOneNote: "目前只有一种登录方式，所以无法断开。请先设置密码或连接其他账户。",
    },
    remove: {
      doneTitle: "账户已注销。",
      doneBody:
        "已从服务器删除你的账户和账户中保存的记录。这个浏览器中的订阅记录仍在，不登录也可以继续使用。",
      failed: "无法注销账户。",
      network: "因网络问题无法注销。请稍后再试。",
      title: "注销账户",
      what: "你的账户（用户名、邮箱、密码哈希）、登录会话以及账户中保存的记录会立即从服务器删除。此操作无法撤销。",
      kept: "这个浏览器中的订阅和签到记录不会被删除。要删除它们，请用“我的订阅”中的“全部重置”或清除浏览器数据。",
      typeRequired: (word) => `请输入“${word}”。`,
      passwordRequired: "请输入密码。",
      typeLabel: (word) => `输入“${word}”以确认`,
      passwordLabel: "确认密码",
      deleting: "正在注销...",
      confirmDescription: (username) =>
        `要注销账户“${username}”吗？\n账户和其中保存的记录无法恢复。`,
      confirm: "注销",
    },
    oauthDone: {
      linkFailed: "无法连接",
      loginFailed: "无法登录",
      linked: (provider) => `已连接 ${provider} 账户`,
      loggedIn: "已登录",
      backToApp: "返回 SubSlash 应用",
      closeNote: "关闭这个窗口即可返回 SubSlash 应用。",
    },
    conflict: {
      counts: (subs, killed, logs) => `订阅 ${subs} 个（已退订 ${killed} 个），签到 ${logs} 条`,
      unknownTime: "未知时间",
      savedAt: (month, day, time) => `${Number(month)}月${day}日 ${time}`,
      leadFirst: "这台设备和账户中的记录不同。",
      leadDiverged: "这台设备和另一台设备分别修改了记录。",
      title: "使用哪边的记录？",
      description: "两边不会合并，而是统一成一边。没选的那边的记录会消失。",
      thisDevice: "这台设备",
      accountSaved: (when) => `账户（最后保存 ${when}）`,
      useLocal: "使用这台设备的记录（替换账户中的）",
      useServer: "使用账户中的记录（替换这台设备的）",
      later: "稍后 —— 关闭这台设备的自动同步",
    },
  },
};

export const ja: Widen<typeof ko> = {
  account: {
    username: "ユーザー名",
    email: "メールアドレス",
    cancel: "キャンセル",
    home: "ホーム",
    seeMe: "マイ情報を見る",
    failedTitle: "処理できませんでした",
    networkFailed: "ネットワークの問題で中断しました。しばらくしてからもう一度お試しください。",
    linkInvalidTitle: "リンクの有効期限が切れているか、正しくありません",
    newPassword: "新しいパスワード",
    newPasswordConfirm: "新しいパスワードの確認",
    changing: "変更中...",
    changePassword: "パスワードを変更",
    verify: {
      question: "このアカウントはご本人が登録しましたか？",
      yes: "はい、自分で登録しました",
      no: "登録していません",
      declineBefore: "ユーザー名 ",
      declineAfter:
        " のアカウントを削除します。元に戻せず、このアドレスは再び登録に使えるようになります。このアカウントでログインしているすべての端末がログアウトされます。",
      deleteAccount: "アカウントを削除",
      verifiedTitle: "メールアドレスを確認しました",
      verifiedBody: (username) =>
        username
          ? `${username} アカウントのメールアドレスを確認しました。`
          : "このアカウントのメールアドレスはすでに確認済みです。",
      declinedTitle: "アカウントを削除しました",
      declinedBody:
        "お知らせいただきありがとうございます。このアドレスで登録されたアカウントはなくなり、このアドレスでまた登録できます。",
      signup: "会員登録",
      goneTitle: "このアカウントはすでに削除されています",
      goneBody: "このリンクのアカウントはもうありません。このアドレスで新しく登録できます。",
      invalidBody: (days) =>
        `確認リンクは送信後 ${days} 日間だけ有効です。ログインすると「マイ情報」で新しい確認メールを受け取れます。`,
      goMe: "マイ情報へ",
      unknownResponse: "予期しない応答です。",
      failedRetry: "処理できませんでした。しばらくしてからもう一度お試しください。",
    },
    profile: {
      guest:
        "ログインしなくてもすべての記録を使えます。ログインすると端末どうしで記録がそろいます。",
      login: "ログイン",
      verified: "確認済み",
      unverified: "未確認",
      unverifiedNote:
        "このメールアドレスがご本人のものかまだ確認していません。確認メールで「はい」を押すと確認されます。確認前でも同じように使えます。",
      sendVerification: "確認メールを送る",
    },
    change: {
      sameAsCurrent: "現在のパスワードとは違うパスワードにしてください。",
      passwordTitle: "パスワード",
      noPasswordBefore: (username) =>
        `簡単ログインで登録したため、まだパスワードがありません。ユーザー名（${username}）でもログインするには、`,
      forgot: "パスワードの再設定",
      noPasswordAfter: (email) => `で ${email} にメールを受け取り、パスワードを作ってください。`,
      currentRequired: "現在のパスワードを入力してください。",
      changed:
        "パスワードを変更しました。ほかの端末では新しいパスワードでもう一度ログインしてください。",
      failed: "パスワードを変更できませんでした。しばらくしてからもう一度お試しください。",
      network: "ネットワークの問題で変更できませんでした。しばらくしてからもう一度お試しください。",
      title: "パスワードの変更",
      current: "現在のパスワード",
      noteBefore:
        "変更すると、このアカウントでログインしているほかのすべての端末がログアウトされます。現在のパスワードを覚えていなければ、",
      resetMail: "再設定メール",
      noteAfter: "で変更できます。",
    },
    reset: {
      checkFailed: "リンクを確認できませんでした。しばらくしてからもう一度お試しください。",
      logoutNote:
        "変更すると、このアカウントでログインしているほかのすべての端末がログアウトされます。",
      doneTitle: "パスワードを変更しました",
      doneBody: (username) =>
        `新しいパスワードで${username ? ` ${username} に` : ""}ログインしました。ほかの端末では新しいパスワードでもう一度ログインしてください。`,
      invalidBody: (minutes) =>
        `再設定リンクは送信後 ${minutes} 分間に 1 回だけ使えます。すでにパスワードを変更したなら、新しいパスワードでログインしてください。`,
      resend: "再設定メールをもう一度受け取る",
      toLogin: "ログインへ",
    },
    forgot: {
      failed: "再設定メールを送れませんでした。しばらくしてからもう一度お試しください。",
      network:
        "ネットワークの問題でリクエストできませんでした。しばらくしてからもう一度お試しください。",
      email: "登録したメールアドレス",
      sending: "送信中...",
      submit: "再設定メールを受け取る",
      back: "ログインに戻る",
    },
    methods: {
      linked: (provider) =>
        `${provider} アカウントをつなぎました。これからはこれでもログインできます。`,
      startFailed: "連携を開始できませんでした。",
      connectNetwork: "ネットワークの問題で連携できませんでした。",
      disconnectFailed: "連携を解除できませんでした。",
      disconnected: (provider) => `${provider} の連携を解除しました。`,
      disconnectNetwork: "ネットワークの問題で解除できませんでした。",
      title: "ログイン方法",
      body: (email) =>
        `つなぐと、それでこのアカウントにログインできます。つないだアカウントのメールアドレスが違っても、このアカウントのメールアドレス（${email}）は変わりません。`,
      password: "メールアドレス · パスワード",
      inUse: "使用中",
      noPassword: "パスワードなし",
      linkedBadge: "連携済み",
      lastOne: "ログインできる方法がこれだけなので解除できません。",
      disconnect: "解除",
      connect: "連携",
      lastOneNote:
        "今ログインできる方法は 1 つだけなので解除できません。先にパスワードを作るか、別のアカウントをつないでください。",
    },
    remove: {
      doneTitle: "退会しました。",
      doneBody:
        "アカウントとアカウントに保存した記録をサーバーから削除しました。このブラウザのサブスクの記録は残っているので、ログインせずに使い続けられます。",
      failed: "退会を処理できませんでした。",
      network: "ネットワークの問題で退会できませんでした。しばらくしてからもう一度お試しください。",
      title: "退会",
      what: "アカウント（ユーザー名・メールアドレス・パスワードのハッシュ）、ログインセッション、アカウントに保存した記録をすぐにサーバーから削除します。元に戻せません。",
      kept: "このブラウザのサブスクとチェックインの記録は削除されません。消すには「マイサブスク」の「すべてリセット」を使うか、ブラウザのデータを消してください。",
      typeRequired: (word) => `「${word}」と入力してください。`,
      passwordRequired: "パスワードを入力してください。",
      typeLabel: (word) => `確認のため「${word}」と入力`,
      passwordLabel: "パスワードの確認",
      deleting: "削除中...",
      confirmDescription: (username) =>
        `アカウント「${username}」を削除しますか？\nアカウントとそこに保存した記録は元に戻せません。`,
      confirm: "退会",
    },
    oauthDone: {
      linkFailed: "連携できませんでした",
      loginFailed: "ログインできませんでした",
      linked: (provider) => `${provider} アカウントをつなぎました`,
      loggedIn: "ログインしました",
      backToApp: "SubSlash アプリに戻る",
      closeNote: "このウィンドウを閉じると SubSlash アプリに戻ります。",
    },
    conflict: {
      counts: (subs, killed, logs) =>
        `サブスク ${subs} 件（解約 ${killed} 件）、チェックイン ${logs} 件`,
      unknownTime: "不明な時刻",
      savedAt: (month, day, time) => `${Number(month)}月${day}日 ${time}`,
      leadFirst: "この端末とアカウントの記録が違います。",
      leadDiverged: "この端末とほかの端末で記録が別々に変わりました。",
      title: "どちらの記録を使いますか？",
      description: "2 つは統合されず、どちらか一方にそろえます。選ばなかった方の記録は消えます。",
      thisDevice: "この端末",
      accountSaved: (when) => `アカウント（最終保存 ${when}）`,
      useLocal: "この端末の記録を使う（アカウントを置き換え）",
      useServer: "アカウントの記録を使う（この端末を置き換え）",
      later: "あとで — この端末の自動同期をオフにする",
    },
  },
};

export const vi: Widen<typeof ko> = {
  account: {
    username: "Tên người dùng",
    email: "Email",
    cancel: "Hủy",
    home: "Trang chủ",
    seeMe: "Xem thông tin của tôi",
    failedTitle: "Không thể hoàn tất",
    networkFailed: "Bị gián đoạn do sự cố mạng. Hãy thử lại sau ít phút.",
    linkInvalidTitle: "Đường dẫn đã hết hạn hoặc không hợp lệ",
    newPassword: "Mật khẩu mới",
    newPasswordConfirm: "Xác nhận mật khẩu mới",
    changing: "Đang đổi...",
    changePassword: "Đổi mật khẩu",
    verify: {
      question: "Chính bạn đã đăng ký tài khoản này?",
      yes: "Đúng, tôi đã đăng ký",
      no: "Tôi không đăng ký",
      declineBefore: "Chúng tôi sẽ xóa tài khoản có tên người dùng ",
      declineAfter:
        ". Không thể hoàn tác, và địa chỉ này có thể dùng để đăng ký lại. Mọi thiết bị đăng nhập tài khoản này sẽ bị đăng xuất.",
      deleteAccount: "Xóa tài khoản",
      verifiedTitle: "Đã xác nhận email",
      verifiedBody: (username) =>
        username
          ? `Email của tài khoản ${username} đã được xác nhận.`
          : "Email của tài khoản này đã được xác nhận trước đó.",
      declinedTitle: "Đã xóa tài khoản",
      declinedBody:
        "Cảm ơn bạn đã báo. Tài khoản đăng ký bằng địa chỉ này đã bị xóa, bạn có thể dùng nó để đăng ký lại.",
      signup: "Đăng ký",
      goneTitle: "Tài khoản này đã bị xóa",
      goneBody:
        "Tài khoản mà đường dẫn này trỏ tới không còn. Bạn có thể đăng ký mới bằng địa chỉ này.",
      invalidBody: (days) =>
        `Đường dẫn xác nhận chỉ có hiệu lực ${days} ngày sau khi gửi. Đăng nhập rồi nhận email xác nhận mới trong “Thông tin của tôi”.`,
      goMe: "Đến thông tin của tôi",
      unknownResponse: "Phản hồi không mong đợi.",
      failedRetry: "Không thể hoàn tất. Hãy thử lại sau ít phút.",
    },
    profile: {
      guest:
        "Không đăng nhập vẫn dùng được mọi dữ liệu. Đăng nhập để đồng bộ dữ liệu giữa các thiết bị.",
      login: "Đăng nhập",
      verified: "Đã xác nhận",
      unverified: "Chưa xác nhận",
      unverifiedNote:
        "Chúng tôi chưa xác nhận email này là của bạn. Nhấn “Đúng” trong email xác nhận để xác nhận. Trước khi xác nhận vẫn dùng như bình thường.",
      sendVerification: "Gửi email xác nhận",
    },
    change: {
      sameAsCurrent: "Hãy đặt mật khẩu khác với mật khẩu hiện tại.",
      passwordTitle: "Mật khẩu",
      noPasswordBefore: (username) =>
        `Bạn đăng ký bằng đăng nhập nhanh nên chưa có mật khẩu. Để cũng đăng nhập bằng tên người dùng (${username}), hãy dùng `,
      forgot: "Quên mật khẩu",
      noPasswordAfter: (email) => ` để nhận email tại ${email} và tạo mật khẩu.`,
      currentRequired: "Nhập mật khẩu hiện tại.",
      changed: "Đã đổi mật khẩu. Trên thiết bị khác, hãy đăng nhập lại bằng mật khẩu mới.",
      failed: "Không đổi được mật khẩu. Hãy thử lại sau ít phút.",
      network: "Không đổi được do sự cố mạng. Hãy thử lại sau ít phút.",
      title: "Đổi mật khẩu",
      current: "Mật khẩu hiện tại",
      noteBefore:
        "Đổi mật khẩu sẽ đăng xuất mọi thiết bị khác đang đăng nhập tài khoản này. Nếu không nhớ mật khẩu hiện tại, bạn có thể đổi bằng ",
      resetMail: "email đặt lại",
      noteAfter: ".",
    },
    reset: {
      checkFailed: "Không kiểm tra được đường dẫn. Hãy thử lại sau ít phút.",
      logoutNote: "Đổi mật khẩu sẽ đăng xuất mọi thiết bị khác đang đăng nhập tài khoản này.",
      doneTitle: "Đã đổi mật khẩu",
      doneBody: (username) =>
        `Đã đăng nhập${username ? ` ${username}` : ""} bằng mật khẩu mới. Trên thiết bị khác, hãy đăng nhập lại bằng mật khẩu mới.`,
      invalidBody: (minutes) =>
        `Đường dẫn đặt lại chỉ dùng được một lần trong ${minutes} phút sau khi gửi. Nếu đã đổi mật khẩu, hãy đăng nhập bằng mật khẩu mới.`,
      resend: "Nhận lại email đặt lại",
      toLogin: "Đến đăng nhập",
    },
    forgot: {
      failed: "Không gửi được email đặt lại. Hãy thử lại sau ít phút.",
      network: "Không gửi được yêu cầu do sự cố mạng. Hãy thử lại sau ít phút.",
      email: "Email bạn đã đăng ký",
      sending: "Đang gửi...",
      submit: "Nhận email đặt lại",
      back: "Quay lại đăng nhập",
    },
    methods: {
      linked: (provider) =>
        `Đã kết nối tài khoản ${provider}. Từ giờ bạn có thể đăng nhập bằng nó.`,
      startFailed: "Không thể bắt đầu kết nối.",
      connectNetwork: "Không kết nối được do sự cố mạng.",
      disconnectFailed: "Không ngắt kết nối được.",
      disconnected: (provider) => `Đã ngắt kết nối ${provider}.`,
      disconnectNetwork: "Không ngắt được do sự cố mạng.",
      title: "Cách đăng nhập",
      body: (email) =>
        `Sau khi kết nối, bạn có thể đăng nhập tài khoản này bằng nó. Dù email của tài khoản kết nối khác, email của tài khoản này (${email}) vẫn giữ nguyên.`,
      password: "Email · mật khẩu",
      inUse: "Đang dùng",
      noPassword: "Chưa có mật khẩu",
      linkedBadge: "Đã kết nối",
      lastOne: "Đây là cách đăng nhập duy nhất nên không thể ngắt.",
      disconnect: "Ngắt",
      connect: "Kết nối",
      lastOneNote:
        "Hiện bạn chỉ có một cách đăng nhập nên không thể ngắt. Hãy tạo mật khẩu hoặc kết nối tài khoản khác trước.",
    },
    remove: {
      doneTitle: "Đã xóa tài khoản của bạn.",
      doneBody:
        "Đã xóa tài khoản và dữ liệu lưu trong tài khoản khỏi máy chủ. Dữ liệu đăng ký trong trình duyệt này vẫn còn, bạn có thể tiếp tục dùng mà không cần đăng nhập.",
      failed: "Không xóa được tài khoản.",
      network: "Không xóa được do sự cố mạng. Hãy thử lại sau ít phút.",
      title: "Xóa tài khoản",
      what: "Tài khoản (tên người dùng, email, bản băm mật khẩu), phiên đăng nhập và dữ liệu lưu trong tài khoản sẽ bị xóa khỏi máy chủ ngay lập tức. Không thể hoàn tác.",
      kept: "Dữ liệu đăng ký và check-in trong trình duyệt này không bị xóa. Để xóa, hãy dùng “Đặt lại tất cả” trong Gói đăng ký của tôi hoặc xóa dữ liệu trình duyệt.",
      typeRequired: (word) => `Hãy nhập '${word}'.`,
      passwordRequired: "Nhập mật khẩu.",
      typeLabel: (word) => `Nhập '${word}' để xác nhận`,
      passwordLabel: "Xác nhận mật khẩu",
      deleting: "Đang xóa...",
      confirmDescription: (username) =>
        `Xóa tài khoản '${username}'?\nTài khoản và dữ liệu lưu trong đó không thể khôi phục.`,
      confirm: "Xóa",
    },
    oauthDone: {
      linkFailed: "Không kết nối được",
      loginFailed: "Không đăng nhập được",
      linked: (provider) => `Đã kết nối tài khoản ${provider}`,
      loggedIn: "Đã đăng nhập",
      backToApp: "Quay lại ứng dụng SubSlash",
      closeNote: "Đóng cửa sổ này để quay lại ứng dụng SubSlash.",
    },
    conflict: {
      counts: (subs, killed, logs) => `${subs} gói (${killed} đã hủy), ${logs} lượt check-in`,
      unknownTime: "không rõ thời gian",
      savedAt: (month, day, time) => `${day}/${Number(month)} ${time}`,
      leadFirst: "Dữ liệu trên thiết bị này và trong tài khoản khác nhau.",
      leadDiverged: "Dữ liệu đã thay đổi riêng trên thiết bị này và một thiết bị khác.",
      title: "Dùng dữ liệu bên nào?",
      description:
        "Hai bên không được gộp mà sẽ thống nhất theo một bên. Dữ liệu của bên không chọn sẽ mất.",
      thisDevice: "Thiết bị này",
      accountSaved: (when) => `Tài khoản (lưu lần cuối ${when})`,
      useLocal: "Dùng dữ liệu thiết bị này (thay dữ liệu tài khoản)",
      useServer: "Dùng dữ liệu tài khoản (thay dữ liệu thiết bị này)",
      later: "Để sau — tắt đồng bộ tự động trên thiết bị này",
    },
  },
};

export const fr: Widen<typeof ko> = {
  account: {
    username: "Identifiant",
    email: "E-mail",
    cancel: "Annuler",
    home: "Accueil",
    seeMe: "Voir mon compte",
    failedTitle: "Impossible de terminer",
    networkFailed: "Un problème réseau a interrompu l'opération. Réessayez dans un instant.",
    linkInvalidTitle: "Ce lien a expiré ou n'est pas valide",
    newPassword: "Nouveau mot de passe",
    newPasswordConfirm: "Confirmer le nouveau mot de passe",
    changing: "Modification...",
    changePassword: "Changer le mot de passe",
    verify: {
      question: "Avez-vous créé ce compte vous-même ?",
      yes: "Oui, je me suis inscrit",
      no: "Je ne me suis pas inscrit",
      declineBefore: "Nous allons supprimer le compte dont l'identifiant est ",
      declineAfter:
        ". C'est irréversible, et l'adresse pourra servir à une nouvelle inscription. Tous les appareils connectés à ce compte seront déconnectés.",
      deleteAccount: "Supprimer le compte",
      verifiedTitle: "E-mail confirmé",
      verifiedBody: (username) =>
        username
          ? `L'e-mail du compte ${username} est confirmé.`
          : "L'e-mail de ce compte est déjà confirmé.",
      declinedTitle: "Compte supprimé",
      declinedBody:
        "Merci de nous avoir prévenus. Le compte créé avec cette adresse a été supprimé, vous pouvez vous inscrire avec.",
      signup: "S'inscrire",
      goneTitle: "Ce compte a déjà été supprimé",
      goneBody:
        "Le compte visé par ce lien n'existe plus. Vous pouvez vous inscrire avec cette adresse.",
      invalidBody: (days) =>
        `Un lien de confirmation n'est valable que ${days} jour${acPl(days, "", "s")} après son envoi. Connectez-vous pour recevoir un nouvel e-mail depuis « Mon compte ».`,
      goMe: "Aller à mon compte",
      unknownResponse: "Réponse inattendue.",
      failedRetry: "Impossible de terminer. Réessayez dans un instant.",
    },
    profile: {
      guest:
        "Vous pouvez utiliser toutes vos données sans vous connecter. Connectez-vous pour les synchroniser entre appareils.",
      login: "Se connecter",
      verified: "Confirmé",
      unverified: "Non confirmé",
      unverifiedNote:
        "Nous n'avons pas encore confirmé que cet e-mail est le vôtre. Appuyez sur « Oui » dans l'e-mail de confirmation. Tout fonctionne de la même façon avant la confirmation.",
      sendVerification: "Envoyer l'e-mail de confirmation",
    },
    change: {
      sameAsCurrent: "Choisissez un mot de passe différent de l'actuel.",
      passwordTitle: "Mot de passe",
      noPasswordBefore: (username) =>
        `Vous vous êtes inscrit avec une connexion rapide, vous n'avez donc pas encore de mot de passe. Pour vous connecter aussi avec votre identifiant (${username}), utilisez `,
      forgot: "Mot de passe oublié",
      noPasswordAfter: (email) => ` pour recevoir un e-mail à ${email} et créer un mot de passe.`,
      currentRequired: "Saisissez votre mot de passe actuel.",
      changed: "Mot de passe modifié. Reconnectez-vous avec le nouveau sur vos autres appareils.",
      failed: "Impossible de modifier le mot de passe. Réessayez dans un instant.",
      network: "Un problème réseau a empêché la modification. Réessayez dans un instant.",
      title: "Changer le mot de passe",
      current: "Mot de passe actuel",
      noteBefore:
        "Le changer déconnecte tous les autres appareils connectés à ce compte. Si vous ne vous souvenez pas du mot de passe actuel, vous pouvez le changer avec un ",
      resetMail: "e-mail de réinitialisation",
      noteAfter: ".",
    },
    reset: {
      checkFailed: "Impossible de vérifier le lien. Réessayez dans un instant.",
      logoutNote: "Le changer déconnecte tous les autres appareils connectés à ce compte.",
      doneTitle: "Mot de passe modifié",
      doneBody: (username) =>
        `Vous êtes connecté${username ? ` à ${username}` : ""} avec le nouveau mot de passe. Reconnectez-vous avec sur vos autres appareils.`,
      invalidBody: (minutes) =>
        `Un lien de réinitialisation ne fonctionne qu'une fois, pendant ${minutes} minutes après son envoi. Si vous avez déjà changé de mot de passe, connectez-vous avec le nouveau.`,
      resend: "Recevoir un nouvel e-mail",
      toLogin: "Aller à la connexion",
    },
    forgot: {
      failed: "Impossible d'envoyer l'e-mail de réinitialisation. Réessayez dans un instant.",
      network: "Un problème réseau a empêché la demande. Réessayez dans un instant.",
      email: "E-mail d'inscription",
      sending: "Envoi...",
      submit: "Recevoir un e-mail de réinitialisation",
      back: "Retour à la connexion",
    },
    methods: {
      linked: (provider) =>
        `Compte ${provider} associé. Vous pouvez désormais vous connecter avec.`,
      startFailed: "Impossible de lancer l'association.",
      connectNetwork: "Un problème réseau a empêché l'association.",
      disconnectFailed: "Impossible de dissocier.",
      disconnected: (provider) => `${provider} dissocié.`,
      disconnectNetwork: "Un problème réseau a empêché la dissociation.",
      title: "Modes de connexion",
      body: (email) =>
        `Une fois associé, vous pouvez vous connecter à ce compte avec. Même si l'e-mail du compte associé diffère, celui de ce compte (${email}) ne change pas.`,
      password: "E-mail · mot de passe",
      inUse: "Utilisé",
      noPassword: "Pas de mot de passe",
      linkedBadge: "Associé",
      lastOne: "C'est votre seul moyen de connexion, impossible de le dissocier.",
      disconnect: "Dissocier",
      connect: "Associer",
      lastOneNote:
        "Vous n'avez qu'un seul moyen de connexion pour l'instant, impossible de le dissocier. Créez d'abord un mot de passe ou associez un autre compte.",
    },
    remove: {
      doneTitle: "Votre compte est supprimé.",
      doneBody:
        "Nous avons supprimé votre compte et les données qui y étaient enregistrées du serveur. Les abonnements dans ce navigateur restent : vous pouvez continuer sans vous connecter.",
      failed: "Impossible de supprimer le compte.",
      network: "Un problème réseau a empêché la suppression. Réessayez dans un instant.",
      title: "Supprimer le compte",
      what: "Votre compte (identifiant, e-mail, hachage du mot de passe), vos sessions et les données enregistrées dans le compte sont supprimés du serveur immédiatement. C'est irréversible.",
      kept: "Les abonnements et check-ins de ce navigateur ne sont pas supprimés. Pour les effacer, utilisez « Tout réinitialiser » dans Mes abonnements ou videz les données du navigateur.",
      typeRequired: (word) => `Saisissez « ${word} ».`,
      passwordRequired: "Saisissez votre mot de passe.",
      typeLabel: (word) => `Saisissez « ${word} » pour confirmer`,
      passwordLabel: "Confirmer le mot de passe",
      deleting: "Suppression...",
      confirmDescription: (username) =>
        `Supprimer le compte « ${username} » ?\nLe compte et ses données ne pourront pas être restaurés.`,
      confirm: "Supprimer",
    },
    oauthDone: {
      linkFailed: "Association impossible",
      loginFailed: "Connexion impossible",
      linked: (provider) => `Compte ${provider} associé`,
      loggedIn: "Vous êtes connecté",
      backToApp: "Revenir à l'application SubSlash",
      closeNote: "Fermez cette fenêtre pour revenir à l'application SubSlash.",
    },
    conflict: {
      counts: (subs, killed, logs) =>
        `${subs} abonnement${acPl(subs, "", "s")} (${killed} résilié${acPl(killed, "", "s")}), ${logs} check-in${acPl(logs, "", "s")}`,
      unknownTime: "heure inconnue",
      savedAt: (month, day, time) => `${day} ${monthName("fr", month)}, ${time}`,
      leadFirst: "Cet appareil et votre compte ont des données différentes.",
      leadDiverged: "Les données ont changé séparément sur cet appareil et sur un autre.",
      title: "Quelles données utiliser ?",
      description:
        "Les deux ne sont pas fusionnées : on garde un seul côté. Les données du côté non choisi sont perdues.",
      thisDevice: "Cet appareil",
      accountSaved: (when) => `Compte (dernier enregistrement ${when})`,
      useLocal: "Utiliser les données de cet appareil (remplace celles du compte)",
      useServer: "Utiliser les données du compte (remplace celles de cet appareil)",
      later: "Plus tard — désactiver la synchronisation sur cet appareil",
    },
  },
};

export const es: Widen<typeof ko> = {
  account: {
    username: "Usuario",
    email: "Correo",
    cancel: "Cancelar",
    home: "Inicio",
    seeMe: "Ver mi cuenta",
    failedTitle: "No se pudo completar",
    networkFailed: "Un problema de red lo interrumpió. Inténtalo en un momento.",
    linkInvalidTitle: "Este enlace caducó o no es válido",
    newPassword: "Nueva contraseña",
    newPasswordConfirm: "Confirmar nueva contraseña",
    changing: "Cambiando...",
    changePassword: "Cambiar contraseña",
    verify: {
      question: "¿Creaste tú esta cuenta?",
      yes: "Sí, me registré",
      no: "No me registré",
      declineBefore: "Borraremos la cuenta con el usuario ",
      declineAfter:
        ". No se puede deshacer y la dirección podrá usarse para registrarse de nuevo. Se cerrará la sesión en todos los dispositivos con esta cuenta.",
      deleteAccount: "Borrar cuenta",
      verifiedTitle: "Correo confirmado",
      verifiedBody: (username) =>
        username
          ? `El correo de la cuenta ${username} está confirmado.`
          : "El correo de esta cuenta ya estaba confirmado.",
      declinedTitle: "Cuenta borrada",
      declinedBody:
        "Gracias por avisarnos. La cuenta registrada con esta dirección se borró y puedes registrarte con ella.",
      signup: "Registrarse",
      goneTitle: "Esta cuenta ya se borró",
      goneBody:
        "La cuenta de este enlace ya no existe. Puedes registrarte de nuevo con esta dirección.",
      invalidBody: (days) =>
        `Un enlace de confirmación solo vale ${days} día${acPl(days, "", "s")} tras enviarse. Inicia sesión y podrás recibir otro correo en «Mi cuenta».`,
      goMe: "Ir a mi cuenta",
      unknownResponse: "Respuesta inesperada.",
      failedRetry: "No se pudo completar. Inténtalo en un momento.",
    },
    profile: {
      guest:
        "Puedes usar todos tus registros sin iniciar sesión. Inicia sesión para sincronizarlos entre dispositivos.",
      login: "Iniciar sesión",
      verified: "Confirmado",
      unverified: "Sin confirmar",
      unverifiedNote:
        "Aún no hemos confirmado que este correo es tuyo. Pulsa «Sí» en el correo de confirmación. Todo funciona igual antes de confirmar.",
      sendVerification: "Enviar correo de confirmación",
    },
    change: {
      sameAsCurrent: "Elige una contraseña distinta de la actual.",
      passwordTitle: "Contraseña",
      noPasswordBefore: (username) =>
        `Te registraste con inicio de sesión rápido, así que aún no tienes contraseña. Para entrar también con tu usuario (${username}), usa `,
      forgot: "Olvidé mi contraseña",
      noPasswordAfter: (email) => ` para recibir un correo en ${email} y crear una contraseña.`,
      currentRequired: "Escribe tu contraseña actual.",
      changed: "Contraseña cambiada. Vuelve a iniciar sesión con la nueva en otros dispositivos.",
      failed: "No se pudo cambiar la contraseña. Inténtalo en un momento.",
      network: "Un problema de red impidió el cambio. Inténtalo en un momento.",
      title: "Cambiar contraseña",
      current: "Contraseña actual",
      noteBefore:
        "Al cambiarla se cierra la sesión en todos los demás dispositivos con esta cuenta. Si no recuerdas la actual, puedes cambiarla con un ",
      resetMail: "correo de restablecimiento",
      noteAfter: ".",
    },
    reset: {
      checkFailed: "No se pudo comprobar el enlace. Inténtalo en un momento.",
      logoutNote:
        "Al cambiarla se cierra la sesión en todos los demás dispositivos con esta cuenta.",
      doneTitle: "Contraseña cambiada",
      doneBody: (username) =>
        `Has iniciado sesión${username ? ` en ${username}` : ""} con la nueva contraseña. Vuelve a entrar con ella en otros dispositivos.`,
      invalidBody: (minutes) =>
        `Un enlace de restablecimiento sirve una vez, durante ${minutes} minutos tras enviarse. Si ya cambiaste la contraseña, entra con la nueva.`,
      resend: "Recibir otro correo",
      toLogin: "Ir a iniciar sesión",
    },
    forgot: {
      failed: "No se pudo enviar el correo de restablecimiento. Inténtalo en un momento.",
      network: "Un problema de red impidió la solicitud. Inténtalo en un momento.",
      email: "Correo con el que te registraste",
      sending: "Enviando...",
      submit: "Recibir correo de restablecimiento",
      back: "Volver a iniciar sesión",
    },
    methods: {
      linked: (provider) =>
        `Cuenta de ${provider} vinculada. A partir de ahora puedes entrar con ella.`,
      startFailed: "No se pudo empezar a vincular.",
      connectNetwork: "Un problema de red impidió vincular.",
      disconnectFailed: "No se pudo desvincular.",
      disconnected: (provider) => `${provider} desvinculado.`,
      disconnectNetwork: "Un problema de red impidió desvincular.",
      title: "Métodos de inicio de sesión",
      body: (email) =>
        `Una vez vinculado, puedes entrar a esta cuenta con él. Aunque el correo de la cuenta vinculada sea otro, el de esta cuenta (${email}) no cambia.`,
      password: "Correo · contraseña",
      inUse: "En uso",
      noPassword: "Sin contraseña",
      linkedBadge: "Vinculado",
      lastOne: "Es tu único método de inicio de sesión, así que no se puede desvincular.",
      disconnect: "Desvincular",
      connect: "Vincular",
      lastOneNote:
        "Ahora solo tienes un método de inicio de sesión, así que no se puede desvincular. Crea una contraseña o vincula otra cuenta primero.",
    },
    remove: {
      doneTitle: "Tu cuenta se borró.",
      doneBody:
        "Borramos tu cuenta y los registros guardados en ella del servidor. Las suscripciones de este navegador siguen ahí, así que puedes seguir usándolas sin iniciar sesión.",
      failed: "No se pudo borrar la cuenta.",
      network: "Un problema de red impidió borrarla. Inténtalo en un momento.",
      title: "Borrar cuenta",
      what: "Tu cuenta (usuario, correo, hash de la contraseña), las sesiones y los registros guardados en la cuenta se borran del servidor al instante. No se puede deshacer.",
      kept: "Los registros de suscripciones y uso de este navegador no se borran. Para borrarlos, usa «Restablecer todo» en Mis suscripciones o borra los datos del navegador.",
      typeRequired: (word) => `Escribe '${word}'.`,
      passwordRequired: "Escribe tu contraseña.",
      typeLabel: (word) => `Escribe '${word}' para confirmar`,
      passwordLabel: "Confirmar contraseña",
      deleting: "Borrando...",
      confirmDescription: (username) =>
        `¿Borrar la cuenta '${username}'?\nLa cuenta y sus registros no se podrán recuperar.`,
      confirm: "Borrar",
    },
    oauthDone: {
      linkFailed: "No se pudo vincular",
      loginFailed: "No se pudo iniciar sesión",
      linked: (provider) => `Cuenta de ${provider} vinculada`,
      loggedIn: "Has iniciado sesión",
      backToApp: "Volver a la app SubSlash",
      closeNote: "Cierra esta ventana para volver a la app SubSlash.",
    },
    conflict: {
      counts: (subs, killed, logs) =>
        `${subs} suscripci${acPl(subs, "ón", "ones")} (${killed} cancelada${acPl(killed, "", "s")}), ${logs} registro${acPl(logs, "", "s")}`,
      unknownTime: "hora desconocida",
      savedAt: (month, day, time) => `${day} de ${monthName("es", month)}, ${time}`,
      leadFirst: "Este dispositivo y tu cuenta tienen registros distintos.",
      leadDiverged: "Los registros cambiaron por separado en este dispositivo y en otro.",
      title: "¿Qué registros usamos?",
      description:
        "No se combinan: se dejan iguales a un lado. Se pierden los registros del lado que no elijas.",
      thisDevice: "Este dispositivo",
      accountSaved: (when) => `Cuenta (último guardado ${when})`,
      useLocal: "Usar los de este dispositivo (sustituye los de la cuenta)",
      useServer: "Usar los de la cuenta (sustituye los de este dispositivo)",
      later: "Más tarde: desactivar la sincronización en este dispositivo",
    },
  },
};

export const de: Widen<typeof ko> = {
  account: {
    username: "Benutzername",
    email: "E-Mail",
    cancel: "Abbrechen",
    home: "Startseite",
    seeMe: "Mein Konto ansehen",
    failedTitle: "Konnte nicht abgeschlossen werden",
    networkFailed:
      "Ein Netzwerkproblem hat den Vorgang unterbrochen. Bitte versuch es gleich noch einmal.",
    linkInvalidTitle: "Dieser Link ist abgelaufen oder ungültig",
    newPassword: "Neues Passwort",
    newPasswordConfirm: "Neues Passwort bestätigen",
    changing: "Wird geändert...",
    changePassword: "Passwort ändern",
    verify: {
      question: "Hast du dieses Konto selbst registriert?",
      yes: "Ja, ich habe mich registriert",
      no: "Ich habe mich nicht registriert",
      declineBefore: "Wir löschen das Konto mit dem Benutzernamen ",
      declineAfter:
        ". Das lässt sich nicht rückgängig machen, und die Adresse kann erneut zur Registrierung genutzt werden. Alle mit diesem Konto angemeldeten Geräte werden abgemeldet.",
      deleteAccount: "Konto löschen",
      verifiedTitle: "E-Mail bestätigt",
      verifiedBody: (username) =>
        username
          ? `Die E-Mail des Kontos ${username} ist bestätigt.`
          : "Die E-Mail dieses Kontos ist bereits bestätigt.",
      declinedTitle: "Konto gelöscht",
      declinedBody:
        "Danke für den Hinweis. Das mit dieser Adresse registrierte Konto ist gelöscht, und du kannst dich damit registrieren.",
      signup: "Registrieren",
      goneTitle: "Dieses Konto wurde bereits gelöscht",
      goneBody:
        "Das Konto, auf das dieser Link zeigt, gibt es nicht mehr. Du kannst dich mit dieser Adresse neu registrieren.",
      invalidBody: (days) =>
        `Ein Bestätigungslink gilt nur ${days} ${acPl(days, "Tag", "Tage")} nach dem Versand. Melde dich an, dann kannst du unter „Mein Konto“ eine neue Bestätigungs-E-Mail anfordern.`,
      goMe: "Zu meinem Konto",
      unknownResponse: "Unerwartete Antwort.",
      failedRetry: "Konnte nicht abgeschlossen werden. Bitte versuch es gleich noch einmal.",
    },
    profile: {
      guest:
        "Du kannst alle Daten ohne Anmeldung nutzen. Melde dich an, um sie zwischen Geräten abzugleichen.",
      login: "Anmelden",
      verified: "Bestätigt",
      unverified: "Nicht bestätigt",
      unverifiedNote:
        "Wir haben noch nicht bestätigt, dass diese E-Mail dir gehört. Tippe in der Bestätigungs-E-Mail auf „Ja“. Bis dahin funktioniert alles genauso.",
      sendVerification: "Bestätigungs-E-Mail senden",
    },
    change: {
      sameAsCurrent: "Wähl ein anderes Passwort als das aktuelle.",
      passwordTitle: "Passwort",
      noPasswordBefore: (username) =>
        `Du hast dich per Schnellanmeldung registriert, daher gibt es noch kein Passwort. Um dich auch mit deinem Benutzernamen (${username}) anzumelden, nutze `,
      forgot: "Passwort vergessen",
      noPasswordAfter: (email) =>
        `, um eine E-Mail an ${email} zu bekommen und ein Passwort zu erstellen.`,
      currentRequired: "Gib dein aktuelles Passwort ein.",
      changed: "Passwort geändert. Melde dich auf anderen Geräten mit dem neuen erneut an.",
      failed: "Das Passwort konnte nicht geändert werden. Bitte versuch es gleich noch einmal.",
      network:
        "Ein Netzwerkproblem hat die Änderung verhindert. Bitte versuch es gleich noch einmal.",
      title: "Passwort ändern",
      current: "Aktuelles Passwort",
      noteBefore:
        "Beim Ändern werden alle anderen mit diesem Konto angemeldeten Geräte abgemeldet. Wenn du dein aktuelles Passwort nicht mehr weißt, kannst du es per ",
      resetMail: "Zurücksetzungs-E-Mail",
      noteAfter: " ändern.",
    },
    reset: {
      checkFailed: "Der Link konnte nicht geprüft werden. Bitte versuch es gleich noch einmal.",
      logoutNote:
        "Beim Ändern werden alle anderen mit diesem Konto angemeldeten Geräte abgemeldet.",
      doneTitle: "Passwort geändert",
      doneBody: (username) =>
        `Du bist${username ? ` bei ${username}` : ""} mit dem neuen Passwort angemeldet. Melde dich auf anderen Geräten damit erneut an.`,
      invalidBody: (minutes) =>
        `Ein Zurücksetzungslink funktioniert einmal, ${minutes} Minuten lang nach dem Versand. Wenn du dein Passwort schon geändert hast, melde dich mit dem neuen an.`,
      resend: "Neue Zurücksetzungs-E-Mail anfordern",
      toLogin: "Zur Anmeldung",
    },
    forgot: {
      failed:
        "Die Zurücksetzungs-E-Mail konnte nicht gesendet werden. Bitte versuch es gleich noch einmal.",
      network:
        "Ein Netzwerkproblem hat die Anfrage verhindert. Bitte versuch es gleich noch einmal.",
      email: "E-Mail, mit der du dich registriert hast",
      sending: "Wird gesendet...",
      submit: "Zurücksetzungs-E-Mail anfordern",
      back: "Zurück zur Anmeldung",
    },
    methods: {
      linked: (provider) => `${provider}-Konto verknüpft. Du kannst dich ab jetzt damit anmelden.`,
      startFailed: "Die Verknüpfung konnte nicht gestartet werden.",
      connectNetwork: "Ein Netzwerkproblem hat die Verknüpfung verhindert.",
      disconnectFailed: "Die Verknüpfung konnte nicht aufgehoben werden.",
      disconnected: (provider) => `${provider} getrennt.`,
      disconnectNetwork: "Ein Netzwerkproblem hat das Trennen verhindert.",
      title: "Anmeldemethoden",
      body: (email) =>
        `Nach dem Verknüpfen kannst du dich damit bei diesem Konto anmelden. Auch wenn die E-Mail des verknüpften Kontos abweicht, bleibt die E-Mail dieses Kontos (${email}) gleich.`,
      password: "E-Mail · Passwort",
      inUse: "In Gebrauch",
      noPassword: "Kein Passwort",
      linkedBadge: "Verknüpft",
      lastOne: "Das ist deine einzige Anmeldemethode, daher kann sie nicht getrennt werden.",
      disconnect: "Trennen",
      connect: "Verknüpfen",
      lastOneNote:
        "Du hast gerade nur eine Anmeldemethode, daher kann sie nicht getrennt werden. Erstelle zuerst ein Passwort oder verknüpfe ein anderes Konto.",
    },
    remove: {
      doneTitle: "Dein Konto ist gelöscht.",
      doneBody:
        "Wir haben dein Konto und die darin gespeicherten Daten vom Server gelöscht. Die Abo-Daten in diesem Browser bleiben, du kannst sie also ohne Anmeldung weiter nutzen.",
      failed: "Das Konto konnte nicht gelöscht werden.",
      network:
        "Ein Netzwerkproblem hat das Löschen verhindert. Bitte versuch es gleich noch einmal.",
      title: "Konto löschen",
      what: "Dein Konto (Benutzername, E-Mail, Passwort-Hash), deine Sitzungen und die im Konto gespeicherten Daten werden sofort vom Server gelöscht. Das lässt sich nicht rückgängig machen.",
      kept: "Abo- und Nutzungsdaten in diesem Browser werden nicht gelöscht. Um sie zu löschen, nutze „Alles zurücksetzen“ unter Meine Abos oder lösche die Browserdaten.",
      typeRequired: (word) => `Gib '${word}' ein.`,
      passwordRequired: "Gib dein Passwort ein.",
      typeLabel: (word) => `Zur Bestätigung '${word}' eingeben`,
      passwordLabel: "Passwort bestätigen",
      deleting: "Wird gelöscht...",
      confirmDescription: (username) =>
        `Konto '${username}' löschen?\nDas Konto und die darin gespeicherten Daten lassen sich nicht wiederherstellen.`,
      confirm: "Löschen",
    },
    oauthDone: {
      linkFailed: "Verknüpfung fehlgeschlagen",
      loginFailed: "Anmeldung fehlgeschlagen",
      linked: (provider) => `${provider}-Konto verknüpft`,
      loggedIn: "Du bist angemeldet",
      backToApp: "Zurück zur SubSlash-App",
      closeNote: "Schließ dieses Fenster, um zur SubSlash-App zurückzukehren.",
    },
    conflict: {
      counts: (subs, killed, logs) =>
        `${subs} ${acPl(subs, "Abo", "Abos")} (${killed} gekündigt), ${logs} ${acPl(logs, "Eintrag", "Einträge")}`,
      unknownTime: "unbekannte Zeit",
      savedAt: (month, day, time) => `${day}. ${monthName("de", month)}, ${time}`,
      leadFirst: "Dieses Gerät und dein Konto haben unterschiedliche Daten.",
      leadDiverged: "Die Daten haben sich auf diesem und einem anderen Gerät getrennt geändert.",
      title: "Welche Daten sollen gelten?",
      description:
        "Die beiden werden nicht zusammengeführt, sondern auf eine Seite angeglichen. Die Daten der nicht gewählten Seite gehen verloren.",
      thisDevice: "Dieses Gerät",
      accountSaved: (when) => `Konto (zuletzt gespeichert ${when})`,
      useLocal: "Daten dieses Geräts nutzen (ersetzt die des Kontos)",
      useServer: "Daten des Kontos nutzen (ersetzt die dieses Geräts)",
      later: "Später — automatische Synchronisierung auf diesem Gerät ausschalten",
    },
  },
};

export const pt: Widen<typeof ko> = {
  account: {
    username: "Usuário",
    email: "E-mail",
    cancel: "Cancelar",
    home: "Início",
    seeMe: "Ver minha conta",
    failedTitle: "Não foi possível concluir",
    networkFailed: "Um problema de rede interrompeu a operação. Tente de novo em instantes.",
    linkInvalidTitle: "Este link expirou ou não é válido",
    newPassword: "Nova senha",
    newPasswordConfirm: "Confirmar nova senha",
    changing: "Alterando...",
    changePassword: "Alterar senha",
    verify: {
      question: "Foi você que criou esta conta?",
      yes: "Sim, me cadastrei",
      no: "Não me cadastrei",
      declineBefore: "Vamos excluir a conta com o usuário ",
      declineAfter:
        ". Não dá para desfazer, e o endereço poderá ser usado num novo cadastro. Todos os dispositivos conectados a esta conta serão desconectados.",
      deleteAccount: "Excluir conta",
      verifiedTitle: "E-mail confirmado",
      verifiedBody: (username) =>
        username
          ? `O e-mail da conta ${username} está confirmado.`
          : "O e-mail desta conta já estava confirmado.",
      declinedTitle: "Conta excluída",
      declinedBody:
        "Obrigado por avisar. A conta cadastrada com este endereço foi excluída, e você pode se cadastrar com ele.",
      signup: "Cadastrar",
      goneTitle: "Esta conta já foi excluída",
      goneBody:
        "A conta deste link não existe mais. Você pode se cadastrar de novo com este endereço.",
      invalidBody: (days) =>
        `Um link de confirmação só vale ${days} dia${acPl(days, "", "s")} depois de enviado. Entre e receba outro e-mail em “Minha conta”.`,
      goMe: "Ir para minha conta",
      unknownResponse: "Resposta inesperada.",
      failedRetry: "Não foi possível concluir. Tente de novo em instantes.",
    },
    profile: {
      guest:
        "Dá para usar todos os registros sem entrar. Entre para sincronizá-los entre dispositivos.",
      login: "Entrar",
      verified: "Confirmado",
      unverified: "Não confirmado",
      unverifiedNote:
        "Ainda não confirmamos que este e-mail é seu. Toque em “Sim” no e-mail de confirmação. Tudo funciona igual antes da confirmação.",
      sendVerification: "Enviar e-mail de confirmação",
    },
    change: {
      sameAsCurrent: "Escolha uma senha diferente da atual.",
      passwordTitle: "Senha",
      noPasswordBefore: (username) =>
        `Você se cadastrou com login rápido, então ainda não tem senha. Para entrar também com seu usuário (${username}), use `,
      forgot: "Esqueci a senha",
      noPasswordAfter: (email) => ` para receber um e-mail em ${email} e criar uma senha.`,
      currentRequired: "Informe sua senha atual.",
      changed: "Senha alterada. Entre de novo com a nova nos outros dispositivos.",
      failed: "Não foi possível alterar a senha. Tente de novo em instantes.",
      network: "Um problema de rede impediu a alteração. Tente de novo em instantes.",
      title: "Alterar senha",
      current: "Senha atual",
      noteBefore:
        "Alterar desconecta todos os outros dispositivos conectados a esta conta. Se não lembra da senha atual, dá para alterar com um ",
      resetMail: "e-mail de redefinição",
      noteAfter: ".",
    },
    reset: {
      checkFailed: "Não foi possível verificar o link. Tente de novo em instantes.",
      logoutNote: "Alterar desconecta todos os outros dispositivos conectados a esta conta.",
      doneTitle: "Senha alterada",
      doneBody: (username) =>
        `Você entrou${username ? ` em ${username}` : ""} com a nova senha. Entre de novo com ela nos outros dispositivos.`,
      invalidBody: (minutes) =>
        `Um link de redefinição funciona uma vez, por ${minutes} minutos depois de enviado. Se já alterou a senha, entre com a nova.`,
      resend: "Receber outro e-mail de redefinição",
      toLogin: "Ir para entrar",
    },
    forgot: {
      failed: "Não foi possível enviar o e-mail de redefinição. Tente de novo em instantes.",
      network: "Um problema de rede impediu o pedido. Tente de novo em instantes.",
      email: "E-mail do cadastro",
      sending: "Enviando...",
      submit: "Receber e-mail de redefinição",
      back: "Voltar para entrar",
    },
    methods: {
      linked: (provider) =>
        `Conta ${provider} vinculada. A partir de agora você pode entrar com ela.`,
      startFailed: "Não foi possível começar a vincular.",
      connectNetwork: "Um problema de rede impediu a vinculação.",
      disconnectFailed: "Não foi possível desvincular.",
      disconnected: (provider) => `${provider} desvinculado.`,
      disconnectNetwork: "Um problema de rede impediu a desvinculação.",
      title: "Formas de login",
      body: (email) =>
        `Depois de vincular, você pode entrar nesta conta com ela. Mesmo que o e-mail da conta vinculada seja outro, o desta conta (${email}) não muda.`,
      password: "E-mail · senha",
      inUse: "Em uso",
      noPassword: "Sem senha",
      linkedBadge: "Vinculado",
      lastOne: "É sua única forma de login, então não dá para desvincular.",
      disconnect: "Desvincular",
      connect: "Vincular",
      lastOneNote:
        "Você só tem uma forma de login agora, então não dá para desvincular. Crie uma senha ou vincule outra conta primeiro.",
    },
    remove: {
      doneTitle: "Sua conta foi excluída.",
      doneBody:
        "Excluímos sua conta e os registros salvos nela do servidor. As assinaturas neste navegador continuam aqui, então você pode seguir usando sem entrar.",
      failed: "Não foi possível excluir a conta.",
      network: "Um problema de rede impediu a exclusão. Tente de novo em instantes.",
      title: "Excluir conta",
      what: "Sua conta (usuário, e-mail, hash da senha), as sessões e os registros salvos na conta são apagados do servidor na hora. Não dá para desfazer.",
      kept: "Os registros de assinaturas e uso deste navegador não são apagados. Para apagá-los, use “Redefinir tudo” em Minhas assinaturas ou limpe os dados do navegador.",
      typeRequired: (word) => `Digite '${word}'.`,
      passwordRequired: "Informe sua senha.",
      typeLabel: (word) => `Digite '${word}' para confirmar`,
      passwordLabel: "Confirmar senha",
      deleting: "Excluindo...",
      confirmDescription: (username) =>
        `Excluir a conta '${username}'?\nA conta e os registros salvos nela não poderão ser recuperados.`,
      confirm: "Excluir",
    },
    oauthDone: {
      linkFailed: "Não foi possível vincular",
      loginFailed: "Não foi possível entrar",
      linked: (provider) => `Conta ${provider} vinculada`,
      loggedIn: "Você entrou",
      backToApp: "Voltar ao app SubSlash",
      closeNote: "Feche esta janela para voltar ao app SubSlash.",
    },
    conflict: {
      counts: (subs, killed, logs) =>
        `${subs} assinatura${acPl(subs, "", "s")} (${killed} cancelada${acPl(killed, "", "s")}), ${logs} registro${acPl(logs, "", "s")}`,
      unknownTime: "horário desconhecido",
      savedAt: (month, day, time) => `${day} de ${monthName("pt", month)}, ${time}`,
      leadFirst: "Este dispositivo e sua conta têm registros diferentes.",
      leadDiverged: "Os registros mudaram separadamente neste dispositivo e em outro.",
      title: "Quais registros usar?",
      description:
        "Os dois não são mesclados: ficam iguais a um lado só. Os registros do lado não escolhido se perdem.",
      thisDevice: "Este dispositivo",
      accountSaved: (when) => `Conta (último salvamento ${when})`,
      useLocal: "Usar os deste dispositivo (substitui os da conta)",
      useServer: "Usar os da conta (substitui os deste dispositivo)",
      later: "Depois — desligar a sincronização automática neste dispositivo",
    },
  },
};
