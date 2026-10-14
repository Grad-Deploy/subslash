import type { Widen } from "../types";
import { countOf } from "../english";

/** 여러 기기 사용 측정의 구독 상세 한 줄(`components/usage/MeasuredUsage`). */
export const ko = {
  measured: {
    count: (n: number) => `${n}번`,
    atLeast: (value: string) => `최소 ${value}`,
    zeroTime: "0분",
    zeroCount: "0번",
    partial: "30일을 다 잰 기기가 아직 없어서, 잰 기간만의 숫자예요.",
    lineBefore: "측정한 기기에서 최근 30일 ",
    lineDevices: (devices: number) => `기기 ${devices}대를 이어서 셌어요`,
    lineHandoff: (n: number) => ` (기기를 바꿔 이어 쓴 ${n}번 포함)`,
    lineAfter: ". TV·PC에서 본 것은 없어서 체크인할 때 더해 주세요.",
    zeroWhy:
      "측정한 기기(안드로이드 휴대폰·태블릿)에서 1분 넘게 쓴 적이 없어요. 1분이 안 되는 사용은 세지 않아요.",
    lineAfterPc: ". PC·웹에서 쓴 것은 빠져 있어서 체크인할 때 더해 주세요.",
  },
};

export const en: Widen<typeof ko> = {
  measured: {
    count: (n) => countOf(n, "time"),
    atLeast: (value) => `At least ${value}`,
    zeroTime: "0 min",
    zeroCount: "0 times",
    partial:
      "No device has measured the full 30 days yet, so these numbers cover only the measured period.",
    lineBefore: "On measured devices in the last 30 days: ",
    lineDevices: (devices) => `Counted across ${countOf(devices, "device")}`,
    lineHandoff: (n) =>
      ` (including ${countOf(n, "switch")} between devices)`.replace("switchs", "switches"),
    lineAfter: ". Watching on a TV or PC isn't included, so add it when you check in.",
    zeroWhy:
      "Not used for more than a minute on the measured devices (Android phones and tablets). Uses shorter than a minute aren't counted.",
    lineAfterPc: ". Use on a PC or the web isn't included, so add it when you check in.",
  },
};

export const zh: Widen<typeof ko> = {
  measured: {
    count: (n) => `${n} 次`,
    atLeast: (value) => `至少 ${value}`,
    zeroTime: "0 分钟",
    zeroCount: "0 次",
    partial: "还没有设备测满 30 天，所以这些数字只涵盖已测量的时段。",
    lineBefore: "已测量的设备在最近 30 天：",
    lineDevices: (devices) => `合计了 ${devices} 台设备`,
    lineHandoff: (n) => `（含换设备接着用的 ${n} 次）`,
    lineAfter: "。不包括在电视或电脑上观看的部分，签到时请加上。",
    zeroWhy: "在已测量的设备（Android 手机、平板）上没有使用超过 1 分钟。不足 1 分钟的使用不计入。",
    lineAfterPc: "。不包括在电脑或网页上的使用，签到时请加上。",
  },
};

export const ja: Widen<typeof ko> = {
  measured: {
    count: (n) => `${n} 回`,
    atLeast: (value) => `少なくとも ${value}`,
    zeroTime: "0 分",
    zeroCount: "0 回",
    partial: "30 日分を測定し終えた端末がまだないため、測定した期間だけの数字です。",
    lineBefore: "測定した端末で直近 30 日 ",
    lineDevices: (devices) => `端末 ${devices} 台をつなげて数えました`,
    lineHandoff: (n) => `（端末を替えて続けて使った ${n} 回を含む）`,
    lineAfter: "。テレビ・PC で見た分はないので、チェックインのときに足してください。",
    zeroWhy:
      "測定した端末（Android のスマホ・タブレット）では 1 分を超えて使っていません。1 分未満の利用は数えません。",
    lineAfterPc: "。PC・ウェブで使った分は含まれないので、チェックインのときに足してください。",
  },
};

export const vi: Widen<typeof ko> = {
  measured: {
    count: (n) => `${n} lần`,
    atLeast: (value) => `Ít nhất ${value}`,
    zeroTime: "0 phút",
    zeroCount: "0 lần",
    partial: "Chưa có thiết bị nào đo đủ 30 ngày, nên các con số chỉ tính trong khoảng đã đo.",
    lineBefore: "Trên các thiết bị đã đo trong 30 ngày gần nhất: ",
    lineDevices: (devices) => `Đếm liền mạch trên ${devices} thiết bị`,
    lineHandoff: (n) => ` (gồm ${n} lần chuyển thiết bị để dùng tiếp)`,
    lineAfter: ". Không có phần xem trên TV hay PC, hãy cộng thêm khi check-in.",
    zeroWhy:
      "Chưa dùng quá 1 phút trên các thiết bị đã đo (điện thoại, máy tính bảng Android). Lần dùng dưới 1 phút không được tính.",
    lineAfterPc: ". Không tính phần dùng trên PC hay web, hãy cộng thêm khi check-in.",
  },
};

