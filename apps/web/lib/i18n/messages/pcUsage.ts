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
    toolWeb: "claude.ai",
    evidence: {
      item: (label: string, days: number, until: string | null) =>
        `${label} ${days}일${until ? `(${until}까지)` : ""}`,
      overlap: (days: number) => `겹친 날 ${days}일`,
      saved: "지난번에 읽은 기록을 이 기기에 남겨 두었다가 함께 셌어요. 서버로 보내지 않아요.",
      forget: "지난 기록 지우기",
    },
    daysFromRecords: (days: number) => `기록으로 ${days}일`,
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
    modalLinkClaude: "PC의 Claude Code 기록이나 claude.ai 대화 파일로 세기 →",
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
        "이 PC의 Claude Code·Codex·Cursor·Antigravity 기록 폴더를 고르면, 브라우저가 기기 안에서 질문을 보낸 시각만 세어 최근 30일 중 쓴 날을 체크인에 채워 줘요. claude.ai에서 나눈 대화는 내보내기 파일(맨 아래 칸)로 함께 셀 수 있어요.",
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
      claudeWeb: "claude.ai 대화 (내보내기 파일)",
      webHelp:
        "웹·앱에서 나눈 대화는 PC 기록에 없어요. claude.ai 설정에서 데이터 내보내기를 요청하고, 받은 conversations 묶음(zip)을 풀어 conversations.json을 고르세요. 내가 보낸 시각만 세고 대화 내용은 읽자마자 버려요. 파일은 서버로 보내지 않아요.",
      webReadFailed:
        "claude.ai 대화 내보내기 파일로 읽지 못했어요. 압축을 푼 conversations.json을 골랐는지 확인해 주세요.",
      webUntilExport: "내보낸 때까지의 대화만 들어 있어요. 그 뒤에 쓴 날은 빠져 있어요.",
      webQuestion: "이 파일은 Claude 구독(Pro·Max) 계정의 것인가요?",
      webHint:
        "내보내기 파일에는 요금제가 없어서 물어요. 무료 계정의 대화는 구독 사용이 아니라 세지 않아요.",
      webYes: "네, 구독 계정이에요",
      webNo: "아니요, 무료 계정이에요",
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
    toolWeb: "claude.ai",
    evidence: {
      item: (label, days, until) =>
        `${label} ${days} ${one(days) ? "day" : "days"}${until ? ` (up to ${until})` : ""}`,
      overlap: (days) => `${days} ${one(days) ? "day" : "days"} in both`,
      saved:
        "Records you read earlier are kept on this device and counted together. They aren't sent to a server.",
      forget: "Forget earlier records",
    },
    daysFromRecords: (days) => `${days} ${one(days) ? "day" : "days"} from records`,
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
    modalLinkClaude: "Count from Claude Code records on this PC or a claude.ai chat export →",
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
        "Pick the Claude Code, Codex, Cursor or Antigravity record folders on this PC. Your browser counts only the times you sent prompts, on this device, and fills in the days used in the last 30 days. Chats on claude.ai can be counted too, from an export file (the last box).",
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
      claudeWeb: "claude.ai chats (export file)",
      webHelp:
        "Chats on the web and app aren't in PC records. Request a data export in claude.ai settings, unzip the conversations bundle you receive, and choose conversations.json. Only the times you sent messages are counted, and chat content is discarded as soon as it's read. The file isn't sent to a server.",
      webReadFailed:
        "Couldn't read this as a claude.ai chat export. Check that you chose the unzipped conversations.json.",
      webUntilExport: "It only has chats up to when you exported. Days after that aren't included.",
      webQuestion: "Is this file from a Claude subscription (Pro/Max) account?",
      webHint:
        "The export file doesn't say which plan you're on, so we ask. Chats from a free account aren't subscription use and aren't counted.",
      webYes: "Yes, a subscription account",
      webNo: "No, a free account",
      appOnly:
        "Open this on your PC's browser. This page reads the Claude Code and Codex records on your PC.",
    },
  },
};

const pcPl = (n: number, one: string, many: string) => (Number(n) === 1 ? one : many);
const PC_TOOLS = {
  "claude-pro": "Claude Code",
  "chatgpt-plus": "Codex",
  "cursor-pro": "Cursor",
  "google-ai-pro": "Antigravity",
};

export const zh: Widen<typeof ko> = {
  pcUsage: {
    title: "这台电脑上的 AI 编程工具使用",
    description: (windowDays, until) =>
      `这台电脑上以订阅方式使用 Claude Code 或 Codex 的天数（截至 ${until} 的最近 ${windowDays} 天）。`,
    pcOnly:
      "只包括这台电脑上的天数。如果也在网页或手机上用过，请在签到时调高数字。确认之前不会保存。",
    tool: PC_TOOLS,
    days: (days) => `电脑记录 ${days} 天`,
    toolWeb: "claude.ai",
    evidence: {
      item: (label, days, until) => `${label} ${days} 天${until ? `（截至 ${until}）` : ""}`,
      overlap: (days) => `重叠 ${days} 天`,
      saved: "之前读取的记录保存在这台设备上，并一起统计。不会发送到服务器。",
      forget: "清除之前的记录",
    },
    daysFromRecords: (days) => `记录中 ${days} 天`,
    perDay: (cost) => `每个使用日 ${cost}`,
    tokens: (tokens) => `${tokens} 个令牌`,
    checkIn: "签到",
    done: "已签到",
    none: "你还没有添加这项服务的订阅。添加后即可签到。",
    ambiguous: (count) => `这项服务有 ${count} 个订阅，无法判断用哪一个。请在订阅详情中签到。`,
    otherMetric: "这个订阅不是按使用天数衡量的。请在详情中签到。",
    invalidTitle: "无法读取这个链接",
    invalidBody: "请在下方重新读取电脑记录。",
    staleTitle: "这个链接已过期",
    staleBody: "为避免签到旧数字已停止。请在下方重新读取电脑记录。",
    toSubs: "前往订阅 →",
    modalLink: (tool) => `用这台电脑上的 ${tool} 记录计数 →`,
    modalLinkClaude: "用这台电脑上的 Claude Code 记录或 claude.ai 对话导出文件计数 →",
    apiValue: (usd) => `按 API 价格约 ${usd}`,
    ratioOver: (times) => `相当于你每月订阅份额的 ${times} 倍——仅电脑上的使用就已经够本了。`,
    ratioUnder: (percent) =>
      `相当于你每月份额的 ${percent}%。不包括网页和应用中的使用，实际可能用得更多。`,
    apiNote:
      "同一模型按 API 标价（税前）计算的费用。这不是你被扣的钱，而是衡量你从订阅中用了多少的参考。",
    privacy: "数字只在链接的 # 之后，没有发送到服务器。",
    reader: {
      description:
        "选择这台电脑上 Claude Code、Codex、Cursor 或 Antigravity 的记录文件夹。浏览器只在这台设备上统计你发送提示的时间，并填入最近 30 天的使用天数。在 claude.ai 上的对话也可以用导出文件（最下面一栏）一起统计。",
      privacy:
        "文件不会发送到服务器。提示和回复的内容读到后立即丢弃，只保留时间。浏览器询问时请允许读取文件夹。",
      claude: "Claude Code",
      codex: "Codex",
      cursor: "Cursor",
      antigravity: "Antigravity",
      cursorNote:
        "这个文件里也有 Cursor 的登录信息，但只读取套餐和提示时间字段。文件不会发送到服务器。",
      pickFile: "选择文件",
      cursorFileTip:
        "浏览器无法整体打开这个文件夹，所以改为选择文件。复制路径，粘贴到文件选择器顶部的地址栏并按 Enter，然后选择 state.vscdb（如果有 state.vscdb-wal，按住 Ctrl 一起选择）。",
      cursorNoFile:
        "找不到 state.vscdb。请确认在上面的路径中选择了 state.vscdb（不是 state.vscdb.backup）。",
      usedConversations: (days, conversations) =>
        `最近 30 天至少使用了 ${days} 天 · ${conversations} 个对话（每个对话只记录最后一次输入的日期）`,
      antigravityQuestion: "你是用 Google AI 订阅账户（Pro/Ultra）使用 Antigravity 的吗？",
      antigravityHint: "记录中没有写用的是哪个账户，所以要问你。免费使用不算订阅使用，不计入。",
      antigravityYes: "是，订阅账户",
      antigravityNo: "不是，免费使用",
      folder: "记录文件夹",
      copy: "复制路径",
      copied: "已复制",
      pick: "选择文件夹",
      pickAgain: "重新选择",
      reading: "正在读取…",
      hiddenTip: "如果文件夹被隐藏看不到，复制路径粘贴到文件夹选择器顶部的地址栏并按 Enter。",
      windowsUser: "Windows 用户名",
      windowsUserPlaceholder: "例如 user",
      windowsUserHint: "C:\\Users 里带你名字的文件夹。只记在这个浏览器中。",
      windowsUserInPath: "用户名",
      copyNeedsUser: "请先输入用户名",
      noFiles: "没有找到最近 30 天的记录。请确认选择的是上面的文件夹。",
      readFailed: "无法读取文件夹。请重新选择。",
      used: (days, prompts) => `最近 30 天使用了 ${days} 天 · ${prompts} 次提问`,
      noUse: "最近 30 天没有订阅使用。",
      plan: (plan) => `记录中的套餐：${plan}`,
      unpriced: (n, models) => `未计入 ${n} 条来自价格未确认模型的回复：${models}`,
      excluded: (n) => `跳过了 ${n} 个非订阅的会话（API 密钥、免费套餐等）。`,
      unknown: (n) => `跳过了 ${n} 个无法确认订阅的会话。`,
      unrecognized: (n) => `有 ${n} 个记录文件无法识别——工具可能改变了格式。`,
      loginQuestion: "你是怎样登录 Claude Code 的？",
      loginHint: "记录中没有写用的是哪个账户，所以要问你。用 API 密钥使用不算订阅使用，不计入。",
      loginSubscription: "Claude 订阅账户（Pro/Max）",
      loginApiKey: "API 密钥",
      results: "签到",
      claudeWeb: "claude.ai 对话（导出文件）",
      webHelp:
        "在网页和应用中的对话不在电脑记录里。请在 claude.ai 设置中申请导出数据，解压收到的 conversations 压缩包，然后选择 conversations.json。只统计你发送消息的时间，对话内容读取后立即丢弃。文件不会发送到服务器。",
      webReadFailed:
        "无法作为 claude.ai 对话导出文件读取。请确认选择的是解压后的 conversations.json。",
      webUntilExport: "只包含导出之前的对话。之后使用的天数不在其中。",
      webQuestion: "这个文件来自 Claude 订阅（Pro/Max）账户吗？",
      webHint: "导出文件里没有套餐信息，所以需要询问。免费账户的对话不算订阅使用，不会统计。",
      webYes: "是，订阅账户",
      webNo: "不是，免费账户",
      appOnly: "请在电脑的浏览器中打开。这个页面会读取电脑上的 Claude Code 和 Codex 记录。",
    },
  },
};

