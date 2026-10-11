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

// 원어민 검토 전의 번역(LOCALE_INFO.beta).
export const zh: Widen<typeof ko> = {
  howTitle: "开启后会测量什么",
  howUpload:
    "在这台设备上，下面这些服务的应用显示在前台的开始和结束时间会上传到你的账户。其他应用以及你在应用里看了什么都不会上传。（报告中“这部手机”的使用情况即使不开启也只保存在这部手机上。）",
  howLink: "同一账户的各设备上的使用会合并计算。在手机上看、30 分钟内在平板上接着看，算作一次。",
  howLimits:
    "在电视、电脑或 iPhone 上观看以及关屏播放无法测量，所以这个数字的意思是“在已测量的设备上至少这么多次”。请照常自己签到。",
  howRetention: (days) => `记录会在 ${days} 天后删除，你也可以随时关闭或删除。`,
  privacy: "隐私政策",
  services: (names) => `测量的服务：${names}`,
  measuring: "正在这台设备上测量",
  accessOff: "设备设置中的“使用情况访问权限”已关闭，所以现在没有在测量。重新允许即可继续。",
  allowAccess: "允许使用情况访问权限",
  turnOff: "停止在这台设备上测量",
  turnOffNote: "关闭后也会删除这台设备上传的内容。",
  otherAccount: "这台设备之前在为另一个账户测量。在你开启之前，不会为这个账户上传任何内容。",
  turnOn: "开启使用测量",
  waitingForAccess: "请在设备设置中为 SubSlash 允许“使用情况访问权限”，然后回来完成开启。",
  androidOnly:
    "只有 Android 应用可以开启测量。iPhone 和网页浏览器不会提供其他应用的使用时间。在这里可以查看和删除账户中收集到的设备。",
  devices: "已测量的设备",
  noDevices: "还没有设备向这个账户上传过。",
  thisDevice: "这台设备",
  androidDevice: (n) => `Android 设备 ${n}`,
  deleteAllConfirm:
    "要删除这个账户中所有设备的使用记录吗？其他设备会继续测量，所以在那里打开应用后记录会重新出现。",
  deleteAll: "全部删除",
  deleteAllButton: "删除所有设备的记录",
  turnedOn: "已为这台设备开启使用测量。",
  turnOnFailed: "无法开启使用测量。",
  turnedOff: "已停止在这台设备上测量，并删除了它上传的内容。",
  turnOffFailed: "无法关闭测量。",
  deletedAll: "已删除这个账户中所有设备的使用记录。",
  deleteFailed: "无法删除使用记录。",
};

export const ja: Widen<typeof ko> = {
  howTitle: "オンにすると何を測定するか",
  howUpload:
    "この端末で、下のサービスのアプリが前面に出ていた開始・終了時刻をアカウントにアップロードします。ほかのアプリや、アプリの中で何を見たかはアップロードしません。（レポートの「このスマホ」の利用状況は、オンにしなくてもこのスマホの中だけに残ります。）",
  howLink:
    "同じアカウントの端末での利用はまとめて数えます。スマホで見て 30 分以内にタブレットで続きを見たら 1 回です。",
  howLimits:
    "テレビ・PC・iPhone での視聴や画面を消した再生は測定できないので、数字は「測定した端末で少なくともこの回数」という意味です。これまでどおりご自身でもチェックインしてください。",
  howRetention: (days) => `記録は ${days} 日後に削除され、いつでもオフにしたり削除したりできます。`,
  privacy: "プライバシーポリシー",
  services: (names) => `測定するサービス: ${names}`,
  measuring: "この端末で測定中",
  accessOff:
    "端末設定の「使用状況へのアクセス」がオフになっているため、今は測定していません。もう一度許可すると続きます。",
  allowAccess: "使用状況へのアクセスを許可",
  turnOff: "この端末での測定をやめる",
  turnOffNote: "オフにすると、この端末がアップロードした分も削除します。",
  otherAccount:
    "この端末は別のアカウントのために測定していました。オンにするまで、このアカウントには何もアップロードしません。",
  turnOn: "利用測定をオンにする",
  waitingForAccess:
    "端末設定で SubSlash の「使用状況へのアクセス」を許可してから戻ってくると、オンにする手続きが完了します。",
  androidOnly:
    "測定は Android アプリでのみオンにできます。iPhone やウェブブラウザはほかのアプリの利用時間を教えてくれません。ここではアカウントに集まった端末を確認・削除できます。",
  devices: "測定した端末",
  noDevices: "このアカウントにアップロードした端末はまだありません。",
  thisDevice: "この端末",
  androidDevice: (n) => `Android 端末 ${n}`,
  deleteAllConfirm:
    "このアカウントのすべての端末の利用記録を削除しますか？ ほかの端末は測定を続けるので、その端末でアプリを開くと記録が戻ります。",
  deleteAll: "すべて削除",
  deleteAllButton: "すべての端末の記録を削除",
  turnedOn: "この端末の利用測定をオンにしました。",
  turnOnFailed: "利用測定をオンにできませんでした。",
  turnedOff: "この端末での測定をやめ、アップロードした分を削除しました。",
  turnOffFailed: "測定をオフにできませんでした。",
  deletedAll: "このアカウントのすべての端末の利用記録を削除しました。",
  deleteFailed: "利用記録を削除できませんでした。",
};

