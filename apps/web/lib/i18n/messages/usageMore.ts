import type { Widen } from "../types";
import { countOf } from "../english";

/**
 * 앱의 폰 사용 기록 중 체크인 칸의 한 줄·자동 체크인·구독 후보·안 쓴 구독 알림·켜기 안내. 앱 이름(유튜브 뮤직
 * 등)은 서비스 목록처럼 그대로 쓴다.
 */
export const ko = {
  usageMore: {
    phoneBadge: "폰 기록",
    tvTabletMissing: "TV·PC·태블릿에서 본 건 빠져 있어요.",
    within: (covered: number) =>
      covered < 30 ? `기록이 있는 ${covered}일 동안` : "최근 30일 동안",
    hint: {
      notOpened: "이 폰에서는 안 열었어요.",
      notOpenedAfter: " TV·PC·태블릿에서 썼다면 막대로 골라 주세요.",
      usedBefore: (within: string) => `이 폰에서 ${within} `,
      usedOpens: (opens: number, duration: string) => `${opens}번 · ${duration}`,
      usedAfter: " 썼어요. 막대를 여기에 맞춰 뒀어요.",
      notInstalledBar:
        "이 폰에는 이 서비스의 앱이 없어요. 다른 기기에서 썼다면 막대로 골라 주세요.",
      notInstalledInput:
        "이 폰에는 이 서비스의 앱이 없어요. 다른 기기에서 썼다면 직접 적어 주세요.",
      building: "이 폰의 사용 기록은 오늘부터 쌓여요. 내일부터 여기서 채울 수 있어요.",
      fill: "폰 사용 기록으로 채우기",
      fillOpens: "이 폰에서 몇 번 썼는지 불러와요",
      fillDays: "이 폰에서 며칠 썼는지 불러와요",
      fillHours: "이 폰에서 몇 시간 썼는지 불러와요",
      usedDays: (days: number, duration: string) => `${days}일 · ${duration}`,
      usedAfterPlain: " 썼어요. ",
      fitted: "칸을 여기에 맞춰 뒀어요.",
      underHour: "1시간이 안 돼 칸은 비워 뒀어요.",
      listenMissing: "화면을 끄고 들은 재생은 아직 재지 못한 날이 있어 빠져 있을 수 있어요. ",
    },
    auto: {
      title: "폰 기록으로 자동 체크인",
      off: "꺼져 있어요. 체크인은 직접 해 주세요.",
      waiting: (days: number) => `폰 기록이 ${days}일 쌓이면 알아서 해요.`,
      on: "최근 30일 폰 기록으로 알아서 체크인해요. 이 폰에서 안 쓴 구독과 직접 센 숫자가 더 큰 구독은 그대로 둬요.",
      progress: (done: number, total: number) => `${done} / ${total}일`,
      left: (days: number) => `${days}일 남았어요`,
      status: (on: boolean) => `자동 체크인 ${on ? "켜짐" : "꺼짐"}`,
      statusOff: "직접 체크인해 주세요",
      statusWaiting: (days: number) => `폰 기록이 ${days}일 쌓이면 알아서 해요`,
      statusSoon: (days: number) => `${days}일 뒤부터 알아서 해요`,
      statusOn: "폰 기록으로 알아서 맞춰요",
      settings: "설정",
      turnOn: "켜기",
      batch: "폰 기록으로 체크인",
    },
    suggest: {
      sectionLabel: "폰 기록으로 찾은 구독",
      recent: (days: number) => (days >= 30 ? "최근 30일" : `최근 ${days}일`),
      killedTitle: (name: string) => `해지한 ${name}, 다시 쓰고 있어요`,
      title: (name: string) => `${name}, 구독 중인가요?`,
      used: (period: string, app: string | null, duration: string, days: number) =>
        `${period} 이 폰${app ? `의 ${app} 앱` : ""}에서 ${duration}, ${days}일 썼어요.`,
      killedBody: "다시 구독했다면 새로 등록해요.",
      newBody: "등록하지 않은 서비스예요.",
      share: "가족·친구와 나눠 내면 등록할 때 인원을 적어요.",
      notes: {
        "youtube-premium": "유튜브 뮤직만 따로 내면(뮤직 프리미엄) 직접 입력으로 등록해요.",
        "coupang-wow": "쿠팡플레이는 와우 회원이 아니어도 광고를 보며 무료로 볼 수 있어요.",
      } as Record<string, string>,
      whichBundle: "어느 상품으로 받나요?",
      resubscribed: "다시 구독했어요",
      subscribed: "내가 구독 중",
      viaBundle: "결합 상품으로 받아요",
      notPaying: "내가 내지 않아요",
      notPayingNote: (days: number) =>
        `‘내가 내지 않아요’는 가족 계정·무료 시청·구독 안 함이에요. ${days}일 동안 묻지 않아요.`,
    },
    alerts: {
      sectionLabel: "폰 기록으로 본 구독",
      unusedTitle: (name: string, days: number) => `${name} 앱을 ${days}일 동안 안 열었어요`,
      unusedReason: (days: number, amount: string) =>
        `${days === 0 ? "오늘" : `${days}일 뒤`} ${amount}이 결제돼요. 노트북·태블릿에서도 안 봤다면 쉬어가도 괜찮아요.`,
      priceyTitle: (name: string, amount: string) => `${name}, 시간당 ${amount}`,
      priceyReason: (days: number, duration: string, ratio: number) =>
        `최근 ${days}일 ${duration}만 썼어요. 내 다른 구독보다 ${ratio}배 비싸요.`,
      cancelGuide: "해지 안내 보기",
      otherDevice: "다른 기기에서 봤어요",
      fine: "괜찮아요",
      batchTitle: "폰 기록으로 한 번에 체크인",
      batchBody: (count: number) => `체크인 필요 ${count}개를 채워요`,
      fillButton: "채우기",
    },
    access: {
      label: "폰 사용 기록 연결",
      title1: "폰 사용 기록으로",
      title2: "체크인을 채울까요?",
      body: "안드로이드 설정의 ‘사용 기록 액세스’를 켜면, 구독한 서비스 앱을 얼마나 열고 썼는지 불러와요.",
      points: [
        {
          title: "구독한 서비스 앱의 사용 시간·쓴 횟수·재생 시간만 읽어요",
          body: "재생 시간은 음악 앱이 재생 알림을 띄워 둔 시간이에요. 다른 앱의 기록과 화면 내용은 쓰지 않아요",
        },
        {
          title: "이 폰 안에서만 계산해요",
          body: "서버나 계정으로 보내지 않아요. 여러 기기 합산은 설정에서 따로 켤 때만 올려요",
        },
        {
          title: "TV·PC에서 본 건 빠져요",
          body: "기록이 30일 쌓이면 체크인을 알아서 적어요. '내 구독'에서 끌 수 있고, 적힌 숫자는 언제든 다시 체크인해 고칠 수 있어요",
        },
        {
          title: "언제든 끌 수 있어요",
          body: "설정 › 사용 기록 액세스 › SubSlash",
        },
      ],
      waiting: "설정에서 SubSlash를 켜고 돌아와 주세요.",
      failed: "설정 화면을 열지 못했어요. 설정 › 사용 기록 액세스에서 직접 켜 주세요.",
      openSettings: "설정에서 켜기",
      later: "직접 입력할게요",
    },
    find: {
      label: "폰 사용 기록에서 찾기",
      accessTitle1: "폰 사용 기록으로",
      accessTitle2: "구독을 찾을까요?",
      accessBody: (names: string) =>
        `안드로이드 설정의 ‘사용 기록 액세스’를 켜면, ${names} 앱을 이 폰에서 얼마나 썼는지 보고 등록하지 않은 구독을 찾아요.`,
      covered: (days: number) => `최근 30일 중 ${days}일치 기록으로 찾았어요.`,
      noRecords: "아직 읽은 기록이 없어요.",
      scope: (names: string) => `${names}를 찾고, TV·PC에서 본 것은 빠져요.`,
      none: "등록하지 않은 OTT를 찾지 못했어요",
      fewDays: (days: number) => `기록이 ${days}일치뿐이에요. 며칠 더 쓰고 다시 찾아보세요.`,
      noneEnough: "이미 모두 등록했거나, 1시간·3일 넘게 쓴 앱이 없어요.",
    },
  },
};

