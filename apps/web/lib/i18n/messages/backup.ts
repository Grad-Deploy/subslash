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
