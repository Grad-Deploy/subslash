import type { Widen } from "../types";
import { MONTHS_SHORT } from "../english";

/** 대시보드의 '지금 결정할 것'. 각 줄이 왜 떴는지는 `lib/i18n/action-reason`이 아래 문장 틀에 값을 넣어 만든다. */
export const ko = {
  queue: {
    title: (count: number) => `지금 결정할 것 (${count})`,
    urgentFirst: "급한 순",
    emptyTitle: "아직 등록된 구독이 없어요",
    emptyHint: "구독을 등록하면 결정할 일이 여기 떠요.",
    addFirst: "+ 첫 구독 등록",
    nothingToDecide: "지금 결정할 것이 없어요",
    nextBilling: (name: string, dday: string) => `다음 결제: ${name} ${dday}`,
    noBillingKnown: "결제일을 아는 구독이 없어요. 구독 상세에서 채워 주세요.",
    tagVerifyKill: "해지 확인",
    tagResubscribe: "다시 살펴볼 날",
    tagCancelNotice: "해지 메일",
    tagChargedAfterKill: "해지 후 결제됨",
    checkIn: "체크인",
    updateTo: (amount: string) => `${amount}으로 갱신`,
    edit: "수정",
    charged: "결제됐어요",
    stillSubscribed: "아직 구독 중",
    verbs: {
      "cancel-guide": "해지 가이드",
      "check-in": "체크인하기",
      "confirm-price": "요금 유지",
      "set-billing-month": "결제 월 입력",
      "verify-kill": "결제 안 됐어요",
      "confirm-cancel": "해지했어요",
      "review-resubscribe": "살펴보기",
    },
    fold: {
      expand: "펼치기",
      collapse: "접기",
      mostUrgent: "가장 급한 것:",
      andMore: (count: number) => ` 외 ${count}건`,
    },
  },
  reason: {
    chargedAfterKill: (date: string, amount: string | null) =>
      `해지로 기록한 뒤인 ${date}에 결제 메일이 왔습니다${amount ? ` (${amount})` : ""}. 해지가 안 됐을 수 있으니 다시 확인해 주세요.`,
    trialEnding: (dday: string, endsAt: string, stake: string) =>
      `${dday} · 무료 체험이 ${endsAt}에 끝납니다. 그대로 두면 ${stake}부터 결제가 시작됩니다.`,
    cancelNotice: (date: string) =>
      `${date}에 해지·취소 알림 메일이 왔습니다. 해지했다면 기록해 주세요. 요금제 변경이나 환불 안내일 수도 있어요.`,
    billingSoonRisky: (dday: string, checkIn: string, stake: string | null) =>
      `${dday} · 마지막 체크인: ${checkIn}` +
      (stake !== null ? `. 결제 전에 끊으면 ${stake}을 지킵니다.` : "."),
    lowUsageNone: (days: number, item: string, amount: string) =>
      `이번 달 이용이 아직 없었어요. ${days}일 뒤 자동 갱신 전에 잠시 구독을 멈추고 ${item} 값(${amount})을 아껴볼까요?`,
    lowUsage: (uses: number, days: number, item: string, amount: string) =>
      `이번 달은 ${uses}회만 이용했어요. ${days}일 뒤 갱신 전에 잠시 쉬어가면 ${item} 값(${amount})을 지킬 수 있어요.`,
    billingSoon: (dday: string, stake: string | null, sinceCheckIn: number | null) =>
      `${dday} · ${stake !== null ? `${stake}이 곧 빠져나갑니다.` : "곧 결제됩니다."}` +
      (sinceCheckIn !== null
        ? ` 마지막 체크인이 ${sinceCheckIn}일 전이라 결제 전에 다시 확인해 보세요.`
        : ""),
    billingSoonNoCheckIn: (dday: string) =>
      `${dday} · 아직 체크인한 적이 없어, 끊을지 판단할 근거가 없습니다.`,
    verifyKill: (date: string, amount: string) =>
      `해지 후 첫 결제일 ${date}이 지났습니다. 그날 ${amount}이 결제됐나요? 결제 문자나 카드 내역에서 확인해 주세요.`,
    amountChanged: (date: string, observed: string, billed: string) =>
      `${date} 결제 메일에는 ${observed}이 찍혔는데, 등록된 청구액은 ${billed}입니다. 어느 쪽이 맞는지 확인해 주세요.`,
    risky: (checkIn: string) => `마지막 체크인: ${checkIn}. 돈값을 못 하고 있습니다.`,
    neverCheckedIn: "아직 체크인한 적이 없습니다. 얼마나 썼는지 모르면 끊을지 판단할 수 없습니다.",
    staleCheckIn: (days: number) =>
      `마지막 체크인이 ${days}일 전입니다. 그 사이 사용 습관이 달라졌을 수 있습니다.`,
    priceCheck: (amount: string, taxExcluded: boolean) =>
      `등록된 금액이 ${amount}${taxExcluded ? "(세금 별도)" : ""}입니다. 지금도 맞는지 확인해주세요.`,
    missingBillingMonth: "연간 결제인데 결제 월이 없어 D-day도, 지킨 금액도 계산할 수 없습니다.",
    resubscribe: (date: string) =>
      `해지할 때 ${date}에 다시 알려 달라고 하셨어요. 다시 쓸 때가 됐는지 살펴보세요. 필요 없으면 알림만 지우면 돼요.`,
    /** "9월 15일". 올해가 아니면 "2025년 12월 5일". */
    killCheckDate: (year: number, month: number, day: number, sameYear: boolean) =>
      sameYear ? `${month}월 ${day}일` : `${year}년 ${month}월 ${day}일`,
  },
};

