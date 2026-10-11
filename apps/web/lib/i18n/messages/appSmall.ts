import type { Widen } from "../types";
import { one } from "../english";

/** 앱의 폰 기록으로 한 번에 체크인, 첫 체크인 카드, 대시보드·계산서의 '지킨 돈' 한 줄. */
export const ko = {
  appSmall: {
    batch: {
      title: "폰 기록으로 한 번에 체크인",
      zero: {
        uses: "폰에서는 안 열었어요 · 다른 기기에서 봤나요?",
        days: "폰에서는 안 썼어요 · 다른 기기에서 썼나요?",
        hours: "폰에서는 안 들었어요 · 다른 기기에서 썼나요?",
      },
      saved: (count: number) => `${count}개 체크인했어요`,
      close: "닫기",
      intro: (coveredDays: number) =>
        `${coveredDays < 30 ? `기록이 있는 최근 ${coveredDays}일 동안` : "최근 30일 동안"} 이 폰에서 잰 값이에요. OTT는 연 횟수, AI는 5분 넘게 쓴 날, 음악·독서는 들은 시간이에요. 확인하고 고쳐 주세요.`,
      none: "폰 기록으로 잴 수 있는 구독이 없어요. 체크인은 구독마다 직접 해 주세요.",
      pick: (name: string) => `${name} 체크인에 넣기`,
      notInstalled: "이 폰에 앱이 없어요 · 따로 체크인",
      underHour: (used: string) => `${used} 사용 · 1시간이 안 돼요`,
      used: (used: string) => `${used} 사용`,
      minus: (name: string, unit: string) => `${name} 1${unit} 빼기`,
      plus: (name: string, unit: string) => `${name} 1${unit} 더하기`,
      footer: "TV·PC·태블릿에서 본 건 빠져 있어요. 거기서도 썼다면 + 로 더해 주세요.",
      footerUnmapped: (count: number) =>
        ` 폰 기록으로 알 수 없는 구독 ${count}개는 따로 체크인해요.`,
      submit: (count: number) => `${count}개 체크인하기`,
      submitNone: "체크인할 구독을 골라 주세요",
      later: "나중에",
      duration: {
        zero: "0분",
        under1: "1분 미만",
        minutes: (m: number) => `${m}분`,
        hours: (h: number) => `${h}시간`,
        hoursMinutes: (h: number, m: number) => `${h}시간 ${m}분`,
      },
    },
    first: {
      hints: {
        red: "빨간색은 요금만큼 쓰지 못했다는 뜻이에요. 다음 달에도 그렇다면 해지를 고민해 볼 때예요.",
        yellow: "노란색은 애매하다는 뜻이에요. 다음 달에도 이 정도라면 다시 생각해 보세요.",
        green: "초록색은 요금만큼 잘 쓰고 있다는 뜻이에요.",
      },
      perMonth: (amount: string) => `월 ${amount}`,
      label: (name: string) => `${name} 첫 체크인`,
      thisMuch: "이 정도면",
      closeHint: "안내 닫기",
      record: "기록하기",
    },
    savings: {
      pending: (amount: string) => `확인 대기 ${amount}`,
      accrues: "결제일이 지나면 쌓여요",
      thisMonth: (amount: string) => `이번 달 +${amount}`,
      link: "절약 현황",
      keptBefore: "해지해서 ",
      keptAfter: " 지켰어요",
      killedCount: (count: number) => `해지 ${count}개`,
      kept: "해지로 지킨 돈",
    },
  },
};

