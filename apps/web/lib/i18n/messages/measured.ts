import type { Widen } from "../types";

/** 문구 검사가 글자를 넘기기도 해서 숫자로 바꿔 비교한다. */
const one = (n: number) => Number(n) === 1;
const plural = (n: number, word: string) => `${n} ${one(n) ? word : `${word}s`}`;

/** 여러 기기 사용 측정의 리포트 칸·구독 상세 한 줄(`components/usage/MeasuredUsage`). */
export const ko = {
  measured: {
    count: (n: number) => `${n}번`,
    atLeast: (value: string) => `최소 ${value}`,
    zeroTime: "0분",
    zeroCount: "0번",
    zeroOn: (value: string) => `측정한 기기에선 ${value}`,
    partial: "30일을 다 잰 기기가 아직 없어서, 잰 기간만의 숫자예요.",
    loadFailed: (error: string) => `측정한 사용 기록을 불러오지 못했어요. ${error}`,
    offTitle: "기기를 오가며 쓴 횟수",
    offLink: "내 구독",
    offAfter: " 아래 ‘여러 기기 사용 측정’을 켜면, 휴대폰과 태블릿에서 쓴 횟수를 이어서 세 드려요.",
    titleAmount: "모든 기기 합쳐서 쓴 양",
    titleCount: "모든 기기 합쳐서 쓴 횟수",
    subtitle: (devices: number) =>
      `최근 30일 · 기기 ${devices}대 · 30분 안에 이어 쓰면 기기가 달라도 1번`,
    handoff: (n: number) => `기기를 바꿔 이어 쓴 ${n}번은 한 번으로 셌어요`,
    notIncluded: "TV·PC·iPhone에서 본 것은 들어 있지 않아요.",
    screenOff: " 시간은 앱이 화면에 떠 있던 시간이라, 화면을 끄고 들은 시간은 빠져 있어요.",
    unitCost: " 1회 단가는 체크인한 값으로 계산해요.",
    differs:
      " 위의 '이 폰' 숫자와 다를 수 있어요 — 휴대폰과 태블릿을 오가며 이어 쓴 것은 한 번으로 세요.",
    lineBefore: "측정한 기기에서 최근 30일 ",
    lineDevices: (devices: number) => `기기 ${devices}대를 이어서 셌어요`,
    lineHandoff: (n: number) => ` (기기를 바꿔 이어 쓴 ${n}번 포함)`,
    lineAfter: ". TV·PC에서 본 것은 없어서 체크인할 때 더해 주세요.",
  },
};

export const en: Widen<typeof ko> = {
  measured: {
    count: (n) => plural(n, "time"),
    atLeast: (value) => `At least ${value}`,
    zeroTime: "0 min",
    zeroCount: "0 times",
    zeroOn: (value) => `${value} on measured devices`,
    partial:
      "No device has measured the full 30 days yet, so these numbers cover only the measured period.",
    loadFailed: (error) => `Couldn't load the measured usage. ${error}`,
    offTitle: "Uses across devices",
    offLink: "My subscriptions",
    offAfter:
      ": turn on “Multi-device usage measurement” below and we'll count uses across your phone and tablet as one.",
    titleAmount: "Usage across all devices",
    titleCount: "Uses across all devices",
    subtitle: (devices) =>
      `Last 30 days · ${plural(devices, "device")} · continuing within 30 minutes counts once, even on another device`,
    handoff: (n) =>
      `${plural(n, "switch")} between devices counted as one`.replace("switchs", "switches"),
    notIncluded: "Watching on a TV, PC, or iPhone isn't included.",
    screenOff:
      " Time is how long the app was on screen, so listening with the screen off isn't included.",
    unitCost: " Cost per use is calculated from your check-ins.",
    differs:
      " It may differ from the “This phone” numbers above — use that continues across phone and tablet counts once.",
    lineBefore: "On measured devices in the last 30 days: ",
    lineDevices: (devices) => `Counted across ${plural(devices, "device")}`,
    lineHandoff: (n) =>
      ` (including ${plural(n, "switch")} between devices)`.replace("switchs", "switches"),
    lineAfter: ". Watching on a TV or PC isn't included, so add it when you check in.",
  },
};
