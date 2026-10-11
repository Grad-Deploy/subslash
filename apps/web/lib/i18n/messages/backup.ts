import type { Widen } from "../types";
import { MONTHS_SHORT } from "../english";

const subs = (n: number) => `${n} ${n === 1 ? "subscription" : "subscriptions"}`;
const checkIns = (n: number) => `${n} ${n === 1 ? "check-in" : "check-ins"}`;

/** 설정의 데이터 백업 카드(DataBackupCard)와 그 확인 문구(backupText). */
export const ko = {
  date: (year: number, month: number, day: number) => `${year}년 ${month}월 ${day}일`,
  unknownTime: "알 수 없는 시각",
  localLine: (subscriptionCount: number, usageLogCount: number) =>
    `지금: 구독 ${subscriptionCount}개, 체크인 ${usageLogCount}건`,
  savedLine: (subscriptionCount: number, killedCount: number, usageLogCount: number) =>
    `구독 ${subscriptionCount}개 (해지 ${killedCount}개), 체크인 ${usageLogCount}건`,
  restore: {
    accountLabel: "계정에 저장된 기록",
    fileLabel: "백업",
    replaceWith: (label: string) => `이 기기의 기록을 ${label} 내용으로 바꿔요.`,
    notMerged: "지금 기록은 합쳐지지 않고 사라져요. 필요하면 먼저 '백업 파일 저장'을 누르세요.",
    syncWarning: "자동 동기화 중이라 다른 기기의 기록도 바뀌어요.",
  },
  overwrite: {
    intro: "계정 기록을 이 기기의 기록으로 바꿔요.",
    accountAt: (savedAt: string) => `계정 (${savedAt})`,
    notMerged: "합쳐지지 않고 바뀌어요.",
  },
  lastSaved: (savedAt: string, line: string) => `마지막 저장 ${savedAt} · ${line}`,

  title: "데이터 백업",
  intro:
    "기록은 이 기기에만 있어요. 브라우저를 지우거나 기기를 바꾸기 전에 백업하거나 로그인하세요.",
  exportFile: "백업 파일 저장",
  restoreFile: "백업에서 복원",
  chooseFile: "백업 파일 선택",
  exported: (count: number) => `백업 파일 저장 (구독 ${count}개)`,
  exportFailed: "백업 파일을 만들지 못했습니다. 다시 시도해 주세요.",
  unchanged: "지금 기록은 바뀌지 않았어요.",

  sync: {
    title: "계정 동기화",
    loginHint: "로그인하면 기록이 계정에 저장되고 다른 기기와 자동으로 맞춰져요.",
    login: "로그인",
    onSince: (time: string) => `자동 동기화 켜짐 · 마지막으로 맞춘 시각 ${time}`,
    onSyncing: "자동 동기화 켜짐 · 계정과 맞추는 중…",
    turnOff: "자동 동기화 끄기",
    onNote: "로그인한 기기끼리 기록을 맞춰요. 양쪽이 따로 바뀌면 어느 쪽을 쓸지 물어요.",
    deletedElsewhere:
      "다른 기기에서 계정 기록을 지워 동기화를 멈췄어요. 다시 켜면 이 기기의 기록을 올려요.",
    turnOn: "자동 동기화 켜기",
    saveToAccount: "계정에 저장",
    loadFromAccount: "계정에서 불러오기",
    deleteFromAccount: "계정에서 지우기",
    offNote: "자동 동기화가 꺼져 있어요. ‘계정에 저장’·‘계정에서 불러오기’로 옮기세요.",
    turnedOn: "자동 동기화 켜짐",
    turnedOff: "자동 동기화 꺼짐 · 계정 기록은 그대로예요",
    checking: "계정 기록 확인 중…",
    none: "계정에 저장한 기록이 없어요.",
  },

  errors: {
    checkFailed: "계정에 저장된 기록을 확인하지 못했습니다.",
    checkNetwork: "네트워크에 문제가 있어 확인하지 못했습니다.",
    saveFailed: "계정에 저장하지 못했습니다.",
    saveNetwork: "네트워크에 문제가 있어 계정에 저장하지 못했습니다.",
    noRecord: "계정에 저장된 기록이 없습니다.",
    loadFailed: "계정에 저장된 기록을 불러오지 못했습니다.",
    unreadable: (detail: string) => `계정에 저장된 기록을 읽을 수 없습니다. ${detail}`,
    loadNetwork: "네트워크에 문제가 있어 불러오지 못했습니다.",
    deleteFailed: "계정에 저장된 기록을 지우지 못했습니다.",
    deleteNetwork: "네트워크에 문제가 있어 지우지 못했습니다.",
  },

  savedToAccount: (count: number) => `계정에 저장 (구독 ${count}개)`,
  deleted: "계정 기록을 지우고 자동 동기화를 껐어요. 이 기기의 기록은 그대로예요.",
  loadedFromAccount: (count: number) => `계정에서 구독 ${count}개를 불러왔어요`,
  restoredFromFile: (count: number) => `백업에서 구독 ${count}개를 복원했어요`,

  dialog: {
    loadTitle: "계정에서 불러오기",
    restoreTitle: "백업에서 복원",
    load: "불러오기",
    restore: "복원",
    saveTitle: "계정에 저장",
    save: "저장",
    deleteTitle: "계정에서 지우기",
    deleteDescription:
      "서버의 계정 기록을 지우고 이 기기의 자동 동기화를 꺼요. 이 기기의 기록은 남고, 다른 기기의 동기화는 멈춰요.",
    delete: "지우기",
    cancel: "취소",
  },
};

