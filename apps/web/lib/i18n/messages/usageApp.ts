import type { Widen } from "../types";
import { MONTHS_SHORT, countOf } from "../english";
import { monthName } from "../months";

/**
 * 앱의 폰 사용 기록 화면(리포트의 구독 사용 현황·구독 상세의 사용 현황). 평가 기준(`lib/usage/value`)과
 * 시간 계산은 그대로 쓰고 말만 옮긴다.
 */
export const ko = {
  usageApp: {
    range: { week: "1주", month: "1달", year: "1년" },
    rangeLabel: "기간",
    level: { red: "비쌈", yellow: "애매", green: "잘 씀" },
    per: { uses: "1회당", days: "하루당", hours: "시간당" },
    /** '잘 씀' 기준·잰 양: '4회' · '10일' · '10시간'. */
    goal: {
      uses: (n: number) => `${n}회`,
      days: (n: number) => `${n}일`,
      hours: (n: number) => `${n}시간`,
    },
    month: (m: number) => `${m}월`,
    monthDay: (m: number, d: number) => `${m}월 ${d}일`,
    weekdays: ["일", "월", "화", "수", "목", "금", "토"],
    seconds: (s: number) => `${s}초`,
    noRecord: "기록 없음",
    times: (n: number) => `${n}회`,
    timesUnit: "회",
    usedTime: "사용 시간",
    opens: "쓴 횟수",
    unused: "안 씀",
    pending: (days: number) => `평가까지 ${days}일`,
    connect: "폰 사용 기록 연결하기",
    title: "구독 사용 현황",
    thisPhone: "이 폰 기준",
    line: {
      unopenedFor: (days: number) => `${days}일 동안 안 열었어요`,
      daysUsed: (days: number) => `${days}일 사용`,
      notInstalled: "이 폰에 앱이 없어요",
      noData: "이 기간에는 기록이 없어요",
      spentIn: (duration: string) => `${duration}에`,
      unusedDetail: (days: number) => `${days}일 동안 이 폰에서 한 번도 안 열었어요`,
      captionPending: (days: number, have: string, goal: string) =>
        `${days}일 동안 ${have} · 잘 씀 기준은 30일에 ${goal}`,
      captionMonth: (have: string, goal: string) => `한 달에 ${have} · 잘 씀 기준 ${goal}`,
      shareTime: (percent: number) => `구독 앱 전체 사용 시간의 ${percent}%`,
      shareOpens: (percent: number) => `구독 앱 전체 쓴 횟수의 ${percent}%`,
    },
    detail: {
      connectBody: "이 구독 앱을 얼마나 썼는지 기간별로 보여 드려요",
      title: "사용 현황",
      notInstalled: "이 폰에 앱이 없어요. 다른 기기에서 쓴다면 체크인으로 알려 주세요.",
      listenNote:
        "사용 시간에는 화면을 끄고 들은 재생 시간(재생 알림이 떠 있던 시간)도 들어가요. 일시정지 시간이 섞일 수 있어요.",
      dashed: "점선은 기록이 없는 때예요.",
      valueTitle: "이 구독의 가성비",
      shortLabel: "쓴 시간 동안 낸 돈",
      measuredUses: (days: number, count: number) => `최근 ${days}일 ${count}회`,
      measuredDays: (days: number, count: number) => `최근 ${days}일 중 ${count}일`,
      measuredHours: (days: number, used: string) => `최근 ${days}일 ${used}`,
      shortNote: (used: string) => `${used}만 써서 시간당은 계산하지 않았어요`,
      noneUses: (days: number) => `최근 ${days}일 동안 1분 넘게 연 적이 없어요`,
      noneDays: (days: number) => `최근 ${days}일 동안 쓴 날이 없어요`,
      noneHours: (days: number) => `최근 ${days}일 동안 안 썼어요`,
      activeDays: "쓴 날",
      days: (n: number) => `${n}일`,
      opened: (days: number, count: number) => `최근 ${days}일 · ${count}회 열었어요`,
      tvNote: "TV·PC에서 쓴 건 빠져 있어요. 체크인은 이 숫자를 채워 두고 고칠 수 있게 해요.",
    },
    report: {
      sort: { value: "가성비", time: "사용 시간", opens: "쓴 횟수" },
      sortLabel: "정렬",
      offBody: "폰 사용 기록을 연결하면 구독 앱을 얼마나 썼는지, 시간당 얼마였는지 보여 드려요.",
      recordedSuffix: (days: number) => ` · 기록 ${days}일`,
      totalTime: "구독 앱 사용 시간",
      totalOpens: "구독 앱 쓴 횟수",
      empty: "아직 쌓인 기록이 없어요. 내일부터 이 폰의 사용 기록이 여기에 쌓여요.",
      valueRecent: "가성비는 기간과 관계없이 최근 30일로 봐요.",
      legendValue:
        "막대가 꽉 차면 '잘 씀'이에요(한 달에 OTT 4회 · AI 10일(하루 5분 이상) · 음악 10시간, 체크인과 같은 기준). 평가는 기록이 30일 쌓이면 나와요.",
      legendShare: "막대를 모두 더하면 100%예요. 색은 가성비 평가예요.",
      tvMissing: "TV·PC에서 본 건 빠져 있어요.",
      unmapped: (count: number) =>
        ` 멤버십이나 PC에서 쓰는 구독 ${count}개는 폰 기록으로 알 수 없어 빠졌어요.`,
      yearTitle: "1년 추이",
      yearSub: "달별 사용 시간",
      since: (date: string) => `${date}부터 이 폰에 쌓은 기록이에요. 점선은 기록이 없는 달이에요.`,
    },
  },
};