export const vi: Widen<typeof ko> = {
  howTitle: "Khi bật, những gì sẽ được đo",
  howUpload:
    "Trên thiết bị này, thời điểm bắt đầu và kết thúc khi ứng dụng của các dịch vụ bên dưới hiển thị ở nền trước sẽ được tải lên tài khoản của bạn. Các ứng dụng khác và nội dung bạn xem trong ứng dụng không được tải lên. (Mức sử dụng “điện thoại này” trong Báo cáo vẫn chỉ nằm trên điện thoại này dù không bật.)",
  howLink:
    "Việc dùng trên các thiết bị cùng tài khoản được tính chung. Xem trên điện thoại rồi xem tiếp trên máy tính bảng trong 30 phút được tính là một lần.",
  howLimits:
    "Không đo được việc xem trên TV, PC hay iPhone và phát khi tắt màn hình, nên con số có nghĩa là “ít nhất chừng này lần trên các thiết bị đã đo”. Hãy tiếp tục tự check-in như trước.",
  howRetention: (days) =>
    `Dữ liệu sẽ bị xóa sau ${days} ngày, và bạn có thể tắt hoặc xóa bất cứ lúc nào.`,
  privacy: "Chính sách quyền riêng tư",
  services: (names) => `Dịch vụ được đo: ${names}`,
  measuring: "Đang đo trên thiết bị này",
  accessOff:
    "“Quyền truy cập dữ liệu sử dụng” đang tắt trong cài đặt thiết bị nên hiện không đo gì. Hãy cho phép lại để tiếp tục.",
  allowAccess: "Cho phép truy cập dữ liệu sử dụng",
  turnOff: "Ngừng đo trên thiết bị này",
  turnOffNote: "Tắt cũng sẽ xóa những gì thiết bị này đã tải lên.",
  otherAccount:
    "Thiết bị này trước đó đo cho tài khoản khác. Sẽ không tải lên gì cho tài khoản này cho đến khi bạn bật.",
  turnOn: "Bật đo mức sử dụng",
  waitingForAccess:
    "Hãy cho phép “Quyền truy cập dữ liệu sử dụng” cho SubSlash trong cài đặt thiết bị, rồi quay lại để hoàn tất việc bật.",
  androidOnly:
    "Chỉ có thể bật đo trong ứng dụng Android. iPhone và trình duyệt web không cung cấp thời gian dùng của ứng dụng khác. Tại đây bạn có thể xem và xóa các thiết bị đã thu thập trong tài khoản.",
  devices: "Thiết bị đã đo",
  noDevices: "Chưa có thiết bị nào tải lên tài khoản này.",
  thisDevice: "Thiết bị này",
  androidDevice: (n) => `Thiết bị Android ${n}`,
  deleteAllConfirm:
    "Xóa dữ liệu sử dụng của tất cả thiết bị trong tài khoản này? Các thiết bị khác vẫn tiếp tục đo nên dữ liệu sẽ quay lại khi mở ứng dụng trên đó.",
  deleteAll: "Xóa tất cả",
  deleteAllButton: "Xóa dữ liệu của tất cả thiết bị",
  turnedOn: "Đã bật đo mức sử dụng cho thiết bị này.",
  turnOnFailed: "Không bật được đo mức sử dụng.",
  turnedOff: "Đã ngừng đo trên thiết bị này và xóa những gì nó đã tải lên.",
  turnOffFailed: "Không tắt được việc đo.",
  deletedAll: "Đã xóa dữ liệu sử dụng của tất cả thiết bị trong tài khoản này.",
  deleteFailed: "Không xóa được dữ liệu sử dụng.",
};