export const en: Widen<typeof ko> = {
  appSmall: {
    batch: {
      title: "Check in everything from phone records",
      zero: {
        uses: "Not opened on this phone · did you watch on another device?",
        days: "Not used on this phone · did you use it on another device?",
        hours: "Not listened to on this phone · did you use it on another device?",
      },
      saved: (count) => `Checked in ${count} ${one(count) ? "subscription" : "subscriptions"}`,
      close: "Close",
      intro: (coveredDays) =>
        `These are values measured on this phone over ${Number(coveredDays) < 30 ? `the last ${coveredDays} days that have records` : "the last 30 days"}. For OTT it's the number of uses in the year, for AI the days you used it for over 5 minutes, and for music and reading the time listened. Check and edit them.`,
      none: "No subscription can be measured from phone records. Check in each one yourself.",
      pick: (name) => `Include ${name} in the check-in`,
      notInstalled: "The app isn't on this phone · check in separately",
      underHour: (used) => `${used} used · under an hour`,
      used: (used) => `${used} used`,
      minus: (name, unit) => `Subtract 1 ${unit} from ${name}`,
      plus: (name, unit) => `Add 1 ${unit} to ${name}`,
      footer: "Use on TV, PC and tablets is missing. If you used it there too, add it with +.",
      footerUnmapped: (count) =>
        ` ${count} ${one(count) ? "subscription" : "subscriptions"} that phone records can't measure ${one(count) ? "is" : "are"} checked in separately.`,
      submit: (count) => `Check in ${count}`,
      submitNone: "Pick subscriptions to check in",
      later: "Later",
      duration: {
        zero: "0 min",
        under1: "under 1 min",
        minutes: (m) => `${m} min`,
        hours: (h) => `${h} h`,
        hoursMinutes: (h, m) => `${h} h ${m} min`,
      },
    },
    first: {
      hints: {
        red: "Red means you didn't use it as much as you paid. If next month is the same, it may be time to think about cancelling.",
        yellow: "Yellow means borderline. If next month is about the same, think again.",
        green: "Green means you're getting your money's worth.",
      },
      perMonth: (amount) => `${amount}/month`,
      label: (name) => `${name} first check-in`,
      thisMuch: "At this rate",
      closeHint: "Dismiss tip",
      record: "Record",
    },
    savings: {
      pending: (amount) => `Awaiting confirmation ${amount}`,
      accrues: "Builds up after the billing date passes",
      thisMonth: (amount) => `+${amount} this month`,
      link: "Savings",
      keptBefore: "You kept ",
      keptAfter: " by cancelling",
      killedCount: (count) => `${count} cancelled`,
      kept: "Money kept by cancelling",
    },
  },
};

// 원어민 검토 전의 번역(LOCALE_INFO.beta).
export const zh: Widen<typeof ko> = {
  appSmall: {
    batch: {
      title: "用手机记录一次签到全部",
      zero: {
        uses: "这部手机上没有打开过 · 是在其他设备上看的吗？",
        days: "这部手机上没有使用 · 是在其他设备上用的吗？",
        hours: "这部手机上没有收听 · 是在其他设备上用的吗？",
      },
      saved: (count) => `已签到 ${count} 个订阅`,
      close: "关闭",
      intro: (coveredDays) =>
        `这些是这部手机在${Number(coveredDays) < 30 ? `最近有记录的 ${coveredDays} 天` : "最近 30 天"}里测得的数值。OTT 是全年的使用次数，AI 是使用超过 5 分钟的天数，音乐和阅读是收听时长。请确认并修改。`,
      none: "没有可以用手机记录测量的订阅。请逐个签到。",
      pick: (name) => `把 ${name} 加入签到`,
      notInstalled: "这部手机上没有该应用 · 请单独签到",
      underHour: (used) => `使用了 ${used} · 不到 1 小时`,
      used: (used) => `使用了 ${used}`,
      minus: (name, unit) => `${name} 减少 1 ${unit}`,
      plus: (name, unit) => `${name} 增加 1 ${unit}`,
      footer: "不包括电视、电脑和平板上的使用。如果在那里也用过，请用 + 加上。",
      footerUnmapped: (count) => ` 有 ${count} 个订阅无法用手机记录测量，请单独签到。`,
      submit: (count) => `签到 ${count} 个`,
      submitNone: "请选择要签到的订阅",
      later: "稍后",
      duration: {
        zero: "0 分钟",
        under1: "不到 1 分钟",
        minutes: (m) => `${m} 分钟`,
        hours: (h) => `${h} 小时`,
        hoursMinutes: (h, m) => `${h} 小时 ${m} 分钟`,
      },
    },
    first: {
      hints: {
        red: "红色表示用得没有付的钱多。如果下个月还是这样，也许该考虑退订了。",
        yellow: "黄色表示刚好在边缘。如果下个月差不多，请再想想。",
        green: "绿色表示物有所值。",
      },
      perMonth: (amount) => `每月 ${amount}`,
      label: (name) => `${name} 首次签到`,
      thisMuch: "按这个用量",
      closeHint: "关闭提示",
      record: "记录",
    },
    savings: {
      pending: (amount) => `待确认 ${amount}`,
      accrues: "扣款日过后才会累积",
      thisMonth: (amount) => `本月 +${amount}`,
      link: "节省",
      keptBefore: "守住了 ",
      keptAfter: "（通过退订）",
      killedCount: (count) => `已退订 ${count} 个`,
      kept: "退订守住的钱",
    },
  },
};