export const en: Widen<typeof ko> = {
  usageApp: {
    range: { week: "1 week", month: "1 month", year: "1 year" },
    rangeLabel: "Period",
    level: { red: "Pricey", yellow: "So-so", green: "Good value" },
    per: { uses: "per use", days: "per day", hours: "per hour" },
    goal: {
      uses: (n) => countOf(n, "use"),
      days: (n) => countOf(n, "day"),
      hours: (n) => countOf(n, "hour"),
    },
    month: (m) => MONTHS_SHORT[Number(m) - 1] ?? String(m),
    monthDay: (m, d) => `${MONTHS_SHORT[Number(m) - 1] ?? m} ${d}`,
    weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    seconds: (s) => `${s} sec`,
    noRecord: "no record",
    times: (n) => countOf(n, "time"),
    timesUnit: "times",
    usedTime: "Time used",
    opens: "Times used",
    unused: "Unused",
    pending: (days) => `${countOf(days, "day")} until rated`,
    connect: "Connect phone usage history",
    title: "Subscription usage",
    thisPhone: "On this phone",
    line: {
      unopenedFor: (days) => `Not opened in ${countOf(days, "day")}`,
      daysUsed: (days) => `Used ${countOf(days, "day")}`,
      notInstalled: "The app isn't on this phone",
      noData: "No records for this period",
      spentIn: (duration) => `for ${duration}`,
      unusedDetail: (days) => `Not opened once on this phone in ${countOf(days, "day")}`,
      captionPending: (days, have, goal) =>
        `${have} in ${countOf(days, "day")} · “Good value” is ${goal} in 30 days`,
      captionMonth: (have, goal) => `${have} a month · “Good value” is ${goal}`,
      shareTime: (percent) => `${percent}% of all subscription app time`,
      shareOpens: (percent) => `${percent}% of all subscription app uses`,
    },
    detail: {
      connectBody: "We show how much you used this subscription's app, by period",
      title: "Usage",
      notInstalled:
        "The app isn't on this phone. If you use it on another device, tell us with a check-in.",
      listenNote:
        "Time used includes playback with the screen off (while the playback notification was showing). Paused time may be mixed in.",
      dashed: "Dashed lines are times with no record.",
      valueTitle: "This subscription's value",
      shortLabel: "Paid for the time used",
      measuredUses: (days, count) =>
        `${countOf(count, "time")} in the last ${countOf(days, "day")}`,
      measuredDays: (days, count) => `${count} of the last ${countOf(days, "day")}`,
      measuredHours: (days, used) => `${used} in the last ${countOf(days, "day")}`,
      shortNote: (used) => `Only ${used} used, so no per-hour cost`,
      noneUses: (days) => `Not opened for over a minute in the last ${countOf(days, "day")}`,
      noneDays: (days) => `No days used in the last ${countOf(days, "day")}`,
      noneHours: (days) => `Not used in the last ${countOf(days, "day")}`,
      activeDays: "Days used",
      days: (n) => countOf(n, "day"),
      opened: (days, count) => `Last ${countOf(days, "day")} · opened ${countOf(count, "time")}`,
      tvNote:
        "Use on a TV or PC isn't included. Check-in fills in this number and lets you correct it.",
    },
    report: {
      sort: { value: "Value", time: "Time used", opens: "Times used" },
      sortLabel: "Sort",
      offBody:
        "Connect your phone usage history to see how much you used your subscription apps and what they cost per hour.",
      recordedSuffix: (days) => ` · ${countOf(days, "day")} recorded`,
      totalTime: "Subscription app time",
      totalOpens: "Subscription app uses",
      empty: "No records yet. From tomorrow, this phone's usage history builds up here.",
      valueRecent: "Value is always based on the last 30 days, whatever the period.",
      legendValue:
        "A full bar means “Good value” (a month of 4 OTT uses · 10 AI days (5+ minutes a day) · 10 hours of music, the same as check-ins). The rating appears once 30 days are recorded.",
      legendShare: "All bars add up to 100%. The color is the value rating.",
      tvMissing: "Watching on a TV or PC isn't included.",
      unmapped: (count) =>
        ` ${countOf(count, "subscription")} used as a membership or on a PC can't be measured from phone records and are left out.`,
      yearTitle: "1-year trend",
      yearSub: "Time used per month",
      since: (date) =>
        `Records built up on this phone since ${date}. Dashed lines are months with no record.`,
    },
  },
};

const uaPl = (n: number, one: string, many: string) => (Number(n) === 1 ? one : many);
const shortMonth = (locale: "fr" | "es" | "de" | "pt", m: number) =>
  monthName(locale, m).slice(0, 3);