export const fr: Widen<typeof ko> = {
  howTitle: "Ce qui est mesuré si vous l'activez",
  howUpload:
    "Sur cet appareil, les heures de début et de fin pendant lesquelles les applications des services ci-dessous étaient au premier plan sont envoyées à votre compte. Les autres applications et ce que vous regardez dans une application ne sont pas envoyés. (L'utilisation « ce téléphone » dans les rapports reste sur ce téléphone même sans activer ceci.)",
  howLink:
    "L'utilisation sur les appareils d'un même compte est comptée ensemble. Regarder sur le téléphone puis continuer sur une tablette dans les 30 minutes compte une fois.",
  howLimits:
    "La TV, le PC, l'iPhone et la lecture écran éteint ne peuvent pas être mesurés : le chiffre signifie « au moins autant de fois sur les appareils mesurés ». Continuez à faire vos check-ins comme avant.",
  howRetention: (days) =>
    `Les données sont supprimées après ${days} jours, et vous pouvez désactiver ou supprimer à tout moment.`,
  privacy: "Politique de confidentialité",
  services: (names) => `Services mesurés : ${names}`,
  measuring: "Mesure en cours sur cet appareil",
  accessOff:
    "L'« accès aux données d'utilisation » est désactivé dans les réglages de l'appareil, rien n'est donc mesuré. Autorisez-le à nouveau pour continuer.",
  allowAccess: "Autoriser l'accès aux données d'utilisation",
  turnOff: "Arrêter la mesure sur cet appareil",
  turnOffNote: "Désactiver supprime aussi ce que cet appareil a envoyé.",
  otherAccount:
    "Cet appareil mesurait pour un autre compte. Rien n'est envoyé pour ce compte tant que vous ne l'activez pas.",
  turnOn: "Activer la mesure d'utilisation",
  waitingForAccess:
    "Autorisez l'« accès aux données d'utilisation » pour SubSlash dans les réglages de l'appareil, puis revenez pour terminer l'activation.",
  androidOnly:
    "La mesure ne peut être activée que dans l'application Android. L'iPhone et les navigateurs ne donnent pas le temps d'utilisation des autres applications. Ici, vous pouvez voir et supprimer les appareils collectés dans votre compte.",
  devices: "Appareils mesurés",
  noDevices: "Aucun appareil n'a encore envoyé de données à ce compte.",
  thisDevice: "Cet appareil",
  androidDevice: (n) => `Appareil Android ${n}`,
  deleteAllConfirm:
    "Supprimer les données d'utilisation de tous les appareils de ce compte ? Les autres appareils continuent de mesurer, leurs données reviendront à l'ouverture de l'application.",
  deleteAll: "Tout supprimer",
  deleteAllButton: "Supprimer les données de tous les appareils",
  turnedOn: "La mesure d'utilisation est activée sur cet appareil.",
  turnOnFailed: "Impossible d'activer la mesure d'utilisation.",
  turnedOff: "Mesure arrêtée sur cet appareil et données envoyées supprimées.",
  turnOffFailed: "Impossible de désactiver la mesure.",
  deletedAll: "Données d'utilisation de tous les appareils du compte supprimées.",
  deleteFailed: "Impossible de supprimer les données d'utilisation.",
};

