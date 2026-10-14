import { AGE_BAND_LABELS } from "../../stats";
import type { Widen } from "../types";
import { monthLong, pluralOf } from "../english";
import { monthName } from "../months";

/**
 * 구독 리포트(/report). 영수증 화면과 '리포트에 물어보기'의 답은 서버·기록에서 문장을 만드는 별도 영역이라
 * 여기에 없다.
 */
export const ko = {
  reportPage: {
    title: "구독 리포트",
    subtitle: "지금 내는 돈과, 제값을 하는지 한눈에.",
    emptyTitle: "아직 등록한 구독이 없어요",
    emptyHint: "구독을 등록하면 여기서 정리해 드려요.",
    register: "구독 등록하러 가기",
    peerSoon: "다른 사용자와의 비교는 준비 중이에요.",
    receipts: {
      label: "구독 영수증",
      month: (month: number) => `${month}월 영수증`,
      year: (year: number) => `${year}년 결산 영수증`,
    },
    summary: {
      label: "지출 요약",
      month: "한 달",
      year: "1년이면",
      subs: "구독",
      count: (count: number) => `${count}개`,
    },
    overlap: {
      label: "결합 상품과 겹치는 구독",
      title: "두 번 내고 있을 수 있어요",
      middle: (services: string) => `에 ${services}이(가) 들어 있는데 `,
      after: "도 따로 구독 중이에요. 다른 계정으로 쓰는 게 아니라면 한 쪽을 해지해도 돼요.",
    },
    ranking: {
      title: "1회 단가 순위",
      monthly: (amount: string) => `한 달 ${amount}`,
      used: (count: number) => ` · ${count}번 사용`,
      beforeCheckIn: "체크인 전",
      unused: "안 썼어요",
      perUse: "1회",
      note: "‘체크인 전’인 구독은 대시보드에서 이번 달 사용 횟수를 알려 주면 1회 단가가 나와요.",
    },
    other: {
      title: "횟수 말고 다른 기준으로 재는 구독",
      note: "음악은 들은 시간, AI·업무 도구는 쓴 날, 멤버십은 받은 혜택, 저장 공간은 쓰는 용량으로 봐요.",
    },
    age: {
      pickNote: "내 연령대를 고르면 같은 연령대와 비교해요.",
      myBand: "내 연령대",
      labels: AGE_BAND_LABELS,
      caption: "연령대별 한 달 구독 지출(보통)",
      notEnough: (participants: number, min: number) =>
        `${participants}명 참여 · ${min}명이 모이면 보여 드려요`,
      me: "나",
      tooFew: (band: string, participants: number) =>
        `${band}는 아직 ${participants}명이라 비교할 수 없어요.`,
      more: (band: string, diff: string, year: string) =>
        `${band} 보통보다 한 달 ${diff} 더 내요. 1년이면 ${year}.`,
      less: (band: string, diff: string) => `${band} 보통보다 한 달 ${diff} 덜 내요.`,
      same: (band: string) => `${band} 보통과 같아요.`,
    },
    peer: {
      title: "다른 사용자와 비교",
      sample: "가상 사용자와 비교한 미리보기예요.",
      real: "참여한 사용자의 익명 통계예요.",
      whatDoWeCollect: "무엇을 모으나요?",
      sampleCount: (count: number) => `가상 ${count}명`,
      realCount: (count: number) => `${count}명 참여`,
      sampleNote: (count: number) =>
        `테스트 빌드용 가상 데이터예요. 실제 사용자가 아니라, 자주 쓰는 구독을 조합해 만든 가상 사용자 ${count}명으로 비교 화면을 보여 드려요.`,
      loadFailed: "비교 통계를 불러오지 못했어요.",
      leaveFailed: "참여를 그만두지 못했어요. 잠시 뒤에 다시 시도해 주세요.",
      typicalBefore: "참여자의 한 달 구독 지출은 보통 ",
      typicalMid: " · 나는 ",
      barMore: (diff: string, year: string) => `보통보다 한 달 ${diff} 더 내요. 1년이면 ${year}.`,
      barLess: (diff: string) => `보통보다 한 달 ${diff} 덜 내요.`,
      barSame: "보통과 같아요.",
      gathering: (min: number, participants: number) =>
        `${min}명이 모이면 비교를 보여 드려요. 지금 ${participants}명이 참여했어요.`,
      typicalAmount: (amount: string) => `보통 ${amount}`,
      typicalUses: (count: number) => `보통 ${count}번`,
      meAmount: (amount: string) => `나 ${amount}`,
      meBeforeCheckIn: "나 체크인 전",
      meUses: (count: number) => `나 ${count}번`,
      contributing: "내 구독 요약을 익명으로 보태는 중이에요.",
      leave: "그만두기",
      signedOutBefore: "로그인하지 않은 동안은 보태지 않아요. ",
      login: "로그인",
      signedOutAfter: "하면 다시 보태요.",
      joinNote: "서비스·금액·사용 횟수만 이름 없이 보태요. 언제든 그만두면 바로 지워져요.",
      join: "익명으로 참여하기",
      loginInviteAfter:
        "하면 서비스·금액·사용 횟수만 이름 없이 보탤 수 있어요. 계정과 묶어 저장하지는 않아요.",
    },
    ask: {
      label: "리포트에 물어보기",
      title: "리포트에 물어보기",
      unavailable: "지금은 답할 수 없어요.",
      goHelp: "도움말에서 찾아보기",
      source: (source: string) => `계산: ${source} · 숫자는 이 기기에서 계산했어요`,
      placeholder: "직접 물어보기",
      inputLabel: "리포트에 물어볼 질문",
      send: "묻기",
      newChat: "새로 묻기",
      followupPlaceholder: "이어서 물어보기 (예: 그럼 1년이면?)",
      contextNote:
        "이어서 물으면 같은 대화의 앞선 질문 3개까지 함께 보내 꼬리 질문을 알아들어요. 답과 숫자는 보내지 않아요.",
      youAsked: "물어본 질문",
      privacy:
        "질문 문장만 AI로 보내요. 내 구독 목록과 금액은 보내지 않아요. 이름·연락처 같은 개인정보는 적지 마세요.",
      privacyLocal: "질문은 이 기기에서만 알아듣고 계산해요. 서버나 AI로 보내지 않아요.",
      localMiss:
        "이 질문은 아직 알아듣지 못해요. 아래 질문 버튼을 눌러 보거나, '한 달 구독료 얼마야?'처럼 물어봐 주세요.",
    },
  },
};

