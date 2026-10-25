import type { Widen } from "../types";
import { MONTHS_LONG, one } from "../english";
import { monthName } from "../months";

/**
 * 구독 영수증: 화면(ReceiptPaper)·이미지(lib/receipt-image)·공유 글이 같은 문구를 쓴다. 두 곳이 따로 적으면 공유한
 * 그림과 화면이 다른 말을 하게 된다. 서비스 이름과 금액은 부르는 쪽이 만들어 넘긴다.
 */
export const ko = {
  receiptView: {
    periodMonth: (year: number, month: number) => `${year}년 ${month}월`,
    periodYear: (year: number) => `${year}년`,
    title: "구독 영수증",
    paperLabel: (period: string) => `${period} 구독 영수증`,
    issued: (number: string, date: string) => `No. ${number} · 발행 ${date}`,
    empty: "결제된 구독이 없어요",
    unknownEmpty: (period: string) =>
      `${period}에 결제했는지 알 수 있는 구독이 없어요. 등록하기 전 달이나 결제 월을 모르는 연간 구독은 비워 뒀어요.`,
    unknownValue: "모름",
    total: (count: number) => `합계(내 몫) · ${count}건`,
    billed: "카드에 찍힌 금액",
    defended: "해지로 지킨 돈",
    killedIn: (names: string) => `이 기간에 해지: ${names}`,
    priciestBefore: "1회가 가장 비쌌던 구독: ",
    priciestAfter: (amount: string) => ` (1회 ${amount})`,
    priciestPlain: (name: string, amount: string) =>
      `1회가 가장 비쌌던 구독: ${name} (1회 ${amount})`,
    line: {
      paidDates: (dates: string) => `${dates} 결제`,
      paidCount: (count: number) => `${count}회 결제`,
      upcoming: (dates: string) => `${dates} 결제 예정`,
      evidenceAll: "결제 메일로 확인",
      evidenceSome: (count: number) => `${count}회는 결제 메일로 확인`,
      yearly: "연간",
      shared: (billed: string) => `나눠 냄 · 카드 ${billed}`,
      killedOn: (date: string) => `${date} 해지`,
      zeroUses: "체크인 0회",
      uses: (count: number, perUse: string) => `${count}회 이용 · 1회 ${perUse}`,
      noCheckIn: "체크인 없음",
    },
    suffix: {
      withUpcoming: " · 결제 예정 포함",
      untilToday: " · 오늘까지",
    },
    notes: {
      base: "등록한 구독 기록으로 계산했어요. 카드 명세서와 다를 수 있어요.",
      evidenced: (count: number, shared: boolean) =>
        `등록하기 전 결제 ${count}건은 Gmail에서 찾은 결제 메일의 날짜와 금액으로 넣었어요.${
          shared ? " 나눠 내는 구독의 내 몫은 지금 나누는 비율로 계산했어요." : ""
        }`,
      historical:
        "지난 달러 결제는 결제일의 고시 환율(ECB 기준)로 바꿨어요. 카드사 환율과 조금 다를 수 있어요.",
      current: (count: number) =>
        `지난 달러 결제 ${count}건은 그날 환율을 받지 못해 지금 설정한 환율로 계산했어요.`,
      incompleteUpcoming:
        "아직 끝나지 않은 기간이에요. 지금 구독 중인데 이번 달 결제일이 오지 않은 것은 ‘결제 예정’으로 넣었어요.",
      incompleteToday: "아직 끝나지 않은 기간이라 오늘까지 결제된 것만 적었어요.",
      undated: (count: number) => `결제 월을 모르는 연간 구독 ${count}개는 넣지 못했어요.`,
      beforeRegistration: (count: number) =>
        `등록한 달보다 앞선 달 중 결제 메일을 찾지 못한 달은 구독 중이었는지 몰라 넣지 않았어요(${count}개).`,
      trial: (count: number) => `무료 체험 중이던 결제일은 뺐어요(${count}개).`,
      defendedUnknown: (count: number) =>
        `결제 월이나 해지일을 몰라 지킨 돈에 넣지 못한 구독이 ${count}개 있어요.`,
    },
    share: {
      title: (period: string, suffix: string) => `SubSlash 구독 영수증 · ${period}${suffix}`,
      upcomingInTitle: " (결제 예정 포함)",
      todayInTitle: " (오늘까지)",
      upcomingMark: " (결제 예정)",
      total: "합계(내 몫)",
      defended: "해지로 지킨 돈",
    },
    shared: {
      badge: "공유받은 구독 영수증",
      note: "보낸 사람이 직접 기록한 내용을 링크에 담은 거예요. SubSlash가 확인하지 않았고, 증빙으로 쓸 수 없어요.",
      invalid: "영수증을 읽지 못했어요. 링크가 잘렸거나 바뀌었을 수 있어요.",
      cta: "SubSlash로 내 구독 영수증 만들기",
      unverifiedMark: "공유 링크로 받은 영수증이에요. SubSlash가 내용을 확인하지 않았어요.",
      maskedName: (n: number) => `구독 ${n}`,
      maskedKilled: (n: number) => `해지한 구독 ${n}`,
      hiddenSummary: (subscriptions: number, charges: number) =>
        `구독 ${subscriptions}개 · 결제 ${charges}건 (서비스 이름과 구독별 금액은 가렸어요)`,
      reopen: "영수증은 주소창에 남기지 않아요. 받은 링크를 다시 열어 주세요.",
    },
    page: {
      back: "← 리포트",
      tabsLabel: "영수증 기간",
      month: "월",
      year: "연말 결산",
      otherPeriods: "다른 기간",
      next: "다음",
      saveImage: "이미지로 저장",
      share: "공유하기",
      privacy:
        "영수증은 이 기기의 기록으로 만들어요. 공유하면 영수증 내용(서비스 이름·금액)이 링크에 담겨, 링크를 받은 사람은 누구나 볼 수 있고 보낸 링크는 취소할 수 없어요. 사용 횟수와 나눠 내는 금액은 담지 않고, 링크의 내용은 서버에 저장하지 않아요.",
      maskNames: "서비스 이름과 구독별 금액 가리고 공유하기",
      maskSingleHint: "구독이 하나뿐이면 합계만 보고도 어떤 서비스인지 짐작할 수 있어요.",
      nothingToShare: "결제가 적힌 영수증만 공유할 수 있어요. 다른 달을 골라 보세요.",
      confirmTitle: "영수증 링크를 보낼까요?",
      confirmBody:
        "영수증 내용이 링크에 담겨요. 링크를 받은 사람은 누구나 볼 수 있고, 다시 전달될 수도 있어요. 보낸 링크는 취소할 수 없어요.",
      confirmOk: "공유하기",
      yearDetail: (year: number) => `${year}년 결산 자세히 보기`,
      imageSaved: "영수증 이미지를 저장했어요",
      imageFailed: "이미지를 만들지 못했어요. 글로 공유해 보세요.",
      textCopied: "영수증 글을 복사했어요",
      design: "영수증 디자인",
      themes: {
        classic: "기본",
        color: "컬러 감열지",
        pass: "탑승권",
        tag: "가격표 태그",
        chat: "채팅",
      },
      previewAlt: (period: string) => `${period} 구독 영수증 이미지`,
    },
    art: {
      passHeader: "SUBSCRIPTION PASS",
      from: "FROM",
      to: "TO",
      period: "기간",
      count: "건수",
      issued: "발행",
      countValue: (count: number) => `${count}건`,
      chatAskMonth: (month: number) => `${month}월에 구독료 얼마 냈어?`,
      chatAskYear: (year: number) => `${year}년에 구독료 얼마 냈어?`,
      chatReply: (period: string) => `${period} 구독 영수증이에요.`,
    },
    image: {
      noCanvas: "캔버스를 쓸 수 없습니다",
      noBlob: "그림을 만들지 못했습니다",
    },
  },
};