export const zh: Widen<typeof ko> = {
  usageApp: {
    range: { week: "1 周", month: "1 个月", year: "1 年" },
    rangeLabel: "期间",
    level: { red: "不划算", yellow: "一般", green: "划算" },
    per: { uses: "每次", days: "每天", hours: "每小时" },
    goal: { uses: (n) => `${n} 次`, days: (n) => `${n} 天`, hours: (n) => `${n} 小时` },
    month: (m) => `${Number(m)}月`,
    monthDay: (m, d) => `${Number(m)}月${d}日`,
    weekdays: ["日", "一", "二", "三", "四", "五", "六"],
    seconds: (s) => `${s} 秒`,
    noRecord: "没有记录",
    times: (n) => `${n} 次`,
    timesUnit: "次",
    usedTime: "使用时间",
    opens: "使用次数",
    unused: "未使用",
    pending: (days) => `还有 ${days} 天出评价`,
    connect: "连接手机使用记录",
    title: "订阅使用情况",
    thisPhone: "这部手机",
    line: {
      unopenedFor: (days) => `${days} 天没有打开`,
      daysUsed: (days) => `使用了 ${days} 天`,
      notInstalled: "这部手机上没有该应用",
      noData: "这段期间没有记录",
      spentIn: (duration) => `共 ${duration}`,
      unusedDetail: (days) => `${days} 天里在这部手机上一次也没打开`,
      captionPending: (days, have, goal) => `${days} 天内 ${have} · 30 天 ${goal} 为“划算”`,
      captionMonth: (have, goal) => `每月 ${have} · ${goal} 为“划算”`,
      shareTime: (percent) => `占所有订阅应用时间的 ${percent}%`,
      shareOpens: (percent) => `占所有订阅应用使用次数的 ${percent}%`,
    },
    detail: {
      connectBody: "按期间显示这个订阅的应用用了多少",
      title: "使用情况",
      notInstalled: "这部手机上没有该应用。如果在其他设备上使用，请通过签到告诉我们。",
      listenNote: "使用时间包括关屏播放（显示播放通知期间）。可能混有暂停的时间。",
      dashed: "虚线表示没有记录的时间。",
      valueTitle: "这个订阅的性价比",
      shortLabel: "按使用时间算的费用",
      measuredUses: (days, count) => `最近 ${days} 天 ${count} 次`,
      measuredDays: (days, count) => `最近 ${days} 天中 ${count} 天`,
      measuredHours: (days, used) => `最近 ${days} 天 ${used}`,
      shortNote: (used) => `只用了 ${used}，不计算每小时费用`,
      noneUses: (days) => `最近 ${days} 天没有打开超过 1 分钟`,
      noneDays: (days) => `最近 ${days} 天没有使用的天`,
      noneHours: (days) => `最近 ${days} 天没有使用`,
      activeDays: "使用天数",
      days: (n) => `${n} 天`,
      opened: (days, count) => `最近 ${days} 天 · 打开 ${count} 次`,
      tvNote: "不包括在电视或电脑上的使用。签到时会填入这个数字，你可以修改。",
    },
    report: {
      sort: { value: "性价比", time: "使用时间", opens: "使用次数" },
      sortLabel: "排序",
      offBody: "连接手机使用记录，就能看到订阅应用用了多少、每小时多少钱。",
      recordedSuffix: (days) => ` · 已记录 ${days} 天`,
      totalTime: "订阅应用使用时间",
      totalOpens: "订阅应用使用次数",
      empty: "还没有记录。从明天起，这部手机的使用记录会积累在这里。",
      valueRecent: "无论选择哪个期间，性价比都按最近 30 天计算。",
      legendValue:
        "柱条满格表示“划算”（每月 OTT 4 次 · AI 10 天（每天 5 分钟以上）· 音乐 10 小时，与签到相同）。记录满 30 天后显示评价。",
      legendShare: "所有柱条加起来是 100%。颜色表示性价比评价。",
      tvMissing: "不包括在电视或电脑上观看的部分。",
      unmapped: (count) => ` 有 ${count} 个会员或在电脑上使用的订阅无法用手机记录测量，未计入。`,
      yearTitle: "1 年趋势",
      yearSub: "每月使用时间",
      since: (date) => `从 ${date} 起在这部手机上积累的记录。虚线表示没有记录的月份。`,
    },
  },
};

export const ja: Widen<typeof ko> = {
  usageApp: {
    range: { week: "1 週間", month: "1 か月", year: "1 年" },
    rangeLabel: "期間",
    level: { red: "割高", yellow: "まあまあ", green: "お得" },
    per: { uses: "1 回あたり", days: "1 日あたり", hours: "1 時間あたり" },
    goal: { uses: (n) => `${n} 回`, days: (n) => `${n} 日`, hours: (n) => `${n} 時間` },
    month: (m) => `${Number(m)}月`,
    monthDay: (m, d) => `${Number(m)}月${d}日`,
    weekdays: ["日", "月", "火", "水", "木", "金", "土"],
    seconds: (s) => `${s} 秒`,
    noRecord: "記録なし",
    times: (n) => `${n} 回`,
    timesUnit: "回",
    usedTime: "利用時間",
    opens: "利用回数",
    unused: "未使用",
    pending: (days) => `評価まであと ${days} 日`,
    connect: "スマホの利用記録をつなぐ",
    title: "サブスクの利用状況",
    thisPhone: "このスマホ",
    line: {
      unopenedFor: (days) => `${days} 日間開いていません`,
      daysUsed: (days) => `${days} 日利用`,
      notInstalled: "このスマホにアプリがありません",
      noData: "この期間の記録はありません",
      spentIn: (duration) => `計 ${duration}`,
      unusedDetail: (days) => `${days} 日間このスマホで一度も開いていません`,
      captionPending: (days, have, goal) => `${days} 日で ${have} · 30 日で ${goal} なら「お得」`,
      captionMonth: (have, goal) => `月 ${have} · ${goal} なら「お得」`,
      shareTime: (percent) => `サブスクアプリ全体の時間の ${percent}%`,
      shareOpens: (percent) => `サブスクアプリ全体の利用回数の ${percent}%`,
    },
    detail: {
      connectBody: "このサブスクのアプリをどれだけ使ったかを期間ごとに表示します",
      title: "利用状況",
      notInstalled:
        "このスマホにアプリがありません。ほかの端末で使っているならチェックインで教えてください。",
      listenNote:
        "利用時間には画面を消した再生（再生通知が出ていた間）も含みます。一時停止の時間が混ざることがあります。",
      dashed: "点線は記録のない時間です。",
      valueTitle: "このサブスクの元の取れ具合",
      shortLabel: "使った時間あたりの料金",
      measuredUses: (days, count) => `直近 ${days} 日で ${count} 回`,
      measuredDays: (days, count) => `直近 ${days} 日中 ${count} 日`,
      measuredHours: (days, used) => `直近 ${days} 日で ${used}`,
      shortNote: (used) => `${used} しか使っていないので 1 時間あたりの料金は出しません`,
      noneUses: (days) => `直近 ${days} 日に 1 分以上開いたことがありません`,
      noneDays: (days) => `直近 ${days} 日に使った日がありません`,
      noneHours: (days) => `直近 ${days} 日に使っていません`,
      activeDays: "使った日数",
      days: (n) => `${n} 日`,
      opened: (days, count) => `直近 ${days} 日 · ${count} 回開いた`,
      tvNote:
        "テレビや PC での利用は含まれません。チェックインでこの数を入れ、直すことができます。",
    },
    report: {
      sort: { value: "お得度", time: "利用時間", opens: "利用回数" },
      sortLabel: "並べ替え",
      offBody:
        "スマホの利用記録をつなぐと、サブスクアプリをどれだけ使い、1 時間あたりいくらかがわかります。",
      recordedSuffix: (days) => ` · ${days} 日分の記録`,
      totalTime: "サブスクアプリの利用時間",
      totalOpens: "サブスクアプリの利用回数",
      empty: "まだ記録がありません。明日から、このスマホの利用記録がここにたまります。",
      valueRecent: "お得度は期間にかかわらず、いつも直近 30 日で見ます。",
      legendValue:
        "棒がいっぱいなら「お得」です（月に OTT 4 回 · AI 10 日（1 日 5 分以上）· 音楽 10 時間、チェックインと同じ）。記録が 30 日たまると評価が出ます。",
      legendShare: "棒を全部足すと 100% です。色はお得度の評価です。",
      tvMissing: "テレビや PC で見た分は含まれません。",
      unmapped: (count) =>
        ` メンバーシップや PC で使うサブスク ${count} 件はスマホの記録で測れないため除いています。`,
      yearTitle: "1 年の推移",
      yearSub: "月ごとの利用時間",
      since: (date) => `${date} からこのスマホにたまった記録です。点線は記録のない月です。`,
    },
  },
};