export const en: Widen<typeof ko> = {
  usageMore: {
    phoneBadge: "Phone record",
    tvTabletMissing: "Watching on a TV, PC, or tablet isn't included.",
    within: (covered) =>
      Number(covered) < 30 ? `in the ${countOf(covered, "day")} on record` : "in the last 30 days",
    hint: {
      notOpened: "Not opened on this phone.",
      notOpenedAfter: " If you used it on a TV, PC, or tablet, pick on the bar.",
      usedBefore: (within) => `On this phone, ${within} you used it `,
      usedOpens: (opens, duration) => `${countOf(opens, "time")} · ${duration}`,
      usedAfter: ". We set the bar to match.",
      notInstalledBar:
        "This service's app isn't on this phone. If you used it on another device, pick on the bar.",
      notInstalledInput:
        "This service's app isn't on this phone. If you used it on another device, enter it yourself.",
      building: "This phone's usage history starts today. You can fill this in from tomorrow.",
      fill: "Fill in from phone usage history",
      fillOpens: "Load how many times you used it on this phone",
      fillDays: "Load how many days you used it on this phone",
      fillHours: "Load how many hours you used it on this phone",
      usedDays: (days, duration) => `${countOf(days, "day")} · ${duration}`,
      usedAfterPlain: ". ",
      fitted: "We filled the field to match.",
      underHour: "Under an hour, so the field is left empty.",
      listenMissing:
        "Some days couldn't measure playback with the screen off yet, so it may be missing. ",
    },
    auto: {
      title: "Auto check-in from phone records",
      off: "It's off. Please check in yourself.",
      waiting: (days) =>
        `Starts on its own once ${countOf(days, "day")} of phone records build up.`,
      on: "Checks in on its own from the last 30 days of phone records. Subscriptions not used on this phone and ones where your own count is higher are left as they are.",
      progress: (done, total) => `${done} / ${countOf(total, "day")}`,
      left: (days) => `${countOf(days, "day")} left`,
      status: (on) => `Auto check-in ${on ? "on" : "off"}`,
      statusOff: "Please check in yourself",
      statusWaiting: (days) => `Starts once ${countOf(days, "day")} of phone records build up`,
      statusSoon: (days) => `Starts in ${countOf(days, "day")}`,
      statusOn: "Matches your phone records automatically",
      settings: "Settings",
      turnOn: "Turn on",
      batch: "Check in from phone records",
    },
    suggest: {
      sectionLabel: "Subscriptions found in phone records",
      recent: (days) =>
        Number(days) >= 30 ? "In the last 30 days" : `In the last ${countOf(days, "day")}`,
      killedTitle: (name) => `You cancelled ${name}, but you're using it again`,
      title: (name) => `${name} — are you subscribed?`,
      used: (period, app, duration, days) =>
        `${period}, you used ${app ? `the ${app} app` : "it"} on this phone for ${duration} on ${countOf(days, "day")}.`,
      killedBody: "If you subscribed again, register it anew.",
      newBody: "It's a service you haven't registered.",
      share: "If you split it with family or friends, enter how many when you register.",
      notes: {
        "youtube-premium":
          "If you only pay for YouTube Music (Music Premium), register it as a custom entry.",
        "coupang-wow": "Coupang Play can be watched free with ads even without a Wow membership.",
      },
      whichBundle: "Which bundle do you get it through?",
      resubscribed: "I subscribed again",
      subscribed: "I'm subscribed",
      viaBundle: "I get it in a bundle",
      notPaying: "I don't pay for it",
      notPayingNote: (days) =>
        `“I don't pay for it” covers a family account, free viewing, or not subscribing. We won't ask for ${countOf(days, "day")}.`,
    },
    alerts: {
      sectionLabel: "Subscriptions seen in phone records",
      unusedTitle: (name, days) => `You haven't opened the ${name} app in ${countOf(days, "day")}`,
      unusedReason: (days, amount) =>
        `${amount} will be charged ${Number(days) === 0 ? "today" : `in ${countOf(days, "day")}`}. If you haven't watched on a laptop or tablet either, it's fine to take a break.`,
      priceyTitle: (name, amount) => `${name}, ${amount} per hour`,
      priceyReason: (days, duration, ratio) =>
        `Used only ${duration} in the last ${countOf(days, "day")}. That's ${ratio}× pricier than your other subscriptions.`,
      cancelGuide: "See how to cancel",
      otherDevice: "I watched on another device",
      fine: "It's fine",
      batchTitle: "Check in all at once from phone records",
      batchBody: (count) => `Fill in ${countOf(count, "subscription")} that need a check-in`,
      fillButton: "Fill in",
    },
    access: {
      label: "Connect phone usage history",
      title1: "Fill in check-ins",
      title2: "from phone usage history?",
      body: "Turn on “Usage access” in Android settings and we'll load how much you opened and used your subscribed services' apps.",
      points: [
        {
          title: "Only reads time used, times used, and playback time of subscribed services' apps",
          body: "Playback time is how long a music app showed its playback notification. Other apps' records and screen contents aren't used",
        },
        {
          title: "Calculated only on this phone",
          body: "Not sent to a server or your account. Totals across devices are uploaded only if you turn that on separately in settings",
        },
        {
          title: "Watching on a TV or PC isn't included",
          body: "Once 30 days are recorded, check-ins are filled in automatically. You can turn this off in “My subscriptions”, and you can always check in again to correct the numbers",
        },
        {
          title: "You can turn it off anytime",
          body: "Settings › Usage access › SubSlash",
        },
      ],
      waiting: "Turn on SubSlash in settings and come back.",
      failed: "Couldn't open settings. Turn it on yourself in Settings › Usage access.",
      openSettings: "Turn on in settings",
      later: "I'll enter it myself",
    },
    find: {
      label: "Find in phone usage history",
      accessTitle1: "Find subscriptions",
      accessTitle2: "from phone usage history?",
      accessBody: (names) =>
        `Turn on “Usage access” in Android settings and we'll check how much you used the ${names} apps on this phone to find subscriptions you haven't registered.`,
      covered: (days) => `Found using ${countOf(days, "day")} of records from the last 30 days.`,
      noRecords: "No records read yet.",
      scope: (names) => `We look for ${names}; watching on a TV or PC isn't included.`,
      none: "No unregistered streaming services found",
      fewDays: (days) =>
        `Only ${countOf(days, "day")} of records so far. Use it a few more days and look again.`,
      noneEnough: "You've registered them all, or no app was used for over 1 hour or 3 days.",
    },
  },
};

// 원어민 검토 전의 번역(LOCALE_INFO.beta).
const umPl = (n: number, one: string, many: string) => (Number(n) === 1 ? one : many);