export const en: Widen<typeof ko> = {
  queue: {
    title: (count) => `To decide now (${count})`,
    urgentFirst: "Most urgent first",
    emptyTitle: "No subscriptions yet",
    emptyHint: "Add a subscription and the things to decide will show up here.",
    addFirst: "+ Add your first subscription",
    nothingToDecide: "Nothing to decide right now",
    nextBilling: (name, dday) => `Next charge: ${name} ${dday}`,
    noBillingKnown:
      "No subscription has a known billing date. Fill it in on the subscription page.",
    tagVerifyKill: "Cancellation check",
    tagResubscribe: "Time to look again",
    tagCancelNotice: "Cancellation email",
    tagChargedAfterKill: "Charged after cancelling",
    checkIn: "Check in",
    updateTo: (amount) => `Update to ${amount}`,
    edit: "Edit",
    charged: "I was charged",
    stillSubscribed: "Still subscribed",
    verbs: {
      "cancel-guide": "Cancel guide",
      "check-in": "Check in",
      "confirm-price": "Keep price",
      "set-billing-month": "Set billing month",
      "verify-kill": "Not charged",
      "confirm-cancel": "I cancelled",
      "review-resubscribe": "Take a look",
    },
    fold: {
      expand: "Expand",
      collapse: "Collapse",
      mostUrgent: "Most urgent:",
      andMore: (count) => ` and ${count} more`,
    },
  },
  reason: {
    chargedAfterKill: (date, amount) =>
      `A payment email arrived on ${date}, after you marked this as cancelled${amount ? ` (${amount})` : ""}. The cancellation may not have gone through, so please check again.`,
    trialEnding: (dday, endsAt, stake) =>
      `${dday} · Your free trial ends on ${endsAt}. If you leave it, billing starts at ${stake}.`,
    cancelNotice: (date) =>
      `A cancellation email arrived on ${date}. If you did cancel, please record it. It may also be a plan change or refund notice.`,
    billingSoonRisky: (dday, checkIn, stake) =>
      `${dday} · Last check-in: ${checkIn}` +
      (stake !== null ? `. Cancel before it renews to keep ${stake}.` : "."),
    lowUsageNone: (days, item, amount) =>
      `No use yet this month. Pause the subscription before it renews in ${days} days and you could save ${item} (${amount}).`,
    lowUsage: (uses, days, item, amount) =>
      `Only ${uses} ${uses === 1 ? "use" : "uses"} this month. Take a break before it renews in ${days} days and you keep ${item} (${amount}).`,
    billingSoon: (dday, stake, sinceCheckIn) =>
      `${dday} · ${stake !== null ? `${stake} is about to be charged.` : "A payment is coming up."}` +
      (sinceCheckIn !== null
        ? ` Your last check-in was ${sinceCheckIn} ${sinceCheckIn === 1 ? "day" : "days"} ago, so check again before it renews.`
        : ""),
    billingSoonNoCheckIn: (dday) =>
      `${dday} · You haven't checked in yet, so there is nothing to base a decision on.`,
    verifyKill: (date, amount) =>
      `The first billing date after you cancelled, ${date}, has passed. Was ${amount} charged that day? Check your card statement or payment texts.`,
    amountChanged: (date, observed, billed) =>
      `The payment email from ${date} shows ${observed}, but the registered amount is ${billed}. Please check which one is right.`,
    risky: (checkIn) => `Last check-in: ${checkIn}. This isn't earning its price.`,
    neverCheckedIn:
      "You haven't checked in yet. Without knowing how much you use it, you can't decide whether to cancel.",
    staleCheckIn: (days) =>
      `Your last check-in was ${days} ${days === 1 ? "day" : "days"} ago. Your usage may have changed since.`,
    priceCheck: (amount, taxExcluded) =>
      `The registered amount is ${amount}${taxExcluded ? " (tax not included)" : ""}. Please check it is still right.`,
    missingBillingMonth:
      "This is billed yearly but has no billing month, so the D-day and the amount you would keep can't be worked out.",
    resubscribe: (date) =>
      `When you cancelled, you asked to be reminded on ${date}. See whether it's time to use it again. If not, just clear the reminder.`,
    killCheckDate: (year, month, day, sameYear) =>
      sameYear ? `${MONTHS_SHORT[month - 1]} ${day}` : `${MONTHS_SHORT[month - 1]} ${day}, ${year}`,
  },
};