export const vi: Widen<typeof ko> = {
  usageApp: {
    range: { week: "1 tuần", month: "1 tháng", year: "1 năm" },
    rangeLabel: "Khoảng thời gian",
    level: { red: "Đắt", yellow: "Tạm được", green: "Đáng tiền" },
    per: { uses: "mỗi lần", days: "mỗi ngày", hours: "mỗi giờ" },
    goal: { uses: (n) => `${n} lần`, days: (n) => `${n} ngày`, hours: (n) => `${n} giờ` },
    month: (m) => `T${Number(m)}`,
    monthDay: (m, d) => `${d}/${Number(m)}`,
    weekdays: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
    seconds: (s) => `${s} giây`,
    noRecord: "không có dữ liệu",
    times: (n) => `${n} lần`,
    timesUnit: "lần",
    usedTime: "Thời gian dùng",
    opens: "Số lần dùng",
    unused: "Chưa dùng",
    pending: (days) => `Còn ${days} ngày đến khi đánh giá`,
    connect: "Kết nối dữ liệu sử dụng điện thoại",
    title: "Mức sử dụng gói đăng ký",
    thisPhone: "Trên điện thoại này",
    line: {
      unopenedFor: (days) => `Không mở trong ${days} ngày`,
      daysUsed: (days) => `Đã dùng ${days} ngày`,
      notInstalled: "Điện thoại này không có ứng dụng",
      noData: "Không có dữ liệu trong khoảng này",
      spentIn: (duration) => `trong ${duration}`,
      unusedDetail: (days) => `Không mở lần nào trên điện thoại này trong ${days} ngày`,
      captionPending: (days, have, goal) =>
        `${have} trong ${days} ngày · “Đáng tiền” là ${goal} trong 30 ngày`,
      captionMonth: (have, goal) => `${have} mỗi tháng · “Đáng tiền” là ${goal}`,
      shareTime: (percent) => `${percent}% tổng thời gian dùng ứng dụng đăng ký`,
      shareOpens: (percent) => `${percent}% tổng số lần dùng ứng dụng đăng ký`,
    },
    detail: {
      connectBody: "Hiển thị mức dùng ứng dụng của gói này theo từng khoảng thời gian",
      title: "Mức sử dụng",
      notInstalled:
        "Điện thoại này không có ứng dụng. Nếu bạn dùng trên thiết bị khác, hãy cho biết qua check-in.",
      listenNote:
        "Thời gian dùng gồm cả lúc phát khi tắt màn hình (khi thông báo phát đang hiện). Có thể lẫn thời gian tạm dừng.",
      dashed: "Đường nét đứt là thời gian không có dữ liệu.",
      valueTitle: "Giá trị của gói này",
      shortLabel: "Chi phí theo thời gian dùng",
      measuredUses: (days, count) => `${count} lần trong ${days} ngày gần nhất`,
      measuredDays: (days, count) => `${count} trong ${days} ngày gần nhất`,
      measuredHours: (days, used) => `${used} trong ${days} ngày gần nhất`,
      shortNote: (used) => `Chỉ dùng ${used} nên không tính chi phí mỗi giờ`,
      noneUses: (days) => `Không mở quá 1 phút trong ${days} ngày gần nhất`,
      noneDays: (days) => `Không có ngày dùng trong ${days} ngày gần nhất`,
      noneHours: (days) => `Không dùng trong ${days} ngày gần nhất`,
      activeDays: "Số ngày dùng",
      days: (n) => `${n} ngày`,
      opened: (days, count) => `${days} ngày gần nhất · mở ${count} lần`,
      tvNote: "Không tính việc dùng trên TV hay PC. Check-in sẽ điền con số này và bạn có thể sửa.",
    },
    report: {
      sort: { value: "Giá trị", time: "Thời gian dùng", opens: "Số lần dùng" },
      sortLabel: "Sắp xếp",
      offBody:
        "Kết nối dữ liệu sử dụng điện thoại để xem bạn dùng ứng dụng đăng ký bao nhiêu và tốn bao nhiêu mỗi giờ.",
      recordedSuffix: (days) => ` · đã ghi ${days} ngày`,
      totalTime: "Thời gian dùng ứng dụng đăng ký",
      totalOpens: "Số lần dùng ứng dụng đăng ký",
      empty: "Chưa có dữ liệu. Từ ngày mai, dữ liệu sử dụng của điện thoại này sẽ được ghi ở đây.",
      valueRecent: "Giá trị luôn tính theo 30 ngày gần nhất, bất kể khoảng thời gian.",
      legendValue:
        "Cột đầy nghĩa là “Đáng tiền” (mỗi tháng OTT 4 lần · AI 10 ngày (từ 5 phút/ngày) · nhạc 10 giờ, giống check-in). Đánh giá xuất hiện khi đã ghi đủ 30 ngày.",
      legendShare: "Tổng các cột là 100%. Màu là đánh giá giá trị.",
      tvMissing: "Không tính phần xem trên TV hay PC.",
      unmapped: (count) =>
        ` ${count} gói dùng dạng thành viên hoặc trên PC không đo được bằng dữ liệu điện thoại nên không được tính.`,
      yearTitle: "Xu hướng 1 năm",
      yearSub: "Thời gian dùng mỗi tháng",
      since: (date) =>
        `Dữ liệu ghi trên điện thoại này từ ${date}. Đường nét đứt là tháng không có dữ liệu.`,
    },
  },
};