export const en: Widen<typeof ko> = {
  date: (year, month, day) => `${MONTHS_SHORT[month - 1]} ${day}, ${year}`,
  unknownTime: "unknown time",
  localLine: (subscriptionCount, usageLogCount) =>
    `Now: ${subs(subscriptionCount)}, ${checkIns(usageLogCount)}`,
  savedLine: (subscriptionCount, killedCount, usageLogCount) =>
    `${subs(subscriptionCount)} (${killedCount} cancelled), ${checkIns(usageLogCount)}`,
  restore: {
    accountLabel: "Account records",
    fileLabel: "Backup",
    replaceWith: (label) =>
      `This device's records will be replaced with the ${label.toLowerCase()}.`,
    notMerged:
      "Your current records will be lost, not merged. If you need them, press ‘Save backup file’ first.",
    syncWarning: "Auto sync is on, so records on your other devices will change too.",
  },
  overwrite: {
    intro: "Your account records will be replaced with this device's records.",
    accountAt: (savedAt) => `Account (${savedAt})`,
    notMerged: "They will be replaced, not merged.",
  },
  lastSaved: (savedAt, line) => `Last saved ${savedAt} · ${line}`,

  title: "Data backup",
  intro:
    "Your records live only on this device. Back them up or log in before clearing your browser or changing devices.",
  exportFile: "Save backup file",
  restoreFile: "Restore from backup",
  chooseFile: "Choose backup file",
  exported: (count) => `Backup file saved (${subs(count)})`,
  exportFailed: "Couldn't create the backup file. Please try again.",
  unchanged: "Your current records haven't changed.",

  sync: {
    title: "Account sync",
    loginHint:
      "Log in to save your records to your account and keep them in sync across devices automatically.",
    login: "Log in",
    onSince: (time) => `Auto sync on · last synced ${time}`,
    onSyncing: "Auto sync on · syncing with your account…",
    turnOff: "Turn off auto sync",
    onNote:
      "Devices you're logged in on keep the same records. If both sides change separately, you'll be asked which to keep.",
    deletedElsewhere:
      "Sync stopped because your account records were deleted on another device. Turn it on again to upload this device's records.",
    turnOn: "Turn on auto sync",
    saveToAccount: "Save to account",
    loadFromAccount: "Load from account",
    deleteFromAccount: "Delete from account",
    offNote: "Auto sync is off. Use ‘Save to account’ and ‘Load from account’ to move records.",
    turnedOn: "Auto sync on",
    turnedOff: "Auto sync off · your account records are unchanged",
    checking: "Checking account records…",
    none: "No records saved to your account yet.",
  },

  errors: {
    checkFailed: "Couldn't check the records saved to your account.",
    checkNetwork: "Couldn't check because of a network problem.",
    saveFailed: "Couldn't save to your account.",
    saveNetwork: "Couldn't save to your account because of a network problem.",
    noRecord: "There are no records saved to your account.",
    loadFailed: "Couldn't load the records saved to your account.",
    unreadable: (detail) => `The records saved to your account can't be read. ${detail}`,
    loadNetwork: "Couldn't load because of a network problem.",
    deleteFailed: "Couldn't delete the records saved to your account.",
    deleteNetwork: "Couldn't delete because of a network problem.",
  },

  savedToAccount: (count) => `Saved to account (${subs(count)})`,
  deleted:
    "Deleted your account records and turned off auto sync. This device's records are unchanged.",
  loadedFromAccount: (count) => `Loaded ${subs(count)} from your account`,
  restoredFromFile: (count) => `Restored ${subs(count)} from backup`,

  dialog: {
    loadTitle: "Load from account",
    restoreTitle: "Restore from backup",
    load: "Load",
    restore: "Restore",
    saveTitle: "Save to account",
    save: "Save",
    deleteTitle: "Delete from account",
    deleteDescription:
      "Deletes your account records on the server and turns off auto sync on this device. Records on this device stay, and sync stops on your other devices.",
    delete: "Delete",
    cancel: "Cancel",
  },
};

// 원어민 검토 전의 번역(LOCALE_INFO.beta).
const bkPl = (n: number, one: string, many: string) => (Number(n) === 1 ? one : many);