export const en: Widen<typeof ko> = {
  reportPage: {
    title: "Subscription report",
    subtitle: "What you pay now, and whether it's worth it, at a glance.",
    emptyTitle: "No subscriptions yet",
    emptyHint: "Add a subscription and we'll sum it up here.",
    register: "Add a subscription",
    peerSoon: "Comparison with other users is coming soon.",
    receipts: {
      label: "Subscription receipts",
      month: (month) => `${monthLong(month)} receipt`,
      year: (year) => `${year} year-end receipt`,
    },
    summary: {
      label: "Spending summary",
      month: "A month",
      year: "In a year",
      subs: "Subscriptions",
      count: (count) => String(count),
    },
    overlap: {
      label: "Subscriptions that overlap with a bundle",
      title: "You may be paying twice",
      middle: (services) => ` includes ${services}, but you also subscribe to `,
      after: " separately. Unless it's a different account, you can cancel one of them.",
    },
    ranking: {
      title: "Cost per use ranking",
      monthly: (amount) => `${amount} a month`,
      used: (count) => ` · used ${count} ${pluralOf(count, "time", "times")}`,
      beforeCheckIn: "No check-in yet",
      unused: "Not used",
      perUse: "per use",
      note: "For subscriptions with “No check-in yet”, tell us this month's usage on the dashboard and the cost per use appears.",
    },
    other: {
      title: "Subscriptions measured another way",
      note: "Music is measured by hours listened, AI and work tools by days used, memberships by benefits received, and storage by space used.",
    },
    age: {
      pickNote: "Pick your age group to compare with the same group.",
      myBand: "My age group",
      labels: {
        "10s": "Teens",
        "20s": "20s",
        "30s": "30s",
        "40s": "40s",
        "50s": "50s",
        "60s+": "60 and over",
      },
      caption: "Typical monthly subscription spending by age group",
      notEnough: (participants, min) => `${participants} joined · shown once ${min} have joined`,
      me: "Me",
      tooFew: (band, participants) =>
        `Only ${participants} ${pluralOf(participants, "person", "people")} in ${band} so far, so it can't be compared.`,
      more: (band, diff, year) =>
        `You pay ${diff} more a month than the typical person in ${band}. That's ${year} a year.`,
      less: (band, diff) => `You pay ${diff} less a month than the typical person in ${band}.`,
      same: (band) => `Same as the typical person in ${band}.`,
    },
    peer: {
      title: "Compare with other users",
      sample: "A preview compared with sample users.",
      real: "Anonymous statistics from users who joined.",
      whatDoWeCollect: "What do we collect?",
      sampleCount: (count) => `${count} sample users`,
      realCount: (count) => `${count} joined`,
      sampleNote: (count) =>
        `This is sample data for test builds. They aren't real users: the comparison uses ${count} sample users made from commonly used subscriptions.`,
      loadFailed: "Couldn't load the comparison statistics.",
      leaveFailed: "Couldn't stop sharing. Please try again in a moment.",
      typicalBefore: "Participants typically spend ",
      typicalMid: " a month on subscriptions · you spend ",
      barMore: (diff, year) => `You pay ${diff} more a month than typical. That's ${year} a year.`,
      barLess: (diff) => `You pay ${diff} less a month than typical.`,
      barSame: "Same as typical.",
      gathering: (min, participants) =>
        `The comparison appears once ${min} have joined. ${participants} ${pluralOf(participants, "person has", "people have")} joined so far.`,
      typicalAmount: (amount) => `Typical ${amount}`,
      typicalUses: (count) => `Typical ${count} ${pluralOf(count, "use", "uses")}`,
      meAmount: (amount) => `You ${amount}`,
      meBeforeCheckIn: "You: no check-in yet",
      meUses: (count) => `You ${count} ${pluralOf(count, "use", "uses")}`,
      contributing: "You're anonymously contributing a summary of your subscriptions.",
      leave: "Stop sharing",
      signedOutBefore: "We don't contribute while you're logged out. ",
      login: "Log in",
      signedOutAfter: " and we'll contribute again.",
      joinNote:
        "Only the service, amount and number of uses are added, without your name. Stop any time and they are deleted right away.",
      join: "Join anonymously",
      loginInviteAfter:
        " to contribute only the service, amount and number of uses without your name. They aren't stored together with your account.",
    },
    ask: {
      label: "Ask your report",
      title: "Ask your report",
      unavailable: "Can't answer right now.",
      goHelp: "Look it up in Help",
      source: (source) => `Calculated from: ${source} · the numbers were worked out on this device`,
      placeholder: "Ask your own question",
      inputLabel: "Question about your report",
      send: "Ask",
      newChat: "New question",
      followupPlaceholder: "Ask a follow-up (e.g. what about a year?)",
      contextNote:
        "Follow-ups send up to 3 earlier questions from this chat so the AI understands them. Answers and numbers aren't sent.",
      youAsked: "You asked",
      privacy:
        "Only the question text goes to the AI. Your subscription list and amounts aren't sent. Don't include personal details such as your name or contacts.",
      privacyLocal:
        "Questions are understood and calculated on this device only. Nothing is sent to a server or an AI.",
      localMiss: "I can't understand this question yet. Try one of the question buttons below.",
    },
  },
};

const rpPl = (n: number, one: string, many: string) => (Number(n) === 1 ? one : many);

