import type { Widen } from "../types";

/** 설정의 여러 기기 사용 측정 카드(DeviceUsageCard). */
export const ko = {
  howTitle: "켜면 이렇게 재요",
  howUpload:
    "이 기기에서 아래 서비스의 앱이 화면 맨 앞에 있던 시작·끝 시각을 로그인한 계정에 올려요. 다른 앱과 앱 안에서 본 콘텐츠는 올리지 않아요. (리포트의 ‘이 폰’ 사용 기록은 켜지 않아도 이 폰 안에만 있어요.)",
  howLink:
    "같은 계정의 기기끼리 이어서 세요. 휴대폰에서 보다가 30분 안에 태블릿에서 이어 보면 1번이에요.",
  howLimits:
    "TV·PC·iPhone에서 본 것과 화면을 끈 재생은 잴 수 없어서, 숫자는 ‘측정한 기기에서 최소 몇 번’이에요. 체크인은 지금처럼 직접 해요.",
  howRetention: (days: number) =>
    `기록은 ${days}일이 지나면 지워지고, 언제든 끄거나 지울 수 있어요.`,
  privacy: "개인정보처리방침",
  services: (names: string) => `재는 서비스: ${names}`,
  measuring: "이 기기에서 재는 중",
  accessOff:
    "기기 설정에서 ‘사용 정보 접근’이 꺼져 있어 지금은 재지 못해요. 다시 허용하면 이어서 재요.",
  allowAccess: "사용 정보 접근 허용하기",
  turnOff: "이 기기 측정 끄기",
  turnOffNote: "끄면 이 기기가 올린 기록도 함께 지워요.",
  otherAccount: "이 기기는 다른 계정으로 재고 있었어요. 이 계정으로는 켜기 전까지 올리지 않아요.",
  turnOn: "사용 측정 켜기",
  waitingForAccess: "기기 설정에서 SubSlash의 ‘사용 정보 접근’을 허용한 뒤 돌아오면 켜져요.",
  androidOnly:
    "측정은 안드로이드 앱에서만 켤 수 있어요. iPhone과 웹 브라우저는 다른 앱의 사용 시간을 알려 주지 않아요. 여기서는 계정에 모인 기기를 보고 지울 수 있어요.",
  devices: "측정한 기기",
  noDevices: "아직 이 계정에 올린 기기가 없어요.",
  thisDevice: "이 기기",
  androidDevice: (n: number) => `안드로이드 기기 ${n}`,
  deleteAllConfirm:
    "이 계정에 모인 모든 기기의 사용 기록을 지울까요? 다른 기기는 측정이 켜진 채라, 그 기기에서 앱을 열면 그때부터 다시 올라와요.",
  deleteAll: "모두 지우기",
  deleteAllButton: "모든 기기 기록 지우기",
  turnedOn: "이 기기에서 사용 측정을 켰습니다.",
  turnOnFailed: "사용 측정을 켜지 못했습니다.",
  turnedOff: "이 기기의 측정을 끄고 올린 기록을 지웠습니다.",
  turnOffFailed: "측정을 끄지 못했습니다.",
  deletedAll: "이 계정의 모든 기기 사용 기록을 지웠습니다.",
  deleteFailed: "사용 기록을 지우지 못했습니다.",
};

export const en: Widen<typeof ko> = {
  howTitle: "What gets measured when you turn this on",
  howUpload:
    "On this device, the start and end times when the apps of the services below were in the foreground are uploaded to your account. Other apps and what you watched inside an app are not uploaded. (The ‘this phone’ usage in Reports stays on this phone even without turning this on.)",
  howLink:
    "Use on devices with the same account is counted together. Watching on your phone and continuing on a tablet within 30 minutes counts as once.",
  howLimits:
    "Viewing on a TV, PC or iPhone and playback with the screen off can't be measured, so the number means ‘at least this many times on measured devices’. Keep checking in yourself as before.",
  howRetention: (days) =>
    `Records are deleted after ${days} days, and you can turn this off or delete them at any time.`,
  privacy: "Privacy policy",
  services: (names) => `Measured services: ${names}`,
  measuring: "Measuring on this device",
  accessOff:
    "‘Usage access’ is off in your device settings, so nothing is being measured right now. Allow it again to continue.",
  allowAccess: "Allow usage access",
  turnOff: "Stop measuring on this device",
  turnOffNote: "Turning this off also deletes what this device uploaded.",
  otherAccount:
    "This device was measuring for another account. Nothing is uploaded for this account until you turn it on.",
  turnOn: "Turn on usage measurement",
  waitingForAccess:
    "Allow ‘Usage access’ for SubSlash in your device settings, then come back to finish turning it on.",
  androidOnly:
    "Measurement can only be turned on in the Android app. iPhone and web browsers don't report other apps' usage time. Here you can see and delete the devices collected in your account.",
  devices: "Measured devices",
  noDevices: "No devices have uploaded to this account yet.",
  thisDevice: "This device",
  androidDevice: (n) => `Android device ${n}`,
  deleteAllConfirm:
    "Delete usage records from all devices in this account? Other devices keep measuring, so their records come back once the app is opened there.",
  deleteAll: "Delete all",
  deleteAllButton: "Delete records from all devices",
  turnedOn: "Usage measurement is on for this device.",
  turnOnFailed: "Couldn't turn on usage measurement.",
  turnedOff: "Stopped measuring on this device and deleted what it uploaded.",
  turnOffFailed: "Couldn't turn off measurement.",
  deletedAll: "Deleted usage records from all devices in this account.",
  deleteFailed: "Couldn't delete the usage records.",
};
