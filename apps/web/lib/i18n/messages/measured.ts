import type { Widen } from "../types";
import { countOf } from "../english";

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
    count: (n) => countOf(n, "time"),
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
      `Last 30 days · ${countOf(devices, "device")} · continuing within 30 minutes counts once, even on another device`,
    handoff: (n) =>
      `${countOf(n, "switch")} between devices counted as one`.replace("switchs", "switches"),
    notIncluded: "Watching on a TV, PC, or iPhone isn't included.",
    screenOff:
      " Time is how long the app was on screen, so listening with the screen off isn't included.",
    unitCost: " Cost per use is calculated from your check-ins.",
    differs:
      " It may differ from the “This phone” numbers above — use that continues across phone and tablet counts once.",
    lineBefore: "On measured devices in the last 30 days: ",
    lineDevices: (devices) => `Counted across ${countOf(devices, "device")}`,
    lineHandoff: (n) =>
      ` (including ${countOf(n, "switch")} between devices)`.replace("switchs", "switches"),
    lineAfter: ". Watching on a TV or PC isn't included, so add it when you check in.",
  },
};

// 원어민 검토 전의 번역(LOCALE_INFO.beta).
export const zh: Widen<typeof ko> = {
  measured: {
    count: (n) => `${n} 次`,
    atLeast: (value) => `至少 ${value}`,
    zeroTime: "0 分钟",
    zeroCount: "0 次",
    zeroOn: (value) => `已测量的设备上为 ${value}`,
    partial: "还没有设备测满 30 天，所以这些数字只涵盖已测量的时段。",
    loadFailed: (error) => `无法载入已测量的使用记录。${error}`,
    offTitle: "跨设备使用次数",
    offLink: "我的订阅",
    offAfter: "：打开下方的“多设备使用测量”，我们会把手机和平板上的使用连起来计数。",
    titleAmount: "所有设备合计的使用量",
    titleCount: "所有设备合计的使用次数",
    subtitle: (devices) =>
      `最近 30 天 · ${devices} 台设备 · 30 分钟内接着用，即使换了设备也算 1 次`,
    handoff: (n) => `换设备接着用的 ${n} 次合并为一次`,
    notIncluded: "不包括在电视、电脑或 iPhone 上观看的部分。",
    screenOff: " 时间是应用显示在屏幕上的时长，关屏收听的时间不包括在内。",
    unitCost: " 单次成本按签到的数值计算。",
    differs: " 可能与上方“这部手机”的数字不同——在手机和平板之间接着用的部分算作一次。",
    lineBefore: "已测量的设备在最近 30 天：",
    lineDevices: (devices) => `合计了 ${devices} 台设备`,
    lineHandoff: (n) => `（含换设备接着用的 ${n} 次）`,
    lineAfter: "。不包括在电视或电脑上观看的部分，签到时请加上。",
  },
};

export const ja: Widen<typeof ko> = {
  measured: {
    count: (n) => `${n} 回`,
    atLeast: (value) => `少なくとも ${value}`,
    zeroTime: "0 分",
    zeroCount: "0 回",
    zeroOn: (value) => `測定した端末では ${value}`,
    partial: "30 日分を測定し終えた端末がまだないため、測定した期間だけの数字です。",
    loadFailed: (error) => `測定した利用記録を読み込めませんでした。${error}`,
    offTitle: "端末をまたいで使った回数",
    offLink: "マイサブスク",
    offAfter:
      " の下の「複数端末の利用測定」をオンにすると、スマホとタブレットで使った回数をつなげて数えます。",
    titleAmount: "すべての端末を合わせた利用量",
    titleCount: "すべての端末を合わせた利用回数",
    subtitle: (devices) =>
      `直近 30 日 · 端末 ${devices} 台 · 30 分以内に続けて使えば端末が違っても 1 回`,
    handoff: (n) => `端末を替えて続けて使った ${n} 回は 1 回として数えました`,
    notIncluded: "テレビ・PC・iPhone で見た分は含まれません。",
    screenOff: " 時間はアプリが画面に出ていた時間なので、画面を消して聞いた時間は含まれません。",
    unitCost: " 1 回あたりの単価はチェックインした値で計算します。",
    differs:
      " 上の「このスマホ」の数字と違うことがあります——スマホとタブレットをまたいで続けて使った分は 1 回と数えます。",
    lineBefore: "測定した端末で直近 30 日 ",
    lineDevices: (devices) => `端末 ${devices} 台をつなげて数えました`,
    lineHandoff: (n) => `（端末を替えて続けて使った ${n} 回を含む）`,
    lineAfter: "。テレビ・PC で見た分はないので、チェックインのときに足してください。",
  },
};