export const zh: Widen<typeof ko> = {
  reportPage: {
    title: "订阅报告",
    subtitle: "现在付了多少、值不值，一目了然。",
    emptyTitle: "还没有订阅",
    emptyHint: "添加订阅后，这里会为你汇总。",
    register: "添加订阅",
    peerSoon: "与其他用户的比较即将推出。",
    receipts: {
      label: "订阅小票",
      month: (month) => `${Number(month)}月小票`,
      year: (year) => `${year}年度小票`,
    },
    summary: {
      label: "支出摘要",
      month: "每月",
      year: "每年",
      subs: "订阅",
      count: (count) => `${count} 个`,
    },
    overlap: {
      label: "与组合套餐重复的订阅",
      title: "你可能付了两次钱",
      middle: (services) => ` 包含 ${services}，但你还另外订阅了 `,
      after: "。除非是不同的账户，否则可以退订其中一个。",
    },
    ranking: {
      title: "单次成本排行",
      monthly: (amount) => `每月 ${amount}`,
      used: (count) => ` · 使用 ${count} 次`,
      beforeCheckIn: "尚未签到",
      unused: "没用过",
      perUse: "每次",
      note: "对于“尚未签到”的订阅，在仪表板上告诉我们本月的使用情况，就会显示单次成本。",
    },
    other: {
      title: "用其他方式衡量的订阅",
      note: "音乐按收听时长，AI 和工作工具按使用天数，会员按获得的优惠，存储按已用空间衡量。",
    },
    age: {
      pickNote: "选择你的年龄段，与同年龄段比较。",
      myBand: "我的年龄段",
      labels: {
        "10s": "10 多岁",
        "20s": "20 多岁",
        "30s": "30 多岁",
        "40s": "40 多岁",
        "50s": "50 多岁",
        "60s+": "60 岁以上",
      },
      caption: "各年龄段的典型每月订阅支出",
      notEnough: (participants, min) => `已有 ${participants} 人参与 · 满 ${min} 人后显示`,
      me: "我",
      tooFew: (band, participants) => `${band}目前只有 ${participants} 人，还无法比较。`,
      more: (band, diff, year) => `你每月比${band}的典型用户多付 ${diff}，一年就是 ${year}。`,
      less: (band, diff) => `你每月比${band}的典型用户少付 ${diff}。`,
      same: (band) => `与${band}的典型用户相同。`,
    },
    peer: {
      title: "与其他用户比较",
      sample: "与示例用户比较的预览。",
      real: "来自参与用户的匿名统计。",
      whatDoWeCollect: "我们收集什么？",
      sampleCount: (count) => `${count} 位示例用户`,
      realCount: (count) => `已有 ${count} 人参与`,
      sampleNote: (count) =>
        `这是测试版本用的示例数据，不是真实用户：比较使用的是由常见订阅组成的 ${count} 位示例用户。`,
      loadFailed: "无法载入比较统计。",
      leaveFailed: "无法停止分享。请稍后再试。",
      typicalBefore: "参与者通常每月在订阅上花 ",
      typicalMid: " · 你花 ",
      barMore: (diff, year) => `你每月比典型用户多付 ${diff}，一年就是 ${year}。`,
      barLess: (diff) => `你每月比典型用户少付 ${diff}。`,
      barSame: "与典型用户相同。",
      gathering: (min, participants) =>
        `满 ${min} 人参与后显示比较。目前已有 ${participants} 人参与。`,
      typicalAmount: (amount) => `典型 ${amount}`,
      typicalUses: (count) => `典型 ${count} 次`,
      meAmount: (amount) => `我 ${amount}`,
      meBeforeCheckIn: "我：尚未签到",
      meUses: (count) => `我 ${count} 次`,
      contributing: "你正在匿名提供订阅摘要。",
      leave: "停止分享",
      signedOutBefore: "未登录时不会提供数据。",
      login: "登录",
      signedOutAfter: "后会继续提供。",
      joinNote: "只匿名加入服务、金额和使用次数。随时可以停止，停止后会立即删除。",
      join: "匿名参与",
      loginInviteAfter: "后，只匿名提供服务、金额和使用次数。这些不会和你的账户存放在一起。",
    },
    ask: {
      label: "询问报告",
      title: "询问报告",
      unavailable: "现在无法回答。",
      goHelp: "在帮助中查找",
      source: (source) => `计算依据：${source} · 数字在这台设备上计算`,
      placeholder: "输入你的问题",
      inputLabel: "关于报告的问题",
      send: "提问",
      newChat: "重新提问",
      followupPlaceholder: "继续提问（例如：那一年呢？）",
      contextNote:
        "继续提问时，会一并发送本次对话中最多 3 个之前的问题，以便理解追问。不会发送回答和数字。",
      youAsked: "你的问题",
      privacy:
        "只有问题文字会发送给 AI，订阅列表和金额不会发送。请不要写入姓名、联系方式等个人信息。",
      privacyLocal: "问题只在本设备上理解和计算，不会发送到服务器或 AI。",
      localMiss: "暂时还无法理解这个问题。请试试下面的问题按钮。",
    },
  },
};

export const ja: Widen<typeof ko> = {
  reportPage: {
    title: "サブスクレポート",
    subtitle: "今払っている額と、元が取れているかをひと目で。",
    emptyTitle: "まだサブスクがありません",
    emptyHint: "サブスクを登録すると、ここにまとめて表示します。",
    register: "サブスクを登録",
    peerSoon: "ほかのユーザーとの比較は近日公開です。",
    receipts: {
      label: "サブスクのレシート",
      month: (month) => `${Number(month)}月のレシート`,
      year: (year) => `${year}年の年間レシート`,
    },
    summary: {
      label: "支出のまとめ",
      month: "1 か月",
      year: "1 年",
      subs: "サブスク",
      count: (count) => `${count} 件`,
    },
    overlap: {
      label: "セット商品と重なるサブスク",
      title: "二重に払っているかもしれません",
      middle: (services) => ` には ${services} が含まれていますが、別に `,
      after: " も契約しています。別のアカウントでなければ、どちらかを解約できます。",
    },
    ranking: {
      title: "1 回あたりの単価ランキング",
      monthly: (amount) => `月 ${amount}`,
      used: (count) => ` · ${count} 回利用`,
      beforeCheckIn: "まだチェックインしていません",
      unused: "未使用",
      perUse: "1 回あたり",
      note: "「まだチェックインしていません」のサブスクは、ダッシュボードで今月の利用を教えてくれると単価が表示されます。",
    },
    other: {
      title: "別の方法で測るサブスク",
      note: "音楽は聞いた時間、AI や仕事のツールは使った日数、メンバーシップは受けた特典、ストレージは使った容量で測ります。",
    },
    age: {
      pickNote: "年代を選ぶと同じ年代と比べられます。",
      myBand: "自分の年代",
      labels: {
        "10s": "10代",
        "20s": "20代",
        "30s": "30代",
        "40s": "40代",
        "50s": "50代",
        "60s+": "60代以上",
      },
      caption: "年代別の典型的な毎月のサブスク支出",
      notEnough: (participants, min) => `${participants} 人参加 · ${min} 人集まると表示`,
      me: "自分",
      tooFew: (band, participants) => `${band}はまだ ${participants} 人だけなので比べられません。`,
      more: (band, diff, year) =>
        `${band}の典型的な人より毎月 ${diff} 多く払っています。1 年で ${year} です。`,
      less: (band, diff) => `${band}の典型的な人より毎月 ${diff} 少なく払っています。`,
      same: (band) => `${band}の典型的な人と同じです。`,
    },
    peer: {
      title: "ほかのユーザーと比べる",
      sample: "サンプルユーザーと比べたプレビューです。",
      real: "参加したユーザーの匿名統計です。",
      whatDoWeCollect: "何を集めていますか？",
      sampleCount: (count) => `サンプルユーザー ${count} 人`,
      realCount: (count) => `${count} 人参加`,
      sampleNote: (count) =>
        `テストビルド用のサンプルデータです。実在のユーザーではなく、よく使われるサブスクで作ったサンプルユーザー ${count} 人と比べています。`,
      loadFailed: "比較の統計を読み込めませんでした。",
      leaveFailed: "参加をやめられませんでした。少ししてからもう一度お試しください。",
      typicalBefore: "参加者は典型的に毎月サブスクに ",
      typicalMid: " · あなたは ",
      barMore: (diff, year) => `典型より毎月 ${diff} 多く払っています。1 年で ${year} です。`,
      barLess: (diff) => `典型より毎月 ${diff} 少なく払っています。`,
      barSame: "典型と同じです。",
      gathering: (min, participants) =>
        `${min} 人集まると比較が表示されます。今のところ ${participants} 人が参加しています。`,
      typicalAmount: (amount) => `典型 ${amount}`,
      typicalUses: (count) => `典型 ${count} 回`,
      meAmount: (amount) => `自分 ${amount}`,
      meBeforeCheckIn: "自分: まだチェックインしていません",
      meUses: (count) => `自分 ${count} 回`,
      contributing: "サブスクの要約を匿名で提供しています。",
      leave: "参加をやめる",
      signedOutBefore: "ログアウト中は提供しません。",
      login: "ログイン",
      signedOutAfter: "するとまた提供します。",
      joinNote:
        "サービス・金額・利用回数だけを名前なしで加えます。いつでもやめられ、やめるとすぐに削除します。",
      join: "匿名で参加",
      loginInviteAfter:
        "すると、サービス・金額・利用回数だけを名前なしで提供できます。アカウントと一緒には保存しません。",
    },
    ask: {
      label: "レポートに質問",
      title: "レポートに質問",
      unavailable: "今は答えられません。",
      goHelp: "ヘルプで探す",
      source: (source) => `計算の根拠: ${source} · 数字はこの端末で計算しました`,
      placeholder: "自由に質問する",
      inputLabel: "レポートについての質問",
      send: "質問",
      newChat: "新しく聞く",
      followupPlaceholder: "続けて聞く（例：じゃあ1年だと？）",
      contextNote:
        "続けて聞くと、この会話の前の質問を最大 3 件いっしょに送り、続きの質問を理解します。答えと数字は送りません。",
      youAsked: "聞いた質問",
      privacy:
        "AI には質問の文章だけが送られ、サブスクの一覧や金額は送られません。名前や連絡先などの個人情報は書かないでください。",
      privacyLocal: "質問はこの端末の中だけで理解・計算します。サーバーや AI には送りません。",
      localMiss: "この質問はまだ理解できません。下の質問ボタンを押してみてください。",
    },
  },
};