export const fr: Widen<typeof ko> = {
  measured: {
    count: (n) => `${n} fois`,
    atLeast: (value) => `Au moins ${value}`,
    zeroTime: "0 min",
    zeroCount: "0 fois",
    partial:
      "Aucun appareil n'a encore mesuré 30 jours complets : ces chiffres ne couvrent que la période mesurée.",
    lineBefore: "Sur les appareils mesurés, 30 derniers jours : ",
    lineDevices: (devices) => `Compté sur ${devices} appareil${Number(devices) === 1 ? "" : "s"}`,
    lineHandoff: (n) => ` (dont ${n} changement${Number(n) === 1 ? "" : "s"} d'appareil)`,
    lineAfter:
      ". Ce que vous regardez sur une TV ou un PC n'est pas inclus : ajoutez-le lors du check-in.",
    zeroWhy:
      "Pas utilisé plus d'une minute sur les appareils mesurés (téléphones et tablettes Android). Les utilisations de moins d'une minute ne sont pas comptées.",
    lineAfterPc:
      ". L'utilisation sur un PC ou sur le web n'est pas incluse : ajoutez-la lors du check-in.",
  },
};

export const es: Widen<typeof ko> = {
  measured: {
    count: (n) => `${n} ${Number(n) === 1 ? "vez" : "veces"}`,
    atLeast: (value) => `Al menos ${value}`,
    zeroTime: "0 min",
    zeroCount: "0 veces",
    partial:
      "Ningún dispositivo ha medido aún los 30 días completos, así que estas cifras solo cubren el periodo medido.",
    lineBefore: "En los dispositivos medidos, últimos 30 días: ",
    lineDevices: (devices) =>
      `Contado en ${devices} dispositivo${Number(devices) === 1 ? "" : "s"}`,
    lineHandoff: (n) => ` (incluye ${n} cambio${Number(n) === 1 ? "" : "s"} de dispositivo)`,
    lineAfter: ". No incluye lo que veas en una TV o un PC, así que súmalo al registrar.",
    zeroWhy:
      "No se ha usado más de un minuto en los dispositivos medidos (teléfonos y tabletas Android). Los usos de menos de un minuto no se cuentan.",
    lineAfterPc: ". No incluye el uso en un PC o en la web, así que súmalo al registrar.",
  },
};

export const de: Widen<typeof ko> = {
  measured: {
    count: (n) => `${n}-mal`,
    atLeast: (value) => `Mindestens ${value}`,
    zeroTime: "0 Min.",
    zeroCount: "0-mal",
    partial:
      "Noch kein Gerät hat volle 30 Tage gemessen, daher gelten die Zahlen nur für den gemessenen Zeitraum.",
    lineBefore: "Auf gemessenen Geräten in den letzten 30 Tagen: ",
    lineDevices: (devices) =>
      `Über ${devices} ${Number(devices) === 1 ? "Gerät" : "Geräte"} gezählt`,
    lineHandoff: (n) => ` (inklusive ${n} Gerätewechsel)`,
    lineAfter: ". Was du auf TV oder PC schaust, fehlt – rechne es beim Eintragen dazu.",
    zeroWhy:
      "Auf den gemessenen Geräten (Android-Handys und -Tablets) nicht länger als eine Minute genutzt. Nutzung unter einer Minute wird nicht gezählt.",
    lineAfterPc: ". Nutzung am PC oder im Web fehlt – rechne sie beim Eintragen dazu.",
  },
};

export const pt: Widen<typeof ko> = {
  measured: {
    count: (n) => `${n} ${Number(n) === 1 ? "vez" : "vezes"}`,
    atLeast: (value) => `Pelo menos ${value}`,
    zeroTime: "0 min",
    zeroCount: "0 vezes",
    partial:
      "Nenhum dispositivo mediu os 30 dias completos ainda, então estes números cobrem só o período medido.",
    lineBefore: "Nos dispositivos medidos, últimos 30 dias: ",
    lineDevices: (devices) =>
      `Contado em ${devices} dispositivo${Number(devices) === 1 ? "" : "s"}`,
    lineHandoff: (n) => ` (incluindo ${n} troca${Number(n) === 1 ? "" : "s"} de dispositivo)`,
    lineAfter: ". Não inclui o que você assiste na TV ou no PC, então some ao registrar.",
    zeroWhy:
      "Não foi usado por mais de um minuto nos dispositivos medidos (celulares e tablets Android). Usos com menos de um minuto não são contados.",
    lineAfterPc: ". Não inclui o uso no PC ou na web, então some ao registrar.",
  },
};