// 원어민 검토 전의 번역(LOCALE_INFO.beta).
export const zh: Widen<typeof ko> = {
  queue: {
    title: (count) => `现在要决定的（${count}）`,
    urgentFirst: "最紧急的排在前面",
    emptyTitle: "还没有订阅",
    emptyHint: "添加订阅后，需要决定的事项会显示在这里。",
    addFirst: "+ 添加第一个订阅",
    nothingToDecide: "现在没有需要决定的事",
    nextBilling: (name, dday) => `下次扣款：${name} ${dday}`,
    noBillingKnown: "没有已知扣款日的订阅。请在订阅页面填写。",
    tagVerifyKill: "确认退订",
    tagResubscribe: "该再看看了",
    tagCancelNotice: "退订邮件",
    tagChargedAfterKill: "退订后被扣款",
    checkIn: "签到",
    updateTo: (amount) => `改为 ${amount}`,
    edit: "编辑",
    charged: "被扣款了",
    stillSubscribed: "仍在订阅",
    verbs: {
      "cancel-guide": "退订指南",
      "check-in": "签到",
      "confirm-price": "保持价格",
      "set-billing-month": "设置扣款月份",
      "verify-kill": "没有扣款",
      "confirm-cancel": "我已退订",
      "review-resubscribe": "看一看",
    },
    fold: {
      expand: "展开",
      collapse: "收起",
      mostUrgent: "最紧急：",
      andMore: (count) => ` 等 ${count} 项`,
    },
  },
  reason: {
    chargedAfterKill: (date, amount) =>
      `在你标记为已退订之后，${date} 收到了付款邮件${amount ? `（${amount}）` : ""}。退订可能没有成功，请再确认一下。`,
    trialEnding: (dday, endsAt, stake) =>
      `${dday} · 免费试用将于 ${endsAt} 结束。如果不处理，将开始扣款 ${stake}。`,
    cancelNotice: (date) =>
      `${date} 收到了退订邮件。如果确实退订了，请记录下来。它也可能是套餐变更或退款通知。`,
    billingSoonRisky: (dday, checkIn, stake) =>
      `${dday} · 最近签到：${checkIn}` +
      (stake !== null ? `。在续费前退订可以守住 ${stake}。` : "。"),
    lowUsageNone: (days, item, amount) =>
      `本月还没用过。在 ${days} 天后续费之前暂停订阅，可以省下${item}（${amount}）。`,
    lowUsage: (uses, days, item, amount) =>
      `本月只用了 ${uses} 次。在 ${days} 天后续费之前暂停一下，就能守住${item}（${amount}）。`,
    billingSoon: (dday, stake, sinceCheckIn) =>
      `${dday} · ${stake !== null ? `即将扣款 ${stake}。` : "即将扣款。"}` +
      (sinceCheckIn !== null ? `上次签到是 ${sinceCheckIn} 天前，续费前请再看一看。` : ""),
    billingSoonNoCheckIn: (dday) => `${dday} · 还没有签到过，没有判断是否退订的依据。`,
    verifyKill: (date, amount) =>
      `退订后的第一个扣款日 ${date} 已经过了。那天有没有扣 ${amount}？请查看银行卡账单或付款短信。`,
    amountChanged: (date, observed, billed) =>
      `${date} 的付款邮件显示 ${observed}，但登记的金额是 ${billed}。请确认哪个是对的。`,
    risky: (checkIn) => `最近签到：${checkIn}。用得不值这个价。`,
    neverCheckedIn: "还没有签到过。不知道用了多少，就无法判断是否该退订。",
    staleCheckIn: (days) => `上次签到是 ${days} 天前。之后的使用情况可能已经变了。`,
    priceCheck: (amount, taxExcluded) =>
      `登记的金额是 ${amount}${taxExcluded ? "（不含税）" : ""}。请确认现在是否仍然正确。`,
    missingBillingMonth: "这是年付订阅，但没有扣款月份，所以无法算出 D-day 和能守住的金额。",
    resubscribe: (date) =>
      `退订时你让我们在 ${date} 提醒你。看看是不是该再用了。如果不是，清除提醒即可。`,
    killCheckDate: (year, month, day, sameYear) =>
      sameYear ? `${month}月${day}日` : `${year}年${month}月${day}日`,
  },
};

export const ja: Widen<typeof ko> = {
  queue: {
    title: (count) => `今決めること（${count}）`,
    urgentFirst: "急ぐものから",
    emptyTitle: "まだサブスクがありません",
    emptyHint: "サブスクを登録すると、決めることがここに表示されます。",
    addFirst: "+ 最初のサブスクを追加",
    nothingToDecide: "今決めることはありません",
    nextBilling: (name, dday) => `次の支払い: ${name} ${dday}`,
    noBillingKnown: "支払日がわかるサブスクがありません。サブスクのページで入力してください。",
    tagVerifyKill: "解約の確認",
    tagResubscribe: "見直す時期",
    tagCancelNotice: "解約のメール",
    tagChargedAfterKill: "解約後に請求",
    checkIn: "チェックイン",
    updateTo: (amount) => `${amount} に更新`,
    edit: "編集",
    charged: "請求されました",
    stillSubscribed: "まだ契約中",
    verbs: {
      "cancel-guide": "解約ガイド",
      "check-in": "チェックイン",
      "confirm-price": "料金はこのまま",
      "set-billing-month": "支払月を設定",
      "verify-kill": "請求なし",
      "confirm-cancel": "解約しました",
      "review-resubscribe": "見てみる",
    },
    fold: {
      expand: "広げる",
      collapse: "たたむ",
      mostUrgent: "いちばん急ぐもの:",
      andMore: (count) => ` ほか ${count} 件`,
    },
  },
  reason: {
    chargedAfterKill: (date, amount) =>
      `解約済みにしたあと、${date} に支払いメールが届きました${amount ? `（${amount}）` : ""}。解約できていない可能性があるので、もう一度確認してください。`,
    trialEnding: (dday, endsAt, stake) =>
      `${dday} · 無料体験は ${endsAt} に終わります。そのままにすると ${stake} の請求が始まります。`,
    cancelNotice: (date) =>
      `${date} に解約のメールが届きました。解約したなら記録してください。プラン変更や返金のお知らせの場合もあります。`,
    billingSoonRisky: (dday, checkIn, stake) =>
      `${dday} · 最近のチェックイン: ${checkIn}` +
      (stake !== null ? `。更新前に解約すれば ${stake} を守れます。` : "。"),
    lowUsageNone: (days, item, amount) =>
      `今月はまだ使っていません。${days} 日後の更新前に一時停止すれば、${item}（${amount}）を節約できます。`,
    lowUsage: (uses, days, item, amount) =>
      `今月は ${uses} 回しか使っていません。${days} 日後の更新前にひと休みすれば、${item}（${amount}）を守れます。`,
    billingSoon: (dday, stake, sinceCheckIn) =>
      `${dday} · ${stake !== null ? `まもなく ${stake} が請求されます。` : "まもなく支払いがあります。"}` +
      (sinceCheckIn !== null
        ? `最後のチェックインは ${sinceCheckIn} 日前なので、更新前にもう一度確認しましょう。`
        : ""),
    billingSoonNoCheckIn: (dday) =>
      `${dday} · まだチェックインしていないので、判断の根拠がありません。`,
    verifyKill: (date, amount) =>
      `解約後最初の支払日 ${date} が過ぎました。その日に ${amount} が請求されましたか？ カードの明細や支払いのメッセージを確認してください。`,
    amountChanged: (date, observed, billed) =>
      `${date} の支払いメールでは ${observed} ですが、登録した金額は ${billed} です。どちらが正しいか確認してください。`,
    risky: (checkIn) => `最近のチェックイン: ${checkIn}。料金に見合っていません。`,
    neverCheckedIn:
      "まだチェックインしていません。どれだけ使ったかわからないと、解約するか判断できません。",
    staleCheckIn: (days) =>
      `最後のチェックインは ${days} 日前です。その後、使い方が変わったかもしれません。`,
    priceCheck: (amount, taxExcluded) =>
      `登録した金額は ${amount}${taxExcluded ? "（税抜き）" : ""}です。今も正しいか確認してください。`,
    missingBillingMonth:
      "年払いのサブスクですが支払月がないため、D-day と守れる金額を計算できません。",
    resubscribe: (date) =>
      `解約するとき ${date} に知らせるよう頼まれていました。また使う時期か見てみましょう。そうでなければ通知を消してください。`,
    killCheckDate: (year, month, day, sameYear) =>
      sameYear ? `${month}月${day}日` : `${year}年${month}月${day}日`,
  },
};