export const vi: Widen<typeof ko> = {
  reportPage: {
    title: "Báo cáo gói đăng ký",
    subtitle: "Bạn đang trả bao nhiêu và có đáng không, xem ngay trong nháy mắt.",
    emptyTitle: "Chưa có gói đăng ký nào",
    emptyHint: "Thêm gói đăng ký, chúng tôi sẽ tổng hợp ở đây.",
    register: "Thêm gói đăng ký",
    peerSoon: "So sánh với người dùng khác sắp ra mắt.",
    receipts: {
      label: "Hóa đơn gói đăng ký",
      month: (month) => `Hóa đơn tháng ${Number(month)}`,
      year: (year) => `Hóa đơn tổng kết năm ${year}`,
    },
    summary: {
      label: "Tóm tắt chi tiêu",
      month: "Mỗi tháng",
      year: "Mỗi năm",
      subs: "Gói đăng ký",
      count: (count) => String(count),
    },
    overlap: {
      label: "Gói trùng với gói kết hợp",
      title: "Có thể bạn đang trả hai lần",
      middle: (services) => ` đã gồm ${services}, nhưng bạn còn đăng ký riêng `,
      after: ". Nếu không phải tài khoản khác, bạn có thể hủy một trong hai.",
    },
    ranking: {
      title: "Xếp hạng chi phí mỗi lần dùng",
      monthly: (amount) => `${amount} mỗi tháng`,
      used: (count) => ` · dùng ${count} lần`,
      beforeCheckIn: "Chưa check-in",
      unused: "Chưa dùng",
      perUse: "mỗi lần",
      note: "Với gói “Chưa check-in”, hãy cho biết mức dùng tháng này trên bảng điều khiển để thấy chi phí mỗi lần dùng.",
    },
    other: {
      title: "Gói được đo theo cách khác",
      note: "Nhạc đo theo giờ nghe, AI và công cụ làm việc theo số ngày dùng, gói thành viên theo ưu đãi nhận được, lưu trữ theo dung lượng đã dùng.",
    },
    age: {
      pickNote: "Chọn nhóm tuổi để so sánh với cùng nhóm.",
      myBand: "Nhóm tuổi của tôi",
      labels: {
        "10s": "Tuổi teen",
        "20s": "Tuổi 20",
        "30s": "Tuổi 30",
        "40s": "Tuổi 40",
        "50s": "Tuổi 50",
        "60s+": "Từ 60 tuổi",
      },
      caption: "Chi tiêu đăng ký hằng tháng điển hình theo nhóm tuổi",
      notEnough: (participants, min) =>
        `${participants} người tham gia · hiển thị khi đủ ${min} người`,
      me: "Tôi",
      tooFew: (band, participants) =>
        `Nhóm ${band} mới có ${participants} người nên chưa so sánh được.`,
      more: (band, diff, year) =>
        `Bạn trả nhiều hơn người điển hình nhóm ${band} ${diff} mỗi tháng, tức ${year} mỗi năm.`,
      less: (band, diff) => `Bạn trả ít hơn người điển hình nhóm ${band} ${diff} mỗi tháng.`,
      same: (band) => `Bằng người điển hình nhóm ${band}.`,
    },
    peer: {
      title: "So sánh với người dùng khác",
      sample: "Bản xem trước so sánh với người dùng mẫu.",
      real: "Thống kê ẩn danh từ người dùng đã tham gia.",
      whatDoWeCollect: "Chúng tôi thu thập gì?",
      sampleCount: (count) => `${count} người dùng mẫu`,
      realCount: (count) => `${count} người tham gia`,
      sampleNote: (count) =>
        `Đây là dữ liệu mẫu cho bản thử nghiệm. Không phải người dùng thật: so sánh dùng ${count} người dùng mẫu tạo từ các gói phổ biến.`,
      loadFailed: "Không tải được thống kê so sánh.",
      leaveFailed: "Không dừng chia sẻ được. Hãy thử lại sau ít phút.",
      typicalBefore: "Người tham gia thường chi ",
      typicalMid: " mỗi tháng cho gói đăng ký · bạn chi ",
      barMore: (diff, year) =>
        `Bạn trả nhiều hơn mức điển hình ${diff} mỗi tháng, tức ${year} mỗi năm.`,
      barLess: (diff) => `Bạn trả ít hơn mức điển hình ${diff} mỗi tháng.`,
      barSame: "Bằng mức điển hình.",
      gathering: (min, participants) =>
        `So sánh sẽ hiện khi đủ ${min} người tham gia. Hiện có ${participants} người.`,
      typicalAmount: (amount) => `Điển hình ${amount}`,
      typicalUses: (count) => `Điển hình ${count} lần`,
      meAmount: (amount) => `Tôi ${amount}`,
      meBeforeCheckIn: "Tôi: chưa check-in",
      meUses: (count) => `Tôi ${count} lần`,
      contributing: "Bạn đang đóng góp ẩn danh bản tóm tắt gói đăng ký.",
      leave: "Dừng chia sẻ",
      signedOutBefore: "Khi chưa đăng nhập, chúng tôi không gửi dữ liệu. ",
      login: "Đăng nhập",
      signedOutAfter: " để tiếp tục đóng góp.",
      joinNote:
        "Chỉ thêm dịch vụ, số tiền và số lần dùng, không kèm tên. Có thể dừng bất cứ lúc nào và dữ liệu sẽ bị xóa ngay.",
      join: "Tham gia ẩn danh",
      loginInviteAfter:
        " để chỉ đóng góp dịch vụ, số tiền và số lần dùng mà không kèm tên. Dữ liệu không được lưu cùng tài khoản.",
    },
    ask: {
      label: "Hỏi báo cáo",
      title: "Hỏi báo cáo",
      unavailable: "Hiện không thể trả lời.",
      goHelp: "Tìm trong Trợ giúp",
      source: (source) => `Tính từ: ${source} · các con số được tính trên thiết bị này`,
      placeholder: "Đặt câu hỏi của bạn",
      inputLabel: "Câu hỏi về báo cáo",
      send: "Hỏi",
      newChat: "Hỏi mới",
      followupPlaceholder: "Hỏi tiếp (ví dụ: còn một năm thì sao?)",
      contextNote:
        "Khi hỏi tiếp, tối đa 3 câu hỏi trước trong cuộc trò chuyện này được gửi kèm để AI hiểu câu hỏi nối tiếp. Câu trả lời và con số không được gửi.",
      youAsked: "Bạn đã hỏi",
      privacy:
        "Chỉ nội dung câu hỏi được gửi đến AI. Danh sách và số tiền đăng ký không được gửi. Đừng ghi thông tin cá nhân như tên hay số liên lạc.",
      privacyLocal:
        "Câu hỏi chỉ được hiểu và tính trên thiết bị này. Không gửi đến máy chủ hay AI.",
      localMiss: "Chưa hiểu được câu hỏi này. Hãy thử các nút câu hỏi bên dưới.",
    },
  },
};