export const zh: Widen<typeof ko> = {
  date: (year, month, day) => `${year}年${month}月${day}日`,
  unknownTime: "未知时间",
  localLine: (subscriptionCount, usageLogCount) =>
    `当前：订阅 ${subscriptionCount} 个，签到 ${usageLogCount} 条`,
  savedLine: (subscriptionCount, killedCount, usageLogCount) =>
    `订阅 ${subscriptionCount} 个（已退订 ${killedCount} 个），签到 ${usageLogCount} 条`,
  restore: {
    accountLabel: "账户中的记录",
    fileLabel: "备份",
    replaceWith: (label) => `这台设备的记录将被替换为${label}的内容。`,
    notMerged: "当前记录不会合并，而是会消失。如有需要，请先点“保存备份文件”。",
    syncWarning: "自动同步已开启，其他设备上的记录也会一起改变。",
  },
  overwrite: {
    intro: "账户中的记录将被替换为这台设备的记录。",
    accountAt: (savedAt) => `账户（${savedAt}）`,
    notMerged: "不会合并，而是替换。",
  },
  lastSaved: (savedAt, line) => `最后保存 ${savedAt} · ${line}`,
  title: "数据备份",
  intro: "你的记录只在这台设备上。清除浏览器或更换设备前，请先备份或登录。",
  exportFile: "保存备份文件",
  restoreFile: "从备份恢复",
  chooseFile: "选择备份文件",
  exported: (count) => `已保存备份文件（订阅 ${count} 个）`,
  exportFailed: "无法创建备份文件。请重试。",
  unchanged: "当前记录没有改变。",
  sync: {
    title: "账户同步",
    loginHint: "登录后，记录会保存到账户，并在各设备间自动同步。",
    login: "登录",
    onSince: (time) => `自动同步已开启 · 最近同步 ${time}`,
    onSyncing: "自动同步已开启 · 正在与账户同步…",
    turnOff: "关闭自动同步",
    onNote: "已登录的设备会保持相同的记录。如果两边分别发生变化，会询问你保留哪一边。",
    deletedElsewhere:
      "由于账户中的记录在其他设备上被删除，同步已停止。重新开启即可上传这台设备的记录。",
    turnOn: "开启自动同步",
    saveToAccount: "保存到账户",
    loadFromAccount: "从账户载入",
    deleteFromAccount: "从账户删除",
    offNote: "自动同步已关闭。请用“保存到账户”和“从账户载入”来转移记录。",
    turnedOn: "已开启自动同步",
    turnedOff: "已关闭自动同步 · 账户中的记录没有改变",
    checking: "正在确认账户中的记录…",
    none: "账户中还没有保存的记录。",
  },
  errors: {
    checkFailed: "无法确认账户中保存的记录。",
    checkNetwork: "因网络问题无法确认。",
    saveFailed: "无法保存到账户。",
    saveNetwork: "因网络问题无法保存到账户。",
    noRecord: "账户中没有保存的记录。",
    loadFailed: "无法载入账户中保存的记录。",
    unreadable: (detail) => `无法读取账户中保存的记录。${detail}`,
    loadNetwork: "因网络问题无法载入。",
    deleteFailed: "无法删除账户中保存的记录。",
    deleteNetwork: "因网络问题无法删除。",
  },
  savedToAccount: (count) => `已保存到账户（订阅 ${count} 个）`,
  deleted: "已删除账户中的记录并关闭自动同步。这台设备上的记录没有改变。",
  loadedFromAccount: (count) => `已从账户载入订阅 ${count} 个`,
  restoredFromFile: (count) => `已从备份恢复订阅 ${count} 个`,
  dialog: {
    loadTitle: "从账户载入",
    restoreTitle: "从备份恢复",
    load: "载入",
    restore: "恢复",
    saveTitle: "保存到账户",
    save: "保存",
    deleteTitle: "从账户删除",
    deleteDescription:
      "删除服务器上账户中的记录，并关闭这台设备的自动同步。这台设备上的记录保留，其他设备的同步也会停止。",
    delete: "删除",
    cancel: "取消",
  },
};

export const ja: Widen<typeof ko> = {
  date: (year, month, day) => `${year}年${month}月${day}日`,
  unknownTime: "不明な時刻",
  localLine: (subscriptionCount, usageLogCount) =>
    `現在: サブスク ${subscriptionCount} 件、チェックイン ${usageLogCount} 件`,
  savedLine: (subscriptionCount, killedCount, usageLogCount) =>
    `サブスク ${subscriptionCount} 件（解約 ${killedCount} 件）、チェックイン ${usageLogCount} 件`,
  restore: {
    accountLabel: "アカウントの記録",
    fileLabel: "バックアップ",
    replaceWith: (label) => `この端末の記録を${label}の内容に置き換えます。`,
    notMerged:
      "今の記録は統合されずに消えます。必要なら先に「バックアップファイルを保存」を押してください。",
    syncWarning: "自動同期がオンなので、ほかの端末の記録も一緒に変わります。",
  },
  overwrite: {
    intro: "アカウントの記録をこの端末の記録に置き換えます。",
    accountAt: (savedAt) => `アカウント（${savedAt}）`,
    notMerged: "統合ではなく置き換えです。",
  },
  lastSaved: (savedAt, line) => `最終保存 ${savedAt} · ${line}`,
  title: "データのバックアップ",
  intro:
    "記録はこの端末の中にだけあります。ブラウザを消去したり端末を替えたりする前に、バックアップするかログインしてください。",
  exportFile: "バックアップファイルを保存",
  restoreFile: "バックアップから復元",
  chooseFile: "バックアップファイルを選ぶ",
  exported: (count) => `バックアップファイルを保存しました（サブスク ${count} 件）`,
  exportFailed: "バックアップファイルを作れませんでした。もう一度お試しください。",
  unchanged: "今の記録は変わっていません。",
  sync: {
    title: "アカウント同期",
    loginHint: "ログインすると記録をアカウントに保存し、端末どうしで自動的にそろえます。",
    login: "ログイン",
    onSince: (time) => `自動同期オン · 最終同期 ${time}`,
    onSyncing: "自動同期オン · アカウントと同期中…",
    turnOff: "自動同期をオフにする",
    onNote:
      "ログインした端末どうしは同じ記録を保ちます。両方で別々に変わった場合は、どちらを残すか確認します。",
    deletedElsewhere:
      "ほかの端末でアカウントの記録が削除されたため、同期を止めました。もう一度オンにすると、この端末の記録をアップロードします。",
    turnOn: "自動同期をオンにする",
    saveToAccount: "アカウントに保存",
    loadFromAccount: "アカウントから読み込む",
    deleteFromAccount: "アカウントから削除",
    offNote:
      "自動同期はオフです。「アカウントに保存」「アカウントから読み込む」で記録を移してください。",
    turnedOn: "自動同期をオンにしました",
    turnedOff: "自動同期をオフにしました · アカウントの記録はそのままです",
    checking: "アカウントの記録を確認中…",
    none: "アカウントに保存された記録はまだありません。",
  },
  errors: {
    checkFailed: "アカウントに保存された記録を確認できませんでした。",
    checkNetwork: "ネットワークの問題で確認できませんでした。",
    saveFailed: "アカウントに保存できませんでした。",
    saveNetwork: "ネットワークの問題でアカウントに保存できませんでした。",
    noRecord: "アカウントに保存された記録がありません。",
    loadFailed: "アカウントに保存された記録を読み込めませんでした。",
    unreadable: (detail) => `アカウントに保存された記録を読み取れません。${detail}`,
    loadNetwork: "ネットワークの問題で読み込めませんでした。",
    deleteFailed: "アカウントに保存された記録を削除できませんでした。",
    deleteNetwork: "ネットワークの問題で削除できませんでした。",
  },
  savedToAccount: (count) => `アカウントに保存しました（サブスク ${count} 件）`,
  deleted: "アカウントの記録を削除し、自動同期をオフにしました。この端末の記録はそのままです。",
  loadedFromAccount: (count) => `アカウントからサブスク ${count} 件を読み込みました`,
  restoredFromFile: (count) => `バックアップからサブスク ${count} 件を復元しました`,
  dialog: {
    loadTitle: "アカウントから読み込む",
    restoreTitle: "バックアップから復元",
    load: "読み込む",
    restore: "復元",
    saveTitle: "アカウントに保存",
    save: "保存",
    deleteTitle: "アカウントから削除",
    deleteDescription:
      "サーバーのアカウントの記録を削除し、この端末の自動同期をオフにします。この端末の記録は残り、ほかの端末の同期も止まります。",
    delete: "削除",
    cancel: "キャンセル",
  },
};