export const vi: Widen<typeof ko> = {
  measured: {
    count: (n) => `${n} lần`,
    atLeast: (value) => `Ít nhất ${value}`,
    zeroTime: "0 phút",
    zeroCount: "0 lần",
    zeroOn: (value) => `${value} trên các thiết bị đã đo`,
    partial: "Chưa có thiết bị nào đo đủ 30 ngày, nên các con số chỉ tính trong khoảng đã đo.",
    loadFailed: (error) => `Không tải được dữ liệu sử dụng đã đo. ${error}`,
    offTitle: "Số lần dùng trên nhiều thiết bị",
    offLink: "Gói đăng ký của tôi",
    offAfter:
      ": bật “Đo mức sử dụng trên nhiều thiết bị” bên dưới, chúng tôi sẽ đếm liền mạch số lần dùng trên điện thoại và máy tính bảng.",
    titleAmount: "Mức sử dụng trên tất cả thiết bị",
    titleCount: "Số lần dùng trên tất cả thiết bị",
    subtitle: (devices) =>
      `30 ngày gần nhất · ${devices} thiết bị · dùng tiếp trong 30 phút thì tính 1 lần, kể cả trên thiết bị khác`,
    handoff: (n) => `${n} lần chuyển thiết bị để dùng tiếp được tính là một`,
    notIncluded: "Không tính phần xem trên TV, PC hay iPhone.",
    screenOff:
      " Thời gian là khoảng ứng dụng hiện trên màn hình, nên thời gian nghe khi tắt màn hình không được tính.",
    unitCost: " Chi phí mỗi lần dùng được tính từ số liệu check-in.",
    differs:
      " Có thể khác với số “Điện thoại này” ở trên — việc dùng tiếp qua lại giữa điện thoại và máy tính bảng được tính là một lần.",
    lineBefore: "Trên các thiết bị đã đo trong 30 ngày gần nhất: ",
    lineDevices: (devices) => `Đếm liền mạch trên ${devices} thiết bị`,
    lineHandoff: (n) => ` (gồm ${n} lần chuyển thiết bị để dùng tiếp)`,
    lineAfter: ". Không có phần xem trên TV hay PC, hãy cộng thêm khi check-in.",
  },
};