export const fr: Widen<typeof ko> = {
  reportPage: {
    title: "Rapport d'abonnements",
    subtitle: "Ce que vous payez et si cela en vaut la peine, d'un coup d'œil.",
    emptyTitle: "Pas encore d'abonnement",
    emptyHint: "Ajoutez un abonnement et nous le résumerons ici.",
    register: "Ajouter un abonnement",
    peerSoon: "La comparaison avec d'autres utilisateurs arrive bientôt.",
    receipts: {
      label: "Tickets d'abonnements",
      month: (month) => `Ticket de ${monthName("fr", month)}`,
      year: (year) => `Bilan ${year}`,
    },
    summary: {
      label: "Résumé des dépenses",
      month: "Par mois",
      year: "Par an",
      subs: "Abonnements",
      count: (count) => String(count),
    },
    overlap: {
      label: "Abonnements en double avec une offre groupée",
      title: "Vous payez peut-être deux fois",
      middle: (services) => ` inclut ${services}, mais vous êtes aussi abonné séparément à `,
      after: ". Sauf s'il s'agit d'un autre compte, vous pouvez en résilier un.",
    },
    ranking: {
      title: "Classement du coût par utilisation",
      monthly: (amount) => `${amount} par mois`,
      used: (count) => ` · utilisé ${count} fois`,
      beforeCheckIn: "Pas encore de check-in",
      unused: "Pas utilisé",
      perUse: "par utilisation",
      note: "Pour les abonnements « Pas encore de check-in », indiquez l'utilisation du mois sur le tableau de bord et le coût par utilisation apparaîtra.",
    },
    other: {
      title: "Abonnements mesurés autrement",
      note: "La musique se mesure en heures d'écoute, l'IA et les outils de travail en jours d'utilisation, les adhésions en avantages reçus et le stockage en espace utilisé.",
    },
    age: {
      pickNote: "Choisissez votre tranche d'âge pour vous comparer à elle.",
      myBand: "Ma tranche d'âge",
      labels: {
        "10s": "Ados",
        "20s": "20-29 ans",
        "30s": "30-39 ans",
        "40s": "40-49 ans",
        "50s": "50-59 ans",
        "60s+": "60 ans et plus",
      },
      caption: "Dépense mensuelle typique en abonnements par tranche d'âge",
      notEnough: (participants, min) =>
        `${participants} participant${rpPl(participants, "", "s")} · affiché à partir de ${min}`,
      me: "Moi",
      tooFew: (band, participants) =>
        `Seulement ${participants} personne${rpPl(participants, "", "s")} chez les ${band} pour l'instant, impossible de comparer.`,
      more: (band, diff, year) =>
        `Vous payez ${diff} de plus par mois que la personne typique des ${band}. Soit ${year} par an.`,
      less: (band, diff) =>
        `Vous payez ${diff} de moins par mois que la personne typique des ${band}.`,
      same: (band) => `Comme la personne typique des ${band}.`,
    },
    peer: {
      title: "Comparer avec d'autres utilisateurs",
      sample: "Un aperçu comparé à des utilisateurs d'exemple.",
      real: "Statistiques anonymes des utilisateurs participants.",
      whatDoWeCollect: "Que collectons-nous ?",
      sampleCount: (count) => `${count} utilisateurs d'exemple`,
      realCount: (count) => `${count} participant${rpPl(count, "", "s")}`,
      sampleNote: (count) =>
        `Données d'exemple pour les versions de test. Ce ne sont pas de vrais utilisateurs : la comparaison utilise ${count} utilisateurs d'exemple créés à partir d'abonnements courants.`,
      loadFailed: "Impossible de charger les statistiques de comparaison.",
      leaveFailed: "Impossible d'arrêter le partage. Réessayez dans un instant.",
      typicalBefore: "Les participants dépensent typiquement ",
      typicalMid: " par mois en abonnements · vous dépensez ",
      barMore: (diff, year) =>
        `Vous payez ${diff} de plus par mois que la normale. Soit ${year} par an.`,
      barLess: (diff) => `Vous payez ${diff} de moins par mois que la normale.`,
      barSame: "Comme la normale.",
      gathering: (min, participants) =>
        `La comparaison apparaît à partir de ${min} participants. ${participants} ${rpPl(participants, "personne a", "personnes ont")} participé jusqu'ici.`,
      typicalAmount: (amount) => `Typique ${amount}`,
      typicalUses: (count) => `Typique ${count} utilisation${rpPl(count, "", "s")}`,
      meAmount: (amount) => `Moi ${amount}`,
      meBeforeCheckIn: "Moi : pas encore de check-in",
      meUses: (count) => `Moi ${count} utilisation${rpPl(count, "", "s")}`,
      contributing: "Vous partagez anonymement un résumé de vos abonnements.",
      leave: "Arrêter le partage",
      signedOutBefore: "Nous ne partageons rien tant que vous êtes déconnecté. ",
      login: "Connectez-vous",
      signedOutAfter: " et le partage reprendra.",
      joinNote:
        "Seuls le service, le montant et le nombre d'utilisations sont ajoutés, sans votre nom. Arrêtez quand vous voulez : ils sont supprimés immédiatement.",
      join: "Participer anonymement",
      loginInviteAfter:
        " pour partager uniquement le service, le montant et le nombre d'utilisations, sans votre nom. Ils ne sont pas stockés avec votre compte.",
    },
    ask: {
      label: "Interroger votre rapport",
      title: "Interroger votre rapport",
      unavailable: "Impossible de répondre pour le moment.",
      goHelp: "Chercher dans l'aide",
      source: (source) =>
        `Calculé à partir de : ${source} · les chiffres ont été calculés sur cet appareil`,
      placeholder: "Posez votre question",
      inputLabel: "Question sur votre rapport",
      send: "Demander",
      newChat: "Nouvelle question",
      followupPlaceholder: "Poser une question de suite (ex. : et sur un an ?)",
      contextNote:
        "Pour une question de suite, jusqu'à 3 questions précédentes de cette conversation sont envoyées pour que l'IA comprenne. Les réponses et les chiffres ne sont pas envoyés.",
      youAsked: "Votre question",
      privacy:
        "Seul le texte de la question est envoyé à l'IA. Votre liste d'abonnements et vos montants ne le sont pas. N'y mettez pas de données personnelles comme votre nom ou vos coordonnées.",
      privacyLocal:
        "Les questions sont comprises et calculées uniquement sur cet appareil. Rien n'est envoyé à un serveur ni à une IA.",
      localMiss:
        "Je ne comprends pas encore cette question. Essayez l'un des boutons de questions ci-dessous.",
    },
  },
};