export const ja: Widen<typeof ko> = {
  pcUsage: {
    title: "この PC での AI コーディングツールの利用",
    description: (windowDays, until) =>
      `この PC でサブスクとして Claude Code や Codex を使った日数（${until} までの直近 ${windowDays} 日）。`,
    pcOnly:
      "この PC での日数だけです。ウェブやスマホでも使ったなら、チェックインで数を増やしてください。確認するまで保存されません。",
    tool: PC_TOOLS,
    days: (days) => `PC の記録で ${days} 日`,
    toolWeb: "claude.ai",
    evidence: {
      item: (label, days, until) => `${label} ${days} 日${until ? `（${until}まで）` : ""}`,
      overlap: (days) => `重なった日 ${days} 日`,
      saved: "前に読んだ記録をこの端末に残しておき、一緒に数えました。サーバーには送りません。",
      forget: "前の記録を消す",
    },
    daysFromRecords: (days) => `記録で ${days} 日`,
    perDay: (cost) => `使った日 1 日あたり ${cost}`,
    tokens: (tokens) => `${tokens} トークン`,
    checkIn: "チェックイン",
    done: "チェックインしました",
    none: "このサービスのサブスクがまだ登録されていません。登録するとチェックインできます。",
    ambiguous: (count) =>
      `このサービスのサブスクが ${count} 件あるため、どれを使うか決められません。サブスクの詳細からチェックインしてください。`,
    otherMetric: "このサブスクは使った日数以外で測ります。詳細からチェックインしてください。",
    invalidTitle: "このリンクは読めません",
    invalidBody: "下で PC の記録をもう一度読み込んでください。",
    staleTitle: "このリンクは古くなっています",
    staleBody:
      "古い数字がチェックインされないよう止めました。下で PC の記録をもう一度読み込んでください。",
    toSubs: "サブスクへ →",
    modalLink: (tool) => `この PC の ${tool} の記録で数える →`,
    modalLinkClaude: "この PC の Claude Code の記録か claude.ai のチャットのエクスポートで数える →",
    apiValue: (usd) => `API 料金で約 ${usd}`,
    ratioOver: (times) => `月の自分の負担分の ${times} 倍です——PC での利用だけで元が取れています。`,
    ratioUnder: (percent) =>
      `月の負担分の ${percent}% です。ウェブやアプリでの利用は含まれないので、実際はもっと使っているかもしれません。`,
    apiNote:
      "同じモデルを API の定価（税抜き）で使った場合の額です。請求された額ではなく、サブスクをどれだけ使ったかの目安です。",
    privacy: "数字はリンクの # の後ろにだけあり、サーバーには送っていません。",
    reader: {
      description:
        "この PC の Claude Code・Codex・Cursor・Antigravity の記録フォルダを選んでください。ブラウザがこの端末の中で、質問を送った時刻だけを数えて、直近 30 日の利用日数を入れます。claude.ai でのチャットも、エクスポートファイル（いちばん下の欄）で一緒に数えられます。",
      privacy:
        "ファイルはサーバーに送りません。質問や回答の内容は読んだらすぐに捨て、時刻だけを残します。ブラウザがフォルダの読み取りを尋ねたら許可してください。",
      claude: "Claude Code",
      codex: "Codex",
      cursor: "Cursor",
      antigravity: "Antigravity",
      cursorNote:
        "このファイルには Cursor のログイン情報もありますが、プランと質問時刻の項目だけを読みます。ファイルはサーバーに送りません。",
      pickFile: "ファイルを選ぶ",
      cursorFileTip:
        "ブラウザはこのフォルダを丸ごと開けないので、ファイルを選びます。パスをコピーしてファイル選択画面上部のアドレス欄に貼り付け、Enter を押してから state.vscdb を選んでください（state.vscdb-wal があれば Ctrl を押しながら一緒に選ぶ）。",
      cursorNoFile:
        "state.vscdb が見つかりません。上のパスで state.vscdb（state.vscdb.backup ではない）を選んだか確認してください。",
      usedConversations: (days, conversations) =>
        `直近 30 日に少なくとも ${days} 日利用 · 会話 ${conversations} 件（各会話の最後の入力日だけを記録）`,
      antigravityQuestion:
        "Antigravity を Google AI のサブスクアカウント（Pro/Ultra）で使っていますか？",
      antigravityHint:
        "記録にはどのアカウントか書かれていないのでお聞きします。無料の利用はサブスクの利用ではないので数えません。",
      antigravityYes: "はい、サブスクアカウント",
      antigravityNo: "いいえ、無料で使っています",
      folder: "記録フォルダ",
      copy: "パスをコピー",
      copied: "コピーしました",
      pick: "フォルダを選ぶ",
      pickAgain: "選び直す",
      reading: "読み込み中…",
      hiddenTip:
        "隠しフォルダで表示されない場合は、パスをコピーしてフォルダ選択画面上部のアドレス欄に貼り付け、Enter を押してください。",
      windowsUser: "Windows のユーザー名",
      windowsUserPlaceholder: "例: user",
      windowsUserHint:
        "C:\\Users の中にある自分の名前のフォルダです。このブラウザにだけ記憶します。",
      windowsUserInPath: "ユーザー名",
      copyNeedsUser: "先にユーザー名を入力してください",
      noFiles: "直近 30 日の記録が見つかりませんでした。上のフォルダを選んだか確認してください。",
      readFailed: "フォルダを読めませんでした。もう一度選んでください。",
      used: (days, prompts) => `直近 30 日に ${days} 日利用 · 質問 ${prompts} 回`,
      noUse: "直近 30 日にサブスクでの利用はありません。",
      plan: (plan) => `記録されたプラン: ${plan}`,
      unpriced: (n, models) => `料金を確認していないモデルの回答 ${n} 件を除外: ${models}`,
      excluded: (n) =>
        `サブスクではないセッション ${n} 件（API キー、無料プランなど）を除外しました。`,
      unknown: (n) => `サブスクか確認できないセッション ${n} 件を除外しました。`,
      unrecognized: (n) =>
        `認識できない記録ファイルが ${n} 件あります——ツールの形式が変わったのかもしれません。`,
      loginQuestion: "Claude Code にはどうログインしていますか？",
      loginHint:
        "記録にはどのアカウントか書かれていないのでお聞きします。API キーでの利用はサブスクの利用ではないので数えません。",
      loginSubscription: "Claude のサブスクアカウント（Pro/Max）",
      loginApiKey: "API キー",
      results: "チェックイン",
      claudeWeb: "claude.ai のチャット（エクスポートファイル）",
      webHelp:
        "ウェブやアプリでのチャットは PC の記録にありません。claude.ai の設定でデータのエクスポートを申請し、届いた conversations のまとめ（zip）を展開して conversations.json を選んでください。送信した時刻だけを数え、チャットの内容は読み取ったらすぐに捨てます。ファイルはサーバーに送りません。",
      webReadFailed:
        "claude.ai のチャットのエクスポートファイルとして読めませんでした。展開した conversations.json を選んだか確認してください。",
      webUntilExport:
        "エクスポートした時点までのチャットだけが入っています。その後に使った日は含まれません。",
      webQuestion: "このファイルは Claude のサブスク（Pro/Max）アカウントのものですか？",
      webHint:
        "エクスポートファイルにはプランの情報がないので確認します。無料アカウントのチャットはサブスクの利用ではないので数えません。",
      webYes: "はい、サブスクのアカウントです",
      webNo: "いいえ、無料アカウントです",
      appOnly:
        "PC のブラウザで開いてください。このページは PC の Claude Code と Codex の記録を読みます。",
    },
  },
};