export const fr: Widen<typeof ko> = {
  measured: {
    count: (n) => `${n} fois`,
    atLeast: (value) => `Au moins ${value}`,
    zeroTime: "0 min",
    zeroCount: "0 fois",
    zeroOn: (value) => `${value} sur les appareils mesurés`,
    partial:
      "Aucun appareil n'a encore mesuré 30 jours complets : ces chiffres ne couvrent que la période mesurée.",
    loadFailed: (error) => `Impossible de charger l'utilisation mesurée. ${error}`,
    offTitle: "Utilisations sur plusieurs appareils",
    offLink: "Mes abonnements",
    offAfter:
      " : activez « Mesure de l'utilisation multi-appareils » ci-dessous et nous compterons ensemble les utilisations sur votre téléphone et votre tablette.",
    titleAmount: "Utilisation sur tous les appareils",
    titleCount: "Utilisations sur tous les appareils",
    subtitle: (devices) =>
      `30 derniers jours · ${devices} appareil${Number(devices) === 1 ? "" : "s"} · une reprise dans les 30 minutes compte une fois, même sur un autre appareil`,
    handoff: (n) =>
      `${n} changement${Number(n) === 1 ? "" : "s"} d'appareil compté${Number(n) === 1 ? "" : "s"} comme une seule utilisation`,
    notIncluded: "Ce que vous regardez sur une TV, un PC ou un iPhone n'est pas inclus.",
    screenOff:
      " La durée correspond au temps où l'application était à l'écran : l'écoute écran éteint n'est pas incluse.",
    unitCost: " Le coût par utilisation est calculé à partir de vos check-ins.",
    differs:
      " Cela peut différer des chiffres « Ce téléphone » ci-dessus — une utilisation poursuivie entre téléphone et tablette compte une fois.",
    lineBefore: "Sur les appareils mesurés, 30 derniers jours : ",
    lineDevices: (devices) => `Compté sur ${devices} appareil${Number(devices) === 1 ? "" : "s"}`,
    lineHandoff: (n) => ` (dont ${n} changement${Number(n) === 1 ? "" : "s"} d'appareil)`,
    lineAfter:
      ". Ce que vous regardez sur une TV ou un PC n'est pas inclus : ajoutez-le lors du check-in.",
  },
};

export const es: Widen<typeof ko> = {
  measured: {
    count: (n) => `${n} ${Number(n) === 1 ? "vez" : "veces"}`,
    atLeast: (value) => `Al menos ${value}`,
    zeroTime: "0 min",
    zeroCount: "0 veces",
    zeroOn: (value) => `${value} en los dispositivos medidos`,
    partial:
      "Ningún dispositivo ha medido aún los 30 días completos, así que estas cifras solo cubren el periodo medido.",
    loadFailed: (error) => `No se pudo cargar el uso medido. ${error}`,
    offTitle: "Usos entre dispositivos",
    offLink: "Mis suscripciones",
    offAfter:
      ": activa «Medición de uso en varios dispositivos» abajo y contaremos juntos los usos en tu móvil y tu tableta.",
    titleAmount: "Uso en todos los dispositivos",
    titleCount: "Usos en todos los dispositivos",
    subtitle: (devices) =>
      `Últimos 30 días · ${devices} dispositivo${Number(devices) === 1 ? "" : "s"} · seguir en 30 minutos cuenta una vez, aunque sea en otro dispositivo`,
    handoff: (n) =>
      `${n} cambio${Number(n) === 1 ? "" : "s"} de dispositivo contado${Number(n) === 1 ? "" : "s"} como uno`,
    notIncluded: "No incluye lo que veas en una TV, un PC o un iPhone.",
    screenOff:
      " El tiempo es lo que la app estuvo en pantalla, así que no incluye escuchar con la pantalla apagada.",
    unitCost: " El coste por uso se calcula con tus registros.",
    differs:
      " Puede diferir de las cifras de «Este móvil» de arriba: el uso que sigue entre móvil y tableta cuenta una vez.",
    lineBefore: "En los dispositivos medidos, últimos 30 días: ",
    lineDevices: (devices) =>
      `Contado en ${devices} dispositivo${Number(devices) === 1 ? "" : "s"}`,
    lineHandoff: (n) => ` (incluye ${n} cambio${Number(n) === 1 ? "" : "s"} de dispositivo)`,
    lineAfter: ". No incluye lo que veas en una TV o un PC, así que súmalo al registrar.",
  },
};