export const en: Widen<typeof ko> = {
  receiptView: {
    periodMonth: (year, month) => `${MONTHS_LONG[Number(month) - 1] ?? month} ${year}`,
    periodYear: (year) => String(year),
    title: "Subscription receipt",
    paperLabel: (period) => `${period} subscription receipt`,
    issued: (number, date) => `No. ${number} · issued ${date}`,
    empty: "No subscriptions were charged",
    unknownEmpty: (period) =>
      `There's no subscription we know was charged in ${period}. Months before you added a subscription, and yearly plans without a billing month, are left blank.`,
    unknownValue: "Unknown",
    total: (count) => `Total (your share) · ${count} ${one(count) ? "charge" : "charges"}`,
    billed: "Charged to your card",
    defended: "Money kept by cancelling",
    killedIn: (names) => `Cancelled in this period: ${names}`,
    priciestBefore: "Highest cost per use: ",
    priciestAfter: (amount) => ` (${amount} per use)`,
    priciestPlain: (name, amount) => `Highest cost per use: ${name} (${amount} per use)`,
    line: {
      paidDates: (dates) => `Paid ${dates}`,
      paidCount: (count) => `Paid ${count} ${one(count) ? "time" : "times"}`,
      upcoming: (dates) => `Due ${dates}`,
      evidenceAll: "confirmed from payment emails",
      evidenceSome: (count) =>
        `${count} ${one(count) ? "payment" : "payments"} confirmed from payment emails`,
      yearly: "yearly",
      shared: (billed) => `shared · card ${billed}`,
      killedOn: (date) => `cancelled ${date}`,
      zeroUses: "0 check-ins",
      uses: (count, perUse) => `${count} ${one(count) ? "use" : "uses"} · ${perUse} per use`,
      noCheckIn: "no check-in",
    },
    suffix: {
      withUpcoming: " · including upcoming charges",
      untilToday: " · up to today",
    },
    notes: {
      base: "Calculated from your registered subscription records. It may differ from your card statement.",
      evidenced: (count, shared) =>
        `${count} ${one(count) ? "payment" : "payments"} from before you registered ${one(count) ? "was" : "were"} added using the date and amount in payment emails found in Gmail.${
          shared ? " Your share of shared subscriptions uses the current split." : ""
        }`,
      historical:
        "Past dollar payments were converted at the published rate on the payment date (ECB). It may differ slightly from your card company's rate.",
      current: (count) =>
        `${count} past dollar ${one(count) ? "payment" : "payments"} couldn't get that day's rate, so ${one(count) ? "it uses" : "they use"} the rate you set now.`,
      incompleteUpcoming:
        "This period isn't over yet. Subscriptions you have now whose billing day this month hasn't come are included as “due”.",
      incompleteToday: "This period isn't over yet, so only charges up to today are listed.",
      undated: (count) =>
        `${count} yearly ${one(count) ? "subscription" : "subscriptions"} with an unknown billing month couldn't be included.`,
      beforeRegistration: (count) =>
        `Months before you registered with no payment email found were left out because we don't know if you were subscribed (${count}).`,
      trial: (count) => `Billing days during a free trial were left out (${count}).`,
      defendedUnknown: (count) =>
        `${count} ${one(count) ? "subscription" : "subscriptions"} couldn't be counted in the money kept because the billing month or cancellation date is unknown.`,
    },
    share: {
      title: (period, suffix) => `SubSlash subscription receipt · ${period}${suffix}`,
      upcomingInTitle: " (including upcoming charges)",
      todayInTitle: " (up to today)",
      upcomingMark: " (due)",
      total: "Total (your share)",
      defended: "Money kept by cancelling",
    },
    shared: {
      badge: "A shared subscription receipt",
      note: "This is what the sender recorded, carried in the link. SubSlash hasn't checked it, and it can't be used as proof.",
      invalid: "Couldn't read this receipt. The link may have been cut off or changed.",
      cta: "Make my own receipt with SubSlash",
      unverifiedMark: "Receipt received via a shared link. SubSlash hasn't checked its contents.",
      maskedName: (n) => `Subscription ${n}`,
      maskedKilled: (n) => `Canceled subscription ${n}`,
      hiddenSummary: (subscriptions, charges) =>
        `${subscriptions} subscription${subscriptions === 1 ? "" : "s"} · ${charges} charge${charges === 1 ? "" : "s"} (service names and per-subscription amounts hidden)`,
      reopen: "The receipt isn't kept in the address bar. Open the link you received again.",
    },
    page: {
      back: "← Report",
      tabsLabel: "Receipt period",
      month: "Month",
      year: "Year in review",
      otherPeriods: "Other periods",
      next: "Next",
      saveImage: "Save as image",
      share: "Share",
      privacy:
        "The receipt is made from this device's records. When you share it, its contents (service names and amounts) go into the link: anyone with the link can see them, and a sent link can't be taken back. Usage counts and shared-plan amounts aren't included, and the link's contents aren't stored on our server.",
      maskNames: "Hide service names and per-subscription amounts when sharing",
      maskSingleHint: "With only one subscription, the total alone may reveal which service it is.",
      nothingToShare: "Only receipts with charges on them can be shared. Try another month.",
      confirmTitle: "Send a receipt link?",
      confirmBody:
        "The receipt's contents go into the link. Anyone with the link can see them, and it may be forwarded. A sent link can't be taken back.",
      confirmOk: "Share",
      yearDetail: (year) => `See the ${year} year in review`,
      imageSaved: "Saved the receipt image",
      imageFailed: "Couldn't make the image. Try sharing it as text.",
      textCopied: "Copied the receipt text",
      design: "Receipt design",
      themes: {
        classic: "Classic",
        color: "Color thermal",
        pass: "Boarding pass",
        tag: "Price tag",
        chat: "Chat",
      },
      previewAlt: (period) => `${period} subscription receipt image`,
    },
    art: {
      passHeader: "SUBSCRIPTION PASS",
      from: "FROM",
      to: "TO",
      period: "Period",
      count: "Charges",
      issued: "Issued",
      countValue: (count) => `${count}`,
      chatAskMonth: (month) =>
        `How much did I pay for subscriptions in ${MONTHS_LONG[month - 1] ?? month}?`,
      chatAskYear: (year) => `How much did I pay for subscriptions in ${year}?`,
      chatReply: (period) => `Here's your subscription receipt for ${period}.`,
    },
    image: {
      noCanvas: "Canvas is not available",
      noBlob: "Couldn't create the image",
    },
  },
};