export const zh: Widen<typeof ko> = {
  usageMore: {
    phoneBadge: "手机记录",
    tvTabletMissing: "不包括在电视、电脑或平板上观看的部分。",
    within: (covered) => (Number(covered) < 30 ? `在有记录的 ${covered} 天里` : "在最近 30 天里"),
    hint: {
      notOpened: "这部手机上没有打开过。",
      notOpenedAfter: " 如果在电视、电脑或平板上用过，请在柱条上选择。",
      usedBefore: (within) => `这部手机上，${within}你用了 `,
      usedOpens: (opens, duration) => `${opens} 次 · ${duration}`,
      usedAfter: "。我们已把柱条调到相应位置。",
      notInstalledBar: "这部手机上没有这个服务的应用。如果在其他设备上用过，请在柱条上选择。",
      notInstalledInput: "这部手机上没有这个服务的应用。如果在其他设备上用过，请自行输入。",
      building: "这部手机的使用记录从今天开始积累。明天起就可以自动填入。",
      fill: "用手机使用记录填入",
      fillOpens: "载入这部手机上的使用次数",
      fillDays: "载入这部手机上的使用天数",
      fillHours: "载入这部手机上的使用时长",
      usedDays: (days, duration) => `${days} 天 · ${duration}`,
      usedAfterPlain: "。",
      fitted: "已按此填入。",
      underHour: "不到 1 小时，所以留空。",
      listenMissing: "有些天还无法测量关屏播放，可能有遗漏。",
    },
    auto: {
      title: "用手机记录自动签到",
      off: "已关闭。请自己签到。",
      waiting: (days) => `手机记录积累满 ${days} 天后会自动开始。`,
      on: "用最近 30 天的手机记录自动签到。这部手机上没用过的订阅、以及你自己记的次数更多的订阅保持不变。",
      progress: (done, total) => `${done} / ${total} 天`,
      left: (days) => `还剩 ${days} 天`,
      status: (on) => `自动签到${on ? "已开启" : "已关闭"}`,
      statusOff: "请自己签到",
      statusWaiting: (days) => `手机记录满 ${days} 天后开始`,
      statusSoon: (days) => `${days} 天后开始`,
      statusOn: "自动与手机记录保持一致",
      settings: "设置",
      turnOn: "开启",
      batch: "用手机记录签到",
    },
    suggest: {
      sectionLabel: "在手机记录中发现的订阅",
      recent: (days) => (Number(days) >= 30 ? "最近 30 天" : `最近 ${days} 天`),
      killedTitle: (name) => `你已退订 ${name}，但又在用了`,
      title: (name) => `你在订阅 ${name} 吗？`,
      used: (period, app, duration, days) =>
        `${period}，你在这部手机上${app ? `用 ${app} 应用` : ""}共 ${days} 天、${duration}。`,
      killedBody: "如果重新订阅了，请重新登记。",
      newBody: "这是你还没登记的服务。",
      share: "如果和家人或朋友分摊，登记时请输入人数。",
      notes: {
        "youtube-premium": "如果只付 YouTube Music（Music Premium），请手动输入登记。",
        "coupang-wow": "即使不是 Wow 会员，也可以看广告免费观看 Coupang Play。",
      },
      whichBundle: "是通过哪个组合套餐获得的？",
      resubscribed: "重新订阅了",
      subscribed: "在订阅",
      viaBundle: "通过组合套餐获得",
      notPaying: "不是我付钱",
      notPayingNote: (days) =>
        `“不是我付钱”包括家庭账户、免费观看或没有订阅。${days} 天内不会再问。`,
    },
    alerts: {
      sectionLabel: "在手机记录中看到的订阅",
      unusedTitle: (name, days) => `${days} 天没有打开 ${name} 应用`,
      unusedReason: (days, amount) =>
        `${Number(days) === 0 ? "今天" : `${days} 天后`}将扣款 ${amount}。如果也没在笔记本或平板上看，暂停一下也无妨。`,
      priceyTitle: (name, amount) => `${name} 每小时 ${amount}`,
      priceyReason: (days, duration, ratio) =>
        `最近 ${days} 天只用了 ${duration}，比你其他订阅贵 ${ratio} 倍。`,
      cancelGuide: "查看退订方法",
      otherDevice: "在其他设备上看了",
      fine: "没关系",
      batchTitle: "用手机记录一次签到全部",
      batchBody: (count) => `填入 ${count} 个需要签到的订阅`,
      fillButton: "填入",
    },
    access: {
      label: "连接手机使用记录",
      title1: "用手机使用记录",
      title2: "填入签到吗？",
      body: "在 Android 设置中打开“使用情况访问权限”，我们会载入你打开和使用订阅服务应用的情况。",
      points: [
        {
          title: "只读取订阅服务应用的使用时间、次数和播放时间",
          body: "播放时间是音乐应用显示播放通知的时长。不使用其他应用的记录或屏幕内容",
        },
        {
          title: "只在这部手机上计算",
          body: "不会发送到服务器或账户。只有在设置中另外开启时，才会上传跨设备的合计",
        },
        {
          title: "不包括在电视或电脑上观看的部分",
          body: "记录满 30 天后会自动填入签到。可以在“我的订阅”中关闭，也随时可以重新签到修正数字",
        },
        { title: "随时可以关闭", body: "设置 › 使用情况访问权限 › SubSlash" },
      ],
      waiting: "请在设置中打开 SubSlash 后回来。",
      failed: "无法打开设置。请在 设置 › 使用情况访问权限 中自行打开。",
      openSettings: "在设置中打开",
      later: "我自己输入",
    },
    find: {
      label: "从手机使用记录中查找",
      accessTitle1: "用手机使用记录",
      accessTitle2: "查找订阅吗？",
      accessBody: (names) =>
        `在 Android 设置中打开“使用情况访问权限”，我们会查看这部手机上 ${names} 应用的使用情况，找出你还没登记的订阅。`,
      covered: (days) => `用最近 30 天中 ${days} 天的记录查找。`,
      noRecords: "还没有读取到记录。",
      scope: (names) => `查找的是 ${names}，不包括在电视或电脑上观看的部分。`,
      none: "没有找到未登记的视频服务",
      fewDays: (days) => `目前只有 ${days} 天的记录。再用几天后重新查找吧。`,
      noneEnough: "都已登记，或者没有应用使用超过 1 小时或 3 天。",
    },
  },
};

export const ja: Widen<typeof ko> = {
  usageMore: {
    phoneBadge: "スマホの記録",
    tvTabletMissing: "テレビ・PC・タブレットで見た分は含まれません。",
    within: (covered) => (Number(covered) < 30 ? `記録のある ${covered} 日間に` : "直近 30 日間に"),
    hint: {
      notOpened: "このスマホでは開いていません。",
      notOpenedAfter: " テレビ・PC・タブレットで使ったなら、棒で選んでください。",
      usedBefore: (within) => `このスマホで、${within} `,
      usedOpens: (opens, duration) => `${opens} 回 · ${duration}`,
      usedAfter: " 使いました。それに合わせて棒を設定しました。",
      notInstalledBar:
        "このサービスのアプリはこのスマホにありません。ほかの端末で使ったなら、棒で選んでください。",
      notInstalledInput:
        "このサービスのアプリはこのスマホにありません。ほかの端末で使ったなら、自分で入力してください。",
      building: "このスマホの利用記録は今日からたまります。明日から入れられます。",
      fill: "スマホの利用記録で入れる",
      fillOpens: "このスマホで使った回数を読み込む",
      fillDays: "このスマホで使った日数を読み込む",
      fillHours: "このスマホで使った時間を読み込む",
      usedDays: (days, duration) => `${days} 日 · ${duration}`,
      usedAfterPlain: "。",
      fitted: "それに合わせて入力しました。",
      underHour: "1 時間未満なので空欄にしています。",
      listenMissing: "まだ画面を消した再生を測れない日があり、抜けているかもしれません。",
    },
    auto: {
      title: "スマホの記録で自動チェックイン",
      off: "オフです。ご自身でチェックインしてください。",
      waiting: (days) => `スマホの記録が ${days} 日分たまると自動で始まります。`,
      on: "直近 30 日のスマホの記録で自動的にチェックインします。このスマホで使っていないサブスクや、自分で数えた回数のほうが多いものはそのままです。",
      progress: (done, total) => `${done} / ${total} 日`,
      left: (days) => `あと ${days} 日`,
      status: (on) => `自動チェックイン${on ? "オン" : "オフ"}`,
      statusOff: "ご自身でチェックインしてください",
      statusWaiting: (days) => `スマホの記録が ${days} 日分たまると開始`,
      statusSoon: (days) => `${days} 日後に開始`,
      statusOn: "スマホの記録に自動で合わせます",
      settings: "設定",
      turnOn: "オンにする",
      batch: "スマホの記録でチェックイン",
    },
    suggest: {
      sectionLabel: "スマホの記録で見つけたサブスク",
      recent: (days) => (Number(days) >= 30 ? "直近 30 日" : `直近 ${days} 日`),
      killedTitle: (name) => `${name} を解約しましたが、また使っています`,
      title: (name) => `${name} を契約していますか？`,
      used: (period, app, duration, days) =>
        `${period}、このスマホで${app ? ` ${app} アプリを` : ""} ${days} 日・${duration} 使いました。`,
      killedBody: "また契約したなら、新しく登録してください。",
      newBody: "まだ登録していないサービスです。",
      share: "家族や友人と分け合っているなら、登録時に人数を入れてください。",
      notes: {
        "youtube-premium":
          "YouTube Music（Music Premium）だけを払っているなら、手動入力で登録してください。",
        "coupang-wow": "Coupang Play は Wow 会員でなくても広告付きで無料で見られます。",
      },
      whichBundle: "どのセット商品で受けていますか？",
      resubscribed: "また契約しました",
      subscribed: "契約しています",
      viaBundle: "セット商品で受けています",
      notPaying: "自分は払っていません",
      notPayingNote: (days) =>
        `「自分は払っていません」は家族アカウント・無料視聴・未契約を含みます。${days} 日間は聞きません。`,
    },
    alerts: {
      sectionLabel: "スマホの記録で見えたサブスク",
      unusedTitle: (name, days) => `${days} 日間 ${name} アプリを開いていません`,
      unusedReason: (days, amount) =>
        `${Number(days) === 0 ? "今日" : `${days} 日後に`} ${amount} が請求されます。ノート PC やタブレットでも見ていないなら、ひと休みしても大丈夫です。`,
      priceyTitle: (name, amount) => `${name}、1 時間あたり ${amount}`,
      priceyReason: (days, duration, ratio) =>
        `直近 ${days} 日で ${duration} しか使っていません。ほかのサブスクより ${ratio} 倍割高です。`,
      cancelGuide: "解約方法を見る",
      otherDevice: "ほかの端末で見ました",
      fine: "大丈夫です",
      batchTitle: "スマホの記録でまとめてチェックイン",
      batchBody: (count) => `チェックインが必要なサブスク ${count} 件を入れる`,
      fillButton: "入れる",
    },
    access: {
      label: "スマホの利用記録をつなぐ",
      title1: "スマホの利用記録で",
      title2: "チェックインを入れますか？",
      body: "Android の設定で「使用状況へのアクセス」をオンにすると、契約しているサービスのアプリをどれだけ開いて使ったかを読み込みます。",
      points: [
        {
          title: "契約サービスのアプリの利用時間・回数・再生時間だけを読みます",
          body: "再生時間は音楽アプリが再生通知を出していた時間です。ほかのアプリの記録や画面の内容は使いません",
        },
        {
          title: "このスマホの中だけで計算します",
          body: "サーバーやアカウントには送りません。端末をまたいだ合計は、設定で別にオンにしたときだけアップロードします",
        },
        {
          title: "テレビ・PC で見た分は含まれません",
          body: "30 日分たまるとチェックインが自動で入ります。「マイサブスク」でオフにでき、いつでもチェックインし直して数を直せます",
        },
        { title: "いつでもオフにできます", body: "設定 › 使用状況へのアクセス › SubSlash" },
      ],
      waiting: "設定で SubSlash をオンにしてから戻ってきてください。",
      failed: "設定を開けませんでした。設定 › 使用状況へのアクセス でご自身でオンにしてください。",
      openSettings: "設定でオンにする",
      later: "自分で入力します",
    },
    find: {
      label: "スマホの利用記録で探す",
      accessTitle1: "スマホの利用記録で",
      accessTitle2: "サブスクを探しますか？",
      accessBody: (names) =>
        `Android の設定で「使用状況へのアクセス」をオンにすると、このスマホで ${names} のアプリをどれだけ使ったかを見て、まだ登録していないサブスクを探します。`,
      covered: (days) => `直近 30 日のうち ${days} 日分の記録で探しました。`,
      noRecords: "まだ記録を読み込んでいません。",
      scope: (names) => `${names} を探します。テレビ・PC で見た分は含まれません。`,
      none: "未登録の動画サービスは見つかりませんでした",
      fewDays: (days) =>
        `まだ ${days} 日分の記録しかありません。あと数日使ってからもう一度探してください。`,
      noneEnough: "すべて登録済みか、1 時間以上または 3 日以上使ったアプリがありません。",
    },
  },
};