export const vi: Widen<typeof ko> = {
  pcUsage: {
    title: "Dùng công cụ lập trình AI trên PC này",
    description: (windowDays, until) =>
      `Số ngày bạn dùng Claude Code hoặc Codex theo gói đăng ký trên PC này (${windowDays} ngày gần nhất đến ${until}).`,
    pcOnly:
      "Chỉ tính các ngày trên PC này. Nếu bạn cũng dùng trên web hay điện thoại, hãy tăng số khi check-in. Chưa lưu gì cho đến khi bạn xác nhận.",
    tool: PC_TOOLS,
    days: (days) => `${days} ngày theo dữ liệu PC`,
    toolWeb: "claude.ai",
    evidence: {
      item: (label, days, until) => `${label} ${days} ngày${until ? ` (đến ${until})` : ""}`,
      overlap: (days) => `Trùng ${days} ngày`,
      saved:
        "Dữ liệu bạn đọc trước đó được giữ trên thiết bị này và được đếm cùng. Không gửi lên máy chủ.",
      forget: "Xóa dữ liệu trước đó",
    },
    daysFromRecords: (days) => `${days} ngày theo dữ liệu`,
    perDay: (cost) => `${cost} mỗi ngày dùng`,
    tokens: (tokens) => `${tokens} token`,
    checkIn: "Check-in",
    done: "Đã check-in",
    none: "Bạn chưa thêm gói đăng ký cho dịch vụ này. Thêm gói để check-in.",
    ambiguous: (count) =>
      `Bạn có ${count} gói cho dịch vụ này nên không biết dùng gói nào. Hãy check-in từ chi tiết gói.`,
    otherMetric:
      "Gói này được đo bằng chỉ số khác ngoài số ngày dùng. Hãy check-in từ chi tiết gói.",
    invalidTitle: "Không đọc được đường dẫn này",
    invalidBody: "Hãy đọc lại dữ liệu PC bên dưới.",
    staleTitle: "Đường dẫn này đã cũ",
    staleBody: "Đã dừng để không check-in số liệu cũ. Hãy đọc lại dữ liệu PC bên dưới.",
    toSubs: "Đến gói đăng ký →",
    modalLink: (tool) => `Đếm từ dữ liệu ${tool} trên PC này →`,
    modalLinkClaude: "Đếm từ dữ liệu Claude Code trên PC này hoặc tệp xuất trò chuyện claude.ai →",
    apiValue: (usd) => `Khoảng ${usd} theo giá API`,
    ratioOver: (times) =>
      `Gấp ${times} lần phần phí hằng tháng của bạn — riêng việc dùng trên PC đã đủ bù.`,
    ratioUnder: (percent) =>
      `Bằng ${percent}% phần phí hằng tháng của bạn. Chưa tính việc dùng trên web hay ứng dụng nên thực tế có thể nhiều hơn.`,
    apiNote:
      "Chi phí nếu dùng cùng mô hình theo giá niêm yết API (chưa thuế). Đây không phải số tiền bạn bị trừ, mà là thước đo bạn đã khai thác gói bao nhiêu.",
    privacy: "Các con số chỉ nằm sau dấu # trong đường dẫn và không được gửi đến máy chủ.",
    reader: {
      description:
        "Chọn thư mục dữ liệu của Claude Code, Codex, Cursor hoặc Antigravity trên PC này. Trình duyệt chỉ đếm thời điểm bạn gửi câu lệnh, ngay trên thiết bị này, rồi điền số ngày dùng trong 30 ngày gần nhất. Các cuộc trò chuyện trên claude.ai cũng có thể được đếm bằng tệp xuất (ô cuối cùng).",
      privacy:
        "Tệp không được gửi đến máy chủ. Nội dung câu lệnh và phản hồi bị bỏ ngay khi đọc; chỉ giữ thời điểm. Hãy cho phép khi trình duyệt hỏi quyền đọc thư mục.",
      claude: "Claude Code",
      codex: "Codex",
      cursor: "Cursor",
      antigravity: "Antigravity",
      cursorNote:
        "Tệp này cũng chứa thông tin đăng nhập Cursor, nhưng chỉ đọc trường gói và thời điểm câu lệnh. Tệp không được gửi đến máy chủ.",
      pickFile: "Chọn tệp",
      cursorFileTip:
        "Trình duyệt không mở được cả thư mục này nên bạn chọn tệp. Sao chép đường dẫn, dán vào thanh địa chỉ phía trên hộp chọn tệp, nhấn Enter rồi chọn state.vscdb (nếu có state.vscdb-wal, giữ Ctrl để chọn cùng).",
      cursorNoFile:
        "Không tìm thấy state.vscdb. Hãy chắc chắn bạn đã chọn state.vscdb ở đường dẫn trên (không phải state.vscdb.backup).",
      usedConversations: (days, conversations) =>
        `Đã dùng ít nhất ${days} ngày trong 30 ngày gần nhất · ${conversations} cuộc trò chuyện (mỗi cuộc chỉ ghi ngày nhập cuối)`,
      antigravityQuestion:
        "Bạn dùng Antigravity bằng tài khoản đăng ký Google AI (Pro/Ultra) phải không?",
      antigravityHint:
        "Dữ liệu không ghi tài khoản nào được dùng nên chúng tôi hỏi. Dùng miễn phí không phải dùng gói đăng ký và không được tính.",
      antigravityYes: "Có, tài khoản đăng ký",
      antigravityNo: "Không, tôi dùng miễn phí",
      folder: "Thư mục dữ liệu",
      copy: "Sao chép đường dẫn",
      copied: "Đã sao chép",
      pick: "Chọn thư mục",
      pickAgain: "Chọn lại",
      reading: "Đang đọc…",
      hiddenTip:
        "Nếu thư mục bị ẩn và không hiện, hãy sao chép đường dẫn, dán vào thanh địa chỉ phía trên hộp chọn thư mục rồi nhấn Enter.",
      windowsUser: "Tên người dùng Windows",
      windowsUserPlaceholder: "ví dụ: user",
      windowsUserHint: "Thư mục mang tên bạn trong C:\\Users. Chỉ được nhớ trong trình duyệt này.",
      windowsUserInPath: "tên người dùng",
      copyNeedsUser: "Hãy nhập tên người dùng trước",
      noFiles: "Không tìm thấy dữ liệu 30 ngày gần nhất. Hãy kiểm tra bạn đã chọn thư mục ở trên.",
      readFailed: "Không đọc được thư mục. Hãy chọn lại.",
      used: (days, prompts) => `Đã dùng ${days} ngày trong 30 ngày gần nhất · ${prompts} câu lệnh`,
      noUse: "Không dùng gói đăng ký trong 30 ngày gần nhất.",
      plan: (plan) => `Gói được ghi: ${plan}`,
      unpriced: (n, models) => `Đã bỏ ${n} phản hồi từ mô hình chưa xác nhận giá: ${models}`,
      excluded: (n) => `Đã bỏ qua ${n} phiên không dùng gói đăng ký (khóa API, gói miễn phí…).`,
      unknown: (n) => `Đã bỏ qua ${n} phiên không xác nhận được gói đăng ký.`,
      unrecognized: (n) =>
        `${n} tệp dữ liệu không nhận dạng được — công cụ có thể đã đổi định dạng.`,
      loginQuestion: "Bạn đăng nhập Claude Code bằng cách nào?",
      loginHint:
        "Dữ liệu không ghi tài khoản nào được dùng nên chúng tôi hỏi. Dùng bằng khóa API không phải dùng gói đăng ký và không được tính.",
      loginSubscription: "Tài khoản đăng ký Claude (Pro/Max)",
      loginApiKey: "Khóa API",
      results: "Check-in",
      claudeWeb: "Trò chuyện claude.ai (tệp xuất)",
      webHelp:
        "Các cuộc trò chuyện trên web và ứng dụng không có trong dữ liệu PC. Hãy yêu cầu xuất dữ liệu trong phần cài đặt claude.ai, giải nén gói conversations nhận được rồi chọn conversations.json. Chỉ đếm thời điểm bạn gửi tin nhắn, nội dung trò chuyện bị bỏ ngay khi đọc. Tệp không được gửi lên máy chủ.",
      webReadFailed:
        "Không đọc được tệp này như tệp xuất trò chuyện claude.ai. Hãy kiểm tra bạn đã chọn conversations.json sau khi giải nén.",
      webUntilExport:
        "Chỉ có các cuộc trò chuyện đến lúc bạn xuất. Những ngày dùng sau đó không có trong tệp.",
      webQuestion: "Tệp này có phải của tài khoản đăng ký Claude (Pro/Max) không?",
      webHint:
        "Tệp xuất không ghi gói bạn dùng nên chúng tôi hỏi. Trò chuyện từ tài khoản miễn phí không phải là dùng gói đăng ký nên không được đếm.",
      webYes: "Có, tài khoản đăng ký",
      webNo: "Không, tài khoản miễn phí",
      appOnly:
        "Hãy mở trên trình duyệt của PC. Trang này đọc dữ liệu Claude Code và Codex trên PC của bạn.",
    },
  },
};