export const zh: Widen<typeof ko> = {
  receiptView: {
    periodMonth: (year, month) => `${year}年${Number(month)}月`,
    periodYear: (year) => `${year}年`,
    title: "订阅小票",
    paperLabel: (period) => `${period} 订阅小票`,
    issued: (number, date) => `No. ${number} · ${date} 开具`,
    empty: "没有扣款的订阅",
    unknownEmpty: (period) =>
      `没有能确定在${period}付过款的订阅。添加订阅之前的月份，以及不知道付款月份的年付订阅，都留空了。`,
    unknownValue: "未知",
    total: (count) => `合计（我的份额）· ${count} 笔`,
    billed: "卡上扣款",
    defended: "退订守住的钱",
    killedIn: (names) => `本期退订：${names}`,
    priciestBefore: "单次成本最高：",
    priciestAfter: (amount) => `（每次 ${amount}）`,
    priciestPlain: (name, amount) => `单次成本最高：${name}（每次 ${amount}）`,
    line: {
      paidDates: (dates) => `${dates} 已付`,
      paidCount: (count) => `已付 ${count} 次`,
      upcoming: (dates) => `${dates} 将扣款`,
      evidenceAll: "已通过付款邮件确认",
      evidenceSome: (count) => `${count} 笔已通过付款邮件确认`,
      yearly: "年付",
      shared: (billed) => `分摊 · 卡上 ${billed}`,
      killedOn: (date) => `${date} 退订`,
      zeroUses: "签到 0 次",
      uses: (count, perUse) => `${count} 次 · 每次 ${perUse}`,
      noCheckIn: "未签到",
    },
    suffix: { withUpcoming: " · 含即将扣款", untilToday: " · 截至今天" },
    notes: {
      base: "根据登记的订阅记录计算，可能与银行卡账单不同。",
      evidenced: (count, shared) =>
        `登记之前的 ${count} 笔付款，按 Gmail 中找到的付款邮件的日期和金额补充。${shared ? "分摊订阅的份额按当前的分摊方式计算。" : ""}`,
      historical: "过去的美元付款按付款日的公布汇率（ECB）换算，可能与发卡机构的汇率略有不同。",
      current: (count) => `${count} 笔过去的美元付款无法取得当天汇率，因此使用你现在设置的汇率。`,
      incompleteUpcoming: "本期尚未结束。本月扣款日还没到的现有订阅以“将扣款”计入。",
      incompleteToday: "本期尚未结束，因此只列出截至今天的扣款。",
      undated: (count) => `${count} 个不知道扣款月份的年付订阅无法计入。`,
      beforeRegistration: (count) =>
        `登记之前没有找到付款邮件的月份，因为不知道是否在订阅，所以未计入（${count}）。`,
      trial: (count) => `免费试用期间的扣款日未计入（${count}）。`,
      defendedUnknown: (count) => `${count} 个订阅因扣款月份或退订日期不明，未计入守住的钱。`,
    },
    share: {
      title: (period, suffix) => `SubSlash 订阅小票 · ${period}${suffix}`,
      upcomingInTitle: "（含即将扣款）",
      todayInTitle: "（截至今天）",
      upcomingMark: "（将扣款）",
      total: "合计（我的份额）",
      defended: "退订守住的钱",
    },
    shared: {
      badge: "收到的订阅小票",
      note: "这是发送者自己记录的内容，放在链接里。SubSlash 没有核实，不能作为凭证。",
      invalid: "无法读取这张小票。链接可能被截断或改动了。",
      cta: "用 SubSlash 生成我的订阅小票",
      unverifiedMark: "通过分享链接收到的小票。SubSlash 未核实其内容。",
      maskedName: (n) => `订阅 ${n}`,
      maskedKilled: (n) => `已取消的订阅 ${n}`,
      hiddenSummary: (subscriptions, charges) =>
        `${subscriptions} 个订阅 · ${charges} 笔付款（已隐藏服务名称和各订阅金额）`,
      reopen: "小票不会保留在地址栏中。请重新打开收到的链接。",
    },
    page: {
      back: "← 报告",
      tabsLabel: "小票期间",
      month: "按月",
      year: "年度总结",
      otherPeriods: "其他期间",
      next: "下一个",
      saveImage: "保存为图片",
      share: "分享",
      privacy:
        "小票由这台设备上的记录生成。分享时，小票内容（服务名称和金额）会放进链接里：拿到链接的任何人都能看到，发出的链接无法撤回。不包含使用次数和分摊金额，链接内容也不会保存在服务器上。",
      maskNames: "分享时隐藏服务名称和各订阅金额",
      maskSingleHint: "只有一个订阅时，仅凭合计也可能猜出是哪项服务。",
      nothingToShare: "只有列出付款的小票才能分享。请选择其他月份。",
      confirmTitle: "要发送小票链接吗？",
      confirmBody:
        "小票内容会放进链接里。拿到链接的任何人都能看到，也可能被转发。发出的链接无法撤回。",
      confirmOk: "分享",
      yearDetail: (year) => `查看 ${year} 年度总结`,
      imageSaved: "已保存小票图片",
      imageFailed: "无法生成图片。请尝试以文字分享。",
      textCopied: "已复制小票文字",
      design: "小票样式",
      themes: { classic: "默认", color: "彩色热敏纸", pass: "登机牌", tag: "价签", chat: "聊天" },
      previewAlt: (period) => `${period} 订阅小票图片`,
    },
    art: {
      passHeader: "SUBSCRIPTION PASS",
      from: "FROM",
      to: "TO",
      period: "期间",
      count: "笔数",
      issued: "开具",
      countValue: (count) => `${count} 笔`,
      chatAskMonth: (month) => `我${month}月订阅花了多少钱？`,
      chatAskYear: (year) => `我${year}年订阅花了多少钱？`,
      chatReply: (period) => `这是你 ${period} 的订阅小票。`,
    },
    image: { noCanvas: "无法使用 Canvas", noBlob: "无法生成图片" },
  },
};

export const ja: Widen<typeof ko> = {
  receiptView: {
    periodMonth: (year, month) => `${year}年${Number(month)}月`,
    periodYear: (year) => `${year}年`,
    title: "サブスクのレシート",
    paperLabel: (period) => `${period} サブスクのレシート`,
    issued: (number, date) => `No. ${number} · ${date} 発行`,
    empty: "請求されたサブスクはありません",
    unknownEmpty: (period) =>
      `${period}に支払ったと分かるサブスクがありません。登録する前の月や、支払い月が分からない年額プランは空けてあります。`,
    unknownValue: "不明",
    total: (count) => `合計（自分の負担分）· ${count} 件`,
    billed: "カードへの請求",
    defended: "解約で守ったお金",
    killedIn: (names) => `この期間に解約: ${names}`,
    priciestBefore: "1 回あたりが一番高い: ",
    priciestAfter: (amount) => `（1 回 ${amount}）`,
    priciestPlain: (name, amount) => `1 回あたりが一番高い: ${name}（1 回 ${amount}）`,
    line: {
      paidDates: (dates) => `${dates} 支払い`,
      paidCount: (count) => `${count} 回支払い`,
      upcoming: (dates) => `${dates} 支払い予定`,
      evidenceAll: "支払いメールで確認",
      evidenceSome: (count) => `${count} 件を支払いメールで確認`,
      yearly: "年払い",
      shared: (billed) => `共有 · カード ${billed}`,
      killedOn: (date) => `${date} 解約`,
      zeroUses: "チェックイン 0 回",
      uses: (count, perUse) => `${count} 回 · 1 回 ${perUse}`,
      noCheckIn: "チェックインなし",
    },
    suffix: { withUpcoming: " · 支払い予定を含む", untilToday: " · 今日まで" },
    notes: {
      base: "登録したサブスクの記録から計算しました。カードの明細と違うことがあります。",
      evidenced: (count, shared) =>
        `登録前の支払い ${count} 件は、Gmail で見つけた支払いメールの日付と金額で補いました。${shared ? "共有サブスクの負担分は今の分け方で計算しています。" : ""}`,
      historical:
        "過去のドル払いは支払日の公表レート（ECB）で換算しました。カード会社のレートとは少し違うことがあります。",
      current: (count) =>
        `過去のドル払い ${count} 件はその日のレートが取れず、今設定しているレートを使いました。`,
      incompleteUpcoming:
        "この期間はまだ終わっていません。今月の支払日がまだ来ていない今のサブスクは「支払い予定」として含めています。",
      incompleteToday: "この期間はまだ終わっていないため、今日までの請求だけを載せています。",
      undated: (count) => `支払月がわからない年払いのサブスク ${count} 件は含められませんでした。`,
      beforeRegistration: (count) =>
        `登録前で支払いメールが見つからなかった月は、契約していたかわからないので除きました（${count}）。`,
      trial: (count) => `無料体験中の支払日は除きました（${count}）。`,
      defendedUnknown: (count) =>
        `${count} 件のサブスクは支払月か解約日がわからず、守ったお金に数えられませんでした。`,
    },
    share: {
      title: (period, suffix) => `SubSlash サブスクのレシート · ${period}${suffix}`,
      upcomingInTitle: "（支払い予定を含む）",
      todayInTitle: "（今日まで）",
      upcomingMark: "（予定）",
      total: "合計（自分の負担分）",
      defended: "解約で守ったお金",
    },
    shared: {
      badge: "共有されたサブスクのレシート",
      note: "送った人が自分で記録した内容をリンクに入れたものです。SubSlashは確認しておらず、証明には使えません。",
      invalid: "レシートを読み込めませんでした。リンクが途中で切れたか、変わった可能性があります。",
      cta: "SubSlashで自分のレシートを作る",
      unverifiedMark: "共有リンクで受け取ったレシートです。SubSlashは内容を確認していません。",
      maskedName: (n) => `サブスク ${n}`,
      maskedKilled: (n) => `解約したサブスク ${n}`,
      hiddenSummary: (subscriptions, charges) =>
        `サブスク${subscriptions}件 · 支払い${charges}件（サービス名とサブスクごとの金額は隠しています）`,
      reopen: "レシートはアドレスバーに残しません。受け取ったリンクをもう一度開いてください。",
    },
    page: {
      back: "← レポート",
      tabsLabel: "レシートの期間",
      month: "月",
      year: "年間まとめ",
      otherPeriods: "ほかの期間",
      next: "次へ",
      saveImage: "画像で保存",
      share: "共有",
      privacy:
        "レシートはこの端末の記録から作ります。共有すると、レシートの内容（サービス名・金額）がリンクに入り、リンクを受け取った人は誰でも見られます。送ったリンクは取り消せません。利用回数や分担額は入れず、リンクの内容はサーバーに保存しません。",
      maskNames: "サービス名とサブスクごとの金額を隠して共有する",
      maskSingleHint: "サブスクが1つだけだと、合計だけでどのサービスか推測できることがあります。",
      nothingToShare: "支払いが載っているレシートだけ共有できます。ほかの月を選んでみてください。",
      confirmTitle: "レシートのリンクを送りますか？",
      confirmBody:
        "レシートの内容がリンクに入ります。リンクを受け取った人は誰でも見られ、転送されることもあります。送ったリンクは取り消せません。",
      confirmOk: "共有する",
      yearDetail: (year) => `${year}年の年間まとめを見る`,
      imageSaved: "レシートの画像を保存しました",
      imageFailed: "画像を作れませんでした。テキストで共有してみてください。",
      textCopied: "レシートの文章をコピーしました",
      design: "レシートのデザイン",
      themes: {
        classic: "ベーシック",
        color: "カラー感熱紙",
        pass: "搭乗券",
        tag: "値札タグ",
        chat: "チャット",
      },
      previewAlt: (period) => `${period} のサブスクレシート画像`,
    },
    art: {
      passHeader: "SUBSCRIPTION PASS",
      from: "FROM",
      to: "TO",
      period: "期間",
      count: "件数",
      issued: "発行",
      countValue: (count) => `${count} 件`,
      chatAskMonth: (month) => `${month}月のサブスク代はいくらだった？`,
      chatAskYear: (year) => `${year}年のサブスク代はいくらだった？`,
      chatReply: (period) => `${period}のサブスクレシートです。`,
    },
    image: { noCanvas: "Canvas を使えません", noBlob: "画像を作れませんでした" },
  },
};