export const fr: Widen<typeof ko> = {
  usageApp: {
    range: { week: "1 semaine", month: "1 mois", year: "1 an" },
    rangeLabel: "Période",
    level: { red: "Cher", yellow: "Moyen", green: "Rentable" },
    per: { uses: "par utilisation", days: "par jour", hours: "par heure" },
    goal: {
      uses: (n) => `${n} utilisation${uaPl(n, "", "s")}`,
      days: (n) => `${n} jour${uaPl(n, "", "s")}`,
      hours: (n) => `${n} heure${uaPl(n, "", "s")}`,
    },
    month: (m) => shortMonth("fr", Number(m)),
    monthDay: (m, d) => `${d} ${shortMonth("fr", Number(m))}`,
    weekdays: ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."],
    seconds: (s) => `${s} s`,
    noRecord: "aucune donnée",
    times: (n) => `${n} fois`,
    timesUnit: "fois",
    usedTime: "Temps d'utilisation",
    opens: "Utilisations",
    unused: "Inutilisé",
    pending: (days) => `${days} jour${uaPl(days, "", "s")} avant l'évaluation`,
    connect: "Connecter l'utilisation du téléphone",
    title: "Utilisation des abonnements",
    thisPhone: "Sur ce téléphone",
    line: {
      unopenedFor: (days) => `Pas ouvert depuis ${days} jour${uaPl(days, "", "s")}`,
      daysUsed: (days) => `Utilisé ${days} jour${uaPl(days, "", "s")}`,
      notInstalled: "L'application n'est pas sur ce téléphone",
      noData: "Aucune donnée pour cette période",
      spentIn: (duration) => `pendant ${duration}`,
      unusedDetail: (days) =>
        `Pas ouvert une seule fois sur ce téléphone en ${days} jour${uaPl(days, "", "s")}`,
      captionPending: (days, have, goal) =>
        `${have} en ${days} jour${uaPl(days, "", "s")} · « Rentable », c'est ${goal} en 30 jours`,
      captionMonth: (have, goal) => `${have} par mois · « Rentable », c'est ${goal}`,
      shareTime: (percent) => `${percent} % du temps total des applis d'abonnement`,
      shareOpens: (percent) => `${percent} % des utilisations des applis d'abonnement`,
    },
    detail: {
      connectBody:
        "Nous montrons, par période, combien vous avez utilisé l'application de cet abonnement",
      title: "Utilisation",
      notInstalled:
        "L'application n'est pas sur ce téléphone. Si vous l'utilisez sur un autre appareil, indiquez-le par un check-in.",
      listenNote:
        "Le temps d'utilisation inclut la lecture écran éteint (tant que la notification de lecture est affichée). Des pauses peuvent s'y mêler.",
      dashed: "Les pointillés indiquent des moments sans données.",
      valueTitle: "Valeur de cet abonnement",
      shortLabel: "Payé pour le temps utilisé",
      measuredUses: (days, count) => `${count} fois sur les ${days} derniers jours`,
      measuredDays: (days, count) => `${count} sur les ${days} derniers jours`,
      measuredHours: (days, used) => `${used} sur les ${days} derniers jours`,
      shortNote: (used) => `Seulement ${used} d'utilisation, pas de coût horaire`,
      noneUses: (days) => `Pas ouvert plus d'une minute sur les ${days} derniers jours`,
      noneDays: (days) => `Aucun jour d'utilisation sur les ${days} derniers jours`,
      noneHours: (days) => `Pas utilisé sur les ${days} derniers jours`,
      activeDays: "Jours d'utilisation",
      days: (n) => `${n} jour${uaPl(n, "", "s")}`,
      opened: (days, count) => `${days} derniers jours · ouvert ${count} fois`,
      tvNote:
        "L'usage sur TV ou PC n'est pas inclus. Le check-in reprend ce chiffre et vous permet de le corriger.",
    },
    report: {
      sort: { value: "Valeur", time: "Temps", opens: "Utilisations" },
      sortLabel: "Trier",
      offBody:
        "Connectez l'historique d'utilisation du téléphone pour voir combien vous utilisez vos applis d'abonnement et ce qu'elles coûtent par heure.",
      recordedSuffix: (days) =>
        ` · ${days} jour${uaPl(days, "", "s")} enregistré${uaPl(days, "", "s")}`,
      totalTime: "Temps dans les applis d'abonnement",
      totalOpens: "Utilisations des applis d'abonnement",
      empty: "Pas encore de données. Dès demain, l'historique de ce téléphone s'accumulera ici.",
      valueRecent:
        "La valeur se base toujours sur les 30 derniers jours, quelle que soit la période.",
      legendValue:
        "Une barre pleine signifie « Rentable » (par mois : 4 utilisations de streaming · 10 jours d'IA (5 min+ par jour) · 10 heures de musique, comme pour les check-ins). L'évaluation apparaît après 30 jours de données.",
      legendShare: "Toutes les barres font 100 %. La couleur correspond à l'évaluation.",
      tvMissing: "Ce que vous regardez sur TV ou PC n'est pas inclus.",
      unmapped: (count) =>
        ` ${count} abonnement${uaPl(count, "", "s")} utilisé${uaPl(count, "", "s")} comme adhésion ou sur PC ne ${uaPl(count, "peut", "peuvent")} pas être mesuré${uaPl(count, "", "s")} par le téléphone et ${uaPl(count, "est exclu", "sont exclus")}.`,
      yearTitle: "Tendance sur 1 an",
      yearSub: "Temps d'utilisation par mois",
      since: (date) =>
        `Données accumulées sur ce téléphone depuis le ${date}. Les pointillés indiquent des mois sans données.`,
    },
  },
};