export const ja: Widen<typeof ko> = {
  appSmall: {
    batch: {
      title: "スマホの記録でまとめてチェックイン",
      zero: {
        uses: "このスマホでは開いていません · ほかの端末で見ましたか？",
        days: "このスマホでは使っていません · ほかの端末で使いましたか？",
        hours: "このスマホでは聞いていません · ほかの端末で使いましたか？",
      },
      saved: (count) => `${count} 件をチェックインしました`,
      close: "閉じる",
      intro: (coveredDays) =>
        `このスマホで${Number(coveredDays) < 30 ? `記録がある直近 ${coveredDays} 日` : "直近 30 日"}に測った値です。OTT は年間の利用回数、AI は 5 分以上使った日数、音楽・読書は聞いた時間です。確認して直してください。`,
      none: "スマホの記録で測れるサブスクがありません。1 件ずつチェックインしてください。",
      pick: (name) => `${name} をチェックインに含める`,
      notInstalled: "このスマホにアプリがありません · 別にチェックイン",
      underHour: (used) => `${used} 利用 · 1 時間未満`,
      used: (used) => `${used} 利用`,
      minus: (name, unit) => `${name} を 1 ${unit}減らす`,
      plus: (name, unit) => `${name} を 1 ${unit}増やす`,
      footer:
        "テレビ・PC・タブレットでの利用は含まれません。そちらでも使ったら + で足してください。",
      footerUnmapped: (count) =>
        ` スマホの記録で測れないサブスク ${count} 件は別にチェックインします。`,
      submit: (count) => `${count} 件をチェックイン`,
      submitNone: "チェックインするサブスクを選んでください",
      later: "あとで",
      duration: {
        zero: "0 分",
        under1: "1 分未満",
        minutes: (m) => `${m} 分`,
        hours: (h) => `${h} 時間`,
        hoursMinutes: (h, m) => `${h} 時間 ${m} 分`,
      },
    },
    first: {
      hints: {
        red: "赤は払った分ほど使っていないという意味です。来月も同じなら、解約を考える時期かもしれません。",
        yellow: "黄色はぎりぎりという意味です。来月も同じくらいなら、もう一度考えてみましょう。",
        green: "緑は元が取れているという意味です。",
      },
      perMonth: (amount) => `月 ${amount}`,
      label: (name) => `${name} の初めてのチェックイン`,
      thisMuch: "このペースなら",
      closeHint: "ヒントを閉じる",
      record: "記録",
    },
    savings: {
      pending: (amount) => `確定待ち ${amount}`,
      accrues: "支払日が過ぎると積み上がります",
      thisMonth: (amount) => `今月 +${amount}`,
      link: "節約",
      keptBefore: "解約で ",
      keptAfter: " を守りました",
      killedCount: (count) => `${count} 件解約`,
      kept: "解約で守ったお金",
    },
  },
};