export const de: Widen<typeof ko> = {
  measured: {
    count: (n) => `${n}-mal`,
    atLeast: (value) => `Mindestens ${value}`,
    zeroTime: "0 Min.",
    zeroCount: "0-mal",
    zeroOn: (value) => `${value} auf gemessenen Geräten`,
    partial:
      "Noch kein Gerät hat volle 30 Tage gemessen, daher gelten die Zahlen nur für den gemessenen Zeitraum.",
    loadFailed: (error) => `Die gemessene Nutzung konnte nicht geladen werden. ${error}`,
    offTitle: "Nutzung über mehrere Geräte",
    offLink: "Meine Abos",
    offAfter:
      ": Aktiviere unten „Nutzungsmessung auf mehreren Geräten“, dann zählen wir die Nutzung auf Handy und Tablet zusammen.",
    titleAmount: "Nutzung über alle Geräte",
    titleCount: "Nutzungen über alle Geräte",
    subtitle: (devices) =>
      `Letzte 30 Tage · ${devices} ${Number(devices) === 1 ? "Gerät" : "Geräte"} · wer innerhalb von 30 Minuten weitermacht, zählt einmal, auch auf einem anderen Gerät`,
    handoff: (n) => `${n} Gerätewechsel als eine Nutzung gezählt`,
    notIncluded: "Was du auf TV, PC oder iPhone schaust, ist nicht enthalten.",
    screenOff:
      " Die Zeit ist, wie lange die App auf dem Bildschirm war – Hören bei ausgeschaltetem Bildschirm fehlt.",
    unitCost: " Die Kosten pro Nutzung werden aus deinen Einträgen berechnet.",
    differs:
      " Kann von den Zahlen „Dieses Handy“ oben abweichen — fortgesetzte Nutzung zwischen Handy und Tablet zählt einmal.",
    lineBefore: "Auf gemessenen Geräten in den letzten 30 Tagen: ",
    lineDevices: (devices) =>
      `Über ${devices} ${Number(devices) === 1 ? "Gerät" : "Geräte"} gezählt`,
    lineHandoff: (n) => ` (inklusive ${n} Gerätewechsel)`,
    lineAfter: ". Was du auf TV oder PC schaust, fehlt – rechne es beim Eintragen dazu.",
  },
};

export const pt: Widen<typeof ko> = {
  measured: {
    count: (n) => `${n} ${Number(n) === 1 ? "vez" : "vezes"}`,
    atLeast: (value) => `Pelo menos ${value}`,
    zeroTime: "0 min",
    zeroCount: "0 vezes",
    zeroOn: (value) => `${value} nos dispositivos medidos`,
    partial:
      "Nenhum dispositivo mediu os 30 dias completos ainda, então estes números cobrem só o período medido.",
    loadFailed: (error) => `Não foi possível carregar o uso medido. ${error}`,
    offTitle: "Usos entre dispositivos",
    offLink: "Minhas assinaturas",
    offAfter:
      ": ative “Medição de uso em vários dispositivos” abaixo e vamos contar juntos os usos no celular e no tablet.",
    titleAmount: "Uso em todos os dispositivos",
    titleCount: "Usos em todos os dispositivos",
    subtitle: (devices) =>
      `Últimos 30 dias · ${devices} dispositivo${Number(devices) === 1 ? "" : "s"} · continuar em até 30 minutos conta uma vez, mesmo em outro dispositivo`,
    handoff: (n) =>
      `${n} troca${Number(n) === 1 ? "" : "s"} de dispositivo contada${Number(n) === 1 ? "" : "s"} como uma`,
    notIncluded: "Não inclui o que você assiste na TV, no PC ou no iPhone.",
    screenOff: " O tempo é quanto o app ficou na tela, então ouvir com a tela desligada não entra.",
    unitCost: " O custo por uso é calculado com seus registros.",
    differs:
      " Pode ser diferente dos números de “Este celular” acima — o uso que continua entre celular e tablet conta uma vez.",
    lineBefore: "Nos dispositivos medidos, últimos 30 dias: ",
    lineDevices: (devices) =>
      `Contado em ${devices} dispositivo${Number(devices) === 1 ? "" : "s"}`,
    lineHandoff: (n) => ` (incluindo ${n} troca${Number(n) === 1 ? "" : "s"} de dispositivo)`,
    lineAfter: ". Não inclui o que você assiste na TV ou no PC, então some ao registrar.",
  },
};