export const vi: Widen<typeof ko> = {
  receiptView: {
    periodMonth: (year, month) => `Tháng ${Number(month)}/${year}`,
    periodYear: (year) => `Năm ${year}`,
    title: "Hóa đơn gói đăng ký",
    paperLabel: (period) => `Hóa đơn gói đăng ký ${period}`,
    issued: (number, date) => `Số ${number} · xuất ngày ${date}`,
    empty: "Không có gói nào bị trừ tiền",
    unknownEmpty: (period) =>
      `Không có gói nào được biết là đã thanh toán trong ${period}. Các tháng trước khi bạn thêm gói và gói năm chưa rõ tháng thanh toán được để trống.`,
    unknownValue: "Không rõ",
    total: (count) => `Tổng (phần của tôi) · ${count} khoản`,
    billed: "Trừ trên thẻ",
    defended: "Tiền giữ lại nhờ hủy",
    killedIn: (names) => `Đã hủy trong kỳ này: ${names}`,
    priciestBefore: "Chi phí mỗi lần dùng cao nhất: ",
    priciestAfter: (amount) => ` (${amount} mỗi lần)`,
    priciestPlain: (name, amount) => `Chi phí mỗi lần dùng cao nhất: ${name} (${amount} mỗi lần)`,
    line: {
      paidDates: (dates) => `Đã trả ${dates}`,
      paidCount: (count) => `Đã trả ${count} lần`,
      upcoming: (dates) => `Sắp trả ${dates}`,
      evidenceAll: "đã xác nhận qua email thanh toán",
      evidenceSome: (count) => `${count} khoản đã xác nhận qua email thanh toán`,
      yearly: "theo năm",
      shared: (billed) => `dùng chung · thẻ ${billed}`,
      killedOn: (date) => `hủy ngày ${date}`,
      zeroUses: "0 lần check-in",
      uses: (count, perUse) => `${count} lần · ${perUse} mỗi lần`,
      noCheckIn: "chưa check-in",
    },
    suffix: { withUpcoming: " · gồm khoản sắp trừ", untilToday: " · đến hôm nay" },
    notes: {
      base: "Tính từ dữ liệu gói đăng ký đã nhập. Có thể khác với sao kê thẻ.",
      evidenced: (count, shared) =>
        `${count} khoản thanh toán trước khi bạn đăng ký được bổ sung theo ngày và số tiền trong email thanh toán tìm thấy ở Gmail.${shared ? " Phần của bạn trong gói dùng chung tính theo cách chia hiện tại." : ""}`,
      historical:
        "Các khoản trả bằng đô la trước đây được quy đổi theo tỷ giá công bố ngày thanh toán (ECB). Có thể hơi khác tỷ giá của ngân hàng phát hành thẻ.",
      current: (count) =>
        `${count} khoản trả bằng đô la trước đây không lấy được tỷ giá ngày đó, nên dùng tỷ giá bạn đang đặt.`,
      incompleteUpcoming:
        "Kỳ này chưa kết thúc. Các gói hiện có mà ngày thanh toán tháng này chưa đến được tính là “sắp trừ”.",
      incompleteToday: "Kỳ này chưa kết thúc nên chỉ liệt kê các khoản đến hôm nay.",
      undated: (count) =>
        `${count} gói trả theo năm không rõ tháng thanh toán nên không được tính.`,
      beforeRegistration: (count) =>
        `Các tháng trước khi đăng ký mà không tìm thấy email thanh toán bị bỏ qua vì không biết bạn có đăng ký hay không (${count}).`,
      trial: (count) => `Đã bỏ qua các ngày thanh toán trong thời gian dùng thử (${count}).`,
      defendedUnknown: (count) =>
        `${count} gói không được tính vào tiền giữ lại vì không rõ tháng thanh toán hoặc ngày hủy.`,
    },
    share: {
      title: (period, suffix) => `Hóa đơn gói đăng ký SubSlash · ${period}${suffix}`,
      upcomingInTitle: " (gồm khoản sắp trừ)",
      todayInTitle: " (đến hôm nay)",
      upcomingMark: " (sắp trừ)",
      total: "Tổng (phần của tôi)",
      defended: "Tiền giữ lại nhờ hủy",
    },
    shared: {
      badge: "Hóa đơn đăng ký được chia sẻ",
      note: "Đây là nội dung người gửi tự ghi lại, được đưa vào liên kết. SubSlash chưa kiểm tra và không thể dùng làm bằng chứng.",
      invalid: "Không đọc được hóa đơn này. Liên kết có thể đã bị cắt hoặc bị thay đổi.",
      cta: "Tạo hóa đơn của tôi với SubSlash",
      unverifiedMark: "Hóa đơn nhận qua liên kết chia sẻ. SubSlash chưa kiểm tra nội dung.",
      maskedName: (n) => `Gói đăng ký ${n}`,
      maskedKilled: (n) => `Gói đã hủy ${n}`,
      hiddenSummary: (subscriptions, charges) =>
        `${subscriptions} gói đăng ký · ${charges} lần thanh toán (đã ẩn tên dịch vụ và số tiền từng gói)`,
      reopen: "Hóa đơn không được giữ trên thanh địa chỉ. Hãy mở lại liên kết bạn nhận được.",
    },
    page: {
      back: "← Báo cáo",
      tabsLabel: "Kỳ hóa đơn",
      month: "Tháng",
      year: "Tổng kết năm",
      otherPeriods: "Kỳ khác",
      next: "Tiếp",
      saveImage: "Lưu thành ảnh",
      share: "Chia sẻ",
      privacy:
        "Hóa đơn được tạo từ dữ liệu trên thiết bị này. Khi chia sẻ, nội dung hóa đơn (tên dịch vụ và số tiền) được đưa vào liên kết: bất kỳ ai có liên kết đều xem được, và liên kết đã gửi không thể thu hồi. Số lần sử dụng và số tiền chia sẻ không được đưa vào, và nội dung liên kết không được lưu trên máy chủ.",
      maskNames: "Ẩn tên dịch vụ và số tiền từng gói khi chia sẻ",
      maskSingleHint:
        "Nếu chỉ có một gói, chỉ cần nhìn tổng cũng có thể đoán ra đó là dịch vụ nào.",
      nothingToShare: "Chỉ có thể chia sẻ hóa đơn có ghi khoản thanh toán. Hãy chọn tháng khác.",
      confirmTitle: "Gửi liên kết hóa đơn?",
      confirmBody:
        "Nội dung hóa đơn được đưa vào liên kết. Bất kỳ ai có liên kết đều xem được và có thể chuyển tiếp. Liên kết đã gửi không thể thu hồi.",
      confirmOk: "Chia sẻ",
      yearDetail: (year) => `Xem tổng kết năm ${year}`,
      imageSaved: "Đã lưu ảnh hóa đơn",
      imageFailed: "Không tạo được ảnh. Hãy thử chia sẻ dạng văn bản.",
      textCopied: "Đã sao chép nội dung hóa đơn",
      design: "Mẫu hóa đơn",
      themes: {
        classic: "Cơ bản",
        color: "Giấy in nhiệt màu",
        pass: "Thẻ lên máy bay",
        tag: "Thẻ giá",
        chat: "Trò chuyện",
      },
      previewAlt: (period) => `Ảnh hóa đơn gói đăng ký ${period}`,
    },
    art: {
      passHeader: "SUBSCRIPTION PASS",
      from: "FROM",
      to: "TO",
      period: "Kỳ",
      count: "Số khoản",
      issued: "Ngày lập",
      countValue: (count) => `${count} khoản`,
      chatAskMonth: (month) => `Tháng ${month} mình trả bao nhiêu cho gói đăng ký?`,
      chatAskYear: (year) => `Năm ${year} mình trả bao nhiêu cho gói đăng ký?`,
      chatReply: (period) => `Đây là hóa đơn gói đăng ký ${period} của bạn.`,
    },
    image: { noCanvas: "Không dùng được Canvas", noBlob: "Không tạo được ảnh" },
  },
};