export const vi: Widen<typeof ko> = {
  appSmall: {
    batch: {
      title: "Check-in tất cả bằng dữ liệu điện thoại",
      zero: {
        uses: "Chưa mở trên điện thoại này · bạn có xem trên thiết bị khác không?",
        days: "Chưa dùng trên điện thoại này · bạn có dùng trên thiết bị khác không?",
        hours: "Chưa nghe trên điện thoại này · bạn có dùng trên thiết bị khác không?",
      },
      saved: (count) => `Đã check-in ${count} gói đăng ký`,
      close: "Đóng",
      intro: (coveredDays) =>
        `Đây là số liệu đo trên điện thoại này trong ${Number(coveredDays) < 30 ? `${coveredDays} ngày gần nhất có dữ liệu` : "30 ngày gần nhất"}. Với OTT là số lần dùng trong năm, với AI là số ngày dùng trên 5 phút, với nhạc và đọc sách là thời gian nghe. Hãy kiểm tra và sửa lại.`,
      none: "Không có gói nào đo được bằng dữ liệu điện thoại. Hãy check-in từng gói.",
      pick: (name) => `Đưa ${name} vào check-in`,
      notInstalled: "Điện thoại này không có ứng dụng · check-in riêng",
      underHour: (used) => `Đã dùng ${used} · dưới 1 giờ`,
      used: (used) => `Đã dùng ${used}`,
      minus: (name, unit) => `Trừ 1 ${unit} cho ${name}`,
      plus: (name, unit) => `Cộng 1 ${unit} cho ${name}`,
      footer:
        "Không tính việc dùng trên TV, PC và máy tính bảng. Nếu bạn cũng dùng ở đó, hãy cộng thêm bằng +.",
      footerUnmapped: (count) =>
        ` ${count} gói không đo được bằng dữ liệu điện thoại sẽ được check-in riêng.`,
      submit: (count) => `Check-in ${count} gói`,
      submitNone: "Chọn gói để check-in",
      later: "Để sau",
      duration: {
        zero: "0 phút",
        under1: "dưới 1 phút",
        minutes: (m) => `${m} phút`,
        hours: (h) => `${h} giờ`,
        hoursMinutes: (h, m) => `${h} giờ ${m} phút`,
      },
    },
    first: {
      hints: {
        red: "Màu đỏ nghĩa là bạn dùng không tương xứng với số tiền đã trả. Nếu tháng sau vẫn vậy, có lẽ đã đến lúc nghĩ đến việc hủy.",
        yellow: "Màu vàng nghĩa là sát ngưỡng. Nếu tháng sau tương tự, hãy cân nhắc lại.",
        green: "Màu xanh nghĩa là bạn đang dùng xứng đáng với số tiền bỏ ra.",
      },
      perMonth: (amount) => `${amount}/tháng`,
      label: (name) => `Check-in đầu tiên của ${name}`,
      thisMuch: "Với mức này",
      closeHint: "Đóng gợi ý",
      record: "Ghi lại",
    },
    savings: {
      pending: (amount) => `Chờ xác nhận ${amount}`,
      accrues: "Được cộng dồn sau khi qua ngày thanh toán",
      thisMonth: (amount) => `+${amount} tháng này`,
      link: "Tiết kiệm",
      keptBefore: "Bạn đã giữ lại ",
      keptAfter: " nhờ hủy",
      killedCount: (count) => `Đã hủy ${count}`,
      kept: "Tiền giữ lại nhờ hủy",
    },
  },
};

