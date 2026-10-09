import type { Widen } from "../types";
import { one } from "../english";

/** PC의 AI 코딩 도구 사용을 체크인으로 받는 화면(`/pc-usage`, `npx subslash-usage`가 만든 링크). */
export const ko = {
  pcUsage: {
    title: "PC의 AI 코딩 도구 사용",
    description: (windowDays: number, until: string) =>
      `이 PC에서 Claude Code·Codex를 구독으로 쓴 날을 셌어요 (${until}까지 최근 ${windowDays}일).`,
    pcOnly:
      "PC에서 쓴 날만 들어 있어요. 웹·폰에서 쓴 날이 더 있으면 체크인 창에서 숫자를 늘려 주세요. 확인을 눌러야 저장돼요.",
    tool: { "claude-pro": "Claude Code", "chatgpt-plus": "Codex" },
    days: (days: number) => `PC 기록으로 ${days}일`,
    checkIn: "체크인에 적기",
    done: "체크인했어요",
    none: "이 서비스로 등록한 구독이 없어요. 구독을 등록하면 체크인할 수 있어요.",
    ambiguous: (count: number) =>
      `같은 서비스 구독이 ${count}개라 어디에 적을지 정할 수 없어요. 구독 상세에서 직접 체크인해 주세요.`,
    otherMetric: "이 구독은 쓴 날이 아닌 다른 기준으로 재요. 구독 상세에서 직접 체크인해 주세요.",
    invalidTitle: "읽을 수 없는 링크예요",
    invalidBody: "아래에서 PC 기록을 다시 읽어 주세요.",
    staleTitle: "오래된 링크예요",
    staleBody: "지난 숫자로 체크인하지 않도록 막았어요. 아래에서 PC 기록을 다시 읽어 주세요.",
    toSubs: "내 구독으로 →",
    /** 체크인 창(PC 웹)의 링크. */
    modalLink: (tool: string) => `PC의 ${tool} 기록으로 세기 →`,
    privacy: "숫자는 링크의 # 뒤에만 있어 서버로 보내지 않았어요.",
    reader: {
      description:
        "이 PC의 Claude Code·Codex 기록 폴더를 고르면, 브라우저가 기기 안에서 질문을 보낸 시각만 세어 최근 30일 중 쓴 날을 체크인에 채워 줘요.",
      privacy:
        "파일은 서버로 보내지 않아요. 질문·답 내용은 읽자마자 버리고 시각만 남겨요. 브라우저가 폴더를 읽어도 되는지 물으면 허용해 주세요.",
      claude: "Claude Code",
      codex: "Codex",
      folder: "기록 폴더",
      copy: "경로 복사",
      copied: "복사했어요",
      pick: "폴더 고르기",
      pickAgain: "다시 고르기",
      reading: "읽는 중…",
      hiddenTip:
        "숨김 폴더라 목록에 안 보이면, 경로를 복사해 폴더 선택 창 위쪽 주소 칸에 붙여 넣고 Enter를 누르세요.",
      windowsUser: "Windows 사용자 이름",
      windowsUserPlaceholder: "예: user",
      windowsUserHint: "C:\\Users 폴더 안에 있는 내 이름 폴더예요. 이 브라우저에만 기억해요.",
      windowsUserInPath: "사용자이름",
      copyNeedsUser: "사용자 이름을 먼저 적어 주세요",
      noFiles: "최근 30일의 기록 파일을 찾지 못했어요. 위 경로의 폴더를 골랐는지 확인해 주세요.",
      readFailed: "폴더를 읽지 못했어요. 다시 골라 주세요.",
      used: (days: number, prompts: number) => `최근 30일 중 ${days}일 사용 · 질문 ${prompts}개`,
      noUse: "최근 30일에 구독으로 쓴 기록이 없어요.",
      plan: (plan: string) => `기록된 ChatGPT 요금제: ${plan}`,
      excluded: (n: number) => `구독이 아닌 방식(API 키 등)으로 쓴 세션 ${n}개는 세지 않았어요.`,
      unknown: (n: number) => `구독으로 썼는지 알 수 없는 세션 ${n}개는 세지 않았어요.`,
      unrecognized: (n: number) =>
        `알아보지 못한 기록 파일 ${n}개 — 도구가 업데이트돼 형식이 바뀌었을 수 있어요.`,
      loginQuestion: "Claude Code에 어떻게 로그인해 쓰나요?",
      loginHint:
        "기록에는 어떤 계정으로 썼는지가 없어서 물어요. API 키로 쓴 것은 구독 사용이 아니라 세지 않아요.",
      loginSubscription: "Claude 구독 계정(Pro·Max)",
      loginApiKey: "API 키",
      results: "체크인",
      appOnly: "PC 브라우저에서 열어 주세요. 이 화면은 PC에 있는 Claude Code·Codex 기록을 읽어요.",
    },
  },
};