export const fr: Widen<typeof ko> = {
  receiptView: {
    periodMonth: (year, month) => `${monthName("fr", month)} ${year}`,
    periodYear: (year) => String(year),
    title: "Ticket d'abonnements",
    paperLabel: (period) => `Ticket d'abonnements — ${period}`,
    issued: (number, date) => `N° ${number} · émis le ${date}`,
    empty: "Aucun abonnement n'a été débité",
    unknownEmpty: (period) =>
      `Aucun abonnement dont on sait qu'il a été payé en ${period}. Les mois avant l'ajout d'un abonnement et les forfaits annuels sans mois de paiement sont laissés vides.`,
    unknownValue: "Inconnu",
    total: (count) => `Total (votre part) · ${count} paiement${Number(count) === 1 ? "" : "s"}`,
    billed: "Débité sur votre carte",
    defended: "Argent économisé en résiliant",
    killedIn: (names) => `Résiliés sur la période : ${names}`,
    priciestBefore: "Coût par utilisation le plus élevé : ",
    priciestAfter: (amount) => ` (${amount} par utilisation)`,
    priciestPlain: (name, amount) =>
      `Coût par utilisation le plus élevé : ${name} (${amount} par utilisation)`,
    line: {
      paidDates: (dates) => `Payé le ${dates}`,
      paidCount: (count) => `Payé ${count} fois`,
      upcoming: (dates) => `Prévu le ${dates}`,
      evidenceAll: "confirmé par les e-mails de paiement",
      evidenceSome: (count) =>
        `${count} paiement${Number(count) === 1 ? " confirmé" : "s confirmés"} par e-mail`,
      yearly: "annuel",
      shared: (billed) => `partagé · carte ${billed}`,
      killedOn: (date) => `résilié le ${date}`,
      zeroUses: "0 check-in",
      uses: (count, perUse) =>
        `${count} utilisation${Number(count) === 1 ? "" : "s"} · ${perUse} par utilisation`,
      noCheckIn: "pas de check-in",
    },
    suffix: { withUpcoming: " · paiements à venir inclus", untilToday: " · jusqu'à aujourd'hui" },
    notes: {
      base: "Calculé à partir de vos abonnements enregistrés. Peut différer de votre relevé de carte.",
      evidenced: (count, shared) =>
        `${count} paiement${Number(count) === 1 ? " antérieur" : "s antérieurs"} à votre enregistrement ${Number(count) === 1 ? "a été ajouté" : "ont été ajoutés"} d'après la date et le montant des e-mails de paiement trouvés dans Gmail.${shared ? " Votre part des abonnements partagés utilise la répartition actuelle." : ""}`,
      historical:
        "Les paiements passés en dollars ont été convertis au taux publié du jour du paiement (BCE). Il peut légèrement différer du taux de votre banque.",
      current: (count) =>
        `${count} paiement${Number(count) === 1 ? "" : "s"} passé${Number(count) === 1 ? "" : "s"} en dollars n'${Number(count) === 1 ? "a" : "ont"} pas pu obtenir le taux du jour : le taux que vous avez défini est utilisé.`,
      incompleteUpcoming:
        "Cette période n'est pas terminée. Les abonnements actuels dont le jour de paiement de ce mois n'est pas encore arrivé sont inclus comme « prévus ».",
      incompleteToday:
        "Cette période n'est pas terminée : seuls les paiements jusqu'à aujourd'hui sont listés.",
      undated: (count) =>
        `${count} abonnement${Number(count) === 1 ? "" : "s"} annuel${Number(count) === 1 ? "" : "s"} sans mois de paiement connu n'${Number(count) === 1 ? "a" : "ont"} pas pu être inclus.`,
      beforeRegistration: (count) =>
        `Les mois antérieurs à l'enregistrement sans e-mail de paiement ont été exclus, car nous ne savons pas si vous étiez abonné (${count}).`,
      trial: (count) => `Les jours de paiement pendant un essai gratuit ont été exclus (${count}).`,
      defendedUnknown: (count) =>
        `${count} abonnement${Number(count) === 1 ? "" : "s"} n'${Number(count) === 1 ? "a" : "ont"} pas pu être compté${Number(count) === 1 ? "" : "s"} dans l'argent économisé : mois de paiement ou date de résiliation inconnu.`,
    },
    share: {
      title: (period, suffix) => `Ticket d'abonnements SubSlash · ${period}${suffix}`,
      upcomingInTitle: " (paiements à venir inclus)",
      todayInTitle: " (jusqu'à aujourd'hui)",
      upcomingMark: " (prévu)",
      total: "Total (votre part)",
      defended: "Argent économisé en résiliant",
    },
    shared: {
      badge: "Ticket d'abonnements partagé",
      note: "Il s'agit de ce que l'expéditeur a lui-même enregistré, placé dans le lien. SubSlash ne l'a pas vérifié et il ne peut pas servir de justificatif.",
      invalid: "Impossible de lire ce ticket. Le lien a peut-être été coupé ou modifié.",
      cta: "Créer mon ticket avec SubSlash",
      unverifiedMark: "Ticket reçu par un lien partagé. SubSlash n'a pas vérifié son contenu.",
      maskedName: (n) => `Abonnement ${n}`,
      maskedKilled: (n) => `Abonnement résilié ${n}`,
      hiddenSummary: (subscriptions, charges) =>
        `${subscriptions} abonnement${subscriptions > 1 ? "s" : ""} · ${charges} paiement${charges > 1 ? "s" : ""} (noms des services et montants par abonnement masqués)`,
      reopen:
        "Le ticket n'est pas conservé dans la barre d'adresse. Rouvrez le lien que vous avez reçu.",
    },
    page: {
      back: "← Rapport",
      tabsLabel: "Période du ticket",
      month: "Mois",
      year: "Bilan de l'année",
      otherPeriods: "Autres périodes",
      next: "Suivant",
      saveImage: "Enregistrer en image",
      share: "Partager",
      privacy:
        "Le ticket est créé à partir des données de cet appareil. Si vous le partagez, son contenu (noms des services et montants) est placé dans le lien : toute personne qui a le lien peut le voir, et un lien envoyé ne peut pas être retiré. Le nombre d'utilisations et les montants partagés ne sont pas inclus, et le contenu du lien n'est pas enregistré sur notre serveur.",
      maskNames: "Masquer les noms des services et les montants par abonnement au partage",
      maskSingleHint:
        "Avec un seul abonnement, le total suffit parfois à deviner de quel service il s'agit.",
      nothingToShare:
        "Seuls les tickets comportant des paiements peuvent être partagés. Choisissez un autre mois.",
      confirmTitle: "Envoyer un lien vers le ticket ?",
      confirmBody:
        "Le contenu du ticket est placé dans le lien. Toute personne qui a le lien peut le voir, et il peut être transféré. Un lien envoyé ne peut pas être retiré.",
      confirmOk: "Partager",
      yearDetail: (year) => `Voir le bilan ${year}`,
      imageSaved: "Image du ticket enregistrée",
      imageFailed: "Impossible de créer l'image. Essayez de partager en texte.",
      textCopied: "Texte du ticket copié",
      design: "Style du ticket",
      themes: {
        classic: "Classique",
        color: "Thermique couleur",
        pass: "Carte d'embarquement",
        tag: "Étiquette de prix",
        chat: "Discussion",
      },
      previewAlt: (period) => `Image du ticket d'abonnements · ${period}`,
    },
    art: {
      passHeader: "SUBSCRIPTION PASS",
      from: "FROM",
      to: "TO",
      period: "Période",
      count: "Paiements",
      issued: "Émis le",
      countValue: (count) => `${count}`,
      chatAskMonth: (month) => `Combien j'ai payé en abonnements en ${monthName("fr", month)} ?`,
      chatAskYear: (year) => `Combien j'ai payé en abonnements en ${year} ?`,
      chatReply: (period) => `Voici votre ticket d'abonnements · ${period}.`,
    },
    image: { noCanvas: "Canvas indisponible", noBlob: "Impossible de créer l'image" },
  },
};