export const es: Widen<typeof ko> = {
  usageApp: {
    range: { week: "1 semana", month: "1 mes", year: "1 año" },
    rangeLabel: "Periodo",
    level: { red: "Caro", yellow: "Regular", green: "Vale la pena" },
    per: { uses: "por uso", days: "por día", hours: "por hora" },
    goal: {
      uses: (n) => `${n} uso${uaPl(n, "", "s")}`,
      days: (n) => `${n} día${uaPl(n, "", "s")}`,
      hours: (n) => `${n} hora${uaPl(n, "", "s")}`,
    },
    month: (m) => shortMonth("es", Number(m)),
    monthDay: (m, d) => `${d} ${shortMonth("es", Number(m))}`,
    weekdays: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
    seconds: (s) => `${s} s`,
    noRecord: "sin registro",
    times: (n) => `${n} ${uaPl(n, "vez", "veces")}`,
    timesUnit: "veces",
    usedTime: "Tiempo de uso",
    opens: "Veces usado",
    unused: "Sin usar",
    pending: (days) => `${days} día${uaPl(days, "", "s")} para la valoración`,
    connect: "Conectar el historial de uso del móvil",
    title: "Uso de suscripciones",
    thisPhone: "En este móvil",
    line: {
      unopenedFor: (days) => `Sin abrir en ${days} día${uaPl(days, "", "s")}`,
      daysUsed: (days) => `Usado ${days} día${uaPl(days, "", "s")}`,
      notInstalled: "La app no está en este móvil",
      noData: "Sin registros en este periodo",
      spentIn: (duration) => `durante ${duration}`,
      unusedDetail: (days) =>
        `No se abrió ni una vez en este móvil en ${days} día${uaPl(days, "", "s")}`,
      captionPending: (days, have, goal) =>
        `${have} en ${days} día${uaPl(days, "", "s")} · «Vale la pena» es ${goal} en 30 días`,
      captionMonth: (have, goal) => `${have} al mes · «Vale la pena» es ${goal}`,
      shareTime: (percent) => `${percent} % del tiempo total en apps de suscripción`,
      shareOpens: (percent) => `${percent} % de los usos de apps de suscripción`,
    },
    detail: {
      connectBody: "Mostramos por periodo cuánto usaste la app de esta suscripción",
      title: "Uso",
      notInstalled:
        "La app no está en este móvil. Si la usas en otro dispositivo, dínoslo con un registro.",
      listenNote:
        "El tiempo de uso incluye la reproducción con la pantalla apagada (mientras se ve la notificación de reproducción). Puede incluir pausas.",
      dashed: "Las líneas discontinuas son momentos sin registro.",
      valueTitle: "Valor de esta suscripción",
      shortLabel: "Pagado por el tiempo usado",
      measuredUses: (days, count) =>
        `${count} ${uaPl(count, "vez", "veces")} en los últimos ${days} días`,
      measuredDays: (days, count) => `${count} de los últimos ${days} días`,
      measuredHours: (days, used) => `${used} en los últimos ${days} días`,
      shortNote: (used) => `Solo ${used} de uso, así que no hay coste por hora`,
      noneUses: (days) => `No se abrió más de un minuto en los últimos ${days} días`,
      noneDays: (days) => `Ningún día de uso en los últimos ${days} días`,
      noneHours: (days) => `Sin uso en los últimos ${days} días`,
      activeDays: "Días de uso",
      days: (n) => `${n} día${uaPl(n, "", "s")}`,
      opened: (days, count) =>
        `Últimos ${days} días · abierta ${count} ${uaPl(count, "vez", "veces")}`,
      tvNote: "No incluye el uso en TV o PC. El registro rellena esta cifra y te deja corregirla.",
    },
    report: {
      sort: { value: "Valor", time: "Tiempo", opens: "Veces" },
      sortLabel: "Ordenar",
      offBody:
        "Conecta el historial de uso del móvil para ver cuánto usas tus apps de suscripción y cuánto cuestan por hora.",
      recordedSuffix: (days) =>
        ` · ${days} día${uaPl(days, "", "s")} registrado${uaPl(days, "", "s")}`,
      totalTime: "Tiempo en apps de suscripción",
      totalOpens: "Usos de apps de suscripción",
      empty:
        "Aún no hay registros. A partir de mañana, el historial de este móvil se acumulará aquí.",
      valueRecent: "El valor siempre se basa en los últimos 30 días, sea cual sea el periodo.",
      legendValue:
        "Una barra llena significa «Vale la pena» (al mes: 4 usos de streaming · 10 días de IA (5+ min al día) · 10 horas de música, igual que en los registros). La valoración aparece tras 30 días de registros.",
      legendShare: "Todas las barras suman 100 %. El color es la valoración.",
      tvMissing: "No incluye lo que veas en una TV o un PC.",
      unmapped: (count) =>
        ` ${count} suscripci${uaPl(count, "ón usada", "ones usadas")} como membresía o en PC no se ${uaPl(count, "puede", "pueden")} medir con el móvil y ${uaPl(count, "queda", "quedan")} fuera.`,
      yearTitle: "Tendencia de 1 año",
      yearSub: "Tiempo de uso por mes",
      since: (date) =>
        `Registros acumulados en este móvil desde el ${date}. Las líneas discontinuas son meses sin registro.`,
    },
  },
};