export const vi: Widen<typeof ko> = {
  usageMore: {
    phoneBadge: "Dữ liệu điện thoại",
    tvTabletMissing: "Không tính phần xem trên TV, PC hay máy tính bảng.",
    within: (covered) =>
      Number(covered) < 30 ? `trong ${covered} ngày có dữ liệu` : "trong 30 ngày gần nhất",
    hint: {
      notOpened: "Chưa mở trên điện thoại này.",
      notOpenedAfter: " Nếu bạn dùng trên TV, PC hay máy tính bảng, hãy chọn trên thanh.",
      usedBefore: (within) => `Trên điện thoại này, ${within} bạn đã dùng `,
      usedOpens: (opens, duration) => `${opens} lần · ${duration}`,
      usedAfter: ". Chúng tôi đã đặt thanh cho khớp.",
      notInstalledBar:
        "Điện thoại này không có ứng dụng của dịch vụ. Nếu bạn dùng trên thiết bị khác, hãy chọn trên thanh.",
      notInstalledInput:
        "Điện thoại này không có ứng dụng của dịch vụ. Nếu bạn dùng trên thiết bị khác, hãy tự nhập.",
      building:
        "Dữ liệu sử dụng của điện thoại này bắt đầu từ hôm nay. Từ mai bạn có thể điền tự động.",
      fill: "Điền từ dữ liệu sử dụng điện thoại",
      fillOpens: "Tải số lần dùng trên điện thoại này",
      fillDays: "Tải số ngày dùng trên điện thoại này",
      fillHours: "Tải số giờ dùng trên điện thoại này",
      usedDays: (days, duration) => `${days} ngày · ${duration}`,
      usedAfterPlain: ". ",
      fitted: "Đã điền cho khớp.",
      underHour: "Dưới 1 giờ nên để trống.",
      listenMissing: "Một số ngày chưa đo được thời gian phát khi tắt màn hình nên có thể thiếu. ",
    },
    auto: {
      title: "Tự động check-in từ dữ liệu điện thoại",
      off: "Đang tắt. Hãy tự check-in.",
      waiting: (days) => `Sẽ tự bắt đầu khi đủ ${days} ngày dữ liệu điện thoại.`,
      on: "Tự check-in từ dữ liệu điện thoại 30 ngày gần nhất. Gói không dùng trên điện thoại này và gói mà số bạn tự đếm cao hơn được giữ nguyên.",
      progress: (done, total) => `${done} / ${total} ngày`,
      left: (days) => `Còn ${days} ngày`,
      status: (on) => `Tự động check-in ${on ? "bật" : "tắt"}`,
      statusOff: "Hãy tự check-in",
      statusWaiting: (days) => `Bắt đầu khi đủ ${days} ngày dữ liệu điện thoại`,
      statusSoon: (days) => `Bắt đầu sau ${days} ngày`,
      statusOn: "Tự khớp với dữ liệu điện thoại",
      settings: "Cài đặt",
      turnOn: "Bật",
      batch: "Check-in từ dữ liệu điện thoại",
    },
    suggest: {
      sectionLabel: "Gói tìm thấy trong dữ liệu điện thoại",
      recent: (days) =>
        Number(days) >= 30 ? "Trong 30 ngày gần nhất" : `Trong ${days} ngày gần nhất`,
      killedTitle: (name) => `Bạn đã hủy ${name} nhưng lại đang dùng`,
      title: (name) => `Bạn có đang đăng ký ${name} không?`,
      used: (period, app, duration, days) =>
        `${period}, bạn đã dùng ${app ? `ứng dụng ${app}` : "nó"} trên điện thoại này ${duration} trong ${days} ngày.`,
      killedBody: "Nếu đã đăng ký lại, hãy thêm mới.",
      newBody: "Đây là dịch vụ bạn chưa thêm.",
      share: "Nếu chia với gia đình hoặc bạn bè, hãy nhập số người khi thêm.",
      notes: {
        "youtube-premium": "Nếu chỉ trả YouTube Music (Music Premium), hãy thêm bằng cách tự nhập.",
        "coupang-wow":
          "Coupang Play có thể xem miễn phí kèm quảng cáo dù không phải thành viên Wow.",
      },
      whichBundle: "Bạn nhận qua gói kết hợp nào?",
      resubscribed: "Tôi đã đăng ký lại",
      subscribed: "Tôi đang đăng ký",
      viaBundle: "Tôi nhận qua gói kết hợp",
      notPaying: "Tôi không trả tiền",
      notPayingNote: (days) =>
        `“Tôi không trả tiền” gồm tài khoản gia đình, xem miễn phí hoặc không đăng ký. Chúng tôi sẽ không hỏi trong ${days} ngày.`,
    },
    alerts: {
      sectionLabel: "Gói thấy trong dữ liệu điện thoại",
      unusedTitle: (name, days) => `Bạn chưa mở ứng dụng ${name} trong ${days} ngày`,
      unusedReason: (days, amount) =>
        `${amount} sẽ bị trừ ${Number(days) === 0 ? "hôm nay" : `sau ${days} ngày`}. Nếu cũng không xem trên laptop hay máy tính bảng, tạm nghỉ cũng không sao.`,
      priceyTitle: (name, amount) => `${name}, ${amount} mỗi giờ`,
      priceyReason: (days, duration, ratio) =>
        `Chỉ dùng ${duration} trong ${days} ngày gần nhất. Đắt gấp ${ratio} lần các gói khác của bạn.`,
      cancelGuide: "Xem cách hủy",
      otherDevice: "Tôi xem trên thiết bị khác",
      fine: "Không sao",
      batchTitle: "Check-in tất cả từ dữ liệu điện thoại",
      batchBody: (count) => `Điền ${count} gói cần check-in`,
      fillButton: "Điền",
    },
    access: {
      label: "Kết nối dữ liệu sử dụng điện thoại",
      title1: "Điền check-in",
      title2: "từ dữ liệu sử dụng điện thoại?",
      body: "Bật “Quyền truy cập dữ liệu sử dụng” trong cài đặt Android, chúng tôi sẽ tải mức bạn mở và dùng ứng dụng của các dịch vụ đã đăng ký.",
      points: [
        {
          title:
            "Chỉ đọc thời gian dùng, số lần dùng và thời gian phát của ứng dụng dịch vụ đã đăng ký",
          body: "Thời gian phát là khoảng ứng dụng nhạc hiện thông báo phát. Không dùng dữ liệu của ứng dụng khác hay nội dung màn hình",
        },
        {
          title: "Chỉ tính trên điện thoại này",
          body: "Không gửi đến máy chủ hay tài khoản. Tổng trên nhiều thiết bị chỉ được tải lên nếu bạn bật riêng trong cài đặt",
        },
        {
          title: "Không tính phần xem trên TV hay PC",
          body: "Khi đủ 30 ngày dữ liệu, check-in được điền tự động. Bạn có thể tắt trong “Gói đăng ký của tôi” và luôn có thể check-in lại để sửa số",
        },
        {
          title: "Có thể tắt bất cứ lúc nào",
          body: "Cài đặt › Quyền truy cập dữ liệu sử dụng › SubSlash",
        },
      ],
      waiting: "Hãy bật SubSlash trong cài đặt rồi quay lại.",
      failed: "Không mở được cài đặt. Hãy tự bật trong Cài đặt › Quyền truy cập dữ liệu sử dụng.",
      openSettings: "Bật trong cài đặt",
      later: "Tôi sẽ tự nhập",
    },
    find: {
      label: "Tìm trong dữ liệu sử dụng điện thoại",
      accessTitle1: "Tìm gói đăng ký",
      accessTitle2: "từ dữ liệu sử dụng điện thoại?",
      accessBody: (names) =>
        `Bật “Quyền truy cập dữ liệu sử dụng” trong cài đặt Android, chúng tôi sẽ xem mức bạn dùng ứng dụng ${names} trên điện thoại này để tìm gói bạn chưa thêm.`,
      covered: (days) => `Tìm bằng ${days} ngày dữ liệu trong 30 ngày gần nhất.`,
      noRecords: "Chưa đọc được dữ liệu nào.",
      scope: (names) => `Chúng tôi tìm ${names}; không tính phần xem trên TV hay PC.`,
      none: "Không tìm thấy dịch vụ video chưa thêm",
      fewDays: (days) => `Mới có ${days} ngày dữ liệu. Hãy dùng thêm vài ngày rồi tìm lại.`,
      noneEnough: "Bạn đã thêm tất cả, hoặc không có ứng dụng nào được dùng quá 1 giờ hay 3 ngày.",
    },
  },
};