export const vi: Widen<typeof ko> = {
  queue: {
    title: (count) => `Cần quyết định ngay (${count})`,
    urgentFirst: "Gấp nhất trước",
    emptyTitle: "Chưa có gói đăng ký nào",
    emptyHint: "Thêm gói đăng ký, những việc cần quyết định sẽ hiện ở đây.",
    addFirst: "+ Thêm gói đầu tiên",
    nothingToDecide: "Hiện không có gì cần quyết định",
    nextBilling: (name, dday) => `Lần thanh toán tới: ${name} ${dday}`,
    noBillingKnown: "Chưa gói nào có ngày thanh toán. Hãy nhập trên trang gói đăng ký.",
    tagVerifyKill: "Kiểm tra việc hủy",
    tagResubscribe: "Đến lúc xem lại",
    tagCancelNotice: "Email hủy",
    tagChargedAfterKill: "Bị trừ tiền sau khi hủy",
    checkIn: "Check-in",
    updateTo: (amount) => `Cập nhật thành ${amount}`,
    edit: "Sửa",
    charged: "Đã bị trừ tiền",
    stillSubscribed: "Vẫn đang đăng ký",
    verbs: {
      "cancel-guide": "Hướng dẫn hủy",
      "check-in": "Check-in",
      "confirm-price": "Giữ giá",
      "set-billing-month": "Đặt tháng thanh toán",
      "verify-kill": "Không bị trừ",
      "confirm-cancel": "Tôi đã hủy",
      "review-resubscribe": "Xem thử",
    },
    fold: {
      expand: "Mở rộng",
      collapse: "Thu gọn",
      mostUrgent: "Gấp nhất:",
      andMore: (count) => ` và ${count} mục khác`,
    },
  },
  reason: {
    chargedAfterKill: (date, amount) =>
      `Email thanh toán đến vào ${date}, sau khi bạn đánh dấu đã hủy${amount ? ` (${amount})` : ""}. Có thể việc hủy chưa thành công, hãy kiểm tra lại.`,
    trialEnding: (dday, endsAt, stake) =>
      `${dday} · Bản dùng thử miễn phí kết thúc vào ${endsAt}. Nếu để nguyên, bạn sẽ bắt đầu bị trừ ${stake}.`,
    cancelNotice: (date) =>
      `Email hủy đến vào ${date}. Nếu bạn đã hủy thật, hãy ghi lại. Đó cũng có thể là thông báo đổi gói hoặc hoàn tiền.`,
    billingSoonRisky: (dday, checkIn, stake) =>
      `${dday} · Check-in gần nhất: ${checkIn}` +
      (stake !== null ? `. Hủy trước khi gia hạn để giữ lại ${stake}.` : "."),
    lowUsageNone: (days, item, amount) =>
      `Tháng này chưa dùng lần nào. Tạm dừng trước khi gia hạn sau ${days} ngày, bạn có thể tiết kiệm ${item} (${amount}).`,
    lowUsage: (uses, days, item, amount) =>
      `Tháng này chỉ dùng ${uses} lần. Nghỉ một chút trước khi gia hạn sau ${days} ngày, bạn sẽ giữ lại ${item} (${amount}).`,
    billingSoon: (dday, stake, sinceCheckIn) =>
      `${dday} · ${stake !== null ? `Sắp bị trừ ${stake}.` : "Sắp đến lần thanh toán."}` +
      (sinceCheckIn !== null
        ? ` Lần check-in gần nhất là ${sinceCheckIn} ngày trước, hãy xem lại trước khi gia hạn.`
        : ""),
    billingSoonNoCheckIn: (dday) => `${dday} · Bạn chưa check-in nên chưa có căn cứ để quyết định.`,
    verifyKill: (date, amount) =>
      `Ngày thanh toán đầu tiên sau khi hủy, ${date}, đã qua. Hôm đó bạn có bị trừ ${amount} không? Hãy xem sao kê thẻ hoặc tin nhắn thanh toán.`,
    amountChanged: (date, observed, billed) =>
      `Email thanh toán ngày ${date} ghi ${observed}, nhưng số tiền đã đăng ký là ${billed}. Hãy kiểm tra số nào đúng.`,
    risky: (checkIn) => `Check-in gần nhất: ${checkIn}. Chưa đáng với số tiền bỏ ra.`,
    neverCheckedIn:
      "Bạn chưa check-in. Không biết mình dùng bao nhiêu thì không thể quyết định có nên hủy.",
    staleCheckIn: (days) =>
      `Lần check-in gần nhất là ${days} ngày trước. Mức sử dụng có thể đã thay đổi.`,
    priceCheck: (amount, taxExcluded) =>
      `Số tiền đã đăng ký là ${amount}${taxExcluded ? " (chưa gồm thuế)" : ""}. Hãy kiểm tra xem còn đúng không.`,
    missingBillingMonth:
      "Gói này thanh toán theo năm nhưng chưa có tháng thanh toán, nên không tính được D-day và số tiền có thể giữ lại.",
    resubscribe: (date) =>
      `Khi hủy, bạn đã nhờ nhắc vào ${date}. Hãy xem đã đến lúc dùng lại chưa. Nếu chưa, chỉ cần xóa lời nhắc.`,
    killCheckDate: (year, month, day, sameYear) =>
      sameYear ? `${day}/${month}` : `${day}/${month}/${year}`,
  },
};