export const fr: Widen<typeof ko> = {
  appSmall: {
    batch: {
      title: "Tout enregistrer depuis les données du téléphone",
      zero: {
        uses: "Pas ouvert sur ce téléphone · regardé sur un autre appareil ?",
        days: "Pas utilisé sur ce téléphone · utilisé sur un autre appareil ?",
        hours: "Pas écouté sur ce téléphone · utilisé sur un autre appareil ?",
      },
      saved: (count) =>
        `${count} abonnement${Number(count) === 1 ? "" : "s"} enregistré${Number(count) === 1 ? "" : "s"}`,
      close: "Fermer",
      intro: (coveredDays) =>
        `Ces valeurs ont été mesurées sur ce téléphone ${Number(coveredDays) < 30 ? `sur les ${coveredDays} derniers jours enregistrés` : "sur les 30 derniers jours"}. Pour l'OTT, c'est le nombre d'utilisations de l'année ; pour l'IA, les jours d'utilisation de plus de 5 minutes ; pour la musique et la lecture, le temps d'écoute. Vérifiez et corrigez.`,
      none: "Aucun abonnement ne peut être mesuré par le téléphone. Faites le check-in de chacun.",
      pick: (name) => `Inclure ${name} dans le check-in`,
      notInstalled: "L'application n'est pas sur ce téléphone · check-in séparé",
      underHour: (used) => `${used} d'utilisation · moins d'une heure`,
      used: (used) => `${used} d'utilisation`,
      minus: (name, unit) => `Retirer 1 ${unit} à ${name}`,
      plus: (name, unit) => `Ajouter 1 ${unit} à ${name}`,
      footer:
        "L'utilisation sur TV, PC et tablette n'est pas comptée. Si vous les avez utilisés, ajoutez-la avec +.",
      footerUnmapped: (count) =>
        ` ${count} abonnement${Number(count) === 1 ? "" : "s"} non mesurable${Number(count) === 1 ? "" : "s"} par le téléphone ${Number(count) === 1 ? "est enregistré" : "sont enregistrés"} séparément.`,
      submit: (count) => `Enregistrer ${count}`,
      submitNone: "Choisissez les abonnements à enregistrer",
      later: "Plus tard",
      duration: {
        zero: "0 min",
        under1: "moins d'1 min",
        minutes: (m) => `${m} min`,
        hours: (h) => `${h} h`,
        hoursMinutes: (h, m) => `${h} h ${m} min`,
      },
    },
    first: {
      hints: {
        red: "Rouge : vous l'utilisez moins que ce que vous payez. Si c'est pareil le mois prochain, il est peut-être temps de résilier.",
        yellow: "Jaune : c'est limite. Si le mois prochain est pareil, réfléchissez-y.",
        green: "Vert : vous en avez pour votre argent.",
      },
      perMonth: (amount) => `${amount}/mois`,
      label: (name) => `Premier check-in de ${name}`,
      thisMuch: "À ce rythme",
      closeHint: "Fermer l'astuce",
      record: "Enregistrer",
    },
    savings: {
      pending: (amount) => `En attente de confirmation ${amount}`,
      accrues: "S'accumule une fois la date de paiement passée",
      thisMonth: (amount) => `+${amount} ce mois-ci`,
      link: "Économies",
      keptBefore: "Vous avez économisé ",
      keptAfter: " en résiliant",
      killedCount: (count) => `${count} résilié${Number(count) === 1 ? "" : "s"}`,
      kept: "Argent économisé en résiliant",
    },
  },
};

export const es: Widen<typeof ko> = {
  appSmall: {
    batch: {
      title: "Registrar todo con los datos del móvil",
      zero: {
        uses: "No se abrió en este móvil · ¿lo viste en otro dispositivo?",
        days: "No se usó en este móvil · ¿lo usaste en otro dispositivo?",
        hours: "No se escuchó en este móvil · ¿lo usaste en otro dispositivo?",
      },
      saved: (count) =>
        `${count} suscripci${Number(count) === 1 ? "ón registrada" : "ones registradas"}`,
      close: "Cerrar",
      intro: (coveredDays) =>
        `Son valores medidos en este móvil ${Number(coveredDays) < 30 ? `en los últimos ${coveredDays} días con datos` : "en los últimos 30 días"}. Para OTT es el número de usos del año; para IA, los días con más de 5 minutos de uso; para música y lectura, el tiempo escuchado. Revísalos y corrígelos.`,
      none: "Ninguna suscripción se puede medir con los datos del móvil. Regístralas una por una.",
      pick: (name) => `Incluir ${name} en el registro`,
      notInstalled: "La app no está en este móvil · regístrala aparte",
      underHour: (used) => `${used} de uso · menos de una hora`,
      used: (used) => `${used} de uso`,
      minus: (name, unit) => `Restar 1 ${unit} a ${name}`,
      plus: (name, unit) => `Sumar 1 ${unit} a ${name}`,
      footer: "No incluye el uso en TV, PC ni tableta. Si también lo usaste ahí, súmalo con +.",
      footerUnmapped: (count) =>
        ` ${count} suscripci${Number(count) === 1 ? "ón que no se puede medir con el móvil se registra" : "ones que no se pueden medir con el móvil se registran"} aparte.`,
      submit: (count) => `Registrar ${count}`,
      submitNone: "Elige suscripciones para registrar",
      later: "Más tarde",
      duration: {
        zero: "0 min",
        under1: "menos de 1 min",
        minutes: (m) => `${m} min`,
        hours: (h) => `${h} h`,
        hoursMinutes: (h, m) => `${h} h ${m} min`,
      },
    },
    first: {
      hints: {
        red: "Rojo significa que no lo usaste tanto como pagaste. Si el próximo mes es igual, quizá sea hora de pensar en cancelar.",
        yellow:
          "Amarillo significa que está al límite. Si el próximo mes es parecido, piénsalo otra vez.",
        green: "Verde significa que le sacas provecho a lo que pagas.",
      },
      perMonth: (amount) => `${amount}/mes`,
      label: (name) => `Primer registro de ${name}`,
      thisMuch: "A este ritmo",
      closeHint: "Cerrar consejo",
      record: "Registrar",
    },
    savings: {
      pending: (amount) => `Pendiente de confirmar ${amount}`,
      accrues: "Se acumula cuando pasa el día de cobro",
      thisMonth: (amount) => `+${amount} este mes`,
      link: "Ahorro",
      keptBefore: "Ahorraste ",
      keptAfter: " cancelando",
      killedCount: (count) => `${count} cancelada${Number(count) === 1 ? "" : "s"}`,
      kept: "Dinero ahorrado cancelando",
    },
  },
};