export const vi: Widen<typeof ko> = {
  date: (year, month, day) => `${day}/${month}/${year}`,
  unknownTime: "không rõ thời gian",
  localLine: (subscriptionCount, usageLogCount) =>
    `Hiện tại: ${subscriptionCount} gói, ${usageLogCount} lượt check-in`,
  savedLine: (subscriptionCount, killedCount, usageLogCount) =>
    `${subscriptionCount} gói (${killedCount} đã hủy), ${usageLogCount} lượt check-in`,
  restore: {
    accountLabel: "Dữ liệu tài khoản",
    fileLabel: "Bản sao lưu",
    replaceWith: (label) =>
      `Dữ liệu trên thiết bị này sẽ được thay bằng nội dung của ${label.toLowerCase()}.`,
    notMerged:
      "Dữ liệu hiện tại sẽ mất chứ không được gộp. Nếu cần, hãy nhấn “Lưu tệp sao lưu” trước.",
    syncWarning: "Đồng bộ tự động đang bật nên dữ liệu trên các thiết bị khác cũng sẽ thay đổi.",
  },
  overwrite: {
    intro: "Dữ liệu tài khoản sẽ được thay bằng dữ liệu trên thiết bị này.",
    accountAt: (savedAt) => `Tài khoản (${savedAt})`,
    notMerged: "Sẽ thay thế chứ không gộp.",
  },
  lastSaved: (savedAt, line) => `Lưu lần cuối ${savedAt} · ${line}`,
  title: "Sao lưu dữ liệu",
  intro:
    "Dữ liệu chỉ nằm trên thiết bị này. Hãy sao lưu hoặc đăng nhập trước khi xóa trình duyệt hay đổi thiết bị.",
  exportFile: "Lưu tệp sao lưu",
  restoreFile: "Khôi phục từ bản sao lưu",
  chooseFile: "Chọn tệp sao lưu",
  exported: (count) => `Đã lưu tệp sao lưu (${count} gói)`,
  exportFailed: "Không tạo được tệp sao lưu. Hãy thử lại.",
  unchanged: "Dữ liệu hiện tại không thay đổi.",
  sync: {
    title: "Đồng bộ tài khoản",
    loginHint: "Đăng nhập để lưu dữ liệu vào tài khoản và tự động đồng bộ giữa các thiết bị.",
    login: "Đăng nhập",
    onSince: (time) => `Đồng bộ tự động bật · lần cuối ${time}`,
    onSyncing: "Đồng bộ tự động bật · đang đồng bộ với tài khoản…",
    turnOff: "Tắt đồng bộ tự động",
    onNote:
      "Các thiết bị đã đăng nhập giữ cùng dữ liệu. Nếu hai bên thay đổi riêng, bạn sẽ được hỏi giữ bên nào.",
    deletedElsewhere:
      "Đồng bộ đã dừng vì dữ liệu tài khoản bị xóa trên thiết bị khác. Bật lại để tải dữ liệu của thiết bị này lên.",
    turnOn: "Bật đồng bộ tự động",
    saveToAccount: "Lưu vào tài khoản",
    loadFromAccount: "Tải từ tài khoản",
    deleteFromAccount: "Xóa khỏi tài khoản",
    offNote:
      "Đồng bộ tự động đang tắt. Dùng “Lưu vào tài khoản” và “Tải từ tài khoản” để chuyển dữ liệu.",
    turnedOn: "Đã bật đồng bộ tự động",
    turnedOff: "Đã tắt đồng bộ tự động · dữ liệu tài khoản không đổi",
    checking: "Đang kiểm tra dữ liệu tài khoản…",
    none: "Chưa có dữ liệu nào được lưu trong tài khoản.",
  },
  errors: {
    checkFailed: "Không kiểm tra được dữ liệu đã lưu trong tài khoản.",
    checkNetwork: "Không kiểm tra được do sự cố mạng.",
    saveFailed: "Không lưu được vào tài khoản.",
    saveNetwork: "Không lưu được vào tài khoản do sự cố mạng.",
    noRecord: "Không có dữ liệu nào được lưu trong tài khoản.",
    loadFailed: "Không tải được dữ liệu đã lưu trong tài khoản.",
    unreadable: (detail) => `Không đọc được dữ liệu đã lưu trong tài khoản. ${detail}`,
    loadNetwork: "Không tải được do sự cố mạng.",
    deleteFailed: "Không xóa được dữ liệu đã lưu trong tài khoản.",
    deleteNetwork: "Không xóa được do sự cố mạng.",
  },
  savedToAccount: (count) => `Đã lưu vào tài khoản (${count} gói)`,
  deleted: "Đã xóa dữ liệu tài khoản và tắt đồng bộ tự động. Dữ liệu trên thiết bị này không đổi.",
  loadedFromAccount: (count) => `Đã tải ${count} gói từ tài khoản`,
  restoredFromFile: (count) => `Đã khôi phục ${count} gói từ bản sao lưu`,
  dialog: {
    loadTitle: "Tải từ tài khoản",
    restoreTitle: "Khôi phục từ bản sao lưu",
    load: "Tải",
    restore: "Khôi phục",
    saveTitle: "Lưu vào tài khoản",
    save: "Lưu",
    deleteTitle: "Xóa khỏi tài khoản",
    deleteDescription:
      "Xóa dữ liệu tài khoản trên máy chủ và tắt đồng bộ tự động trên thiết bị này. Dữ liệu trên thiết bị này vẫn còn, và đồng bộ trên các thiết bị khác cũng dừng.",
    delete: "Xóa",
    cancel: "Hủy",
  },
};

