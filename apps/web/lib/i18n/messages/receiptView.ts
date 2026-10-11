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
        "영수증은 이 기기의 기록으로 만들어요. 저장하거나 공유할 때만 기기 밖으로 나가요. 서비스 이름이 적혀 있으니 보내기 전에 확인하세요.",
      yearDetail: (year: number) => `${year}년 결산 자세히 보기`,
      imageSaved: "영수증 이미지를 저장했어요",
      imageFailed: "이미지를 만들지 못했어요. 글로 공유해 보세요.",
      textCopied: "영수증 글을 복사했어요",
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
        "The receipt is made from this device's records. It only leaves the device when you save or share it. Service names are printed on it, so check before sending.",
      yearDetail: (year) => `See the ${year} year in review`,
      imageSaved: "Saved the receipt image",
      imageFailed: "Couldn't make the image. Try sharing it as text.",
      textCopied: "Copied the receipt text",
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
        "小票由这台设备上的记录生成。只有在你保存或分享时才会离开设备。上面印有服务名称，发送前请确认。",
      yearDetail: (year) => `查看 ${year} 年度总结`,
      imageSaved: "已保存小票图片",
      imageFailed: "无法生成图片。请尝试以文字分享。",
      textCopied: "已复制小票文字",
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
        "レシートはこの端末の記録から作ります。保存や共有をしたときだけ端末の外に出ます。サービス名が印字されるので、送る前に確認してください。",
      yearDetail: (year) => `${year}年の年間まとめを見る`,
      imageSaved: "レシートの画像を保存しました",
      imageFailed: "画像を作れませんでした。テキストで共有してみてください。",
      textCopied: "レシートの文章をコピーしました",
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
        "Hóa đơn được tạo từ dữ liệu trên thiết bị này. Nó chỉ rời thiết bị khi bạn lưu hoặc chia sẻ. Tên dịch vụ được in trên đó, hãy kiểm tra trước khi gửi.",
      yearDetail: (year) => `Xem tổng kết năm ${year}`,
      imageSaved: "Đã lưu ảnh hóa đơn",
      imageFailed: "Không tạo được ảnh. Hãy thử chia sẻ dạng văn bản.",
      textCopied: "Đã sao chép nội dung hóa đơn",
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
        "Le ticket est créé à partir des données de cet appareil. Il ne quitte l'appareil que si vous l'enregistrez ou le partagez. Les noms des services y figurent : vérifiez avant de l'envoyer.",
      yearDetail: (year) => `Voir le bilan ${year}`,
      imageSaved: "Image du ticket enregistrée",
      imageFailed: "Impossible de créer l'image. Essayez de partager en texte.",
      textCopied: "Texte du ticket copié",
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
        "El ticket se crea con los datos de este dispositivo. Solo sale del dispositivo cuando lo guardas o compartes. Lleva impresos los nombres de los servicios, así que revísalo antes de enviarlo.",
      yearDetail: (year) => `Ver el resumen de ${year}`,
      imageSaved: "Imagen del ticket guardada",
      imageFailed: "No se pudo crear la imagen. Prueba a compartirlo como texto.",
      textCopied: "Texto del ticket copiado",
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
        "Der Beleg wird aus den Daten dieses Geräts erstellt. Er verlässt das Gerät nur, wenn du ihn speicherst oder teilst. Die Namen der Dienste stehen darauf, prüf ihn also vor dem Senden.",
      yearDetail: (year) => `Jahresrückblick ${year} ansehen`,
      imageSaved: "Belegbild gespeichert",
      imageFailed: "Das Bild konnte nicht erstellt werden. Versuch es als Text zu teilen.",
      textCopied: "Belegtext kopiert",
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
        "O recibo é feito com os dados deste dispositivo. Ele só sai do dispositivo quando você salva ou compartilha. Os nomes dos serviços aparecem impressos, então confira antes de enviar.",
      yearDetail: (year) => `Ver o resumo de ${year}`,
      imageSaved: "Imagem do recibo salva",
      imageFailed: "Não foi possível criar a imagem. Tente compartilhar como texto.",
      textCopied: "Texto do recibo copiado",
    },
    image: { noCanvas: "Canvas indisponível", noBlob: "Não foi possível criar a imagem" },
  },
};