export const fr: Widen<typeof ko> = {
  pcUsage: {
    title: "Utilisation d'outils de code IA sur ce PC",
    description: (windowDays, until) =>
      `Jours où vous avez utilisé Claude Code ou Codex avec un abonnement sur ce PC (${windowDays} derniers jours jusqu'au ${until}).`,
    pcOnly:
      "Seuls les jours sur ce PC sont comptés. Si vous l'utilisez aussi sur le web ou le téléphone, augmentez le chiffre lors du check-in. Rien n'est enregistré avant votre confirmation.",
    tool: PC_TOOLS,
    days: (days) => `${days} jour${pcPl(days, "", "s")} selon le PC`,
    toolWeb: "claude.ai",
    evidence: {
      item: (label, days, until) =>
        `${label} : ${days} jour${pcPl(days, "", "s")}${until ? ` (jusqu'au ${until})` : ""}`,
      overlap: (days) => `${days} jour${pcPl(days, "", "s")} en commun`,
      saved:
        "Les données lues précédemment sont conservées sur cet appareil et comptées ensemble. Elles ne sont pas envoyées à un serveur.",
      forget: "Oublier les données précédentes",
    },
    daysFromRecords: (days) => `${days} jour${pcPl(days, "", "s")} selon les données`,
    perDay: (cost) => `${cost} par jour d'utilisation`,
    tokens: (tokens) => `${tokens} jetons`,
    checkIn: "Check-in",
    done: "Check-in fait",
    none: "Vous n'avez pas ajouté d'abonnement pour ce service. Ajoutez-en un pour faire le check-in.",
    ambiguous: (count) =>
      `Vous avez ${count} abonnements pour ce service, impossible de savoir lequel utiliser. Faites le check-in depuis le détail de l'abonnement.`,
    otherMetric:
      "Cet abonnement se mesure autrement qu'en jours d'utilisation. Faites le check-in depuis son détail.",
    invalidTitle: "Ce lien est illisible",
    invalidBody: "Relisez les données de votre PC ci-dessous.",
    staleTitle: "Ce lien est périmé",
    staleBody:
      "Nous l'avons bloqué pour éviter d'enregistrer d'anciens chiffres. Relisez les données de votre PC ci-dessous.",
    toSubs: "Aller aux abonnements →",
    modalLink: (tool) => `Compter depuis les données ${tool} de ce PC →`,
    modalLinkClaude:
      "Compter depuis les données Claude Code de ce PC ou un export des conversations claude.ai →",
    apiValue: (usd) => `Environ ${usd} au prix de l'API`,
    ratioOver: (times) =>
      `C'est ${times}× votre part mensuelle de l'abonnement — l'usage sur PC suffit déjà à le rentabiliser.`,
    ratioUnder: (percent) =>
      `C'est ${percent} % de votre part mensuelle. L'usage sur le web ou dans l'appli n'est pas inclus : vous en avez peut-être profité davantage.`,
    apiNote:
      "Ce qu'aurait coûté le même modèle au tarif public de l'API (hors taxes). Ce n'est pas ce qui vous a été facturé, mais un repère de ce que vous avez tiré de l'abonnement.",
    privacy: "Les chiffres ne sont qu'après le # du lien et n'ont pas été envoyés au serveur.",
    reader: {
      description:
        "Choisissez les dossiers de données de Claude Code, Codex, Cursor ou Antigravity sur ce PC. Votre navigateur compte uniquement les moments où vous avez envoyé des requêtes, sur cet appareil, et remplit les jours d'utilisation des 30 derniers jours. Les conversations sur claude.ai peuvent aussi être comptées à partir d'un fichier d'export (dernier encadré).",
      privacy:
        "Les fichiers ne sont pas envoyés au serveur. Le contenu des requêtes et réponses est écarté dès sa lecture ; seules les heures sont gardées. Autorisez la lecture du dossier quand le navigateur le demande.",
      claude: "Claude Code",
      codex: "Codex",
      cursor: "Cursor",
      antigravity: "Antigravity",
      cursorNote:
        "Ce fichier contient aussi votre connexion à Cursor, mais seuls les champs de formule et d'heure des requêtes sont lus. Le fichier n'est pas envoyé au serveur.",
      pickFile: "Choisir le fichier",
      cursorFileTip:
        "Les navigateurs ne peuvent pas ouvrir ce dossier en entier, vous choisissez donc le fichier. Copiez le chemin, collez-le dans la barre d'adresse en haut du sélecteur de fichiers, appuyez sur Entrée et choisissez state.vscdb (si state.vscdb-wal est présent, maintenez Ctrl pour le choisir aussi).",
      cursorNoFile:
        "state.vscdb introuvable. Vérifiez que vous avez choisi state.vscdb au chemin ci-dessus (pas state.vscdb.backup).",
      usedConversations: (days, conversations) =>
        `Utilisé au moins ${days} jour${pcPl(days, "", "s")} sur les 30 derniers · ${conversations} conversation${pcPl(conversations, "", "s")} (seul le dernier jour de saisie de chacune est enregistré)`,
      antigravityQuestion:
        "Utilisez-vous Antigravity avec un compte d'abonnement Google AI (Pro/Ultra) ?",
      antigravityHint:
        "Les données n'indiquent pas le compte utilisé, d'où la question. L'usage gratuit n'est pas un usage d'abonnement et n'est pas compté.",
      antigravityYes: "Oui, un compte abonné",
      antigravityNo: "Non, je l'utilise gratuitement",
      folder: "Dossier de données",
      copy: "Copier le chemin",
      copied: "Copié",
      pick: "Choisir le dossier",
      pickAgain: "Choisir à nouveau",
      reading: "Lecture…",
      hiddenTip:
        "S'il est masqué et n'apparaît pas, copiez le chemin, collez-le dans la barre d'adresse en haut du sélecteur de dossier et appuyez sur Entrée.",
      windowsUser: "Nom d'utilisateur Windows",
      windowsUserPlaceholder: "ex. user",
      windowsUserHint:
        "Le dossier à votre nom dans C:\\Users. Il n'est mémorisé que dans ce navigateur.",
      windowsUserInPath: "utilisateur",
      copyNeedsUser: "Saisissez d'abord votre nom d'utilisateur",
      noFiles:
        "Aucune donnée des 30 derniers jours trouvée. Vérifiez que vous avez choisi le dossier ci-dessus.",
      readFailed: "Impossible de lire le dossier. Veuillez le choisir à nouveau.",
      used: (days, prompts) =>
        `Utilisé ${days} jour${pcPl(days, "", "s")} sur les 30 derniers · ${prompts} requête${pcPl(prompts, "", "s")}`,
      noUse: "Aucune utilisation d'abonnement sur les 30 derniers jours.",
      plan: (plan) => `Formule enregistrée : ${plan}`,
      unpriced: (n, models) =>
        `${n} réponse${pcPl(n, "", "s")} de modèles sans prix confirmé ${pcPl(n, "écartée", "écartées")} : ${models}`,
      excluded: (n) =>
        `${n} session${pcPl(n, "", "s")} hors abonnement ignorée${pcPl(n, "", "s")} (clé API, formule gratuite, etc.).`,
      unknown: (n) =>
        `${n} session${pcPl(n, "", "s")} dont l'abonnement n'a pas pu être confirmé ignorée${pcPl(n, "", "s")}.`,
      unrecognized: (n) =>
        `${n} fichier${pcPl(n, "", "s")} de données non reconnu${pcPl(n, "", "s")} — l'outil a peut-être changé de format.`,
      loginQuestion: "Comment vous connectez-vous à Claude Code ?",
      loginHint:
        "Les données n'indiquent pas le compte utilisé, d'où la question. L'usage avec une clé API n'est pas un usage d'abonnement et n'est pas compté.",
      loginSubscription: "Compte d'abonnement Claude (Pro/Max)",
      loginApiKey: "Clé API",
      results: "Check-ins",
      claudeWeb: "Conversations claude.ai (fichier d'export)",
      webHelp:
        "Les conversations sur le web et l'appli ne figurent pas dans les données du PC. Demandez un export des données dans les réglages de claude.ai, décompressez l'archive conversations reçue et choisissez conversations.json. Seules les heures d'envoi de vos messages sont comptées ; le contenu des conversations est supprimé dès sa lecture. Le fichier n'est pas envoyé à un serveur.",
      webReadFailed:
        "Impossible de lire ce fichier comme un export de conversations claude.ai. Vérifiez que vous avez choisi conversations.json décompressé.",
      webUntilExport:
        "Il ne contient que les conversations jusqu'à l'export. Les jours suivants n'y figurent pas.",
      webQuestion: "Ce fichier provient-il d'un compte d'abonnement Claude (Pro/Max) ?",
      webHint:
        "Le fichier d'export n'indique pas votre formule, d'où la question. Les conversations d'un compte gratuit ne sont pas une utilisation de l'abonnement et ne sont pas comptées.",
      webYes: "Oui, un compte abonné",
      webNo: "Non, un compte gratuit",
      appOnly:
        "Ouvrez ceci dans le navigateur de votre PC. Cette page lit les données Claude Code et Codex de votre PC.",
    },
  },
};

export const es: Widen<typeof ko> = {
  pcUsage: {
    title: "Uso de herramientas de código con IA en este PC",
    description: (windowDays, until) =>
      `Días en que usaste Claude Code o Codex con suscripción en este PC (últimos ${windowDays} días hasta el ${until}).`,
    pcOnly:
      "Solo cuentan los días en este PC. Si también lo usaste en la web o en el móvil, sube el número al registrar. No se guarda nada hasta que confirmes.",
    tool: PC_TOOLS,
    days: (days) => `${days} día${pcPl(days, "", "s")} según el PC`,
    toolWeb: "claude.ai",
    evidence: {
      item: (label, days, until) =>
        `${label}: ${days} día${pcPl(days, "", "s")}${until ? ` (hasta el ${until})` : ""}`,
      overlap: (days) => `${days} día${pcPl(days, "", "s")} en ambos`,
      saved:
        "Los registros leídos antes se guardan en este dispositivo y se cuentan juntos. No se envían a ningún servidor.",
      forget: "Olvidar registros anteriores",
    },
    daysFromRecords: (days) => `${days} día${pcPl(days, "", "s")} según los registros`,
    perDay: (cost) => `${cost} por día de uso`,
    tokens: (tokens) => `${tokens} tokens`,
    checkIn: "Registrar",
    done: "Registrado",
    none: "No has añadido una suscripción de este servicio. Añádela para registrar.",
    ambiguous: (count) =>
      `Tienes ${count} suscripciones de este servicio, así que no sabemos cuál usar. Regístralo desde el detalle de la suscripción.`,
    otherMetric:
      "Esta suscripción se mide con algo distinto a los días de uso. Regístrala desde su detalle.",
    invalidTitle: "No se puede leer este enlace",
    invalidBody: "Vuelve a leer los registros de tu PC abajo.",
    staleTitle: "Este enlace está desactualizado",
    staleBody:
      "Lo detuvimos para no registrar cifras antiguas. Vuelve a leer los registros de tu PC abajo.",
    toSubs: "Ir a suscripciones →",
    modalLink: (tool) => `Contar con los registros de ${tool} de este PC →`,
    modalLinkClaude:
      "Contar con los registros de Claude Code de este PC o una exportación de chats de claude.ai →",
    apiValue: (usd) => `Unos ${usd} a precio de API`,
    ratioOver: (times) =>
      `Es ${times}× tu parte mensual de la suscripción: solo el uso en el PC ya la amortiza.`,
    ratioUnder: (percent) =>
      `Es el ${percent} % de tu parte mensual. No incluye el uso en la web ni en la app, así que quizá la aprovechaste más.`,
    apiNote:
      "Lo que habría costado el mismo modelo a precio de lista de la API (sin impuestos). No es lo que te cobraron, sino una medida de cuánto aprovechaste la suscripción.",
    privacy: "Las cifras solo están después de # en el enlace y no se enviaron al servidor.",
    reader: {
      description:
        "Elige las carpetas de registros de Claude Code, Codex, Cursor o Antigravity de este PC. Tu navegador cuenta solo los momentos en que enviaste instrucciones, en este dispositivo, y rellena los días de uso de los últimos 30 días. Los chats de claude.ai también se pueden contar con un archivo de exportación (el último recuadro).",
      privacy:
        "Los archivos no se envían al servidor. El contenido de instrucciones y respuestas se descarta al leerlo; solo se guardan las horas. Permite la lectura de la carpeta cuando el navegador lo pida.",
      claude: "Claude Code",
      codex: "Codex",
      cursor: "Cursor",
      antigravity: "Antigravity",
      cursorNote:
        "Este archivo también contiene tu inicio de sesión de Cursor, pero solo se leen los campos de plan y hora de las instrucciones. El archivo no se envía al servidor.",
      pickFile: "Elegir archivo",
      cursorFileTip:
        "Los navegadores no pueden abrir esta carpeta entera, así que eliges el archivo. Copia la ruta, pégala en la barra de direcciones arriba del selector, pulsa Intro y elige state.vscdb (si está state.vscdb-wal, mantén Ctrl y elígelo también).",
      cursorNoFile:
        "No se encontró state.vscdb. Asegúrate de elegir state.vscdb en la ruta de arriba (no state.vscdb.backup).",
      usedConversations: (days, conversations) =>
        `Usado al menos ${days} día${pcPl(days, "", "s")} en los últimos 30 · ${conversations} conversaci${pcPl(conversations, "ón", "ones")} (solo se registra el último día de entrada de cada una)`,
      antigravityQuestion:
        "¿Usas Antigravity con una cuenta de suscripción de Google AI (Pro/Ultra)?",
      antigravityHint:
        "Los registros no dicen qué cuenta se usó, por eso preguntamos. El uso gratuito no es uso de suscripción y no se cuenta.",
      antigravityYes: "Sí, una cuenta de suscripción",
      antigravityNo: "No, lo uso gratis",
      folder: "Carpeta de registros",
      copy: "Copiar ruta",
      copied: "Copiado",
      pick: "Elegir carpeta",
      pickAgain: "Elegir de nuevo",
      reading: "Leyendo…",
      hiddenTip:
        "Si está oculta y no aparece, copia la ruta, pégala en la barra de direcciones arriba del selector de carpetas y pulsa Intro.",
      windowsUser: "Nombre de usuario de Windows",
      windowsUserPlaceholder: "p. ej., user",
      windowsUserHint:
        "La carpeta con tu nombre dentro de C:\\Users. Solo se recuerda en este navegador.",
      windowsUserInPath: "usuario",
      copyNeedsUser: "Primero escribe tu nombre de usuario",
      noFiles:
        "No se encontraron registros de los últimos 30 días. Comprueba que elegiste la carpeta de arriba.",
      readFailed: "No se pudo leer la carpeta. Vuelve a elegirla.",
      used: (days, prompts) =>
        `Usado ${days} día${pcPl(days, "", "s")} en los últimos 30 · ${prompts} instrucci${pcPl(prompts, "ón", "ones")}`,
      noUse: "Sin uso de suscripción en los últimos 30 días.",
      plan: (plan) => `Plan registrado: ${plan}`,
      unpriced: (n, models) =>
        `Se excluyeron ${n} respuesta${pcPl(n, "", "s")} de modelos sin precio confirmado: ${models}`,
      excluded: (n) =>
        `Se omitieron ${n} sesi${pcPl(n, "ón", "ones")} sin suscripción (clave de API, plan gratuito, etc.).`,
      unknown: (n) =>
        `Se omitieron ${n} sesi${pcPl(n, "ón", "ones")} en las que no se pudo confirmar la suscripción.`,
      unrecognized: (n) =>
        `${n} archivo${pcPl(n, "", "s")} de registro no reconocido${pcPl(n, "", "s")}: puede que la herramienta haya cambiado de formato.`,
      loginQuestion: "¿Cómo inicias sesión en Claude Code?",
      loginHint:
        "Los registros no dicen qué cuenta se usó, por eso preguntamos. El uso con clave de API no es uso de suscripción y no se cuenta.",
      loginSubscription: "Cuenta de suscripción de Claude (Pro/Max)",
      loginApiKey: "Clave de API",
      results: "Registros",
      claudeWeb: "Chats de claude.ai (archivo de exportación)",
      webHelp:
        "Los chats en la web y la app no están en los registros del PC. Solicita una exportación de datos en los ajustes de claude.ai, descomprime el paquete conversations que recibas y elige conversations.json. Solo se cuentan las horas en que enviaste mensajes y el contenido de los chats se descarta en cuanto se lee. El archivo no se envía a ningún servidor.",
      webReadFailed:
        "No se pudo leer como una exportación de chats de claude.ai. Comprueba que elegiste conversations.json descomprimido.",
      webUntilExport:
        "Solo incluye los chats hasta el momento de la exportación. Los días posteriores no están incluidos.",
      webQuestion: "¿Este archivo es de una cuenta con suscripción a Claude (Pro/Max)?",
      webHint:
        "El archivo de exportación no indica tu plan, por eso lo preguntamos. Los chats de una cuenta gratuita no son uso de la suscripción y no se cuentan.",
      webYes: "Sí, una cuenta con suscripción",
      webNo: "No, una cuenta gratuita",
      appOnly:
        "Ábrelo en el navegador de tu PC. Esta página lee los registros de Claude Code y Codex de tu PC.",
    },
  },
};

export const de: Widen<typeof ko> = {
  pcUsage: {
    title: "Nutzung von KI-Coding-Tools auf diesem PC",
    description: (windowDays, until) =>
      `Tage, an denen du Claude Code oder Codex mit Abo auf diesem PC genutzt hast (letzte ${windowDays} Tage bis ${until}).`,
    pcOnly:
      "Nur Tage auf diesem PC zählen. Wenn du es auch im Web oder auf dem Handy genutzt hast, erhöh die Zahl beim Eintragen. Nichts wird gespeichert, bis du bestätigst.",
    tool: PC_TOOLS,
    days: (days) => `${days} ${pcPl(days, "Tag", "Tage")} laut PC`,
    toolWeb: "claude.ai",
    evidence: {
      item: (label, days, until) =>
        `${label}: ${days} ${pcPl(days, "Tag", "Tage")}${until ? ` (bis ${until})` : ""}`,
      overlap: (days) => `${days} ${pcPl(days, "Tag", "Tage")} doppelt`,
      saved:
        "Früher gelesene Daten bleiben auf diesem Gerät und werden mitgezählt. Sie werden an keinen Server gesendet.",
      forget: "Frühere Daten vergessen",
    },
    daysFromRecords: (days) => `${days} ${pcPl(days, "Tag", "Tage")} laut Daten`,
    perDay: (cost) => `${cost} pro Nutzungstag`,
    tokens: (tokens) => `${tokens} Tokens`,
    checkIn: "Eintragen",
    done: "Eingetragen",
    none: "Du hast für diesen Dienst noch kein Abo hinzugefügt. Füg eines hinzu, um einzutragen.",
    ambiguous: (count) =>
      `Du hast ${count} Abos für diesen Dienst, daher ist unklar, welches gemeint ist. Trag es in den Abo-Details ein.`,
    otherMetric:
      "Dieses Abo wird nicht nach Nutzungstagen gemessen. Trag es in seinen Details ein.",
    invalidTitle: "Dieser Link ist nicht lesbar",
    invalidBody: "Lies deine PC-Daten unten erneut ein.",
    staleTitle: "Dieser Link ist veraltet",
    staleBody:
      "Wir haben ihn gestoppt, damit keine alten Zahlen eingetragen werden. Lies deine PC-Daten unten erneut ein.",
    toSubs: "Zu den Abos →",
    modalLink: (tool) => `Aus den ${tool}-Daten dieses PCs zählen →`,
    modalLinkClaude:
      "Aus den Claude Code-Daten dieses PCs oder einem claude.ai-Chatexport zählen →",
    apiValue: (usd) => `Etwa ${usd} zu API-Preisen`,
    ratioOver: (times) =>
      `Das ist das ${times}-Fache deines monatlichen Abo-Anteils — schon die PC-Nutzung allein lohnt sich.`,
    ratioUnder: (percent) =>
      `Das sind ${percent} % deines Monatsanteils. Nutzung im Web oder in der App fehlt, du hast es also vielleicht mehr genutzt.`,
    apiNote:
      "Was dasselbe Modell zum API-Listenpreis (vor Steuern) gekostet hätte. Es ist nicht, was dir berechnet wurde, sondern ein Maß dafür, wie viel du aus dem Abo herausgeholt hast.",
    privacy: "Die Zahlen stehen nur hinter dem # im Link und wurden nicht an den Server gesendet.",
    reader: {
      description:
        "Wähl die Datenordner von Claude Code, Codex, Cursor oder Antigravity auf diesem PC. Dein Browser zählt nur die Zeitpunkte, zu denen du Eingaben gesendet hast, auf diesem Gerät, und trägt die Nutzungstage der letzten 30 Tage ein. Chats auf claude.ai lassen sich ebenfalls zählen, mit einer Exportdatei (letztes Feld).",
      privacy:
        "Dateien werden nicht an den Server gesendet. Inhalte von Eingaben und Antworten werden gleich nach dem Lesen verworfen; nur die Zeitpunkte bleiben. Erlaube das Lesen des Ordners, wenn der Browser fragt.",
      claude: "Claude Code",
      codex: "Codex",
      cursor: "Cursor",
      antigravity: "Antigravity",
      cursorNote:
        "Diese Datei enthält auch deine Cursor-Anmeldung, gelesen werden aber nur die Felder für Tarif und Eingabezeit. Die Datei wird nicht an den Server gesendet.",
      pickFile: "Datei wählen",
      cursorFileTip:
        "Browser können diesen Ordner nicht als Ganzes öffnen, daher wählst du die Datei. Kopier den Pfad, füg ihn in die Adressleiste oben im Dateiauswahlfenster ein, drück Enter und wähl state.vscdb (falls state.vscdb-wal da ist, halte Strg gedrückt und wähl sie mit).",
      cursorNoFile:
        "state.vscdb nicht gefunden. Prüf, ob du unter dem Pfad oben state.vscdb gewählt hast (nicht state.vscdb.backup).",
      usedConversations: (days, conversations) =>
        `In den letzten 30 Tagen an mindestens ${days} ${pcPl(days, "Tag", "Tagen")} genutzt · ${conversations} ${pcPl(conversations, "Unterhaltung", "Unterhaltungen")} (pro Unterhaltung wird nur der letzte Eingabetag erfasst)`,
      antigravityQuestion: "Nutzt du Antigravity mit einem Google-AI-Abokonto (Pro/Ultra)?",
      antigravityHint:
        "Die Daten verraten nicht, welches Konto genutzt wurde, daher fragen wir. Kostenlose Nutzung ist keine Abo-Nutzung und zählt nicht.",
      antigravityYes: "Ja, ein Abokonto",
      antigravityNo: "Nein, ich nutze es kostenlos",
      folder: "Datenordner",
      copy: "Pfad kopieren",
      copied: "Kopiert",
      pick: "Ordner wählen",
      pickAgain: "Erneut wählen",
      reading: "Wird gelesen…",
      hiddenTip:
        "Wenn er versteckt ist und nicht erscheint, kopier den Pfad, füg ihn in die Adressleiste oben im Ordnerauswahlfenster ein und drück Enter.",
      windowsUser: "Windows-Benutzername",
      windowsUserPlaceholder: "z. B. user",
      windowsUserHint:
        "Der Ordner mit deinem Namen in C:\\Users. Er wird nur in diesem Browser gespeichert.",
      windowsUserInPath: "benutzername",
      copyNeedsUser: "Gib zuerst deinen Benutzernamen ein",
      noFiles:
        "Keine Daten der letzten 30 Tage gefunden. Prüf, ob du den Ordner oben gewählt hast.",
      readFailed: "Der Ordner konnte nicht gelesen werden. Bitte wähl ihn erneut.",
      used: (days, prompts) =>
        `In den letzten 30 Tagen an ${days} ${pcPl(days, "Tag", "Tagen")} genutzt · ${prompts} ${pcPl(prompts, "Eingabe", "Eingaben")}`,
      noUse: "Keine Abo-Nutzung in den letzten 30 Tagen.",
      plan: (plan) => `Erfasster Tarif: ${plan}`,
      unpriced: (n, models) =>
        `${n} ${pcPl(n, "Antwort", "Antworten")} von Modellen ohne bestätigten Preis ausgelassen: ${models}`,
      excluded: (n) =>
        `${n} ${pcPl(n, "Sitzung", "Sitzungen")} ohne Abo übersprungen (API-Schlüssel, kostenloser Tarif usw.).`,
      unknown: (n) =>
        `${n} ${pcPl(n, "Sitzung", "Sitzungen")} übersprungen, bei denen das Abo nicht bestätigt werden konnte.`,
      unrecognized: (n) =>
        `${n} ${pcPl(n, "Datei", "Dateien")} nicht erkannt — das Tool hat vielleicht sein Format geändert.`,
      loginQuestion: "Wie meldest du dich bei Claude Code an?",
      loginHint:
        "Die Daten verraten nicht, welches Konto genutzt wurde, daher fragen wir. Nutzung mit API-Schlüssel ist keine Abo-Nutzung und zählt nicht.",
      loginSubscription: "Claude-Abokonto (Pro/Max)",
      loginApiKey: "API-Schlüssel",
      results: "Einträge",
      claudeWeb: "claude.ai-Chats (Exportdatei)",
      webHelp:
        "Chats im Web und in der App stehen nicht in den PC-Daten. Fordere in den Einstellungen von claude.ai einen Datenexport an, entpacke das erhaltene conversations-Paket und wähl conversations.json. Gezählt werden nur die Zeitpunkte, zu denen du Nachrichten gesendet hast; der Chatinhalt wird sofort nach dem Lesen verworfen. Die Datei wird an keinen Server gesendet.",
      webReadFailed:
        "Die Datei ließ sich nicht als claude.ai-Chatexport lesen. Prüf, ob du die entpackte conversations.json gewählt hast.",
      webUntilExport: "Sie enthält nur Chats bis zum Export. Spätere Tage sind nicht enthalten.",
      webQuestion: "Stammt diese Datei von einem Claude-Abokonto (Pro/Max)?",
      webHint:
        "Die Exportdatei nennt deinen Tarif nicht, deshalb fragen wir. Chats eines kostenlosen Kontos sind keine Abo-Nutzung und werden nicht gezählt.",
      webYes: "Ja, ein Abokonto",
      webNo: "Nein, ein kostenloses Konto",
      appOnly:
        "Öffne das im Browser deines PCs. Diese Seite liest die Claude-Code- und Codex-Daten auf deinem PC.",
    },
  },
};

export const pt: Widen<typeof ko> = {
  pcUsage: {
    title: "Uso de ferramentas de código com IA neste PC",
    description: (windowDays, until) =>
      `Dias em que você usou Claude Code ou Codex com assinatura neste PC (últimos ${windowDays} dias até ${until}).`,
    pcOnly:
      "Só contam os dias neste PC. Se também usou na web ou no celular, aumente o número ao registrar. Nada é salvo até você confirmar.",
    tool: PC_TOOLS,
    days: (days) => `${days} dia${pcPl(days, "", "s")} pelo PC`,
    toolWeb: "claude.ai",
    evidence: {
      item: (label, days, until) =>
        `${label}: ${days} dia${pcPl(days, "", "s")}${until ? ` (até ${until})` : ""}`,
      overlap: (days) => `${days} dia${pcPl(days, "", "s")} em comum`,
      saved:
        "Os registros lidos antes ficam neste dispositivo e são contados juntos. Não são enviados a nenhum servidor.",
      forget: "Esquecer registros anteriores",
    },
    daysFromRecords: (days) => `${days} dia${pcPl(days, "", "s")} pelos registros`,
    perDay: (cost) => `${cost} por dia de uso`,
    tokens: (tokens) => `${tokens} tokens`,
    checkIn: "Registrar",
    done: "Registrado",
    none: "Você ainda não adicionou uma assinatura deste serviço. Adicione para registrar.",
    ambiguous: (count) =>
      `Você tem ${count} assinaturas deste serviço, então não dá para saber qual usar. Registre pelo detalhe da assinatura.`,
    otherMetric:
      "Esta assinatura é medida por algo além dos dias de uso. Registre pelo detalhe dela.",
    invalidTitle: "Não dá para ler este link",
    invalidBody: "Leia de novo os registros do PC abaixo.",
    staleTitle: "Este link está desatualizado",
    staleBody:
      "Paramos para não registrar números antigos. Leia de novo os registros do PC abaixo.",
    toSubs: "Ir para assinaturas →",
    modalLink: (tool) => `Contar pelos registros do ${tool} neste PC →`,
    modalLinkClaude:
      "Contar pelos registros do Claude Code neste PC ou por uma exportação de conversas do claude.ai →",
    apiValue: (usd) => `Cerca de ${usd} pelo preço da API`,
    ratioOver: (times) =>
      `Isso é ${times}× sua parte mensal da assinatura — só o uso no PC já compensa.`,
    ratioUnder: (percent) =>
      `Isso é ${percent}% da sua parte mensal. O uso na web ou no app não entra, então você pode ter aproveitado mais.`,
    apiNote:
      "Quanto o mesmo modelo custaria pelo preço de tabela da API (sem impostos). Não é o que foi cobrado, e sim uma medida de quanto você aproveitou da assinatura.",
    privacy: "Os números ficam só depois do # no link e não foram enviados ao servidor.",
    reader: {
      description:
        "Escolha as pastas de registros do Claude Code, Codex, Cursor ou Antigravity neste PC. Seu navegador conta só os momentos em que você enviou comandos, neste dispositivo, e preenche os dias de uso dos últimos 30 dias. As conversas no claude.ai também podem ser contadas com um arquivo exportado (o último quadro).",
      privacy:
        "Os arquivos não são enviados ao servidor. O conteúdo dos comandos e respostas é descartado ao ser lido; só os horários ficam. Permita a leitura da pasta quando o navegador pedir.",
      claude: "Claude Code",
      codex: "Codex",
      cursor: "Cursor",
      antigravity: "Antigravity",
      cursorNote:
        "Este arquivo também guarda seu login do Cursor, mas só os campos de plano e horário dos comandos são lidos. O arquivo não é enviado ao servidor.",
      pickFile: "Escolher arquivo",
      cursorFileTip:
        "Os navegadores não abrem esta pasta inteira, então você escolhe o arquivo. Copie o caminho, cole na barra de endereço no topo do seletor de arquivos, pressione Enter e escolha state.vscdb (se houver state.vscdb-wal, segure Ctrl e escolha também).",
      cursorNoFile:
        "state.vscdb não encontrado. Confira se escolheu state.vscdb no caminho acima (não state.vscdb.backup).",
      usedConversations: (days, conversations) =>
        `Usado pelo menos ${days} dia${pcPl(days, "", "s")} nos últimos 30 · ${conversations} conversa${pcPl(conversations, "", "s")} (só o último dia de entrada de cada uma é registrado)`,
      antigravityQuestion:
        "Você usa o Antigravity com uma conta de assinatura do Google AI (Pro/Ultra)?",
      antigravityHint:
        "Os registros não dizem qual conta foi usada, por isso perguntamos. O uso grátis não é uso de assinatura e não conta.",
      antigravityYes: "Sim, conta de assinatura",
      antigravityNo: "Não, uso de graça",
      folder: "Pasta de registros",
      copy: "Copiar caminho",
      copied: "Copiado",
      pick: "Escolher pasta",
      pickAgain: "Escolher de novo",
      reading: "Lendo…",
      hiddenTip:
        "Se estiver oculta e não aparecer, copie o caminho, cole na barra de endereço no topo do seletor de pastas e pressione Enter.",
      windowsUser: "Nome de usuário do Windows",
      windowsUserPlaceholder: "ex.: user",
      windowsUserHint: "A pasta com seu nome em C:\\Users. Fica lembrada só neste navegador.",
      windowsUserInPath: "usuario",
      copyNeedsUser: "Informe primeiro seu nome de usuário",
      noFiles: "Nenhum registro dos últimos 30 dias encontrado. Confira se escolheu a pasta acima.",
      readFailed: "Não foi possível ler a pasta. Escolha de novo.",
      used: (days, prompts) =>
        `Usado ${days} dia${pcPl(days, "", "s")} nos últimos 30 · ${prompts} comando${pcPl(prompts, "", "s")}`,
      noUse: "Sem uso de assinatura nos últimos 30 dias.",
      plan: (plan) => `Plano registrado: ${plan}`,
      unpriced: (n, models) =>
        `${n} resposta${pcPl(n, "", "s")} de modelos sem preço confirmado ${pcPl(n, "ficou", "ficaram")} de fora: ${models}`,
      excluded: (n) =>
        `${n} sess${pcPl(n, "ão", "ões")} sem assinatura ${pcPl(n, "foi ignorada", "foram ignoradas")} (chave de API, plano grátis etc.).`,
      unknown: (n) =>
        `${n} sess${pcPl(n, "ão", "ões")} em que não deu para confirmar a assinatura ${pcPl(n, "foi ignorada", "foram ignoradas")}.`,
      unrecognized: (n) =>
        `${n} arquivo${pcPl(n, "", "s")} de registro não reconhecido${pcPl(n, "", "s")} — a ferramenta pode ter mudado de formato.`,
      loginQuestion: "Como você entra no Claude Code?",
      loginHint:
        "Os registros não dizem qual conta foi usada, por isso perguntamos. O uso com chave de API não é uso de assinatura e não conta.",
      loginSubscription: "Conta de assinatura do Claude (Pro/Max)",
      loginApiKey: "Chave de API",
      results: "Registros",
      claudeWeb: "Conversas do claude.ai (arquivo exportado)",
      webHelp:
        "As conversas na web e no app não estão nos registros do PC. Peça a exportação de dados nas configurações do claude.ai, descompacte o pacote conversations recebido e escolha conversations.json. Só contamos os horários em que você enviou mensagens, e o conteúdo das conversas é descartado assim que é lido. O arquivo não é enviado a nenhum servidor.",
      webReadFailed:
        "Não foi possível ler como uma exportação de conversas do claude.ai. Confira se você escolheu o conversations.json descompactado.",
      webUntilExport:
        "Só inclui conversas até o momento da exportação. Os dias depois disso não estão incluídos.",
      webQuestion: "Este arquivo é de uma conta com assinatura do Claude (Pro/Max)?",
      webHint:
        "O arquivo exportado não informa seu plano, por isso perguntamos. Conversas de uma conta gratuita não são uso da assinatura e não são contadas.",
      webYes: "Sim, conta com assinatura",
      webNo: "Não, conta gratuita",
      appOnly:
        "Abra no navegador do seu PC. Esta página lê os registros do Claude Code e do Codex no seu PC.",
    },
  },
};