export const fr: Widen<typeof ko> = {
  usageMore: {
    phoneBadge: "Données du téléphone",
    tvTabletMissing: "Ce que vous regardez sur TV, PC ou tablette n'est pas inclus.",
    within: (covered) =>
      Number(covered) < 30
        ? `sur les ${covered} jour${umPl(covered, "", "s")} enregistrés`
        : "sur les 30 derniers jours",
    hint: {
      notOpened: "Pas ouvert sur ce téléphone.",
      notOpenedAfter: " Si vous l'avez utilisé sur TV, PC ou tablette, choisissez sur la barre.",
      usedBefore: (within) => `Sur ce téléphone, ${within}, vous l'avez utilisé `,
      usedOpens: (opens, duration) => `${opens} fois · ${duration}`,
      usedAfter: ". Nous avons réglé la barre en conséquence.",
      notInstalledBar:
        "L'application de ce service n'est pas sur ce téléphone. Si vous l'avez utilisée ailleurs, choisissez sur la barre.",
      notInstalledInput:
        "L'application de ce service n'est pas sur ce téléphone. Si vous l'avez utilisée ailleurs, saisissez-le vous-même.",
      building:
        "L'historique de ce téléphone commence aujourd'hui. Vous pourrez remplir ceci dès demain.",
      fill: "Remplir depuis l'historique du téléphone",
      fillOpens: "Charger le nombre d'utilisations sur ce téléphone",
      fillDays: "Charger le nombre de jours d'utilisation sur ce téléphone",
      fillHours: "Charger le nombre d'heures d'utilisation sur ce téléphone",
      usedDays: (days, duration) => `${days} jour${umPl(days, "", "s")} · ${duration}`,
      usedAfterPlain: ". ",
      fitted: "Nous avons rempli le champ en conséquence.",
      underHour: "Moins d'une heure : le champ reste vide.",
      listenMissing:
        "Certains jours ne mesuraient pas encore la lecture écran éteint, il peut manquer des données. ",
    },
    auto: {
      title: "Check-in automatique depuis le téléphone",
      off: "C'est désactivé. Faites le check-in vous-même.",
      waiting: (days) =>
        `Démarre tout seul après ${days} jour${umPl(days, "", "s")} de données du téléphone.`,
      on: "Fait le check-in tout seul à partir des 30 derniers jours de données du téléphone. Les abonnements non utilisés sur ce téléphone et ceux où votre propre compte est plus élevé restent inchangés.",
      progress: (done, total) => `${done} / ${total} jour${umPl(total, "", "s")}`,
      left: (days) => `encore ${days} jour${umPl(days, "", "s")}`,
      status: (on) => `Check-in automatique ${on ? "activé" : "désactivé"}`,
      statusOff: "Faites le check-in vous-même",
      statusWaiting: (days) => `Démarre après ${days} jour${umPl(days, "", "s")} de données`,
      statusSoon: (days) => `Démarre dans ${days} jour${umPl(days, "", "s")}`,
      statusOn: "S'aligne automatiquement sur les données du téléphone",
      settings: "Réglages",
      turnOn: "Activer",
      batch: "Check-in depuis le téléphone",
    },
    suggest: {
      sectionLabel: "Abonnements trouvés dans les données du téléphone",
      recent: (days) =>
        Number(days) >= 30 ? "Sur les 30 derniers jours" : `Sur les ${days} derniers jours`,
      killedTitle: (name) => `Vous avez résilié ${name}, mais vous l'utilisez à nouveau`,
      title: (name) => `${name} : êtes-vous abonné ?`,
      used: (period, app, duration, days) =>
        `${period}, vous avez utilisé ${app ? `l'appli ${app}` : "le service"} sur ce téléphone ${duration} sur ${days} jour${umPl(days, "", "s")}.`,
      killedBody: "Si vous vous êtes réabonné, ajoutez-le à nouveau.",
      newBody: "C'est un service que vous n'avez pas ajouté.",
      share:
        "Si vous le partagez avec la famille ou des amis, indiquez le nombre de personnes à l'ajout.",
      notes: {
        "youtube-premium":
          "Si vous ne payez que YouTube Music (Music Premium), ajoutez-le en saisie manuelle.",
        "coupang-wow":
          "Coupang Play se regarde gratuitement avec publicité, même sans abonnement Wow.",
      },
      whichBundle: "Par quelle offre groupée l'obtenez-vous ?",
      resubscribed: "Je me suis réabonné",
      subscribed: "Je suis abonné",
      viaBundle: "Je l'ai via une offre groupée",
      notPaying: "Je ne paie pas",
      notPayingNote: (days) =>
        `« Je ne paie pas » couvre un compte familial, le visionnage gratuit ou l'absence d'abonnement. Nous ne redemanderons pas pendant ${days} jours.`,
    },
    alerts: {
      sectionLabel: "Abonnements vus dans les données du téléphone",
      unusedTitle: (name, days) =>
        `Vous n'avez pas ouvert l'appli ${name} depuis ${days} jour${umPl(days, "", "s")}`,
      unusedReason: (days, amount) =>
        `${amount} sera débité ${Number(days) === 0 ? "aujourd'hui" : `dans ${days} jour${umPl(days, "", "s")}`}. Si vous ne l'avez pas regardé non plus sur un ordinateur ou une tablette, vous pouvez faire une pause.`,
      priceyTitle: (name, amount) => `${name}, ${amount} par heure`,
      priceyReason: (days, duration, ratio) =>
        `Seulement ${duration} sur les ${days} derniers jours. C'est ${ratio}× plus cher que vos autres abonnements.`,
      cancelGuide: "Voir comment résilier",
      otherDevice: "J'ai regardé sur un autre appareil",
      fine: "Ça va",
      batchTitle: "Tout enregistrer depuis le téléphone",
      batchBody: (count) => `Remplir ${count} abonnement${umPl(count, "", "s")} à enregistrer`,
      fillButton: "Remplir",
    },
    access: {
      label: "Connecter l'historique du téléphone",
      title1: "Remplir les check-ins",
      title2: "depuis l'historique du téléphone ?",
      body: "Activez « Accès aux données d'utilisation » dans les réglages Android et nous chargerons combien vous ouvrez et utilisez les applis de vos services.",
      points: [
        {
          title:
            "Ne lit que le temps, le nombre d'utilisations et le temps de lecture des applis de vos services",
          body: "Le temps de lecture est la durée d'affichage de la notification de lecture d'une appli de musique. Les données des autres applis et le contenu de l'écran ne sont pas utilisés",
        },
        {
          title: "Calculé uniquement sur ce téléphone",
          body: "Rien n'est envoyé à un serveur ni à votre compte. Les totaux multi-appareils ne sont envoyés que si vous l'activez séparément dans les réglages",
        },
        {
          title: "La TV et le PC ne sont pas inclus",
          body: "Après 30 jours de données, les check-ins se remplissent automatiquement. Vous pouvez désactiver cela dans « Mes abonnements » et refaire un check-in à tout moment pour corriger",
        },
        {
          title: "Désactivable à tout moment",
          body: "Réglages › Accès aux données d'utilisation › SubSlash",
        },
      ],
      waiting: "Activez SubSlash dans les réglages, puis revenez.",
      failed:
        "Impossible d'ouvrir les réglages. Activez-le vous-même dans Réglages › Accès aux données d'utilisation.",
      openSettings: "Activer dans les réglages",
      later: "Je le saisirai moi-même",
    },
    find: {
      label: "Trouver dans l'historique du téléphone",
      accessTitle1: "Trouver des abonnements",
      accessTitle2: "dans l'historique du téléphone ?",
      accessBody: (names) =>
        `Activez « Accès aux données d'utilisation » dans les réglages Android et nous vérifierons votre usage des applis ${names} sur ce téléphone pour trouver les abonnements non ajoutés.`,
      covered: (days) =>
        `Recherche faite avec ${days} jour${umPl(days, "", "s")} de données sur les 30 derniers.`,
      noRecords: "Aucune donnée lue pour l'instant.",
      scope: (names) => `Nous cherchons ${names} ; la TV et le PC ne sont pas inclus.`,
      none: "Aucun service de streaming non ajouté trouvé",
      fewDays: (days) =>
        `Seulement ${days} jour${umPl(days, "", "s")} de données pour l'instant. Réessayez dans quelques jours.`,
      noneEnough:
        "Vous les avez tous ajoutés, ou aucune appli n'a été utilisée plus d'1 heure ou 3 jours.",
    },
  },
};

