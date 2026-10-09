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
    tool: {
      "claude-pro": "Claude Code",
      "chatgpt-plus": "Codex",
      "cursor-pro": "Cursor",
      "google-ai-pro": "Antigravity",
    },
    days: (days: number) => `PC 기록으로 ${days}일`,
    perDay: (cost: string) => `하루당 ${cost}`,
    tokens: (tokens: string) => `토큰 ${tokens}개`,
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
    apiValue: (usd: string) => `API 요금으로 환산하면 약 ${usd}`,
    ratioOver: (times: string) =>
      `내 몫 한 달 구독료의 ${times}배어치를 썼어요 — PC 사용만으로도 본전 이상이에요.`,
    ratioUnder: (percent: number) =>
      `내 몫 한 달 구독료의 ${percent}%어치예요. 웹·앱에서 쓴 것은 빠져 있어서 실제로는 더 썼을 수 있어요.`,
    apiNote:
      "같은 모델을 API로 썼다면 냈을 요금표 가격이에요(세금 제외). 실제로 청구된 돈이 아니라, 구독으로 얼마나 뽑아 썼는지 가늠하는 값이에요.",
    privacy: "숫자는 링크의 # 뒤에만 있어 서버로 보내지 않았어요.",
    reader: {
      description:
        "이 PC의 Claude Code·Codex·Cursor·Antigravity 기록 폴더를 고르면, 브라우저가 기기 안에서 질문을 보낸 시각만 세어 최근 30일 중 쓴 날을 체크인에 채워 줘요.",
      privacy:
        "파일은 서버로 보내지 않아요. 질문·답 내용은 읽자마자 버리고 시각만 남겨요. 브라우저가 폴더를 읽어도 되는지 물으면 허용해 주세요.",
      claude: "Claude Code",
      codex: "Codex",
      cursor: "Cursor",
      antigravity: "Antigravity",
      cursorNote:
        "이 파일에는 Cursor 로그인 정보도 들어 있지만, 요금제와 질문 시각 칸만 읽어요. 파일은 서버로 보내지 않아요.",
      pickFile: "파일 고르기",
      cursorFileTip:
        "브라우저가 이 폴더는 통째로 열지 못해 파일을 골라요. 경로를 복사해 파일 선택 창 위쪽 주소 칸에 붙여 넣고 Enter를 누른 뒤 state.vscdb를 고르세요(state.vscdb-wal이 있으면 Ctrl을 누른 채 함께 고르세요).",
      cursorNoFile:
        "state.vscdb 파일을 찾지 못했어요. 위 경로의 state.vscdb를 골랐는지 확인해 주세요(state.vscdb.backup이 아니라).",
      usedConversations: (days: number, conversations: number) =>
        `최근 30일 중 ${days}일 이상 사용 · 대화 ${conversations}개 (대화마다 마지막으로 입력한 날만 남아요)`,
      antigravityQuestion: "Antigravity를 Google AI 구독(Pro·Ultra) 계정으로 쓰나요?",
      antigravityHint:
        "기록에는 어떤 계정으로 썼는지가 없어서 물어요. 무료로 쓴 것은 구독 사용이 아니라 세지 않아요.",
      antigravityYes: "네, 구독 계정이에요",
      antigravityNo: "아니요, 무료로 써요",
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
      plan: (plan: string) => `기록된 요금제: ${plan}`,
      unpriced: (n: number, models: string) =>
        `요금을 확인하지 못한 모델의 응답 ${n}개는 환산에서 뺐어요: ${models}`,
      excluded: (n: number) =>
        `구독이 아닌 방식(API 키·무료 요금제 등)으로 쓴 세션 ${n}개는 세지 않았어요.`,
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
    tool: {
      "claude-pro": "Claude Code",
      "chatgpt-plus": "Codex",
      "cursor-pro": "Cursor",
      "google-ai-pro": "Antigravity",
    },
    days: (days) => `${days} ${one(days) ? "day" : "days"} from PC records`,
    perDay: (cost) => `${cost} per day used`,
    tokens: (tokens) => `${tokens} tokens`,
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
    apiValue: (usd) => `About ${usd} at API prices`,
    ratioOver: (times) =>
      `That's ${times}× your monthly share of the subscription — PC use alone already covers it.`,
    ratioUnder: (percent) =>
      `That's ${percent}% of your monthly share. Use on the web or in the app isn't included, so you may have used more.`,
    apiNote:
      "What the same model would have cost at API list prices (before tax). It isn't what you were charged — it's a gauge of how much you got out of the subscription.",
    privacy: "The numbers are only after # in the link and weren't sent to the server.",
    reader: {
      description:
        "Pick the Claude Code, Codex, Cursor or Antigravity record folders on this PC. Your browser counts only the times you sent prompts, on this device, and fills in the days used in the last 30 days.",
      privacy:
        "Files aren't sent to the server. Prompt and reply contents are dropped as soon as they're read; only the times are kept. Allow the browser to read the folder when it asks.",
      claude: "Claude Code",
      codex: "Codex",
      cursor: "Cursor",
      antigravity: "Antigravity",
      cursorNote:
        "This file also holds your Cursor sign-in, but only the plan and prompt-time fields are read. The file isn't sent to the server.",
      pickFile: "Choose file",
      cursorFileTip:
        "Browsers can't open this folder as a whole, so you choose the file instead. Copy the path, paste it into the address bar at the top of the file picker, press Enter, and choose state.vscdb (if state.vscdb-wal is there, hold Ctrl and choose it too).",
      cursorNoFile:
        "Couldn't find state.vscdb. Make sure you chose state.vscdb at the path above (not state.vscdb.backup).",
      usedConversations: (days, conversations) =>
        `Used on at least ${days} ${one(days) ? "day" : "days"} in the last 30 days · ${conversations} ${one(conversations) ? "conversation" : "conversations"} (only the last input day of each is recorded)`,
      antigravityQuestion:
        "Do you use Antigravity with a Google AI subscription account (Pro/Ultra)?",
      antigravityHint:
        "The records don't say which account was used, so we ask. Free use isn't subscription use and isn't counted.",
      antigravityYes: "Yes, a subscription account",
      antigravityNo: "No, I use it for free",
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
      plan: (plan) => `Recorded plan: ${plan}`,
      unpriced: (n, models) =>
        `Left out ${n} ${one(n) ? "response" : "responses"} from models without a confirmed price: ${models}`,
      excluded: (n) =>
        `Skipped ${n} ${one(n) ? "session" : "sessions"} not on a subscription (API key, free plan, etc.).`,
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
