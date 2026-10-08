import type { Widen } from "../types";
import { MONTHS_LONG, one } from "../english";

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