export const es: Widen<typeof ko> = {
  usageMore: {
    phoneBadge: "Registro del móvil",
    tvTabletMissing: "No incluye lo que veas en TV, PC o tableta.",
    within: (covered) =>
      Number(covered) < 30
        ? `en los ${covered} día${umPl(covered, "", "s")} registrados`
        : "en los últimos 30 días",
    hint: {
      notOpened: "No se abrió en este móvil.",
      notOpenedAfter: " Si la usaste en TV, PC o tableta, elige en la barra.",
      usedBefore: (within) => `En este móvil, ${within}, la usaste `,
      usedOpens: (opens, duration) => `${opens} ${umPl(opens, "vez", "veces")} · ${duration}`,
      usedAfter: ". Ajustamos la barra en consecuencia.",
      notInstalledBar:
        "La app de este servicio no está en este móvil. Si la usaste en otro dispositivo, elige en la barra.",
      notInstalledInput:
        "La app de este servicio no está en este móvil. Si la usaste en otro dispositivo, escríbelo tú.",
      building: "El historial de uso de este móvil empieza hoy. Podrás rellenarlo desde mañana.",
      fill: "Rellenar con el historial del móvil",
      fillOpens: "Cargar cuántas veces la usaste en este móvil",
      fillDays: "Cargar cuántos días la usaste en este móvil",
      fillHours: "Cargar cuántas horas la usaste en este móvil",
      usedDays: (days, duration) => `${days} día${umPl(days, "", "s")} · ${duration}`,
      usedAfterPlain: ". ",
      fitted: "Rellenamos el campo en consecuencia.",
      underHour: "Menos de una hora, así que el campo queda vacío.",
      listenMissing:
        "Algunos días aún no medían la reproducción con la pantalla apagada, así que puede faltar. ",
    },
    auto: {
      title: "Registro automático con el móvil",
      off: "Está desactivado. Registra tú el uso.",
      waiting: (days) =>
        `Empieza solo cuando haya ${days} día${umPl(days, "", "s")} de registros del móvil.`,
      on: "Registra solo a partir de los últimos 30 días del móvil. Las suscripciones que no usaste en este móvil y aquellas en las que tu propio recuento es mayor se quedan como están.",
      progress: (done, total) => `${done} / ${total} día${umPl(total, "", "s")}`,
      left: (days) => `faltan ${days} día${umPl(days, "", "s")}`,
      status: (on) => `Registro automático ${on ? "activado" : "desactivado"}`,
      statusOff: "Registra tú el uso",
      statusWaiting: (days) =>
        `Empieza con ${days} día${umPl(days, "", "s")} de registros del móvil`,
      statusSoon: (days) => `Empieza en ${days} día${umPl(days, "", "s")}`,
      statusOn: "Se ajusta solo a los registros del móvil",
      settings: "Ajustes",
      turnOn: "Activar",
      batch: "Registrar con el móvil",
    },
    suggest: {
      sectionLabel: "Suscripciones encontradas en el móvil",
      recent: (days) =>
        Number(days) >= 30 ? "En los últimos 30 días" : `En los últimos ${days} días`,
      killedTitle: (name) => `Cancelaste ${name}, pero la vuelves a usar`,
      title: (name) => `${name}: ¿estás suscrito?`,
      used: (period, app, duration, days) =>
        `${period}, usaste ${app ? `la app ${app}` : "el servicio"} en este móvil durante ${duration} en ${days} día${umPl(days, "", "s")}.`,
      killedBody: "Si te volviste a suscribir, añádela de nuevo.",
      newBody: "Es un servicio que no has añadido.",
      share: "Si la compartes con familia o amigos, indica cuántos sois al añadirla.",
      notes: {
        "youtube-premium": "Si solo pagas YouTube Music (Music Premium), añádelo escribiéndolo.",
        "coupang-wow": "Coupang Play se puede ver gratis con anuncios aunque no seas miembro Wow.",
      },
      whichBundle: "¿Con qué paquete la tienes?",
      resubscribed: "Me volví a suscribir",
      subscribed: "Estoy suscrito",
      viaBundle: "La tengo en un paquete",
      notPaying: "No la pago yo",
      notPayingNote: (days) =>
        `«No la pago yo» incluye cuenta familiar, ver gratis o no estar suscrito. No volveremos a preguntar en ${days} días.`,
    },
    alerts: {
      sectionLabel: "Suscripciones vistas en el móvil",
      unusedTitle: (name, days) =>
        `No abres la app de ${name} desde hace ${days} día${umPl(days, "", "s")}`,
      unusedReason: (days, amount) =>
        `Se cobrarán ${amount} ${Number(days) === 0 ? "hoy" : `en ${days} día${umPl(days, "", "s")}`}. Si tampoco la viste en un portátil o tableta, puedes tomarte un descanso.`,
      priceyTitle: (name, amount) => `${name}, ${amount} por hora`,
      priceyReason: (days, duration, ratio) =>
        `Solo ${duration} de uso en los últimos ${days} días. Es ${ratio}× más cara que tus otras suscripciones.`,
      cancelGuide: "Ver cómo cancelar",
      otherDevice: "La vi en otro dispositivo",
      fine: "Está bien",
      batchTitle: "Registrar todo con el móvil",
      batchBody: (count) => `Rellenar ${count} suscripci${umPl(count, "ón", "ones")} por registrar`,
      fillButton: "Rellenar",
    },
    access: {
      label: "Conectar el historial de uso del móvil",
      title1: "¿Rellenar los registros",
      title2: "con el historial del móvil?",
      body: "Activa «Acceso a datos de uso» en los ajustes de Android y cargaremos cuánto abriste y usaste las apps de tus servicios.",
      points: [
        {
          title:
            "Solo lee el tiempo, las veces y el tiempo de reproducción de las apps de tus servicios",
          body: "El tiempo de reproducción es cuánto mostró una app de música su notificación de reproducción. No se usan los datos de otras apps ni el contenido de la pantalla",
        },
        {
          title: "Se calcula solo en este móvil",
          body: "No se envía a un servidor ni a tu cuenta. Los totales entre dispositivos solo se suben si lo activas aparte en los ajustes",
        },
        {
          title: "No incluye la TV ni el PC",
          body: "Con 30 días registrados, los registros se rellenan solos. Puedes desactivarlo en «Mis suscripciones» y siempre puedes volver a registrar para corregir",
        },
        {
          title: "Puedes desactivarlo cuando quieras",
          body: "Ajustes › Acceso a datos de uso › SubSlash",
        },
      ],
      waiting: "Activa SubSlash en los ajustes y vuelve.",
      failed: "No se pudieron abrir los ajustes. Actívalo tú en Ajustes › Acceso a datos de uso.",
      openSettings: "Activar en ajustes",
      later: "Lo escribiré yo",
    },
    find: {
      label: "Buscar en el historial del móvil",
      accessTitle1: "¿Buscar suscripciones",
      accessTitle2: "con el historial del móvil?",
      accessBody: (names) =>
        `Activa «Acceso a datos de uso» en los ajustes de Android y revisaremos cuánto usaste las apps de ${names} en este móvil para encontrar suscripciones que no hayas añadido.`,
      covered: (days) =>
        `Búsqueda con ${days} día${umPl(days, "", "s")} de registros de los últimos 30.`,
      noRecords: "Aún no se ha leído ningún registro.",
      scope: (names) => `Buscamos ${names}; no incluye la TV ni el PC.`,
      none: "No se encontraron servicios de streaming sin añadir",
      fewDays: (days) =>
        `Solo hay ${days} día${umPl(days, "", "s")} de registros por ahora. Úsalo unos días más y vuelve a buscar.`,
      noneEnough: "Ya los añadiste todos, o ninguna app se usó más de 1 hora o 3 días.",
    },
  },
};