export const fr: Widen<typeof ko> = {
  queue: {
    title: (count) => `À décider maintenant (${count})`,
    urgentFirst: "Le plus urgent d'abord",
    emptyTitle: "Pas encore d'abonnement",
    emptyHint: "Ajoutez un abonnement et les choses à décider apparaîtront ici.",
    addFirst: "+ Ajouter votre premier abonnement",
    nothingToDecide: "Rien à décider pour le moment",
    nextBilling: (name, dday) => `Prochain paiement : ${name} ${dday}`,
    noBillingKnown:
      "Aucun abonnement n'a de date de paiement connue. Renseignez-la sur la page de l'abonnement.",
    tagVerifyKill: "Vérifier la résiliation",
    tagResubscribe: "À revoir",
    tagCancelNotice: "E-mail de résiliation",
    tagChargedAfterKill: "Débité après résiliation",
    checkIn: "Check-in",
    updateTo: (amount) => `Passer à ${amount}`,
    edit: "Modifier",
    charged: "J'ai été débité",
    stillSubscribed: "Toujours abonné",
    verbs: {
      "cancel-guide": "Guide de résiliation",
      "check-in": "Check-in",
      "confirm-price": "Garder le prix",
      "set-billing-month": "Définir le mois",
      "verify-kill": "Pas débité",
      "confirm-cancel": "J'ai résilié",
      "review-resubscribe": "Jeter un œil",
    },
    fold: {
      expand: "Déplier",
      collapse: "Replier",
      mostUrgent: "Le plus urgent :",
      andMore: (count) => ` et ${count} de plus`,
    },
  },
  reason: {
    chargedAfterKill: (date, amount) =>
      `Un e-mail de paiement est arrivé le ${date}, après que vous l'avez marqué comme résilié${amount ? ` (${amount})` : ""}. La résiliation n'a peut-être pas abouti : vérifiez à nouveau.`,
    trialEnding: (dday, endsAt, stake) =>
      `${dday} · Votre essai gratuit se termine le ${endsAt}. Sans action, la facturation de ${stake} commencera.`,
    cancelNotice: (date) =>
      `Un e-mail de résiliation est arrivé le ${date}. Si vous avez bien résilié, enregistrez-le. Il peut aussi s'agir d'un changement de formule ou d'un remboursement.`,
    billingSoonRisky: (dday, checkIn, stake) =>
      `${dday} · Dernier check-in : ${checkIn}` +
      (stake !== null ? `. Résiliez avant le renouvellement pour économiser ${stake}.` : "."),
    lowUsageNone: (days, item, amount) =>
      `Aucune utilisation ce mois-ci. Suspendez l'abonnement avant son renouvellement dans ${days} jours et vous pourriez économiser ${item} (${amount}).`,
    lowUsage: (uses, days, item, amount) =>
      `Seulement ${uses} utilisation${Number(uses) === 1 ? "" : "s"} ce mois-ci. Faites une pause avant le renouvellement dans ${days} jours et gardez ${item} (${amount}).`,
    billingSoon: (dday, stake, sinceCheckIn) =>
      `${dday} · ${stake !== null ? `${stake} va être débité.` : "Un paiement approche."}` +
      (sinceCheckIn !== null
        ? ` Votre dernier check-in date de ${sinceCheckIn} jour${Number(sinceCheckIn) === 1 ? "" : "s"} : revérifiez avant le renouvellement.`
        : ""),
    billingSoonNoCheckIn: (dday) =>
      `${dday} · Vous n'avez pas encore fait de check-in, il n'y a donc rien sur quoi baser une décision.`,
    verifyKill: (date, amount) =>
      `La première date de paiement après votre résiliation, le ${date}, est passée. ${amount} a-t-il été débité ce jour-là ? Vérifiez votre relevé ou vos SMS de paiement.`,
    amountChanged: (date, observed, billed) =>
      `L'e-mail de paiement du ${date} indique ${observed}, mais le montant enregistré est ${billed}. Vérifiez lequel est correct.`,
    risky: (checkIn) => `Dernier check-in : ${checkIn}. Il ne vaut pas son prix.`,
    neverCheckedIn:
      "Vous n'avez pas encore fait de check-in. Sans savoir combien vous l'utilisez, impossible de décider s'il faut résilier.",
    staleCheckIn: (days) =>
      `Votre dernier check-in date de ${days} jour${Number(days) === 1 ? "" : "s"}. Votre utilisation a peut-être changé depuis.`,
    priceCheck: (amount, taxExcluded) =>
      `Le montant enregistré est ${amount}${taxExcluded ? " (hors taxe)" : ""}. Vérifiez qu'il est toujours juste.`,
    missingBillingMonth:
      "Cet abonnement est annuel mais n'a pas de mois de paiement : impossible de calculer le J-x et le montant économisable.",
    resubscribe: (date) =>
      `En résiliant, vous avez demandé un rappel le ${date}. Voyez s'il est temps de le réutiliser. Sinon, effacez simplement le rappel.`,
    killCheckDate: (year, month, day, sameYear) =>
      sameYear ? `${day}/${month}` : `${day}/${month}/${year}`,
  },
};