export const de: Widen<typeof ko> = {
  appSmall: {
    batch: {
      title: "Alles aus den Handydaten eintragen",
      zero: {
        uses: "Auf diesem Handy nicht geöffnet · auf einem anderen Gerät geschaut?",
        days: "Auf diesem Handy nicht genutzt · auf einem anderen Gerät genutzt?",
        hours: "Auf diesem Handy nicht gehört · auf einem anderen Gerät genutzt?",
      },
      saved: (count) => `${count} ${Number(count) === 1 ? "Abo" : "Abos"} eingetragen`,
      close: "Schließen",
      intro: (coveredDays) =>
        `Diese Werte wurden auf diesem Handy ${Number(coveredDays) < 30 ? `in den letzten ${coveredDays} Tagen mit Daten` : "in den letzten 30 Tagen"} gemessen. Bei OTT ist es die Zahl der Nutzungen im Jahr, bei KI die Tage mit über 5 Minuten Nutzung, bei Musik und Lesen die Hördauer. Prüf und korrigiere sie.`,
      none: "Kein Abo lässt sich aus Handydaten messen. Trag jedes einzeln ein.",
      pick: (name) => `${name} in den Eintrag aufnehmen`,
      notInstalled: "Die App ist nicht auf diesem Handy · separat eintragen",
      underHour: (used) => `${used} genutzt · unter einer Stunde`,
      used: (used) => `${used} genutzt`,
      minus: (name, unit) => `1 ${unit} von ${name} abziehen`,
      plus: (name, unit) => `1 ${unit} zu ${name} hinzufügen`,
      footer:
        "Nutzung auf TV, PC und Tablet fehlt. Wenn du es dort auch genutzt hast, füg es mit + hinzu.",
      footerUnmapped: (count) =>
        ` ${count} ${Number(count) === 1 ? "Abo, das" : "Abos, die"} sich nicht aus Handydaten messen ${Number(count) === 1 ? "lässt, wird" : "lassen, werden"} separat eingetragen.`,
      submit: (count) => `${count} eintragen`,
      submitNone: "Wähl Abos zum Eintragen",
      later: "Später",
      duration: {
        zero: "0 Min.",
        under1: "unter 1 Min.",
        minutes: (m) => `${m} Min.`,
        hours: (h) => `${h} Std.`,
        hoursMinutes: (h, m) => `${h} Std. ${m} Min.`,
      },
    },
    first: {
      hints: {
        red: "Rot heißt, du nutzt es weniger, als du zahlst. Wenn es nächsten Monat genauso ist, wäre es vielleicht Zeit zu kündigen.",
        yellow:
          "Gelb heißt grenzwertig. Wenn der nächste Monat ähnlich ist, denk noch einmal nach.",
        green: "Grün heißt, es lohnt sich für dich.",
      },
      perMonth: (amount) => `${amount}/Monat`,
      label: (name) => `Erster Eintrag für ${name}`,
      thisMuch: "Bei diesem Tempo",
      closeHint: "Tipp schließen",
      record: "Eintragen",
    },
    savings: {
      pending: (amount) => `Wartet auf Bestätigung ${amount}`,
      accrues: "Wird nach dem Abbuchungstag angerechnet",
      thisMonth: (amount) => `+${amount} diesen Monat`,
      link: "Ersparnis",
      keptBefore: "Du hast ",
      keptAfter: " durch Kündigen gespart",
      killedCount: (count) => `${count} gekündigt`,
      kept: "Durch Kündigen gespartes Geld",
    },
  },
};