export const fr: Widen<typeof ko> = {
  date: (year, month, day) => `${day}/${month}/${year}`,
  unknownTime: "heure inconnue",
  localLine: (subscriptionCount, usageLogCount) =>
    `Actuellement : ${subscriptionCount} ${bkPl(subscriptionCount, "abonnement", "abonnements")}, ${usageLogCount} check-in${bkPl(usageLogCount, "", "s")}`,
  savedLine: (subscriptionCount, killedCount, usageLogCount) =>
    `${subscriptionCount} ${bkPl(subscriptionCount, "abonnement", "abonnements")} (${killedCount} résilié${bkPl(killedCount, "", "s")}), ${usageLogCount} check-in${bkPl(usageLogCount, "", "s")}`,
  restore: {
    accountLabel: "Données du compte",
    fileLabel: "Sauvegarde",
    replaceWith: (label) =>
      `Les données de cet appareil seront remplacées par : ${label.toLowerCase()}.`,
    notMerged:
      "Vos données actuelles seront perdues, pas fusionnées. Si besoin, appuyez d'abord sur « Enregistrer une sauvegarde ».",
    syncWarning:
      "La synchronisation automatique est activée : les données de vos autres appareils changeront aussi.",
  },
  overwrite: {
    intro: "Les données de votre compte seront remplacées par celles de cet appareil.",
    accountAt: (savedAt) => `Compte (${savedAt})`,
    notMerged: "Elles seront remplacées, pas fusionnées.",
  },
  lastSaved: (savedAt, line) => `Dernier enregistrement ${savedAt} · ${line}`,
  title: "Sauvegarde des données",
  intro:
    "Vos données ne sont que sur cet appareil. Sauvegardez-les ou connectez-vous avant de vider le navigateur ou de changer d'appareil.",
  exportFile: "Enregistrer une sauvegarde",
  restoreFile: "Restaurer une sauvegarde",
  chooseFile: "Choisir un fichier de sauvegarde",
  exported: (count) =>
    `Sauvegarde enregistrée (${count} ${bkPl(count, "abonnement", "abonnements")})`,
  exportFailed: "Impossible de créer la sauvegarde. Veuillez réessayer.",
  unchanged: "Vos données actuelles n'ont pas changé.",
  sync: {
    title: "Synchronisation du compte",
    loginHint:
      "Connectez-vous pour enregistrer vos données dans votre compte et les synchroniser automatiquement entre appareils.",
    login: "Se connecter",
    onSince: (time) => `Synchronisation automatique activée · dernière le ${time}`,
    onSyncing: "Synchronisation automatique activée · synchronisation en cours…",
    turnOff: "Désactiver la synchronisation",
    onNote:
      "Les appareils connectés gardent les mêmes données. Si les deux côtés changent séparément, on vous demandera lequel garder.",
    deletedElsewhere:
      "La synchronisation s'est arrêtée car les données du compte ont été supprimées sur un autre appareil. Réactivez-la pour envoyer les données de cet appareil.",
    turnOn: "Activer la synchronisation",
    saveToAccount: "Enregistrer dans le compte",
    loadFromAccount: "Charger depuis le compte",
    deleteFromAccount: "Supprimer du compte",
    offNote:
      "La synchronisation automatique est désactivée. Utilisez « Enregistrer dans le compte » et « Charger depuis le compte » pour transférer vos données.",
    turnedOn: "Synchronisation automatique activée",
    turnedOff: "Synchronisation automatique désactivée · les données du compte sont inchangées",
    checking: "Vérification des données du compte…",
    none: "Aucune donnée enregistrée dans votre compte pour l'instant.",
  },
  errors: {
    checkFailed: "Impossible de vérifier les données enregistrées dans votre compte.",
    checkNetwork: "Vérification impossible à cause d'un problème réseau.",
    saveFailed: "Impossible d'enregistrer dans votre compte.",
    saveNetwork: "Enregistrement impossible à cause d'un problème réseau.",
    noRecord: "Aucune donnée n'est enregistrée dans votre compte.",
    loadFailed: "Impossible de charger les données de votre compte.",
    unreadable: (detail) => `Les données de votre compte sont illisibles. ${detail}`,
    loadNetwork: "Chargement impossible à cause d'un problème réseau.",
    deleteFailed: "Impossible de supprimer les données de votre compte.",
    deleteNetwork: "Suppression impossible à cause d'un problème réseau.",
  },
  savedToAccount: (count) =>
    `Enregistré dans le compte (${count} ${bkPl(count, "abonnement", "abonnements")})`,
  deleted:
    "Données du compte supprimées et synchronisation automatique désactivée. Les données de cet appareil sont inchangées.",
  loadedFromAccount: (count) =>
    `${count} ${bkPl(count, "abonnement chargé", "abonnements chargés")} depuis votre compte`,
  restoredFromFile: (count) =>
    `${count} ${bkPl(count, "abonnement restauré", "abonnements restaurés")} depuis la sauvegarde`,
  dialog: {
    loadTitle: "Charger depuis le compte",
    restoreTitle: "Restaurer une sauvegarde",
    load: "Charger",
    restore: "Restaurer",
    saveTitle: "Enregistrer dans le compte",
    save: "Enregistrer",
    deleteTitle: "Supprimer du compte",
    deleteDescription:
      "Supprime les données de votre compte sur le serveur et désactive la synchronisation sur cet appareil. Les données de cet appareil restent, et la synchronisation s'arrête sur vos autres appareils.",
    delete: "Supprimer",
    cancel: "Annuler",
  },
};