export const es: Widen<typeof ko> = {
  receiptView: {
    periodMonth: (year, month) => `${monthName("es", month)} de ${year}`,
    periodYear: (year) => String(year),
    title: "Ticket de suscripciones",
    paperLabel: (period) => `Ticket de suscripciones de ${period}`,
    issued: (number, date) => `N.º ${number} · emitido el ${date}`,
    empty: "No se cobró ninguna suscripción",
    unknownEmpty: (period) =>
      `No hay ninguna suscripción que sepamos que se cobró en ${period}. Los meses anteriores a añadir una suscripción y los planes anuales sin mes de cobro se dejan en blanco.`,
    unknownValue: "Desconocido",
    total: (count) => `Total (tu parte) · ${count} cobro${Number(count) === 1 ? "" : "s"}`,
    billed: "Cobrado a tu tarjeta",
    defended: "Dinero ahorrado cancelando",
    killedIn: (names) => `Canceladas en este periodo: ${names}`,
    priciestBefore: "Mayor coste por uso: ",
    priciestAfter: (amount) => ` (${amount} por uso)`,
    priciestPlain: (name, amount) => `Mayor coste por uso: ${name} (${amount} por uso)`,
    line: {
      paidDates: (dates) => `Pagado el ${dates}`,
      paidCount: (count) => `Pagado ${count} ${Number(count) === 1 ? "vez" : "veces"}`,
      upcoming: (dates) => `Se cobrará el ${dates}`,
      evidenceAll: "confirmado con correos de pago",
      evidenceSome: (count) =>
        `${count} pago${Number(count) === 1 ? " confirmado" : "s confirmados"} con correos de pago`,
      yearly: "anual",
      shared: (billed) => `compartida · tarjeta ${billed}`,
      killedOn: (date) => `cancelada el ${date}`,
      zeroUses: "0 registros",
      uses: (count, perUse) => `${count} uso${Number(count) === 1 ? "" : "s"} · ${perUse} por uso`,
      noCheckIn: "sin registro",
    },
    suffix: { withUpcoming: " · incluye cobros próximos", untilToday: " · hasta hoy" },
    notes: {
      base: "Calculado con tus suscripciones registradas. Puede diferir del extracto de tu tarjeta.",
      evidenced: (count, shared) =>
        `${count} pago${Number(count) === 1 ? " anterior" : "s anteriores"} a tu registro se ${Number(count) === 1 ? "añadió" : "añadieron"} con la fecha y el importe de los correos de pago encontrados en Gmail.${shared ? " Tu parte de las suscripciones compartidas usa el reparto actual." : ""}`,
      historical:
        "Los pagos pasados en dólares se convirtieron al tipo publicado el día del pago (BCE). Puede diferir un poco del tipo de tu banco.",
      current: (count) =>
        `${count} pago${Number(count) === 1 ? "" : "s"} pasado${Number(count) === 1 ? "" : "s"} en dólares no ${Number(count) === 1 ? "obtuvo" : "obtuvieron"} el tipo de ese día, así que se usa el tipo que tienes configurado.`,
      incompleteUpcoming:
        "Este periodo no ha terminado. Las suscripciones actuales cuyo día de cobro de este mes no ha llegado se incluyen como «por cobrar».",
      incompleteToday: "Este periodo no ha terminado, así que solo se listan los cobros hasta hoy.",
      undated: (count) =>
        `${Number(count) === 1 ? "No se pudo" : "No se pudieron"} incluir ${count} suscripci${Number(count) === 1 ? "ón anual" : "ones anuales"} sin mes de cobro conocido.`,
      beforeRegistration: (count) =>
        `Se excluyeron los meses anteriores al registro sin correo de pago, porque no sabemos si estabas suscrito (${count}).`,
      trial: (count) => `Se excluyeron los días de cobro durante la prueba gratuita (${count}).`,
      defendedUnknown: (count) =>
        `${count} suscripci${Number(count) === 1 ? "ón no se pudo" : "ones no se pudieron"} contar en el dinero ahorrado porque se desconoce el mes de cobro o la fecha de cancelación.`,
    },
    share: {
      title: (period, suffix) => `Ticket de suscripciones SubSlash · ${period}${suffix}`,
      upcomingInTitle: " (incluye cobros próximos)",
      todayInTitle: " (hasta hoy)",
      upcomingMark: " (por cobrar)",
      total: "Total (tu parte)",
      defended: "Dinero ahorrado cancelando",
    },
    shared: {
      badge: "Ticket de suscripciones compartido",
      note: "Es lo que registró quien lo envió, guardado en el enlace. SubSlash no lo ha comprobado y no sirve como justificante.",
      invalid: "No se pudo leer este ticket. Puede que el enlace esté cortado o modificado.",
      cta: "Crear mi ticket con SubSlash",
      unverifiedMark:
        "Ticket recibido por un enlace compartido. SubSlash no ha comprobado su contenido.",
      maskedName: (n) => `Suscripción ${n}`,
      maskedKilled: (n) => `Suscripción cancelada ${n}`,
      hiddenSummary: (subscriptions, charges) =>
        `${subscriptions} suscripci${subscriptions === 1 ? "ón" : "ones"} · ${charges} cobro${charges === 1 ? "" : "s"} (nombres de servicios e importes por suscripción ocultos)`,
      reopen:
        "El ticket no se guarda en la barra de direcciones. Vuelve a abrir el enlace que recibiste.",
    },
    page: {
      back: "← Informe",
      tabsLabel: "Periodo del ticket",
      month: "Mes",
      year: "Resumen del año",
      otherPeriods: "Otros periodos",
      next: "Siguiente",
      saveImage: "Guardar como imagen",
      share: "Compartir",
      privacy:
        "El ticket se crea con los datos de este dispositivo. Al compartirlo, su contenido (nombres de servicios e importes) va dentro del enlace: cualquiera que tenga el enlace puede verlo y un enlace enviado no se puede retirar. No se incluyen los usos ni los importes compartidos, y el contenido del enlace no se guarda en nuestro servidor.",
      maskNames: "Ocultar los nombres de los servicios y los importes por suscripción al compartir",
      maskSingleHint:
        "Con una sola suscripción, el total puede bastar para adivinar qué servicio es.",
      nothingToShare: "Solo se pueden compartir tickets con cobros. Prueba con otro mes.",
      confirmTitle: "¿Enviar un enlace al ticket?",
      confirmBody:
        "El contenido del ticket va dentro del enlace. Cualquiera que tenga el enlace puede verlo y puede reenviarse. Un enlace enviado no se puede retirar.",
      confirmOk: "Compartir",
      yearDetail: (year) => `Ver el resumen de ${year}`,
      imageSaved: "Imagen del ticket guardada",
      imageFailed: "No se pudo crear la imagen. Prueba a compartirlo como texto.",
      textCopied: "Texto del ticket copiado",
      design: "Diseño del ticket",
      themes: {
        classic: "Clásico",
        color: "Térmico a color",
        pass: "Tarjeta de embarque",
        tag: "Etiqueta de precio",
        chat: "Chat",
      },
      previewAlt: (period) => `Imagen del ticket de suscripciones · ${period}`,
    },
    art: {
      passHeader: "SUBSCRIPTION PASS",
      from: "FROM",
      to: "TO",
      period: "Periodo",
      count: "Cargos",
      issued: "Emitido",
      countValue: (count) => `${count}`,
      chatAskMonth: (month) => `¿Cuánto pagué en suscripciones en ${monthName("es", month)}?`,
      chatAskYear: (year) => `¿Cuánto pagué en suscripciones en ${year}?`,
      chatReply: (period) => `Aquí tienes tu ticket de suscripciones · ${period}.`,
    },
    image: { noCanvas: "Canvas no disponible", noBlob: "No se pudo crear la imagen" },
  },
};