export const en: Widen<typeof ko> = {
  pcUsage: {
    title: "AI coding tool use on your PC",
    description: (windowDays, until) =>
      `Days you used Claude Code or Codex on a subscription on this PC (last ${windowDays} days up to ${until}).`,
    pcOnly:
      "Only days on this PC are included. If you also used it on the web or your phone, raise the number in the check-in. Nothing is saved until you confirm.",
    tool: { "claude-pro": "Claude Code", "chatgpt-plus": "Codex" },
    days: (days) => `${days} ${one(days) ? "day" : "days"} from PC records`,
    checkIn: "Check in",
    done: "Checked in",
    none: "You haven't added a subscription for this service. Add one to check in.",
    ambiguous: (count) =>
      `You have ${count} subscriptions for this service, so we can't tell which one to use. Check in from the subscription's details.`,
    otherMetric:
      "This subscription is measured by something other than days used. Check in from its details.",
    invalidTitle: "This link can't be read",
    invalidBody: "Read your PC records again below.",
    staleTitle: "This link is out of date",
    staleBody: "We stopped it so old numbers aren't checked in. Read your PC records again below.",
    toSubs: "Go to subscriptions →",
    modalLink: (tool) => `Count from ${tool} records on this PC →`,
    privacy: "The numbers are only after # in the link and weren't sent to the server.",
    reader: {
      description:
        "Pick the Claude Code and Codex record folders on this PC. Your browser counts only the times you sent prompts, on this device, and fills in the days used in the last 30 days.",
      privacy:
        "Files aren't sent to the server. Prompt and reply contents are dropped as soon as they're read; only the times are kept. Allow the browser to read the folder when it asks.",
      claude: "Claude Code",
      codex: "Codex",
      folder: "Record folder",
      copy: "Copy path",
      copied: "Copied",
      pick: "Choose folder",
      pickAgain: "Choose again",
      reading: "Reading…",
      hiddenTip:
        "If it's hidden and not listed, copy the path, paste it into the address bar at the top of the folder picker, and press Enter.",
      windowsUser: "Windows user name",
      windowsUserPlaceholder: "e.g. user",
      windowsUserHint:
        "The folder with your name inside C:\\Users. It's remembered in this browser only.",
      windowsUserInPath: "username",
      copyNeedsUser: "Enter your user name first",
      noFiles:
        "No records from the last 30 days were found. Check that you picked the folder above.",
      readFailed: "Couldn't read the folder. Please choose it again.",
      used: (days, prompts) =>
        `Used on ${days} ${one(days) ? "day" : "days"} in the last 30 days · ${prompts} ${one(prompts) ? "prompt" : "prompts"}`,
      noUse: "No subscription use in the last 30 days.",
      plan: (plan) => `Recorded ChatGPT plan: ${plan}`,
      excluded: (n) =>
        `Skipped ${n} ${one(n) ? "session" : "sessions"} not on a subscription (API key, etc.).`,
      unknown: (n) =>
        `Skipped ${n} ${one(n) ? "session" : "sessions"} where the subscription couldn't be confirmed.`,
      unrecognized: (n) =>
        `${n} record ${one(n) ? "file" : "files"} not recognized — the tool may have changed its format.`,
      loginQuestion: "How do you sign in to Claude Code?",
      loginHint:
        "The records don't say which account was used, so we ask. Use with an API key isn't subscription use and isn't counted.",
      loginSubscription: "Claude subscription account (Pro/Max)",
      loginApiKey: "API key",
      results: "Check-ins",
      appOnly:
        "Open this on your PC's browser. This page reads the Claude Code and Codex records on your PC.",
    },
  },
};