export const es: Widen<typeof ko> = {
  date: (year, month, day) => `${day}/${month}/${year}`,
  unknownTime: "hora desconocida",
  localLine: (subscriptionCount, usageLogCount) =>
    `Ahora: ${subscriptionCount} ${bkPl(subscriptionCount, "suscripción", "suscripciones")}, ${usageLogCount} ${bkPl(usageLogCount, "registro", "registros")}`,
  savedLine: (subscriptionCount, killedCount, usageLogCount) =>
    `${subscriptionCount} ${bkPl(subscriptionCount, "suscripción", "suscripciones")} (${killedCount} ${bkPl(killedCount, "cancelada", "canceladas")}), ${usageLogCount} ${bkPl(usageLogCount, "registro", "registros")}`,
  restore: {
    accountLabel: "Registros de la cuenta",
    fileLabel: "Copia de seguridad",
    replaceWith: (label) =>
      `Los registros de este dispositivo se sustituirán por: ${label.toLowerCase()}.`,
    notMerged:
      "Tus registros actuales se perderán, no se combinarán. Si los necesitas, pulsa antes «Guardar copia».",
    syncWarning:
      "La sincronización automática está activada, así que también cambiarán los registros de tus otros dispositivos.",
  },
  overwrite: {
    intro: "Los registros de tu cuenta se sustituirán por los de este dispositivo.",
    accountAt: (savedAt) => `Cuenta (${savedAt})`,
    notMerged: "Se sustituirán, no se combinarán.",
  },
  lastSaved: (savedAt, line) => `Último guardado ${savedAt} · ${line}`,
  title: "Copia de seguridad",
  intro:
    "Tus registros solo están en este dispositivo. Haz una copia o inicia sesión antes de borrar el navegador o cambiar de dispositivo.",
  exportFile: "Guardar copia",
  restoreFile: "Restaurar copia",
  chooseFile: "Elegir archivo de copia",
  exported: (count) => `Copia guardada (${count} ${bkPl(count, "suscripción", "suscripciones")})`,
  exportFailed: "No se pudo crear la copia. Inténtalo de nuevo.",
  unchanged: "Tus registros actuales no han cambiado.",
  sync: {
    title: "Sincronización de la cuenta",
    loginHint:
      "Inicia sesión para guardar tus registros en tu cuenta y sincronizarlos automáticamente entre dispositivos.",
    login: "Iniciar sesión",
    onSince: (time) => `Sincronización automática activada · última ${time}`,
    onSyncing: "Sincronización automática activada · sincronizando…",
    turnOff: "Desactivar sincronización automática",
    onNote:
      "Los dispositivos con sesión iniciada mantienen los mismos registros. Si ambos cambian por separado, te preguntaremos cuál conservar.",
    deletedElsewhere:
      "La sincronización se detuvo porque los registros de tu cuenta se borraron en otro dispositivo. Actívala de nuevo para subir los registros de este dispositivo.",
    turnOn: "Activar sincronización automática",
    saveToAccount: "Guardar en la cuenta",
    loadFromAccount: "Cargar desde la cuenta",
    deleteFromAccount: "Borrar de la cuenta",
    offNote:
      "La sincronización automática está desactivada. Usa «Guardar en la cuenta» y «Cargar desde la cuenta» para mover registros.",
    turnedOn: "Sincronización automática activada",
    turnedOff: "Sincronización automática desactivada · los registros de tu cuenta no cambian",
    checking: "Comprobando los registros de la cuenta…",
    none: "Todavía no hay registros guardados en tu cuenta.",
  },
  errors: {
    checkFailed: "No se pudieron comprobar los registros guardados en tu cuenta.",
    checkNetwork: "No se pudo comprobar por un problema de red.",
    saveFailed: "No se pudo guardar en tu cuenta.",
    saveNetwork: "No se pudo guardar en tu cuenta por un problema de red.",
    noRecord: "No hay registros guardados en tu cuenta.",
    loadFailed: "No se pudieron cargar los registros de tu cuenta.",
    unreadable: (detail) => `No se pueden leer los registros de tu cuenta. ${detail}`,
    loadNetwork: "No se pudo cargar por un problema de red.",
    deleteFailed: "No se pudieron borrar los registros de tu cuenta.",
    deleteNetwork: "No se pudo borrar por un problema de red.",
  },
  savedToAccount: (count) =>
    `Guardado en la cuenta (${count} ${bkPl(count, "suscripción", "suscripciones")})`,
  deleted:
    "Se borraron los registros de tu cuenta y se desactivó la sincronización automática. Los registros de este dispositivo no cambian.",
  loadedFromAccount: (count) =>
    `Se cargaron ${count} ${bkPl(count, "suscripción", "suscripciones")} desde tu cuenta`,
  restoredFromFile: (count) =>
    `Se restauraron ${count} ${bkPl(count, "suscripción", "suscripciones")} desde la copia`,
  dialog: {
    loadTitle: "Cargar desde la cuenta",
    restoreTitle: "Restaurar copia",
    load: "Cargar",
    restore: "Restaurar",
    saveTitle: "Guardar en la cuenta",
    save: "Guardar",
    deleteTitle: "Borrar de la cuenta",
    deleteDescription:
      "Borra los registros de tu cuenta en el servidor y desactiva la sincronización en este dispositivo. Los registros de este dispositivo se quedan, y la sincronización se detiene en tus otros dispositivos.",
    delete: "Borrar",
    cancel: "Cancelar",
  },
};