export const es: Widen<typeof ko> = {
  queue: {
    title: (count) => `Para decidir ahora (${count})`,
    urgentFirst: "Lo más urgente primero",
    emptyTitle: "Todavía no hay suscripciones",
    emptyHint: "Añade una suscripción y aquí aparecerá lo que hay que decidir.",
    addFirst: "+ Añadir tu primera suscripción",
    nothingToDecide: "No hay nada que decidir ahora",
    nextBilling: (name, dday) => `Próximo cobro: ${name} ${dday}`,
    noBillingKnown:
      "Ninguna suscripción tiene una fecha de cobro conocida. Complétala en la página de la suscripción.",
    tagVerifyKill: "Comprobar cancelación",
    tagResubscribe: "Hora de revisar",
    tagCancelNotice: "Correo de cancelación",
    tagChargedAfterKill: "Cobro tras cancelar",
    checkIn: "Registrar",
    updateTo: (amount) => `Cambiar a ${amount}`,
    edit: "Editar",
    charged: "Me cobraron",
    stillSubscribed: "Sigo suscrito",
    verbs: {
      "cancel-guide": "Guía de cancelación",
      "check-in": "Registrar",
      "confirm-price": "Mantener precio",
      "set-billing-month": "Fijar mes de cobro",
      "verify-kill": "No me cobraron",
      "confirm-cancel": "Ya cancelé",
      "review-resubscribe": "Echar un vistazo",
    },
    fold: {
      expand: "Desplegar",
      collapse: "Plegar",
      mostUrgent: "Lo más urgente:",
      andMore: (count) => ` y ${count} más`,
    },
  },
  reason: {
    chargedAfterKill: (date, amount) =>
      `Llegó un correo de pago el ${date}, después de marcarla como cancelada${amount ? ` (${amount})` : ""}. Puede que la cancelación no se completara: compruébalo otra vez.`,
    trialEnding: (dday, endsAt, stake) =>
      `${dday} · Tu prueba gratuita termina el ${endsAt}. Si no haces nada, empezarán a cobrarte ${stake}.`,
    cancelNotice: (date) =>
      `Llegó un correo de cancelación el ${date}. Si cancelaste, regístralo. También puede ser un aviso de cambio de plan o de reembolso.`,
    billingSoonRisky: (dday, checkIn, stake) =>
      `${dday} · Último registro: ${checkIn}` +
      (stake !== null ? `. Cancela antes de la renovación para ahorrar ${stake}.` : "."),
    lowUsageNone: (days, item, amount) =>
      `Este mes no la has usado. Pausa la suscripción antes de que se renueve en ${days} días y podrías ahorrar ${item} (${amount}).`,
    lowUsage: (uses, days, item, amount) =>
      `Solo ${uses} uso${Number(uses) === 1 ? "" : "s"} este mes. Tómate un descanso antes de la renovación en ${days} días y ahorra ${item} (${amount}).`,
    billingSoon: (dday, stake, sinceCheckIn) =>
      `${dday} · ${stake !== null ? `Se van a cobrar ${stake}.` : "Se acerca un cobro."}` +
      (sinceCheckIn !== null
        ? ` Tu último registro fue hace ${sinceCheckIn} día${Number(sinceCheckIn) === 1 ? "" : "s"}, así que revísalo antes de la renovación.`
        : ""),
    billingSoonNoCheckIn: (dday) =>
      `${dday} · Aún no has registrado el uso, así que no hay base para decidir.`,
    verifyKill: (date, amount) =>
      `Ya pasó la primera fecha de cobro tras cancelar, el ${date}. ¿Te cobraron ${amount} ese día? Revisa el extracto de la tarjeta o los SMS de pago.`,
    amountChanged: (date, observed, billed) =>
      `El correo de pago del ${date} muestra ${observed}, pero el importe registrado es ${billed}. Comprueba cuál es el correcto.`,
    risky: (checkIn) => `Último registro: ${checkIn}. No vale lo que cuesta.`,
    neverCheckedIn:
      "Aún no has registrado el uso. Sin saber cuánto la usas, no puedes decidir si cancelarla.",
    staleCheckIn: (days) =>
      `Tu último registro fue hace ${days} día${Number(days) === 1 ? "" : "s"}. Puede que tu uso haya cambiado.`,
    priceCheck: (amount, taxExcluded) =>
      `El importe registrado es ${amount}${taxExcluded ? " (sin impuestos)" : ""}. Comprueba que sigue siendo correcto.`,
    missingBillingMonth:
      "Se cobra al año pero no tiene mes de cobro, así que no se puede calcular el día D ni lo que ahorrarías.",
    resubscribe: (date) =>
      `Al cancelar pediste que te recordáramos el ${date}. Mira si es momento de volver a usarla. Si no, borra el recordatorio.`,
    killCheckDate: (year, month, day, sameYear) =>
      sameYear ? `${day}/${month}` : `${day}/${month}/${year}`,
  },
};