export const es: Widen<typeof ko> = {
  reportPage: {
    title: "Informe de suscripciones",
    subtitle: "Lo que pagas ahora y si vale la pena, de un vistazo.",
    emptyTitle: "Todavía no hay suscripciones",
    emptyHint: "Añade una suscripción y la resumiremos aquí.",
    register: "Añadir suscripción",
    peerSoon: "La comparación con otros usuarios llegará pronto.",
    receipts: {
      label: "Tickets de suscripciones",
      month: (month) => `Ticket de ${monthName("es", month)}`,
      year: (year) => `Resumen de ${year}`,
    },
    summary: {
      label: "Resumen de gastos",
      month: "Al mes",
      year: "Al año",
      subs: "Suscripciones",
      count: (count) => String(count),
    },
    overlap: {
      label: "Suscripciones que coinciden con un paquete",
      title: "Puede que estés pagando dos veces",
      middle: (services) => ` incluye ${services}, pero también estás suscrito por separado a `,
      after: ". Salvo que sea otra cuenta, puedes cancelar una de las dos.",
    },
    ranking: {
      title: "Ranking de coste por uso",
      monthly: (amount) => `${amount} al mes`,
      used: (count) => ` · usado ${count} ${rpPl(count, "vez", "veces")}`,
      beforeCheckIn: "Sin registro todavía",
      unused: "Sin usar",
      perUse: "por uso",
      note: "Para las suscripciones «Sin registro todavía», cuéntanos el uso de este mes en el panel y aparecerá el coste por uso.",
    },
    other: {
      title: "Suscripciones medidas de otra forma",
      note: "La música se mide por horas escuchadas, la IA y las herramientas de trabajo por días de uso, las membresías por ventajas recibidas y el almacenamiento por espacio usado.",
    },
    age: {
      pickNote: "Elige tu grupo de edad para compararte con él.",
      myBand: "Mi grupo de edad",
      labels: {
        "10s": "Adolescentes",
        "20s": "20-29 años",
        "30s": "30-39 años",
        "40s": "40-49 años",
        "50s": "50-59 años",
        "60s+": "60 o más",
      },
      caption: "Gasto mensual típico en suscripciones por grupo de edad",
      notEnough: (participants, min) =>
        `${participants} participante${rpPl(participants, "", "s")} · se muestra con ${min}`,
      me: "Yo",
      tooFew: (band, participants) =>
        `Solo hay ${participants} persona${rpPl(participants, "", "s")} en ${band} por ahora, así que no se puede comparar.`,
      more: (band, diff, year) =>
        `Pagas ${diff} más al mes que la persona típica de ${band}. Son ${year} al año.`,
      less: (band, diff) => `Pagas ${diff} menos al mes que la persona típica de ${band}.`,
      same: (band) => `Igual que la persona típica de ${band}.`,
    },
    peer: {
      title: "Comparar con otros usuarios",
      sample: "Una vista previa comparada con usuarios de ejemplo.",
      real: "Estadísticas anónimas de los usuarios que participan.",
      whatDoWeCollect: "¿Qué recopilamos?",
      sampleCount: (count) => `${count} usuarios de ejemplo`,
      realCount: (count) => `${count} participante${rpPl(count, "", "s")}`,
      sampleNote: (count) =>
        `Son datos de ejemplo para versiones de prueba. No son usuarios reales: la comparación usa ${count} usuarios de ejemplo creados con suscripciones habituales.`,
      loadFailed: "No se pudieron cargar las estadísticas de comparación.",
      leaveFailed: "No se pudo dejar de compartir. Inténtalo en un momento.",
      typicalBefore: "Los participantes suelen gastar ",
      typicalMid: " al mes en suscripciones · tú gastas ",
      barMore: (diff, year) => `Pagas ${diff} más al mes de lo típico. Son ${year} al año.`,
      barLess: (diff) => `Pagas ${diff} menos al mes de lo típico.`,
      barSame: "Igual que lo típico.",
      gathering: (min, participants) =>
        `La comparación aparece cuando participen ${min}. Hasta ahora ${rpPl(participants, "ha participado", "han participado")} ${participants}.`,
      typicalAmount: (amount) => `Típico ${amount}`,
      typicalUses: (count) => `Típico ${count} uso${rpPl(count, "", "s")}`,
      meAmount: (amount) => `Yo ${amount}`,
      meBeforeCheckIn: "Yo: sin registro todavía",
      meUses: (count) => `Yo ${count} uso${rpPl(count, "", "s")}`,
      contributing: "Estás aportando de forma anónima un resumen de tus suscripciones.",
      leave: "Dejar de compartir",
      signedOutBefore: "No aportamos datos mientras no has iniciado sesión. ",
      login: "Inicia sesión",
      signedOutAfter: " y volveremos a aportarlos.",
      joinNote:
        "Solo se añaden el servicio, el importe y el número de usos, sin tu nombre. Puedes dejarlo cuando quieras y se borran al instante.",
      join: "Participar de forma anónima",
      loginInviteAfter:
        " para aportar solo el servicio, el importe y el número de usos, sin tu nombre. No se guardan junto con tu cuenta.",
    },
    ask: {
      label: "Pregunta a tu informe",
      title: "Pregunta a tu informe",
      unavailable: "No se puede responder ahora.",
      goHelp: "Buscar en la ayuda",
      source: (source) => `Calculado con: ${source} · las cifras se calcularon en este dispositivo`,
      placeholder: "Escribe tu pregunta",
      inputLabel: "Pregunta sobre tu informe",
      send: "Preguntar",
      newChat: "Nueva pregunta",
      followupPlaceholder: "Seguir preguntando (p. ej.: ¿y en un año?)",
      contextNote:
        "Al seguir preguntando se envían hasta 3 preguntas anteriores de esta conversación para que la IA entienda. No se envían respuestas ni cifras.",
      youAsked: "Preguntaste",
      privacy:
        "Solo el texto de la pregunta va a la IA. Tu lista de suscripciones y los importes no se envían. No incluyas datos personales como tu nombre o contacto.",
      privacyLocal:
        "Las preguntas se entienden y calculan solo en este dispositivo. No se envía nada a un servidor ni a una IA.",
      localMiss:
        "Todavía no entiendo esta pregunta. Prueba uno de los botones de preguntas de abajo.",
    },
  },
};