export const es: Widen<typeof ko> = {
  howTitle: "Qué se mide al activarlo",
  howUpload:
    "En este dispositivo se suben a tu cuenta las horas de inicio y fin en que las apps de los servicios de abajo estuvieron en primer plano. Otras apps y lo que viste dentro de una app no se suben. (El uso de «este móvil» en los informes se queda en este móvil aunque no actives esto.)",
  howLink:
    "El uso en dispositivos con la misma cuenta se cuenta junto. Ver en el móvil y seguir en una tableta en 30 minutos cuenta una vez.",
  howLimits:
    "No se puede medir la TV, el PC, el iPhone ni la reproducción con la pantalla apagada, así que la cifra significa «al menos tantas veces en los dispositivos medidos». Sigue registrando tú como antes.",
  howRetention: (days) =>
    `Los registros se borran a los ${days} días y puedes desactivarlo o borrarlos cuando quieras.`,
  privacy: "Política de privacidad",
  services: (names) => `Servicios medidos: ${names}`,
  measuring: "Midiendo en este dispositivo",
  accessOff:
    "El «acceso a datos de uso» está desactivado en los ajustes del dispositivo, así que ahora no se mide nada. Vuelve a permitirlo para continuar.",
  allowAccess: "Permitir acceso a datos de uso",
  turnOff: "Dejar de medir en este dispositivo",
  turnOffNote: "Al desactivarlo también se borra lo que subió este dispositivo.",
  otherAccount:
    "Este dispositivo medía para otra cuenta. No se sube nada para esta cuenta hasta que lo actives.",
  turnOn: "Activar medición de uso",
  waitingForAccess:
    "Permite el «acceso a datos de uso» para SubSlash en los ajustes del dispositivo y vuelve para terminar de activarlo.",
  androidOnly:
    "La medición solo se puede activar en la app de Android. El iPhone y los navegadores no dan el tiempo de uso de otras apps. Aquí puedes ver y borrar los dispositivos reunidos en tu cuenta.",
  devices: "Dispositivos medidos",
  noDevices: "Ningún dispositivo ha subido datos a esta cuenta todavía.",
  thisDevice: "Este dispositivo",
  androidDevice: (n) => `Dispositivo Android ${n}`,
  deleteAllConfirm:
    "¿Borrar los registros de uso de todos los dispositivos de esta cuenta? Los demás dispositivos siguen midiendo, así que sus registros volverán al abrir la app en ellos.",
  deleteAll: "Borrar todo",
  deleteAllButton: "Borrar registros de todos los dispositivos",
  turnedOn: "La medición de uso está activada en este dispositivo.",
  turnOnFailed: "No se pudo activar la medición de uso.",
  turnedOff: "Se dejó de medir en este dispositivo y se borró lo que subió.",
  turnOffFailed: "No se pudo desactivar la medición.",
  deletedAll: "Se borraron los registros de uso de todos los dispositivos de esta cuenta.",
  deleteFailed: "No se pudieron borrar los registros de uso.",
};

export const de: Widen<typeof ko> = {
  howTitle: "Was gemessen wird, wenn du das einschaltest",
  howUpload:
    "Auf diesem Gerät werden Start- und Endzeiten, in denen die Apps der unten genannten Dienste im Vordergrund waren, in dein Konto hochgeladen. Andere Apps und was du in einer App angesehen hast, werden nicht hochgeladen. (Die Nutzung „dieses Handy“ in den Berichten bleibt auch ohne diese Funktion auf diesem Handy.)",
  howLink:
    "Die Nutzung auf Geräten mit demselben Konto wird zusammengezählt. Auf dem Handy schauen und innerhalb von 30 Minuten auf dem Tablet weiterschauen zählt einmal.",
  howLimits:
    "TV, PC, iPhone und Wiedergabe bei ausgeschaltetem Bildschirm lassen sich nicht messen, daher bedeutet die Zahl „mindestens so oft auf gemessenen Geräten“. Trag deine Nutzung weiterhin selbst ein.",
  howRetention: (days) =>
    `Einträge werden nach ${days} Tagen gelöscht, und du kannst die Messung jederzeit ausschalten oder löschen.`,
  privacy: "Datenschutzerklärung",
  services: (names) => `Gemessene Dienste: ${names}`,
  measuring: "Messung auf diesem Gerät läuft",
  accessOff:
    "„Zugriff auf Nutzungsdaten“ ist in den Geräteeinstellungen aus, daher wird gerade nichts gemessen. Erlaube ihn erneut, um fortzufahren.",
  allowAccess: "Zugriff auf Nutzungsdaten erlauben",
  turnOff: "Messung auf diesem Gerät beenden",
  turnOffNote: "Beim Ausschalten wird auch gelöscht, was dieses Gerät hochgeladen hat.",
  otherAccount:
    "Dieses Gerät hat für ein anderes Konto gemessen. Für dieses Konto wird nichts hochgeladen, bis du es einschaltest.",
  turnOn: "Nutzungsmessung einschalten",
  waitingForAccess:
    "Erlaube in den Geräteeinstellungen den „Zugriff auf Nutzungsdaten“ für SubSlash und komm dann zurück, um das Einschalten abzuschließen.",
  androidOnly:
    "Die Messung lässt sich nur in der Android-App einschalten. iPhone und Webbrowser liefern keine Nutzungszeiten anderer Apps. Hier kannst du die in deinem Konto gesammelten Geräte sehen und löschen.",
  devices: "Gemessene Geräte",
  noDevices: "Noch hat kein Gerät Daten in dieses Konto hochgeladen.",
  thisDevice: "Dieses Gerät",
  androidDevice: (n) => `Android-Gerät ${n}`,
  deleteAllConfirm:
    "Nutzungsdaten aller Geräte dieses Kontos löschen? Andere Geräte messen weiter, ihre Daten kommen zurück, sobald die App dort geöffnet wird.",
  deleteAll: "Alle löschen",
  deleteAllButton: "Daten aller Geräte löschen",
  turnedOn: "Die Nutzungsmessung ist auf diesem Gerät eingeschaltet.",
  turnOnFailed: "Die Nutzungsmessung konnte nicht eingeschaltet werden.",
  turnedOff: "Messung auf diesem Gerät beendet und hochgeladene Daten gelöscht.",
  turnOffFailed: "Die Messung konnte nicht ausgeschaltet werden.",
  deletedAll: "Nutzungsdaten aller Geräte dieses Kontos gelöscht.",
  deleteFailed: "Die Nutzungsdaten konnten nicht gelöscht werden.",
};