export const de: Widen<typeof ko> = {
  usageApp: {
    range: { week: "1 Woche", month: "1 Monat", year: "1 Jahr" },
    rangeLabel: "Zeitraum",
    level: { red: "Teuer", yellow: "Mittel", green: "Lohnt sich" },
    per: { uses: "pro Nutzung", days: "pro Tag", hours: "pro Stunde" },
    goal: {
      uses: (n) => `${n} ${uaPl(n, "Nutzung", "Nutzungen")}`,
      days: (n) => `${n} ${uaPl(n, "Tag", "Tage")}`,
      hours: (n) => `${n} ${uaPl(n, "Stunde", "Stunden")}`,
    },
    month: (m) => shortMonth("de", Number(m)),
    monthDay: (m, d) => `${d}. ${shortMonth("de", Number(m))}`,
    weekdays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    seconds: (s) => `${s} Sek.`,
    noRecord: "keine Daten",
    times: (n) => `${n}-mal`,
    timesUnit: "-mal",
    usedTime: "Nutzungszeit",
    opens: "Nutzungen",
    unused: "Ungenutzt",
    pending: (days) => `Noch ${days} ${uaPl(days, "Tag", "Tage")} bis zur Bewertung`,
    connect: "Handynutzung verbinden",
    title: "Abo-Nutzung",
    thisPhone: "Auf diesem Handy",
    line: {
      unopenedFor: (days) => `Seit ${days} ${uaPl(days, "Tag", "Tagen")} nicht geöffnet`,
      daysUsed: (days) => `An ${days} ${uaPl(days, "Tag", "Tagen")} genutzt`,
      notInstalled: "Die App ist nicht auf diesem Handy",
      noData: "Keine Daten für diesen Zeitraum",
      spentIn: (duration) => `für ${duration}`,
      unusedDetail: (days) =>
        `In ${days} ${uaPl(days, "Tag", "Tagen")} kein einziges Mal auf diesem Handy geöffnet`,
      captionPending: (days, have, goal) =>
        `${have} in ${days} ${uaPl(days, "Tag", "Tagen")} · „Lohnt sich“ ist ${goal} in 30 Tagen`,
      captionMonth: (have, goal) => `${have} pro Monat · „Lohnt sich“ ist ${goal}`,
      shareTime: (percent) => `${percent} % der gesamten Abo-App-Zeit`,
      shareOpens: (percent) => `${percent} % aller Abo-App-Nutzungen`,
    },
    detail: {
      connectBody: "Wir zeigen nach Zeitraum, wie viel du die App dieses Abos genutzt hast",
      title: "Nutzung",
      notInstalled:
        "Die App ist nicht auf diesem Handy. Wenn du sie auf einem anderen Gerät nutzt, sag es uns per Eintrag.",
      listenNote:
        "Die Nutzungszeit umfasst Wiedergabe bei ausgeschaltetem Bildschirm (solange die Wiedergabe-Benachrichtigung angezeigt wurde). Pausen können enthalten sein.",
      dashed: "Gestrichelte Linien sind Zeiten ohne Daten.",
      valueTitle: "Wert dieses Abos",
      shortLabel: "Bezahlt für die genutzte Zeit",
      measuredUses: (days, count) => `${count}-mal in den letzten ${days} Tagen`,
      measuredDays: (days, count) => `${count} der letzten ${days} Tage`,
      measuredHours: (days, used) => `${used} in den letzten ${days} Tagen`,
      shortNote: (used) => `Nur ${used} genutzt, daher keine Kosten pro Stunde`,
      noneUses: (days) => `In den letzten ${days} Tagen nie länger als eine Minute geöffnet`,
      noneDays: (days) => `Keine Nutzungstage in den letzten ${days} Tagen`,
      noneHours: (days) => `In den letzten ${days} Tagen nicht genutzt`,
      activeDays: "Nutzungstage",
      days: (n) => `${n} ${uaPl(n, "Tag", "Tage")}`,
      opened: (days, count) => `Letzte ${days} Tage · ${count}-mal geöffnet`,
      tvNote:
        "Nutzung auf TV oder PC ist nicht enthalten. Der Eintrag übernimmt diese Zahl und lässt dich sie korrigieren.",
    },
    report: {
      sort: { value: "Wert", time: "Zeit", opens: "Nutzungen" },
      sortLabel: "Sortieren",
      offBody:
        "Verbinde den Nutzungsverlauf deines Handys, um zu sehen, wie viel du deine Abo-Apps nutzt und was sie pro Stunde kosten.",
      recordedSuffix: (days) => ` · ${days} ${uaPl(days, "Tag", "Tage")} erfasst`,
      totalTime: "Zeit in Abo-Apps",
      totalOpens: "Nutzungen von Abo-Apps",
      empty: "Noch keine Daten. Ab morgen sammelt sich hier der Nutzungsverlauf dieses Handys.",
      valueRecent:
        "Der Wert beruht immer auf den letzten 30 Tagen, egal welcher Zeitraum gewählt ist.",
      legendValue:
        "Ein voller Balken bedeutet „Lohnt sich“ (pro Monat: 4 Streaming-Nutzungen · 10 KI-Tage (ab 5 Min. täglich) · 10 Stunden Musik, wie bei den Einträgen). Die Bewertung erscheint nach 30 erfassten Tagen.",
      legendShare: "Alle Balken ergeben zusammen 100 %. Die Farbe ist die Wertbewertung.",
      tvMissing: "Was du auf TV oder PC schaust, ist nicht enthalten.",
      unmapped: (count) =>
        ` ${count} ${uaPl(count, "Abo, das", "Abos, die")} als Mitgliedschaft oder am PC genutzt ${uaPl(count, "wird, lässt", "werden, lassen")} sich nicht aus Handydaten messen und ${uaPl(count, "fehlt", "fehlen")}.`,
      yearTitle: "Verlauf über 1 Jahr",
      yearSub: "Nutzungszeit pro Monat",
      since: (date) =>
        `Seit ${date} auf diesem Handy gesammelte Daten. Gestrichelte Linien sind Monate ohne Daten.`,
    },
  },
};