export const de: Widen<typeof ko> = {
  queue: {
    title: (count) => `Jetzt entscheiden (${count})`,
    urgentFirst: "Das Dringendste zuerst",
    emptyTitle: "Noch keine Abos",
    emptyHint: "Füg ein Abo hinzu, dann erscheint hier, was zu entscheiden ist.",
    addFirst: "+ Erstes Abo hinzufügen",
    nothingToDecide: "Gerade gibt es nichts zu entscheiden",
    nextBilling: (name, dday) => `Nächste Abbuchung: ${name} ${dday}`,
    noBillingKnown: "Kein Abo hat einen bekannten Abbuchungstag. Trag ihn auf der Abo-Seite ein.",
    tagVerifyKill: "Kündigung prüfen",
    tagResubscribe: "Zeit für einen Blick",
    tagCancelNotice: "Kündigungs-E-Mail",
    tagChargedAfterKill: "Nach Kündigung abgebucht",
    checkIn: "Eintragen",
    updateTo: (amount) => `Auf ${amount} ändern`,
    edit: "Bearbeiten",
    charged: "Es wurde abgebucht",
    stillSubscribed: "Noch abonniert",
    verbs: {
      "cancel-guide": "Kündigungshilfe",
      "check-in": "Eintragen",
      "confirm-price": "Preis behalten",
      "set-billing-month": "Monat festlegen",
      "verify-kill": "Nicht abgebucht",
      "confirm-cancel": "Ich habe gekündigt",
      "review-resubscribe": "Ansehen",
    },
    fold: {
      expand: "Ausklappen",
      collapse: "Einklappen",
      mostUrgent: "Am dringendsten:",
      andMore: (count) => ` und ${count} weitere`,
    },
  },
  reason: {
    chargedAfterKill: (date, amount) =>
      `Am ${date} kam eine Zahlungs-E-Mail, nachdem du das Abo als gekündigt markiert hast${amount ? ` (${amount})` : ""}. Die Kündigung hat vielleicht nicht geklappt – prüf es bitte noch einmal.`,
    trialEnding: (dday, endsAt, stake) =>
      `${dday} · Dein kostenloser Test endet am ${endsAt}. Wenn du nichts tust, werden ${stake} abgebucht.`,
    cancelNotice: (date) =>
      `Am ${date} kam eine Kündigungs-E-Mail. Wenn du wirklich gekündigt hast, trag es ein. Es kann auch eine Tarifänderung oder Erstattung sein.`,
    billingSoonRisky: (dday, checkIn, stake) =>
      `${dday} · Letzter Eintrag: ${checkIn}` +
      (stake !== null ? `. Kündige vor der Verlängerung, um ${stake} zu sparen.` : "."),
    lowUsageNone: (days, item, amount) =>
      `Diesen Monat noch nicht genutzt. Pausier das Abo vor der Verlängerung in ${days} Tagen und spar ${item} (${amount}).`,
    lowUsage: (uses, days, item, amount) =>
      `Diesen Monat nur ${uses}-mal genutzt. Mach vor der Verlängerung in ${days} Tagen eine Pause und behalte ${item} (${amount}).`,
    billingSoon: (dday, stake, sinceCheckIn) =>
      `${dday} · ${stake !== null ? `Gleich werden ${stake} abgebucht.` : "Eine Zahlung steht bevor."}` +
      (sinceCheckIn !== null
        ? ` Dein letzter Eintrag ist ${sinceCheckIn} ${Number(sinceCheckIn) === 1 ? "Tag" : "Tage"} her – prüf es vor der Verlängerung noch einmal.`
        : ""),
    billingSoonNoCheckIn: (dday) =>
      `${dday} · Du hast noch nichts eingetragen, daher gibt es keine Entscheidungsgrundlage.`,
    verifyKill: (date, amount) =>
      `Der erste Abbuchungstag nach deiner Kündigung, der ${date}, ist vorbei. Wurden an dem Tag ${amount} abgebucht? Prüf deine Kartenabrechnung oder Zahlungs-SMS.`,
    amountChanged: (date, observed, billed) =>
      `Die Zahlungs-E-Mail vom ${date} zeigt ${observed}, der eingetragene Betrag ist aber ${billed}. Prüf, welcher stimmt.`,
    risky: (checkIn) => `Letzter Eintrag: ${checkIn}. Es ist seinen Preis nicht wert.`,
    neverCheckedIn:
      "Du hast noch nichts eingetragen. Ohne zu wissen, wie viel du es nutzt, kannst du nicht über eine Kündigung entscheiden.",
    staleCheckIn: (days) =>
      `Dein letzter Eintrag ist ${days} ${Number(days) === 1 ? "Tag" : "Tage"} her. Deine Nutzung hat sich seitdem vielleicht geändert.`,
    priceCheck: (amount, taxExcluded) =>
      `Der eingetragene Betrag ist ${amount}${taxExcluded ? " (ohne Steuer)" : ""}. Prüf, ob er noch stimmt.`,
    missingBillingMonth:
      "Das Abo wird jährlich abgerechnet, hat aber keinen Abbuchungsmonat, daher lassen sich D-Day und sparbarer Betrag nicht berechnen.",
    resubscribe: (date) =>
      `Beim Kündigen wolltest du am ${date} erinnert werden. Schau, ob es Zeit ist, es wieder zu nutzen. Wenn nicht, lösch die Erinnerung einfach.`,
    killCheckDate: (year, month, day, sameYear) =>
      sameYear ? `${day}.${month}.` : `${day}.${month}.${year}`,
  },
};