export const pt: Widen<typeof ko> = {
  howTitle: "O que é medido ao ativar",
  howUpload:
    "Neste dispositivo, os horários de início e fim em que os apps dos serviços abaixo ficaram em primeiro plano são enviados para sua conta. Outros apps e o que você assistiu dentro de um app não são enviados. (O uso “deste celular” nos relatórios fica neste celular mesmo sem ativar isto.)",
  howLink:
    "O uso em dispositivos da mesma conta é contado junto. Assistir no celular e continuar no tablet em até 30 minutos conta como uma vez.",
  howLimits:
    "TV, PC, iPhone e reprodução com a tela desligada não podem ser medidos, então o número quer dizer “pelo menos isto nos dispositivos medidos”. Continue registrando você mesmo como antes.",
  howRetention: (days) =>
    `Os registros são apagados após ${days} dias, e você pode desativar ou apagar quando quiser.`,
  privacy: "Política de privacidade",
  services: (names) => `Serviços medidos: ${names}`,
  measuring: "Medindo neste dispositivo",
  accessOff:
    "O “acesso aos dados de uso” está desativado nas configurações do dispositivo, então nada está sendo medido. Permita de novo para continuar.",
  allowAccess: "Permitir acesso aos dados de uso",
  turnOff: "Parar de medir neste dispositivo",
  turnOffNote: "Desativar também apaga o que este dispositivo enviou.",
  otherAccount:
    "Este dispositivo estava medindo para outra conta. Nada é enviado para esta conta até você ativar.",
  turnOn: "Ativar medição de uso",
  waitingForAccess:
    "Permita o “acesso aos dados de uso” para o SubSlash nas configurações do dispositivo e volte para terminar de ativar.",
  androidOnly:
    "A medição só pode ser ativada no app Android. O iPhone e os navegadores não informam o tempo de uso de outros apps. Aqui você pode ver e apagar os dispositivos reunidos na sua conta.",
  devices: "Dispositivos medidos",
  noDevices: "Nenhum dispositivo enviou dados para esta conta ainda.",
  thisDevice: "Este dispositivo",
  androidDevice: (n) => `Dispositivo Android ${n}`,
  deleteAllConfirm:
    "Apagar os registros de uso de todos os dispositivos desta conta? Os outros dispositivos continuam medindo, então os registros voltam quando o app for aberto neles.",
  deleteAll: "Apagar tudo",
  deleteAllButton: "Apagar registros de todos os dispositivos",
  turnedOn: "A medição de uso está ativada neste dispositivo.",
  turnOnFailed: "Não foi possível ativar a medição de uso.",
  turnedOff: "Parou de medir neste dispositivo e apagou o que ele enviou.",
  turnOffFailed: "Não foi possível desativar a medição.",
  deletedAll: "Registros de uso de todos os dispositivos desta conta apagados.",
  deleteFailed: "Não foi possível apagar os registros de uso.",
};