export const de: Widen<typeof ko> = {
  date: (year, month, day) => `${day}.${month}.${year}`,
  unknownTime: "unbekannte Zeit",
  localLine: (subscriptionCount, usageLogCount) =>
    `Jetzt: ${subscriptionCount} ${bkPl(subscriptionCount, "Abo", "Abos")}, ${usageLogCount} ${bkPl(usageLogCount, "Eintrag", "Einträge")}`,
  savedLine: (subscriptionCount, killedCount, usageLogCount) =>
    `${subscriptionCount} ${bkPl(subscriptionCount, "Abo", "Abos")} (${killedCount} gekündigt), ${usageLogCount} ${bkPl(usageLogCount, "Eintrag", "Einträge")}`,
  restore: {
    accountLabel: "Kontodaten",
    fileLabel: "Sicherung",
    replaceWith: (label) => `Die Daten dieses Geräts werden durch folgende ersetzt: ${label}.`,
    notMerged:
      "Deine aktuellen Daten gehen verloren und werden nicht zusammengeführt. Wenn nötig, tippe zuerst auf „Sicherungsdatei speichern“.",
    syncWarning:
      "Die automatische Synchronisierung ist an, daher ändern sich auch die Daten auf deinen anderen Geräten.",
  },
  overwrite: {
    intro: "Die Daten deines Kontos werden durch die Daten dieses Geräts ersetzt.",
    accountAt: (savedAt) => `Konto (${savedAt})`,
    notMerged: "Sie werden ersetzt, nicht zusammengeführt.",
  },
  lastSaved: (savedAt, line) => `Zuletzt gespeichert ${savedAt} · ${line}`,
  title: "Datensicherung",
  intro:
    "Deine Daten liegen nur auf diesem Gerät. Sichere sie oder melde dich an, bevor du den Browser leerst oder das Gerät wechselst.",
  exportFile: "Sicherungsdatei speichern",
  restoreFile: "Aus Sicherung wiederherstellen",
  chooseFile: "Sicherungsdatei wählen",
  exported: (count) => `Sicherungsdatei gespeichert (${count} ${bkPl(count, "Abo", "Abos")})`,
  exportFailed: "Die Sicherungsdatei konnte nicht erstellt werden. Bitte versuch es erneut.",
  unchanged: "Deine aktuellen Daten haben sich nicht geändert.",
  sync: {
    title: "Kontosynchronisierung",
    loginHint:
      "Melde dich an, um deine Daten im Konto zu speichern und automatisch zwischen Geräten abzugleichen.",
    login: "Anmelden",
    onSince: (time) => `Automatische Synchronisierung an · zuletzt ${time}`,
    onSyncing: "Automatische Synchronisierung an · wird abgeglichen…",
    turnOff: "Automatische Synchronisierung ausschalten",
    onNote:
      "Angemeldete Geräte behalten dieselben Daten. Ändern sich beide Seiten getrennt, fragen wir, welche du behalten willst.",
    deletedElsewhere:
      "Die Synchronisierung wurde gestoppt, weil die Kontodaten auf einem anderen Gerät gelöscht wurden. Schalte sie wieder ein, um die Daten dieses Geräts hochzuladen.",
    turnOn: "Automatische Synchronisierung einschalten",
    saveToAccount: "Im Konto speichern",
    loadFromAccount: "Aus dem Konto laden",
    deleteFromAccount: "Aus dem Konto löschen",
    offNote:
      "Die automatische Synchronisierung ist aus. Nutze „Im Konto speichern“ und „Aus dem Konto laden“, um Daten zu übertragen.",
    turnedOn: "Automatische Synchronisierung an",
    turnedOff: "Automatische Synchronisierung aus · deine Kontodaten bleiben unverändert",
    checking: "Kontodaten werden geprüft…",
    none: "Noch keine Daten im Konto gespeichert.",
  },
  errors: {
    checkFailed: "Die im Konto gespeicherten Daten konnten nicht geprüft werden.",
    checkNetwork: "Prüfung wegen eines Netzwerkproblems fehlgeschlagen.",
    saveFailed: "Speichern im Konto fehlgeschlagen.",
    saveNetwork: "Speichern im Konto wegen eines Netzwerkproblems fehlgeschlagen.",
    noRecord: "Im Konto sind keine Daten gespeichert.",
    loadFailed: "Die im Konto gespeicherten Daten konnten nicht geladen werden.",
    unreadable: (detail) => `Die im Konto gespeicherten Daten sind nicht lesbar. ${detail}`,
    loadNetwork: "Laden wegen eines Netzwerkproblems fehlgeschlagen.",
    deleteFailed: "Die im Konto gespeicherten Daten konnten nicht gelöscht werden.",
    deleteNetwork: "Löschen wegen eines Netzwerkproblems fehlgeschlagen.",
  },
  savedToAccount: (count) => `Im Konto gespeichert (${count} ${bkPl(count, "Abo", "Abos")})`,
  deleted:
    "Kontodaten gelöscht und automatische Synchronisierung ausgeschaltet. Die Daten dieses Geräts bleiben unverändert.",
  loadedFromAccount: (count) => `${count} ${bkPl(count, "Abo", "Abos")} aus dem Konto geladen`,
  restoredFromFile: (count) =>
    `${count} ${bkPl(count, "Abo", "Abos")} aus der Sicherung wiederhergestellt`,
  dialog: {
    loadTitle: "Aus dem Konto laden",
    restoreTitle: "Aus Sicherung wiederherstellen",
    load: "Laden",
    restore: "Wiederherstellen",
    saveTitle: "Im Konto speichern",
    save: "Speichern",
    deleteTitle: "Aus dem Konto löschen",
    deleteDescription:
      "Löscht deine Kontodaten auf dem Server und schaltet die automatische Synchronisierung auf diesem Gerät aus. Die Daten dieses Geräts bleiben, und auf deinen anderen Geräten stoppt die Synchronisierung.",
    delete: "Löschen",
    cancel: "Abbrechen",
  },
};