export const pt: Widen<typeof ko> = {
  queue: {
    title: (count) => `Para decidir agora (${count})`,
    urgentFirst: "O mais urgente primeiro",
    emptyTitle: "Ainda não há assinaturas",
    emptyHint: "Adicione uma assinatura e o que precisa ser decidido aparece aqui.",
    addFirst: "+ Adicionar a primeira assinatura",
    nothingToDecide: "Nada para decidir agora",
    nextBilling: (name, dday) => `Próxima cobrança: ${name} ${dday}`,
    noBillingKnown:
      "Nenhuma assinatura tem data de cobrança conhecida. Preencha na página da assinatura.",
    tagVerifyKill: "Conferir cancelamento",
    tagResubscribe: "Hora de rever",
    tagCancelNotice: "E-mail de cancelamento",
    tagChargedAfterKill: "Cobrado após cancelar",
    checkIn: "Registrar",
    updateTo: (amount) => `Atualizar para ${amount}`,
    edit: "Editar",
    charged: "Fui cobrado",
    stillSubscribed: "Ainda assino",
    verbs: {
      "cancel-guide": "Guia de cancelamento",
      "check-in": "Registrar",
      "confirm-price": "Manter preço",
      "set-billing-month": "Definir mês",
      "verify-kill": "Não fui cobrado",
      "confirm-cancel": "Cancelei",
      "review-resubscribe": "Dar uma olhada",
    },
    fold: {
      expand: "Expandir",
      collapse: "Recolher",
      mostUrgent: "Mais urgente:",
      andMore: (count) => ` e mais ${count}`,
    },
  },
  reason: {
    chargedAfterKill: (date, amount) =>
      `Chegou um e-mail de pagamento em ${date}, depois de você marcar como cancelada${amount ? ` (${amount})` : ""}. O cancelamento pode não ter dado certo, confira de novo.`,
    trialEnding: (dday, endsAt, stake) =>
      `${dday} · Seu teste grátis termina em ${endsAt}. Se deixar como está, a cobrança de ${stake} começa.`,
    cancelNotice: (date) =>
      `Chegou um e-mail de cancelamento em ${date}. Se você cancelou mesmo, registre. Também pode ser um aviso de mudança de plano ou reembolso.`,
    billingSoonRisky: (dday, checkIn, stake) =>
      `${dday} · Último registro: ${checkIn}` +
      (stake !== null ? `. Cancele antes da renovação para economizar ${stake}.` : "."),
    lowUsageNone: (days, item, amount) =>
      `Nenhum uso este mês. Pause a assinatura antes da renovação em ${days} dias e você pode economizar ${item} (${amount}).`,
    lowUsage: (uses, days, item, amount) =>
      `Só ${uses} uso${Number(uses) === 1 ? "" : "s"} este mês. Dê uma pausa antes da renovação em ${days} dias e guarde ${item} (${amount}).`,
    billingSoon: (dday, stake, sinceCheckIn) =>
      `${dday} · ${stake !== null ? `${stake} vai ser cobrado.` : "Uma cobrança está chegando."}` +
      (sinceCheckIn !== null
        ? ` Seu último registro foi há ${sinceCheckIn} dia${Number(sinceCheckIn) === 1 ? "" : "s"}, então confira antes da renovação.`
        : ""),
    billingSoonNoCheckIn: (dday) =>
      `${dday} · Você ainda não registrou o uso, então não há base para decidir.`,
    verifyKill: (date, amount) =>
      `A primeira data de cobrança após o cancelamento, ${date}, já passou. Cobraram ${amount} nesse dia? Confira a fatura do cartão ou os SMS de pagamento.`,
    amountChanged: (date, observed, billed) =>
      `O e-mail de pagamento de ${date} mostra ${observed}, mas o valor registrado é ${billed}. Confira qual está certo.`,
    risky: (checkIn) => `Último registro: ${checkIn}. Não está valendo o preço.`,
    neverCheckedIn:
      "Você ainda não registrou o uso. Sem saber quanto usa, não dá para decidir se cancela.",
    staleCheckIn: (days) =>
      `Seu último registro foi há ${days} dia${Number(days) === 1 ? "" : "s"}. Seu uso pode ter mudado desde então.`,
    priceCheck: (amount, taxExcluded) =>
      `O valor registrado é ${amount}${taxExcluded ? " (sem impostos)" : ""}. Confira se ainda está certo.`,
    missingBillingMonth:
      "É cobrada por ano, mas não tem mês de cobrança, então não dá para calcular o dia D nem quanto você economizaria.",
    resubscribe: (date) =>
      `Ao cancelar, você pediu um lembrete em ${date}. Veja se é hora de usar de novo. Se não, é só apagar o lembrete.`,
    killCheckDate: (year, month, day, sameYear) =>
      sameYear ? `${day}/${month}` : `${day}/${month}/${year}`,
  },
};