export const de: Widen<typeof ko> = {
  reportPage: {
    title: "Abo-Bericht",
    subtitle: "Was du jetzt zahlst und ob es sich lohnt, auf einen Blick.",
    emptyTitle: "Noch keine Abos",
    emptyHint: "Füg ein Abo hinzu, dann fassen wir es hier zusammen.",
    register: "Abo hinzufügen",
    peerSoon: "Der Vergleich mit anderen Nutzern kommt bald.",
    receipts: {
      label: "Abo-Belege",
      month: (month) => `Beleg für ${monthName("de", month)}`,
      year: (year) => `Jahresbeleg ${year}`,
    },
    summary: {
      label: "Ausgabenübersicht",
      month: "Pro Monat",
      year: "Pro Jahr",
      subs: "Abos",
      count: (count) => String(count),
    },
    overlap: {
      label: "Abos, die sich mit einem Paket überschneiden",
      title: "Du zahlst vielleicht doppelt",
      middle: (services) => ` enthält ${services}, aber du hast zusätzlich separat `,
      after: " abonniert. Wenn es nicht ein anderes Konto ist, kannst du eines davon kündigen.",
    },
    ranking: {
      title: "Ranking der Kosten pro Nutzung",
      monthly: (amount) => `${amount} im Monat`,
      used: (count) => ` · ${count}-mal genutzt`,
      beforeCheckIn: "Noch kein Eintrag",
      unused: "Nicht genutzt",
      perUse: "pro Nutzung",
      note: "Bei Abos mit „Noch kein Eintrag“ trag in der Übersicht die Nutzung dieses Monats ein, dann erscheinen die Kosten pro Nutzung.",
    },
    other: {
      title: "Anders gemessene Abos",
      note: "Musik wird nach Hörstunden gemessen, KI und Arbeitstools nach Nutzungstagen, Mitgliedschaften nach erhaltenen Vorteilen und Speicher nach belegtem Platz.",
    },
    age: {
      pickNote: "Wähl deine Altersgruppe, um dich mit ihr zu vergleichen.",
      myBand: "Meine Altersgruppe",
      labels: {
        "10s": "Teenager",
        "20s": "20–29",
        "30s": "30–39",
        "40s": "40–49",
        "50s": "50–59",
        "60s+": "60 und älter",
      },
      caption: "Typische monatliche Abo-Ausgaben nach Altersgruppe",
      notEnough: (participants, min) => `${participants} dabei · wird ab ${min} angezeigt`,
      me: "Ich",
      tooFew: (band, participants) =>
        `In der Gruppe ${band} sind bisher nur ${participants} ${rpPl(participants, "Person", "Personen")}, daher kein Vergleich möglich.`,
      more: (band, diff, year) =>
        `Du zahlst ${diff} mehr im Monat als die typische Person (${band}). Das sind ${year} im Jahr.`,
      less: (band, diff) => `Du zahlst ${diff} weniger im Monat als die typische Person (${band}).`,
      same: (band) => `Gleich wie die typische Person (${band}).`,
    },
    peer: {
      title: "Mit anderen Nutzern vergleichen",
      sample: "Eine Vorschau im Vergleich mit Beispielnutzern.",
      real: "Anonyme Statistik der teilnehmenden Nutzer.",
      whatDoWeCollect: "Was erfassen wir?",
      sampleCount: (count) => `${count} Beispielnutzer`,
      realCount: (count) => `${count} dabei`,
      sampleNote: (count) =>
        `Das sind Beispieldaten für Test-Builds. Keine echten Nutzer: Der Vergleich nutzt ${count} Beispielnutzer aus gängigen Abos.`,
      loadFailed: "Die Vergleichsstatistik konnte nicht geladen werden.",
      leaveFailed: "Das Teilen konnte nicht beendet werden. Bitte versuch es gleich noch einmal.",
      typicalBefore: "Teilnehmende geben typischerweise ",
      typicalMid: " im Monat für Abos aus · du gibst ",
      barMore: (diff, year) =>
        `Du zahlst ${diff} mehr im Monat als typisch. Das sind ${year} im Jahr.`,
      barLess: (diff) => `Du zahlst ${diff} weniger im Monat als typisch.`,
      barSame: "Gleich wie typisch.",
      gathering: (min, participants) =>
        `Der Vergleich erscheint ab ${min} Teilnehmenden. Bisher ${rpPl(participants, "macht", "machen")} ${participants} mit.`,
      typicalAmount: (amount) => `Typisch ${amount}`,
      typicalUses: (count) => `Typisch ${count}-mal`,
      meAmount: (amount) => `Ich ${amount}`,
      meBeforeCheckIn: "Ich: noch kein Eintrag",
      meUses: (count) => `Ich ${count}-mal`,
      contributing: "Du steuerst anonym eine Zusammenfassung deiner Abos bei.",
      leave: "Teilen beenden",
      signedOutBefore: "Solange du abgemeldet bist, steuern wir nichts bei. ",
      login: "Melde dich an",
      signedOutAfter: ", dann geht es weiter.",
      joinNote:
        "Hinzugefügt werden nur Dienst, Betrag und Nutzungsanzahl, ohne deinen Namen. Du kannst jederzeit aufhören, dann wird alles sofort gelöscht.",
      join: "Anonym teilnehmen",
      loginInviteAfter:
        ", um nur Dienst, Betrag und Nutzungsanzahl ohne deinen Namen beizusteuern. Sie werden nicht zusammen mit deinem Konto gespeichert.",
    },
    ask: {
      label: "Deinen Bericht fragen",
      title: "Deinen Bericht fragen",
      unavailable: "Gerade keine Antwort möglich.",
      goHelp: "In der Hilfe nachsehen",
      source: (source) => `Berechnet aus: ${source} · die Zahlen wurden auf diesem Gerät berechnet`,
      placeholder: "Stell deine eigene Frage",
      inputLabel: "Frage zu deinem Bericht",
      send: "Fragen",
      newChat: "Neue Frage",
      followupPlaceholder: "Nachfragen (z. B. und für ein Jahr?)",
      contextNote:
        "Bei Nachfragen werden bis zu 3 frühere Fragen aus diesem Chat mitgeschickt, damit die KI sie versteht. Antworten und Zahlen werden nicht gesendet.",
      youAsked: "Deine Frage",
      privacy:
        "Nur der Fragetext geht an die KI. Deine Abo-Liste und Beträge werden nicht gesendet. Schreib keine persönlichen Daten wie Namen oder Kontaktdaten hinein.",
      privacyLocal:
        "Fragen werden nur auf diesem Gerät verstanden und berechnet. Nichts wird an einen Server oder eine KI gesendet.",
      localMiss:
        "Diese Frage verstehe ich noch nicht. Probiere einen der Fragen-Buttons unten aus.",
    },
  },
};