export const de: Widen<typeof ko> = {
  usageMore: {
    phoneBadge: "Handydaten",
    tvTabletMissing: "Was du auf TV, PC oder Tablet schaust, ist nicht enthalten.",
    within: (covered) =>
      Number(covered) < 30
        ? `in den ${covered} erfassten ${umPl(covered, "Tag", "Tagen")}`
        : "in den letzten 30 Tagen",
    hint: {
      notOpened: "Auf diesem Handy nicht geöffnet.",
      notOpenedAfter: " Wenn du es auf TV, PC oder Tablet genutzt hast, wähl es auf dem Balken.",
      usedBefore: (within) => `Auf diesem Handy hast du es ${within} genutzt: `,
      usedOpens: (opens, duration) => `${opens}-mal · ${duration}`,
      usedAfter: ". Wir haben den Balken passend eingestellt.",
      notInstalledBar:
        "Die App dieses Dienstes ist nicht auf diesem Handy. Wenn du es auf einem anderen Gerät genutzt hast, wähl es auf dem Balken.",
      notInstalledInput:
        "Die App dieses Dienstes ist nicht auf diesem Handy. Wenn du es auf einem anderen Gerät genutzt hast, gib es selbst ein.",
      building:
        "Der Nutzungsverlauf dieses Handys beginnt heute. Ab morgen kannst du das ausfüllen.",
      fill: "Aus dem Handyverlauf ausfüllen",
      fillOpens: "Nutzungsanzahl auf diesem Handy laden",
      fillDays: "Nutzungstage auf diesem Handy laden",
      fillHours: "Nutzungsstunden auf diesem Handy laden",
      usedDays: (days, duration) => `${days} ${umPl(days, "Tag", "Tage")} · ${duration}`,
      usedAfterPlain: ". ",
      fitted: "Wir haben das Feld passend ausgefüllt.",
      underHour: "Unter einer Stunde, daher bleibt das Feld leer.",
      listenMissing:
        "An manchen Tagen ließ sich die Wiedergabe bei ausgeschaltetem Bildschirm noch nicht messen, daher kann etwas fehlen. ",
    },
    auto: {
      title: "Automatisch eintragen aus Handydaten",
      off: "Ist aus. Bitte trag selbst ein.",
      waiting: (days) =>
        `Startet von selbst, sobald ${days} ${umPl(days, "Tag", "Tage")} Handydaten vorliegen.`,
      on: "Trägt automatisch aus den Handydaten der letzten 30 Tage ein. Abos, die auf diesem Handy nicht genutzt wurden, und solche mit höherer eigener Zählung bleiben, wie sie sind.",
      progress: (done, total) => `${done} / ${total} ${umPl(total, "Tag", "Tage")}`,
      left: (days) => `noch ${days} ${umPl(days, "Tag", "Tage")}`,
      status: (on) => `Automatisches Eintragen ${on ? "an" : "aus"}`,
      statusOff: "Bitte trag selbst ein",
      statusWaiting: (days) => `Startet bei ${days} ${umPl(days, "Tag", "Tagen")} Handydaten`,
      statusSoon: (days) => `Startet in ${days} ${umPl(days, "Tag", "Tagen")}`,
      statusOn: "Gleicht sich automatisch mit den Handydaten ab",
      settings: "Einstellungen",
      turnOn: "Einschalten",
      batch: "Aus Handydaten eintragen",
    },
    suggest: {
      sectionLabel: "In den Handydaten gefundene Abos",
      recent: (days) =>
        Number(days) >= 30 ? "In den letzten 30 Tagen" : `In den letzten ${days} Tagen`,
      killedTitle: (name) => `Du hast ${name} gekündigt, nutzt es aber wieder`,
      title: (name) => `${name} — hast du das abonniert?`,
      used: (period, app, duration, days) =>
        `${period} hast du ${app ? `die App ${app}` : "es"} auf diesem Handy an ${days} ${umPl(days, "Tag", "Tagen")} ${duration} lang genutzt.`,
      killedBody: "Wenn du es wieder abonniert hast, trag es neu ein.",
      newBody: "Diesen Dienst hast du noch nicht eingetragen.",
      share: "Wenn du es mit Familie oder Freunden teilst, gib beim Eintragen die Anzahl an.",
      notes: {
        "youtube-premium": "Wenn du nur YouTube Music (Music Premium) zahlst, trag es manuell ein.",
        "coupang-wow":
          "Coupang Play kann man auch ohne Wow-Mitgliedschaft kostenlos mit Werbung schauen.",
      },
      whichBundle: "Über welches Paket bekommst du es?",
      resubscribed: "Ich habe es wieder abonniert",
      subscribed: "Ich habe es abonniert",
      viaBundle: "Ich bekomme es über ein Paket",
      notPaying: "Ich zahle nicht dafür",
      notPayingNote: (days) =>
        `„Ich zahle nicht dafür“ umfasst Familienkonto, kostenloses Schauen oder kein Abo. Wir fragen ${days} Tage lang nicht mehr.`,
    },
    alerts: {
      sectionLabel: "In den Handydaten gesehene Abos",
      unusedTitle: (name, days) =>
        `Du hast die App ${name} seit ${days} ${umPl(days, "Tag", "Tagen")} nicht geöffnet`,
      unusedReason: (days, amount) =>
        `${amount} werden ${Number(days) === 0 ? "heute" : `in ${days} ${umPl(days, "Tag", "Tagen")}`} abgebucht. Wenn du auch nicht am Laptop oder Tablet geschaut hast, kannst du ruhig pausieren.`,
      priceyTitle: (name, amount) => `${name}, ${amount} pro Stunde`,
      priceyReason: (days, duration, ratio) =>
        `In den letzten ${days} Tagen nur ${duration} genutzt. Das ist ${ratio}-mal teurer als deine anderen Abos.`,
      cancelGuide: "So kündigst du",
      otherDevice: "Ich habe auf einem anderen Gerät geschaut",
      fine: "Passt schon",
      batchTitle: "Alles auf einmal aus Handydaten eintragen",
      batchBody: (count) =>
        `${count} ${umPl(count, "Abo", "Abos")} mit fehlendem Eintrag ausfüllen`,
      fillButton: "Ausfüllen",
    },
    access: {
      label: "Handynutzung verbinden",
      title1: "Einträge aus",
      title2: "dem Handyverlauf ausfüllen?",
      body: "Schalte in den Android-Einstellungen „Zugriff auf Nutzungsdaten“ ein, dann laden wir, wie oft und wie lange du die Apps deiner abonnierten Dienste genutzt hast.",
      points: [
        {
          title:
            "Liest nur Nutzungszeit, Nutzungsanzahl und Wiedergabezeit der Apps deiner Dienste",
          body: "Wiedergabezeit ist, wie lange eine Musik-App ihre Wiedergabe-Benachrichtigung zeigte. Daten anderer Apps und Bildschirminhalte werden nicht genutzt",
        },
        {
          title: "Nur auf diesem Handy berechnet",
          body: "Nichts geht an einen Server oder dein Konto. Geräteübergreifende Summen werden nur hochgeladen, wenn du das in den Einstellungen separat einschaltest",
        },
        {
          title: "TV und PC sind nicht enthalten",
          body: "Nach 30 erfassten Tagen werden Einträge automatisch ausgefüllt. Du kannst das unter „Meine Abos“ ausschalten und jederzeit neu eintragen, um Zahlen zu korrigieren",
        },
        {
          title: "Jederzeit ausschaltbar",
          body: "Einstellungen › Zugriff auf Nutzungsdaten › SubSlash",
        },
      ],
      waiting: "Schalte SubSlash in den Einstellungen ein und komm zurück.",
      failed:
        "Die Einstellungen ließen sich nicht öffnen. Schalte es selbst unter Einstellungen › Zugriff auf Nutzungsdaten ein.",
      openSettings: "In den Einstellungen einschalten",
      later: "Ich trage es selbst ein",
    },
    find: {
      label: "Im Handyverlauf suchen",
      accessTitle1: "Abos im",
      accessTitle2: "Handyverlauf finden?",
      accessBody: (names) =>
        `Schalte in den Android-Einstellungen „Zugriff auf Nutzungsdaten“ ein, dann prüfen wir, wie viel du die Apps ${names} auf diesem Handy genutzt hast, um nicht eingetragene Abos zu finden.`,
      covered: (days) =>
        `Gesucht mit ${days} ${umPl(days, "Tag", "Tagen")} Daten aus den letzten 30.`,
      noRecords: "Noch keine Daten gelesen.",
      scope: (names) => `Wir suchen nach ${names}; TV und PC sind nicht enthalten.`,
      none: "Keine nicht eingetragenen Streaming-Dienste gefunden",
      fewDays: (days) =>
        `Bisher erst ${days} ${umPl(days, "Tag", "Tage")} Daten. Nutz es noch ein paar Tage und such dann erneut.`,
      noneEnough:
        "Du hast alle eingetragen, oder keine App wurde länger als 1 Stunde oder an 3 Tagen genutzt.",
    },
  },
};