export const de: Widen<typeof ko> = {
  receiptView: {
    periodMonth: (year, month) => `${monthName("de", month)} ${year}`,
    periodYear: (year) => String(year),
    title: "Abo-Beleg",
    paperLabel: (period) => `Abo-Beleg ${period}`,
    issued: (number, date) => `Nr. ${number} · ausgestellt am ${date}`,
    empty: "Es wurden keine Abos abgebucht",
    unknownEmpty: (period) =>
      `Für ${period} ist kein Abo bekannt, das bezahlt wurde. Monate vor dem Hinzufügen eines Abos und Jahresabos ohne Abrechnungsmonat bleiben leer.`,
    unknownValue: "Unbekannt",
    total: (count) =>
      `Gesamt (dein Anteil) · ${count} ${Number(count) === 1 ? "Abbuchung" : "Abbuchungen"}`,
    billed: "Von der Karte abgebucht",
    defended: "Durch Kündigen gespartes Geld",
    killedIn: (names) => `In diesem Zeitraum gekündigt: ${names}`,
    priciestBefore: "Höchste Kosten pro Nutzung: ",
    priciestAfter: (amount) => ` (${amount} pro Nutzung)`,
    priciestPlain: (name, amount) => `Höchste Kosten pro Nutzung: ${name} (${amount} pro Nutzung)`,
    line: {
      paidDates: (dates) => `Bezahlt am ${dates}`,
      paidCount: (count) => `${count}-mal bezahlt`,
      upcoming: (dates) => `Fällig am ${dates}`,
      evidenceAll: "durch Zahlungs-E-Mails bestätigt",
      evidenceSome: (count) =>
        `${count} ${Number(count) === 1 ? "Zahlung" : "Zahlungen"} durch E-Mails bestätigt`,
      yearly: "jährlich",
      shared: (billed) => `geteilt · Karte ${billed}`,
      killedOn: (date) => `gekündigt am ${date}`,
      zeroUses: "0 Einträge",
      uses: (count, perUse) => `${count}-mal · ${perUse} pro Nutzung`,
      noCheckIn: "kein Eintrag",
    },
    suffix: { withUpcoming: " · inklusive anstehender Abbuchungen", untilToday: " · bis heute" },
    notes: {
      base: "Aus deinen eingetragenen Abos berechnet. Kann von deiner Kartenabrechnung abweichen.",
      evidenced: (count, shared) =>
        `${count} ${Number(count) === 1 ? "Zahlung" : "Zahlungen"} vor deiner Eintragung ${Number(count) === 1 ? "wurde" : "wurden"} mit Datum und Betrag aus den in Gmail gefundenen Zahlungs-E-Mails ergänzt.${shared ? " Dein Anteil an geteilten Abos nutzt die aktuelle Aufteilung." : ""}`,
      historical:
        "Frühere Dollarzahlungen wurden zum veröffentlichten Kurs des Zahlungstags (EZB) umgerechnet. Er kann leicht vom Kurs deiner Kartenfirma abweichen.",
      current: (count) =>
        `Für ${count} frühere Dollarzahlung${Number(count) === 1 ? "" : "en"} gab es keinen Tageskurs, daher wird dein aktuell eingestellter Kurs verwendet.`,
      incompleteUpcoming:
        "Dieser Zeitraum ist noch nicht vorbei. Aktuelle Abos, deren Abbuchungstag in diesem Monat noch kommt, sind als „fällig“ enthalten.",
      incompleteToday:
        "Dieser Zeitraum ist noch nicht vorbei, daher sind nur Abbuchungen bis heute aufgeführt.",
      undated: (count) =>
        `${count} ${Number(count) === 1 ? "Jahresabo" : "Jahresabos"} ohne bekannten Abbuchungsmonat konnte${Number(count) === 1 ? "" : "n"} nicht einbezogen werden.`,
      beforeRegistration: (count) =>
        `Monate vor der Eintragung ohne Zahlungs-E-Mail wurden ausgelassen, da unklar ist, ob du abonniert warst (${count}).`,
      trial: (count) =>
        `Abbuchungstage während eines kostenlosen Tests wurden ausgelassen (${count}).`,
      defendedUnknown: (count) =>
        `${count} ${Number(count) === 1 ? "Abo konnte" : "Abos konnten"} nicht zum gesparten Geld gezählt werden, weil Abbuchungsmonat oder Kündigungsdatum unbekannt ist.`,
    },
    share: {
      title: (period, suffix) => `SubSlash Abo-Beleg · ${period}${suffix}`,
      upcomingInTitle: " (inklusive anstehender Abbuchungen)",
      todayInTitle: " (bis heute)",
      upcomingMark: " (fällig)",
      total: "Gesamt (dein Anteil)",
      defended: "Durch Kündigen gespartes Geld",
    },
    shared: {
      badge: "Geteilter Abo-Beleg",
      note: "Das hat der Absender selbst erfasst und in den Link gepackt. SubSlash hat es nicht geprüft, und es taugt nicht als Nachweis.",
      invalid:
        "Dieser Beleg konnte nicht gelesen werden. Der Link wurde vielleicht abgeschnitten oder verändert.",
      cta: "Eigenen Beleg mit SubSlash erstellen",
      unverifiedMark:
        "Über einen geteilten Link erhaltener Beleg. SubSlash hat den Inhalt nicht geprüft.",
      maskedName: (n) => `Abo ${n}`,
      maskedKilled: (n) => `Gekündigtes Abo ${n}`,
      hiddenSummary: (subscriptions, charges) =>
        `${subscriptions} Abo${subscriptions === 1 ? "" : "s"} · ${charges} Zahlung${charges === 1 ? "" : "en"} (Namen der Dienste und Beträge pro Abo ausgeblendet)`,
      reopen: "Der Beleg bleibt nicht in der Adressleiste. Öffne den erhaltenen Link noch einmal.",
    },
    page: {
      back: "← Bericht",
      tabsLabel: "Belegzeitraum",
      month: "Monat",
      year: "Jahresrückblick",
      otherPeriods: "Andere Zeiträume",
      next: "Weiter",
      saveImage: "Als Bild speichern",
      share: "Teilen",
      privacy:
        "Der Beleg wird aus den Daten dieses Geräts erstellt. Wenn du ihn teilst, steht sein Inhalt (Namen der Dienste und Beträge) im Link: Jeder mit dem Link kann ihn sehen, und ein gesendeter Link lässt sich nicht zurückholen. Nutzungszahlen und geteilte Beträge sind nicht enthalten, und der Inhalt des Links wird nicht auf unserem Server gespeichert.",
      maskNames: "Namen der Dienste und Beträge pro Abo beim Teilen ausblenden",
      maskSingleHint:
        "Bei nur einem Abo lässt sich schon an der Summe erraten, welcher Dienst es ist.",
      nothingToShare: "Nur Belege mit Zahlungen können geteilt werden. Wähle einen anderen Monat.",
      confirmTitle: "Link zum Beleg senden?",
      confirmBody:
        "Der Inhalt des Belegs steht im Link. Jeder mit dem Link kann ihn sehen, und er kann weitergeleitet werden. Ein gesendeter Link lässt sich nicht zurückholen.",
      confirmOk: "Teilen",
      yearDetail: (year) => `Jahresrückblick ${year} ansehen`,
      imageSaved: "Belegbild gespeichert",
      imageFailed: "Das Bild konnte nicht erstellt werden. Versuch es als Text zu teilen.",
      textCopied: "Belegtext kopiert",
      design: "Belegdesign",
      themes: {
        classic: "Klassisch",
        color: "Farbiges Thermopapier",
        pass: "Bordkarte",
        tag: "Preisschild",
        chat: "Chat",
      },
      previewAlt: (period) => `Bild des Abo-Belegs · ${period}`,
    },
    art: {
      passHeader: "SUBSCRIPTION PASS",
      from: "FROM",
      to: "TO",
      period: "Zeitraum",
      count: "Zahlungen",
      issued: "Ausgestellt",
      countValue: (count) => `${count}`,
      chatAskMonth: (month) => `Wie viel habe ich im ${monthName("de", month)} für Abos bezahlt?`,
      chatAskYear: (year) => `Wie viel habe ich ${year} für Abos bezahlt?`,
      chatReply: (period) => `Hier ist dein Abo-Beleg · ${period}.`,
    },
    image: {
      noCanvas: "Canvas ist nicht verfügbar",
      noBlob: "Das Bild konnte nicht erstellt werden",
    },
  },
};