export const pt: Widen<typeof ko> = {
  usageApp: {
    range: { week: "1 semana", month: "1 mês", year: "1 ano" },
    rangeLabel: "Período",
    level: { red: "Caro", yellow: "Mais ou menos", green: "Vale a pena" },
    per: { uses: "por uso", days: "por dia", hours: "por hora" },
    goal: {
      uses: (n) => `${n} uso${uaPl(n, "", "s")}`,
      days: (n) => `${n} dia${uaPl(n, "", "s")}`,
      hours: (n) => `${n} hora${uaPl(n, "", "s")}`,
    },
    month: (m) => shortMonth("pt", Number(m)),
    monthDay: (m, d) => `${d} ${shortMonth("pt", Number(m))}`,
    weekdays: ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"],
    seconds: (s) => `${s} s`,
    noRecord: "sem registro",
    times: (n) => `${n} ${uaPl(n, "vez", "vezes")}`,
    timesUnit: "vezes",
    usedTime: "Tempo de uso",
    opens: "Vezes usado",
    unused: "Sem uso",
    pending: (days) => `${days} dia${uaPl(days, "", "s")} até a avaliação`,
    connect: "Conectar histórico de uso do celular",
    title: "Uso das assinaturas",
    thisPhone: "Neste celular",
    line: {
      unopenedFor: (days) => `Sem abrir há ${days} dia${uaPl(days, "", "s")}`,
      daysUsed: (days) => `Usado ${days} dia${uaPl(days, "", "s")}`,
      notInstalled: "O app não está neste celular",
      noData: "Sem registros neste período",
      spentIn: (duration) => `por ${duration}`,
      unusedDetail: (days) =>
        `Não foi aberto nenhuma vez neste celular em ${days} dia${uaPl(days, "", "s")}`,
      captionPending: (days, have, goal) =>
        `${have} em ${days} dia${uaPl(days, "", "s")} · “Vale a pena” é ${goal} em 30 dias`,
      captionMonth: (have, goal) => `${have} por mês · “Vale a pena” é ${goal}`,
      shareTime: (percent) => `${percent}% do tempo total em apps de assinatura`,
      shareOpens: (percent) => `${percent}% dos usos de apps de assinatura`,
    },
    detail: {
      connectBody: "Mostramos por período quanto você usou o app desta assinatura",
      title: "Uso",
      notInstalled:
        "O app não está neste celular. Se você usa em outro dispositivo, conte para a gente num registro.",
      listenNote:
        "O tempo de uso inclui a reprodução com a tela desligada (enquanto a notificação de reprodução aparecia). Pode incluir pausas.",
      dashed: "As linhas tracejadas são momentos sem registro.",
      valueTitle: "Valor desta assinatura",
      shortLabel: "Pago pelo tempo usado",
      measuredUses: (days, count) =>
        `${count} ${uaPl(count, "vez", "vezes")} nos últimos ${days} dias`,
      measuredDays: (days, count) => `${count} dos últimos ${days} dias`,
      measuredHours: (days, used) => `${used} nos últimos ${days} dias`,
      shortNote: (used) => `Só ${used} de uso, então não há custo por hora`,
      noneUses: (days) => `Não foi aberto por mais de um minuto nos últimos ${days} dias`,
      noneDays: (days) => `Nenhum dia de uso nos últimos ${days} dias`,
      noneHours: (days) => `Sem uso nos últimos ${days} dias`,
      activeDays: "Dias de uso",
      days: (n) => `${n} dia${uaPl(n, "", "s")}`,
      opened: (days, count) =>
        `Últimos ${days} dias · aberto ${count} ${uaPl(count, "vez", "vezes")}`,
      tvNote:
        "Não inclui o uso na TV ou no PC. O registro preenche este número e deixa você corrigir.",
    },
    report: {
      sort: { value: "Valor", time: "Tempo", opens: "Vezes" },
      sortLabel: "Ordenar",
      offBody:
        "Conecte o histórico de uso do celular para ver quanto você usa seus apps de assinatura e quanto custam por hora.",
      recordedSuffix: (days) =>
        ` · ${days} dia${uaPl(days, "", "s")} registrado${uaPl(days, "", "s")}`,
      totalTime: "Tempo em apps de assinatura",
      totalOpens: "Usos de apps de assinatura",
      empty:
        "Ainda não há registros. A partir de amanhã, o histórico deste celular vai se acumular aqui.",
      valueRecent: "O valor sempre se baseia nos últimos 30 dias, qualquer que seja o período.",
      legendValue:
        "Uma barra cheia quer dizer “Vale a pena” (por mês: 4 usos de streaming · 10 dias de IA (5+ min por dia) · 10 horas de música, igual aos registros). A avaliação aparece depois de 30 dias de registros.",
      legendShare: "Todas as barras somam 100%. A cor é a avaliação de valor.",
      tvMissing: "Não inclui o que você assiste na TV ou no PC.",
      unmapped: (count) =>
        ` ${count} assinatura${uaPl(count, " usada", "s usadas")} como plano de membro ou no PC não ${uaPl(count, "pode", "podem")} ser medida${uaPl(count, "", "s")} pelo celular e ${uaPl(count, "fica", "ficam")} de fora.`,
      yearTitle: "Tendência de 1 ano",
      yearSub: "Tempo de uso por mês",
      since: (date) =>
        `Registros acumulados neste celular desde ${date}. As linhas tracejadas são meses sem registro.`,
    },
  },
};