export const pt: Widen<typeof ko> = {
  usageMore: {
    phoneBadge: "Registro do celular",
    tvTabletMissing: "Não inclui o que você assiste na TV, no PC ou no tablet.",
    within: (covered) =>
      Number(covered) < 30
        ? `nos ${covered} dia${umPl(covered, "", "s")} registrados`
        : "nos últimos 30 dias",
    hint: {
      notOpened: "Não foi aberto neste celular.",
      notOpenedAfter: " Se você usou na TV, no PC ou no tablet, escolha na barra.",
      usedBefore: (within) => `Neste celular, ${within}, você usou `,
      usedOpens: (opens, duration) => `${opens} ${umPl(opens, "vez", "vezes")} · ${duration}`,
      usedAfter: ". Ajustamos a barra de acordo.",
      notInstalledBar:
        "O app deste serviço não está neste celular. Se você usou em outro dispositivo, escolha na barra.",
      notInstalledInput:
        "O app deste serviço não está neste celular. Se você usou em outro dispositivo, informe você mesmo.",
      building:
        "O histórico de uso deste celular começa hoje. A partir de amanhã dá para preencher.",
      fill: "Preencher com o histórico do celular",
      fillOpens: "Carregar quantas vezes você usou neste celular",
      fillDays: "Carregar quantos dias você usou neste celular",
      fillHours: "Carregar quantas horas você usou neste celular",
      usedDays: (days, duration) => `${days} dia${umPl(days, "", "s")} · ${duration}`,
      usedAfterPlain: ". ",
      fitted: "Preenchemos o campo de acordo.",
      underHour: "Menos de uma hora, então o campo fica vazio.",
      listenMissing:
        "Alguns dias ainda não mediam a reprodução com a tela desligada, então pode faltar algo. ",
    },
    auto: {
      title: "Registro automático pelo celular",
      off: "Está desligado. Registre você mesmo.",
      waiting: (days) =>
        `Começa sozinho quando houver ${days} dia${umPl(days, "", "s")} de registros do celular.`,
      on: "Registra sozinho a partir dos últimos 30 dias do celular. Assinaturas não usadas neste celular e aquelas em que sua própria contagem é maior ficam como estão.",
      progress: (done, total) => `${done} / ${total} dia${umPl(total, "", "s")}`,
      left: (days) => `faltam ${days} dia${umPl(days, "", "s")}`,
      status: (on) => `Registro automático ${on ? "ligado" : "desligado"}`,
      statusOff: "Registre você mesmo",
      statusWaiting: (days) =>
        `Começa com ${days} dia${umPl(days, "", "s")} de registros do celular`,
      statusSoon: (days) => `Começa em ${days} dia${umPl(days, "", "s")}`,
      statusOn: "Acompanha os registros do celular automaticamente",
      settings: "Configurações",
      turnOn: "Ligar",
      batch: "Registrar pelo celular",
    },
    suggest: {
      sectionLabel: "Assinaturas encontradas no celular",
      recent: (days) => (Number(days) >= 30 ? "Nos últimos 30 dias" : `Nos últimos ${days} dias`),
      killedTitle: (name) => `Você cancelou ${name}, mas está usando de novo`,
      title: (name) => `${name}: você assina?`,
      used: (period, app, duration, days) =>
        `${period}, você usou ${app ? `o app ${app}` : "o serviço"} neste celular por ${duration} em ${days} dia${umPl(days, "", "s")}.`,
      killedBody: "Se assinou de novo, cadastre outra vez.",
      newBody: "É um serviço que você não cadastrou.",
      share: "Se você divide com família ou amigos, informe quantas pessoas ao cadastrar.",
      notes: {
        "youtube-premium": "Se você paga só o YouTube Music (Music Premium), cadastre digitando.",
        "coupang-wow":
          "O Coupang Play pode ser assistido de graça com anúncios mesmo sem ser membro Wow.",
      },
      whichBundle: "Por qual pacote você recebe?",
      resubscribed: "Assinei de novo",
      subscribed: "Eu assino",
      viaBundle: "Recebo num pacote",
      notPaying: "Não sou eu que pago",
      notPayingNote: (days) =>
        `“Não sou eu que pago” inclui conta familiar, assistir de graça ou não assinar. Não vamos perguntar por ${days} dias.`,
    },
    alerts: {
      sectionLabel: "Assinaturas vistas no celular",
      unusedTitle: (name, days) =>
        `Você não abre o app ${name} há ${days} dia${umPl(days, "", "s")}`,
      unusedReason: (days, amount) =>
        `${amount} será cobrado ${Number(days) === 0 ? "hoje" : `em ${days} dia${umPl(days, "", "s")}`}. Se também não assistiu no notebook ou tablet, tudo bem dar uma pausa.`,
      priceyTitle: (name, amount) => `${name}, ${amount} por hora`,
      priceyReason: (days, duration, ratio) =>
        `Só ${duration} de uso nos últimos ${days} dias. É ${ratio}× mais caro que suas outras assinaturas.`,
      cancelGuide: "Ver como cancelar",
      otherDevice: "Assisti em outro dispositivo",
      fine: "Tudo bem",
      batchTitle: "Registrar tudo pelo celular",
      batchBody: (count) => `Preencher ${count} assinatura${umPl(count, "", "s")} sem registro`,
      fillButton: "Preencher",
    },
    access: {
      label: "Conectar histórico de uso do celular",
      title1: "Preencher os registros",
      title2: "pelo histórico do celular?",
      body: "Ative “Acesso aos dados de uso” nas configurações do Android e carregaremos quanto você abriu e usou os apps dos serviços assinados.",
      points: [
        {
          title: "Só lê o tempo, as vezes e o tempo de reprodução dos apps dos seus serviços",
          body: "O tempo de reprodução é quanto um app de música mostrou a notificação de reprodução. Dados de outros apps e o conteúdo da tela não são usados",
        },
        {
          title: "Calculado só neste celular",
          body: "Nada vai para servidor ou conta. Totais entre dispositivos só são enviados se você ligar isso separadamente nas configurações",
        },
        {
          title: "TV e PC não entram",
          body: "Com 30 dias registrados, os registros são preenchidos sozinhos. Dá para desligar em “Minhas assinaturas” e sempre registrar de novo para corrigir",
        },
        {
          title: "Dá para desligar quando quiser",
          body: "Configurações › Acesso aos dados de uso › SubSlash",
        },
      ],
      waiting: "Ative o SubSlash nas configurações e volte.",
      failed:
        "Não foi possível abrir as configurações. Ative você mesmo em Configurações › Acesso aos dados de uso.",
      openSettings: "Ativar nas configurações",
      later: "Vou informar eu mesmo",
    },
    find: {
      label: "Buscar no histórico do celular",
      accessTitle1: "Encontrar assinaturas",
      accessTitle2: "pelo histórico do celular?",
      accessBody: (names) =>
        `Ative “Acesso aos dados de uso” nas configurações do Android e veremos quanto você usou os apps ${names} neste celular para encontrar assinaturas não cadastradas.`,
      covered: (days) =>
        `Busca feita com ${days} dia${umPl(days, "", "s")} de registros dos últimos 30.`,
      noRecords: "Nenhum registro lido ainda.",
      scope: (names) => `Procuramos ${names}; TV e PC não entram.`,
      none: "Nenhum serviço de streaming não cadastrado encontrado",
      fewDays: (days) =>
        `Só há ${days} dia${umPl(days, "", "s")} de registros por enquanto. Use mais alguns dias e procure de novo.`,
      noneEnough: "Você cadastrou todos, ou nenhum app foi usado por mais de 1 hora ou 3 dias.",
    },
  },
};