export const pt: Widen<typeof ko> = {
  receiptView: {
    periodMonth: (year, month) => `${monthName("pt", month)} de ${year}`,
    periodYear: (year) => String(year),
    title: "Recibo de assinaturas",
    paperLabel: (period) => `Recibo de assinaturas de ${period}`,
    issued: (number, date) => `Nº ${number} · emitido em ${date}`,
    empty: "Nenhuma assinatura foi cobrada",
    unknownEmpty: (period) =>
      `Não há nenhuma assinatura que saibamos ter sido cobrada em ${period}. Os meses antes de você adicionar uma assinatura e os planos anuais sem mês de cobrança ficam em branco.`,
    unknownValue: "Desconhecido",
    total: (count) => `Total (sua parte) · ${count} cobrança${Number(count) === 1 ? "" : "s"}`,
    billed: "Cobrado no seu cartão",
    defended: "Dinheiro economizado cancelando",
    killedIn: (names) => `Canceladas neste período: ${names}`,
    priciestBefore: "Maior custo por uso: ",
    priciestAfter: (amount) => ` (${amount} por uso)`,
    priciestPlain: (name, amount) => `Maior custo por uso: ${name} (${amount} por uso)`,
    line: {
      paidDates: (dates) => `Pago em ${dates}`,
      paidCount: (count) => `Pago ${count} ${Number(count) === 1 ? "vez" : "vezes"}`,
      upcoming: (dates) => `Vence em ${dates}`,
      evidenceAll: "confirmado pelos e-mails de pagamento",
      evidenceSome: (count) =>
        `${count} pagamento${Number(count) === 1 ? " confirmado" : "s confirmados"} pelos e-mails`,
      yearly: "anual",
      shared: (billed) => `compartilhada · cartão ${billed}`,
      killedOn: (date) => `cancelada em ${date}`,
      zeroUses: "0 registros",
      uses: (count, perUse) => `${count} uso${Number(count) === 1 ? "" : "s"} · ${perUse} por uso`,
      noCheckIn: "sem registro",
    },
    suffix: { withUpcoming: " · incluindo cobranças futuras", untilToday: " · até hoje" },
    notes: {
      base: "Calculado com as assinaturas registradas. Pode ser diferente da fatura do cartão.",
      evidenced: (count, shared) =>
        `${count} pagamento${Number(count) === 1 ? " anterior" : "s anteriores"} ao seu registro ${Number(count) === 1 ? "foi adicionado" : "foram adicionados"} com a data e o valor dos e-mails de pagamento encontrados no Gmail.${shared ? " Sua parte das assinaturas compartilhadas usa a divisão atual." : ""}`,
      historical:
        "Os pagamentos passados em dólar foram convertidos pela taxa publicada no dia do pagamento (BCE). Pode diferir um pouco da taxa do seu banco.",
      current: (count) =>
        `${count} pagamento${Number(count) === 1 ? "" : "s"} passado${Number(count) === 1 ? "" : "s"} em dólar não ${Number(count) === 1 ? "teve" : "tiveram"} a taxa do dia, então usamos a taxa que você definiu agora.`,
      incompleteUpcoming:
        "Este período ainda não terminou. As assinaturas atuais cujo dia de cobrança deste mês ainda não chegou entram como “a vencer”.",
      incompleteToday: "Este período ainda não terminou, então só aparecem as cobranças até hoje.",
      undated: (count) =>
        `${count} assinatura${Number(count) === 1 ? " anual" : "s anuais"} sem mês de cobrança conhecido não ${Number(count) === 1 ? "pôde" : "puderam"} ser incluída${Number(count) === 1 ? "" : "s"}.`,
      beforeRegistration: (count) =>
        `Os meses antes do registro sem e-mail de pagamento ficaram de fora, porque não sabemos se você assinava (${count}).`,
      trial: (count) => `Os dias de cobrança durante o teste grátis ficaram de fora (${count}).`,
      defendedUnknown: (count) =>
        `${count} assinatura${Number(count) === 1 ? " não pôde" : "s não puderam"} entrar no dinheiro economizado porque o mês de cobrança ou a data de cancelamento é desconhecida.`,
    },
    share: {
      title: (period, suffix) => `Recibo de assinaturas SubSlash · ${period}${suffix}`,
      upcomingInTitle: " (incluindo cobranças futuras)",
      todayInTitle: " (até hoje)",
      upcomingMark: " (a vencer)",
      total: "Total (sua parte)",
      defended: "Dinheiro economizado cancelando",
    },
    shared: {
      badge: "Recibo de assinaturas compartilhado",
      note: "Isto é o que quem enviou registrou, guardado no link. O SubSlash não verificou e não serve como comprovante.",
      invalid: "Não foi possível ler este recibo. O link pode ter sido cortado ou alterado.",
      cta: "Criar meu recibo com o SubSlash",
      unverifiedMark:
        "Recibo recebido por um link compartilhado. O SubSlash não verificou o conteúdo.",
      maskedName: (n) => `Assinatura ${n}`,
      maskedKilled: (n) => `Assinatura cancelada ${n}`,
      hiddenSummary: (subscriptions, charges) =>
        `${subscriptions} assinatura${subscriptions === 1 ? "" : "s"} · ${charges} cobrança${charges === 1 ? "" : "s"} (nomes dos serviços e valores por assinatura ocultos)`,
      reopen: "O recibo não fica na barra de endereços. Abra de novo o link que você recebeu.",
    },
    page: {
      back: "← Relatório",
      tabsLabel: "Período do recibo",
      month: "Mês",
      year: "Resumo do ano",
      otherPeriods: "Outros períodos",
      next: "Próximo",
      saveImage: "Salvar como imagem",
      share: "Compartilhar",
      privacy:
        "O recibo é feito com os dados deste dispositivo. Ao compartilhar, o conteúdo do recibo (nomes dos serviços e valores) vai dentro do link: qualquer pessoa com o link pode vê-lo, e um link enviado não pode ser desfeito. Usos e valores divididos não são incluídos, e o conteúdo do link não é salvo no nosso servidor.",
      maskNames: "Ocultar os nomes dos serviços e os valores por assinatura ao compartilhar",
      maskSingleHint: "Com uma só assinatura, só o total já pode revelar qual é o serviço.",
      nothingToShare: "Só é possível compartilhar recibos com cobranças. Escolha outro mês.",
      confirmTitle: "Enviar um link do recibo?",
      confirmBody:
        "O conteúdo do recibo vai dentro do link. Qualquer pessoa com o link pode vê-lo, e ele pode ser encaminhado. Um link enviado não pode ser desfeito.",
      confirmOk: "Compartilhar",
      yearDetail: (year) => `Ver o resumo de ${year}`,
      imageSaved: "Imagem do recibo salva",
      imageFailed: "Não foi possível criar a imagem. Tente compartilhar como texto.",
      textCopied: "Texto do recibo copiado",
      design: "Estilo do recibo",
      themes: {
        classic: "Clássico",
        color: "Térmico colorido",
        pass: "Cartão de embarque",
        tag: "Etiqueta de preço",
        chat: "Chat",
      },
      previewAlt: (period) => `Imagem do recibo de assinaturas · ${period}`,
    },
    art: {
      passHeader: "SUBSCRIPTION PASS",
      from: "FROM",
      to: "TO",
      period: "Período",
      count: "Cobranças",
      issued: "Emitido",
      countValue: (count) => `${count}`,
      chatAskMonth: (month) => `Quanto paguei em assinaturas em ${monthName("pt", month)}?`,
      chatAskYear: (year) => `Quanto paguei em assinaturas em ${year}?`,
      chatReply: (period) => `Aqui está seu recibo de assinaturas · ${period}.`,
    },
    image: { noCanvas: "Canvas indisponível", noBlob: "Não foi possível criar a imagem" },
  },
};