export const pt: Widen<typeof ko> = {
  appSmall: {
    batch: {
      title: "Registrar tudo com os dados do celular",
      zero: {
        uses: "Não foi aberto neste celular · assistiu em outro dispositivo?",
        days: "Não foi usado neste celular · usou em outro dispositivo?",
        hours: "Não foi ouvido neste celular · usou em outro dispositivo?",
      },
      saved: (count) =>
        `${count} assinatura${Number(count) === 1 ? " registrada" : "s registradas"}`,
      close: "Fechar",
      intro: (coveredDays) =>
        `Estes valores foram medidos neste celular ${Number(coveredDays) < 30 ? `nos últimos ${coveredDays} dias com dados` : "nos últimos 30 dias"}. Para OTT é o número de usos do ano; para IA, os dias com mais de 5 minutos de uso; para música e leitura, o tempo ouvido. Confira e ajuste.`,
      none: "Nenhuma assinatura pode ser medida com os dados do celular. Registre uma por uma.",
      pick: (name) => `Incluir ${name} no registro`,
      notInstalled: "O app não está neste celular · registre à parte",
      underHour: (used) => `${used} de uso · menos de uma hora`,
      used: (used) => `${used} de uso`,
      minus: (name, unit) => `Tirar 1 ${unit} de ${name}`,
      plus: (name, unit) => `Somar 1 ${unit} a ${name}`,
      footer: "Não inclui o uso na TV, no PC e no tablet. Se usou lá também, some com +.",
      footerUnmapped: (count) =>
        ` ${count} assinatura${Number(count) === 1 ? " que não pode ser medida pelo celular é registrada" : "s que não podem ser medidas pelo celular são registradas"} à parte.`,
      submit: (count) => `Registrar ${count}`,
      submitNone: "Escolha assinaturas para registrar",
      later: "Depois",
      duration: {
        zero: "0 min",
        under1: "menos de 1 min",
        minutes: (m) => `${m} min`,
        hours: (h) => `${h} h`,
        hoursMinutes: (h, m) => `${h} h ${m} min`,
      },
    },
    first: {
      hints: {
        red: "Vermelho quer dizer que você não usou tanto quanto pagou. Se o próximo mês for igual, talvez seja hora de pensar em cancelar.",
        yellow: "Amarelo quer dizer no limite. Se o próximo mês for parecido, pense de novo.",
        green: "Verde quer dizer que está valendo o que você paga.",
      },
      perMonth: (amount) => `${amount}/mês`,
      label: (name) => `Primeiro registro de ${name}`,
      thisMuch: "Neste ritmo",
      closeHint: "Fechar dica",
      record: "Registrar",
    },
    savings: {
      pending: (amount) => `Aguardando confirmação ${amount}`,
      accrues: "Acumula depois que passa o dia de cobrança",
      thisMonth: (amount) => `+${amount} este mês`,
      link: "Economia",
      keptBefore: "Você economizou ",
      keptAfter: " cancelando",
      killedCount: (count) => `${count} cancelada${Number(count) === 1 ? "" : "s"}`,
      kept: "Dinheiro economizado cancelando",
    },
  },
};