export const pt: Widen<typeof ko> = {
  reportPage: {
    title: "Relatório de assinaturas",
    subtitle: "Quanto você paga agora e se vale a pena, num relance.",
    emptyTitle: "Ainda não há assinaturas",
    emptyHint: "Adicione uma assinatura e vamos resumir aqui.",
    register: "Adicionar assinatura",
    peerSoon: "A comparação com outros usuários chega em breve.",
    receipts: {
      label: "Recibos de assinaturas",
      month: (month) => `Recibo de ${monthName("pt", month)}`,
      year: (year) => `Resumo de ${year}`,
    },
    summary: {
      label: "Resumo de gastos",
      month: "Por mês",
      year: "Por ano",
      subs: "Assinaturas",
      count: (count) => String(count),
    },
    overlap: {
      label: "Assinaturas que se sobrepõem a um pacote",
      title: "Você pode estar pagando duas vezes",
      middle: (services) => ` inclui ${services}, mas você também assina separadamente `,
      after: ". A menos que seja outra conta, dá para cancelar uma delas.",
    },
    ranking: {
      title: "Ranking de custo por uso",
      monthly: (amount) => `${amount} por mês`,
      used: (count) => ` · usado ${count} ${rpPl(count, "vez", "vezes")}`,
      beforeCheckIn: "Ainda sem registro",
      unused: "Sem uso",
      perUse: "por uso",
      note: "Para assinaturas “Ainda sem registro”, informe o uso deste mês no painel e o custo por uso aparece.",
    },
    other: {
      title: "Assinaturas medidas de outro jeito",
      note: "Música é medida por horas ouvidas, IA e ferramentas de trabalho por dias de uso, planos de membro por benefícios recebidos e armazenamento por espaço usado.",
    },
    age: {
      pickNote: "Escolha sua faixa etária para comparar com ela.",
      myBand: "Minha faixa etária",
      labels: {
        "10s": "Adolescentes",
        "20s": "20 a 29",
        "30s": "30 a 39",
        "40s": "40 a 49",
        "50s": "50 a 59",
        "60s+": "60 ou mais",
      },
      caption: "Gasto mensal típico com assinaturas por faixa etária",
      notEnough: (participants, min) =>
        `${participants} participante${rpPl(participants, "", "s")} · aparece a partir de ${min}`,
      me: "Eu",
      tooFew: (band, participants) =>
        `Só há ${participants} pessoa${rpPl(participants, "", "s")} na faixa ${band} por enquanto, então não dá para comparar.`,
      more: (band, diff, year) =>
        `Você paga ${diff} a mais por mês que a pessoa típica da faixa ${band}. São ${year} por ano.`,
      less: (band, diff) =>
        `Você paga ${diff} a menos por mês que a pessoa típica da faixa ${band}.`,
      same: (band) => `Igual à pessoa típica da faixa ${band}.`,
    },
    peer: {
      title: "Comparar com outros usuários",
      sample: "Uma prévia comparada com usuários de exemplo.",
      real: "Estatísticas anônimas de quem participa.",
      whatDoWeCollect: "O que coletamos?",
      sampleCount: (count) => `${count} usuários de exemplo`,
      realCount: (count) => `${count} participante${rpPl(count, "", "s")}`,
      sampleNote: (count) =>
        `São dados de exemplo para versões de teste. Não são usuários reais: a comparação usa ${count} usuários de exemplo feitos com assinaturas comuns.`,
      loadFailed: "Não foi possível carregar as estatísticas de comparação.",
      leaveFailed: "Não foi possível parar de compartilhar. Tente de novo em instantes.",
      typicalBefore: "Os participantes costumam gastar ",
      typicalMid: " por mês com assinaturas · você gasta ",
      barMore: (diff, year) =>
        `Você paga ${diff} a mais por mês que o típico. São ${year} por ano.`,
      barLess: (diff) => `Você paga ${diff} a menos por mês que o típico.`,
      barSame: "Igual ao típico.",
      gathering: (min, participants) =>
        `A comparação aparece quando ${min} participarem. Até agora ${participants} ${rpPl(participants, "pessoa participou", "pessoas participaram")}.`,
      typicalAmount: (amount) => `Típico ${amount}`,
      typicalUses: (count) => `Típico ${count} uso${rpPl(count, "", "s")}`,
      meAmount: (amount) => `Eu ${amount}`,
      meBeforeCheckIn: "Eu: ainda sem registro",
      meUses: (count) => `Eu ${count} uso${rpPl(count, "", "s")}`,
      contributing: "Você está contribuindo anonimamente com um resumo das suas assinaturas.",
      leave: "Parar de compartilhar",
      signedOutBefore: "Não contribuímos enquanto você está desconectado. ",
      login: "Entre",
      signedOutAfter: " e voltamos a contribuir.",
      joinNote:
        "Só o serviço, o valor e o número de usos são adicionados, sem seu nome. Pare quando quiser e eles são apagados na hora.",
      join: "Participar anonimamente",
      loginInviteAfter:
        " para contribuir só com o serviço, o valor e o número de usos, sem seu nome. Eles não ficam guardados junto com sua conta.",
    },
    ask: {
      label: "Pergunte ao seu relatório",
      title: "Pergunte ao seu relatório",
      unavailable: "Não é possível responder agora.",
      goHelp: "Procurar na ajuda",
      source: (source) =>
        `Calculado com: ${source} · os números foram calculados neste dispositivo`,
      placeholder: "Faça sua pergunta",
      inputLabel: "Pergunta sobre seu relatório",
      send: "Perguntar",
      newChat: "Nova pergunta",
      followupPlaceholder: "Continuar perguntando (ex.: e em um ano?)",
      contextNote:
        "Ao continuar, até 3 perguntas anteriores desta conversa vão junto para a IA entender. Respostas e números não são enviados.",
      youAsked: "Você perguntou",
      privacy:
        "Só o texto da pergunta vai para a IA. Sua lista de assinaturas e os valores não são enviados. Não inclua dados pessoais como nome ou contato.",
      privacyLocal:
        "As perguntas são entendidas e calculadas só neste dispositivo. Nada é enviado a um servidor nem a uma IA.",
      localMiss: "Ainda não entendo esta pergunta. Experimente um dos botões de perguntas abaixo.",
    },
  },
};