export const pt: Widen<typeof ko> = {
  date: (year, month, day) => `${day}/${month}/${year}`,
  unknownTime: "horário desconhecido",
  localLine: (subscriptionCount, usageLogCount) =>
    `Agora: ${subscriptionCount} ${bkPl(subscriptionCount, "assinatura", "assinaturas")}, ${usageLogCount} ${bkPl(usageLogCount, "registro", "registros")}`,
  savedLine: (subscriptionCount, killedCount, usageLogCount) =>
    `${subscriptionCount} ${bkPl(subscriptionCount, "assinatura", "assinaturas")} (${killedCount} ${bkPl(killedCount, "cancelada", "canceladas")}), ${usageLogCount} ${bkPl(usageLogCount, "registro", "registros")}`,
  restore: {
    accountLabel: "Registros da conta",
    fileLabel: "Backup",
    replaceWith: (label) =>
      `Os registros deste dispositivo serão substituídos por: ${label.toLowerCase()}.`,
    notMerged:
      "Seus registros atuais serão perdidos, não mesclados. Se precisar, toque antes em “Salvar backup”.",
    syncWarning:
      "A sincronização automática está ativada, então os registros dos seus outros dispositivos também vão mudar.",
  },
  overwrite: {
    intro: "Os registros da sua conta serão substituídos pelos deste dispositivo.",
    accountAt: (savedAt) => `Conta (${savedAt})`,
    notMerged: "Serão substituídos, não mesclados.",
  },
  lastSaved: (savedAt, line) => `Último salvamento ${savedAt} · ${line}`,
  title: "Backup de dados",
  intro:
    "Seus registros ficam só neste dispositivo. Faça backup ou entre na conta antes de limpar o navegador ou trocar de dispositivo.",
  exportFile: "Salvar backup",
  restoreFile: "Restaurar backup",
  chooseFile: "Escolher arquivo de backup",
  exported: (count) => `Backup salvo (${count} ${bkPl(count, "assinatura", "assinaturas")})`,
  exportFailed: "Não foi possível criar o backup. Tente de novo.",
  unchanged: "Seus registros atuais não mudaram.",
  sync: {
    title: "Sincronização da conta",
    loginHint:
      "Entre para salvar seus registros na conta e sincronizá-los automaticamente entre dispositivos.",
    login: "Entrar",
    onSince: (time) => `Sincronização automática ativada · última ${time}`,
    onSyncing: "Sincronização automática ativada · sincronizando…",
    turnOff: "Desativar sincronização automática",
    onNote:
      "Os dispositivos conectados mantêm os mesmos registros. Se os dois lados mudarem separadamente, perguntaremos qual manter.",
    deletedElsewhere:
      "A sincronização parou porque os registros da conta foram apagados em outro dispositivo. Ative de novo para enviar os registros deste dispositivo.",
    turnOn: "Ativar sincronização automática",
    saveToAccount: "Salvar na conta",
    loadFromAccount: "Carregar da conta",
    deleteFromAccount: "Apagar da conta",
    offNote:
      "A sincronização automática está desativada. Use “Salvar na conta” e “Carregar da conta” para mover os registros.",
    turnedOn: "Sincronização automática ativada",
    turnedOff: "Sincronização automática desativada · os registros da conta não mudaram",
    checking: "Verificando os registros da conta…",
    none: "Ainda não há registros salvos na sua conta.",
  },
  errors: {
    checkFailed: "Não foi possível verificar os registros salvos na sua conta.",
    checkNetwork: "Não foi possível verificar por um problema de rede.",
    saveFailed: "Não foi possível salvar na sua conta.",
    saveNetwork: "Não foi possível salvar na sua conta por um problema de rede.",
    noRecord: "Não há registros salvos na sua conta.",
    loadFailed: "Não foi possível carregar os registros da sua conta.",
    unreadable: (detail) => `Não é possível ler os registros da sua conta. ${detail}`,
    loadNetwork: "Não foi possível carregar por um problema de rede.",
    deleteFailed: "Não foi possível apagar os registros da sua conta.",
    deleteNetwork: "Não foi possível apagar por um problema de rede.",
  },
  savedToAccount: (count) =>
    `Salvo na conta (${count} ${bkPl(count, "assinatura", "assinaturas")})`,
  deleted:
    "Os registros da conta foram apagados e a sincronização automática foi desativada. Os registros deste dispositivo não mudaram.",
  loadedFromAccount: (count) =>
    `${count} ${bkPl(count, "assinatura carregada", "assinaturas carregadas")} da sua conta`,
  restoredFromFile: (count) =>
    `${count} ${bkPl(count, "assinatura restaurada", "assinaturas restauradas")} do backup`,
  dialog: {
    loadTitle: "Carregar da conta",
    restoreTitle: "Restaurar backup",
    load: "Carregar",
    restore: "Restaurar",
    saveTitle: "Salvar na conta",
    save: "Salvar",
    deleteTitle: "Apagar da conta",
    deleteDescription:
      "Apaga os registros da sua conta no servidor e desativa a sincronização neste dispositivo. Os registros deste dispositivo ficam, e a sincronização para nos seus outros dispositivos.",
    delete: "Apagar",
    cancel: "Cancelar",
  },
};
