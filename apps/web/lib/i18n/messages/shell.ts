import type { Widen } from "../types";

/** 모든 화면에 걸리는 틀: 상단 바, 하단 탭, 계정 메뉴, 화면 모드, 샘플 체험 띠, 푸터. */
export const ko = {
  nav: {
    label: "주요 메뉴",
    dashboard: "대시보드",
    subs: "내 구독",
    /** 하단 탭은 칸이 좁아 '내 구독' 대신 이 이름을 쓴다. */
    subsTab: "구독 관리",
    report: "리포트",
    settings: "설정",
  },
  theme: {
    label: "화면 모드",
    current: (label: string) => `화면 모드 (${label})`,
    system: "자동",
    systemDetail: "기기 설정 따라",
    light: "라이트",
    dark: "다크",
  },
  account: {
    menu: "계정 메뉴",
    menuFor: (username: string) => `계정 메뉴 (${username})`,
    signedOut: "로그인하지 않음",
    storedOnDevice: "기록은 이 기기에 저장돼요.",
    me: "내 정보",
    loginOrSignup: "로그인 / 회원가입",
    backup: "데이터 백업",
    syncHint: "로그인하면 여러 기기에서 같은 기록을 쓸 수 있어요.",
    help: "도움말 · 문의",
    logout: "로그아웃",
  },
  demo: {
    title: "샘플로 체험하는 중입니다.",
    body: (minutes: number) =>
      `지금 보이는 구독은 예시이고 내 구독과 섞이지 않습니다. 여기서 바꾼 내용은 저장되지 않고, 새로고침하거나 ${minutes}분이 지나면 체험이 끝납니다.`,
    end: "체험 끝내기",
  },
  footer: {
    help: "도움말 · 문의",
    privacy: "개인정보처리방침",
    getApp: "Google Play에서 앱 받기",
    trademarks:
      "서비스 이름과 로고는 각 소유자의 상표이며, 구독을 알아볼 수 있게 쓸 뿐입니다. SubSlash는 해당 서비스와 제휴하거나 보증받지 않았습니다.",
  },
  /** 앱의 떠 있는 + 버튼과 그 메뉴. */
  addMenu: {
    title: "구독 추가",
    manual: "직접 등록",
    manualDetail: "서비스를 골라 금액·결제일을 넣어요",
    mail: "결제 메일에서 찾기",
    mailDetail: "Gmail의 결제 메일로 구독을 찾아요",
    paste: "결제 문자 붙여넣기",
    pasteDetail: "카드 결제 문자를 붙여 넣어요",
    phone: "폰 사용 기록에서 찾기",
    phoneDetail: "넷플릭스·티빙 같은 OTT를 이 폰에서 쓴 기록으로 찾아요",
  },
  /** 여러 화면이 함께 쓰는 공통 부품(확인 창·복사 안내·기다림 표시). */
  common: {
    confirm: "확인",
    cancel: "취소",
    close: "닫기",
    loading: "불러오는 중",
    copyFallback: "자동으로 복사하지 못했습니다. 아래 글을 길게 눌러 복사해주세요.",
    /** 번역하지 않은 원문 옆의 표시. 원문 언어 화면에서는 보이지 않는다(SourceTextNote). */
    sourceText: "원문",
    /** 한국어가 아닌 화면에서 서비스 목록 요금 옆의 표시(KoreanPriceNote). 목록 요금은 한국에서 확인한 값이라 언어를 바꿔도 옮기지 않는다. */
    koreanPrice: "요금은 한국에서 확인한 값이에요. 다르게 낸다면 실제로 내는 금액을 적어 주세요.",
  },
  /** 없는 주소(app/not-found). Next.js 기본 화면은 영어 한 줄뿐이고 돌아갈 길이 없었다. */
  notFound: {
    title: "페이지를 찾을 수 없어요",
    body: "주소가 바뀌었거나 없는 페이지예요. 구독 기록은 그대로 있어요.",
    home: "처음으로",
    dashboard: "대시보드로",
  },
  app: {
    sheetClose: "닫기",
    exitHint: "한 번 더 누르면 앱이 종료돼요",
  },
};

export const en: Widen<typeof ko> = {
  nav: {
    label: "Main menu",
    dashboard: "Dashboard",
    subs: "My subscriptions",
    subsTab: "Subscriptions",
    report: "Report",
    settings: "Settings",
  },
  theme: {
    label: "Appearance",
    current: (label) => `Appearance (${label})`,
    system: "Auto",
    systemDetail: "Follows device",
    light: "Light",
    dark: "Dark",
  },
  account: {
    menu: "Account menu",
    menuFor: (username) => `Account menu (${username})`,
    signedOut: "Not signed in",
    storedOnDevice: "Your records are saved on this device.",
    me: "My account",
    loginOrSignup: "Log in / Sign up",
    backup: "Data backup",
    syncHint: "Log in to use the same records on several devices.",
    help: "Help & contact",
    logout: "Log out",
  },
  demo: {
    title: "You're trying SubSlash with sample data.",
    body: (minutes) =>
      `The subscriptions shown are examples and are kept apart from yours. Changes here aren't saved, and the trial ends when you refresh or after ${minutes} minutes.`,
    end: "End trial",
  },
  footer: {
    help: "Help & contact",
    privacy: "Privacy policy",
    getApp: "Get the app on Google Play",
    trademarks:
      "Service names and logos are trademarks of their owners and are used only to identify subscriptions. SubSlash is not affiliated with or endorsed by these services.",
  },
  addMenu: {
    title: "Add subscription",
    manual: "Add manually",
    manualDetail: "Pick a service and enter the amount and billing day",
    mail: "Find in payment emails",
    mailDetail: "Find subscriptions from payment emails in Gmail",
    paste: "Paste a payment text",
    pasteDetail: "Paste a card payment text message",
    phone: "Find from phone usage",
    phoneDetail: "Find streaming apps like Netflix or TVING you've used on this phone",
  },
  common: {
    confirm: "OK",
    cancel: "Cancel",
    close: "Close",
    loading: "Loading",
    copyFallback: "Couldn't copy automatically. Press and hold the text below to copy it.",
    sourceText:
      "Original (Korean), not translated: we keep it exactly as we checked it on the service.",
    koreanPrice:
      "Prices are as checked for Korea. If you pay a different amount, enter what you actually pay.",
  },
  notFound: {
    title: "Page not found",
    body: "The address changed or the page doesn't exist. Your subscription records are untouched.",
    home: "Home",
    dashboard: "Go to dashboard",
  },
  app: {
    sheetClose: "Close",
    exitHint: "Press back again to exit the app",
  },
};

export const zh: Widen<typeof ko> = {
  nav: {
    label: "主菜单",
    dashboard: "仪表板",
    subs: "我的订阅",
    subsTab: "订阅",
    report: "报告",
    settings: "设置",
  },
  theme: {
    label: "显示模式",
    current: (label) => `显示模式（${label}）`,
    system: "自动",
    systemDetail: "跟随设备",
    light: "浅色",
    dark: "深色",
  },
  account: {
    menu: "账户菜单",
    menuFor: (username) => `账户菜单（${username}）`,
    signedOut: "未登录",
    storedOnDevice: "你的记录保存在这台设备上。",
    me: "我的信息",
    loginOrSignup: "登录 / 注册",
    backup: "数据备份",
    syncHint: "登录后可以在多台设备上使用同一份记录。",
    help: "帮助与咨询",
    logout: "退出登录",
  },
  demo: {
    title: "你正在用示例数据体验 SubSlash。",
    body: (minutes) =>
      `显示的订阅都是示例，不会和你的订阅混在一起。这里的更改不会保存，刷新或 ${minutes} 分钟后体验就会结束。`,
    end: "结束体验",
  },
  footer: {
    help: "帮助与咨询",
    privacy: "隐私政策",
    getApp: "在 Google Play 下载应用",
    trademarks:
      "服务名称和标志是其所有者的商标，仅用于识别订阅。SubSlash 与这些服务没有合作关系，也未获得其认可。",
  },
  addMenu: {
    title: "添加订阅",
    manual: "手动添加",
    manualDetail: "选择服务并输入金额和扣款日",
    mail: "从付款邮件中查找",
    mailDetail: "从 Gmail 的付款邮件中查找订阅",
    paste: "粘贴付款短信",
    pasteDetail: "粘贴银行卡付款短信",
    phone: "从手机使用记录中查找",
    phoneDetail: "查找这部手机上用过的 Netflix、TVING 等视频应用",
  },
  common: {
    confirm: "确定",
    cancel: "取消",
    close: "关闭",
    loading: "加载中",
    copyFallback: "无法自动复制。请长按下面的文字进行复制。",
    sourceText: "原文（韩语），未翻译：我们保留了在服务上确认过的原样内容。",
    koreanPrice: "价格为在韩国确认的金额。如果你支付的金额不同，请填写实际支付的金额。",
  },
  notFound: {
    title: "找不到页面",
    body: "地址已更改或页面不存在。你的订阅记录不受影响。",
    home: "返回首页",
    dashboard: "前往仪表板",
  },
  app: { sheetClose: "关闭", exitHint: "再按一次返回键退出应用" },
};

export const ja: Widen<typeof ko> = {
  nav: {
    label: "メインメニュー",
    dashboard: "ダッシュボード",
    subs: "マイサブスク",
    subsTab: "サブスク",
    report: "レポート",
    settings: "設定",
  },
  theme: {
    label: "表示モード",
    current: (label) => `表示モード（${label}）`,
    system: "自動",
    systemDetail: "端末に合わせる",
    light: "ライト",
    dark: "ダーク",
  },
  account: {
    menu: "アカウントメニュー",
    menuFor: (username) => `アカウントメニュー（${username}）`,
    signedOut: "ログインしていません",
    storedOnDevice: "記録はこの端末に保存されています。",
    me: "マイ情報",
    loginOrSignup: "ログイン / 会員登録",
    backup: "データのバックアップ",
    syncHint: "ログインすると複数の端末で同じ記録を使えます。",
    help: "ヘルプ・お問い合わせ",
    logout: "ログアウト",
  },
  demo: {
    title: "サンプルデータで SubSlash を体験中です。",
    body: (minutes) =>
      `表示されているサブスクは例で、あなたのサブスクとは混ざりません。ここでの変更は保存されず、再読み込みするか ${minutes} 分たつと体験が終わります。`,
    end: "体験を終える",
  },
  footer: {
    help: "ヘルプ・お問い合わせ",
    privacy: "プライバシーポリシー",
    getApp: "Google Play でアプリを入手",
    trademarks:
      "サービス名とロゴは各所有者の商標で、サブスクを見分けるためだけに使っています。SubSlash はこれらのサービスと提携しておらず、保証も受けていません。",
  },
  addMenu: {
    title: "サブスクを追加",
    manual: "手動で追加",
    manualDetail: "サービスを選んで金額と支払日を入力",
    mail: "支払いメールから探す",
    mailDetail: "Gmail の支払いメールからサブスクを探す",
    paste: "支払いのメッセージを貼り付け",
    pasteDetail: "カード決済のメッセージを貼り付け",
    phone: "スマホの利用記録から探す",
    phoneDetail: "このスマホで使った Netflix・TVING などの動画アプリを探す",
  },
  common: {
    confirm: "OK",
    cancel: "キャンセル",
    close: "閉じる",
    loading: "読み込み中",
    copyFallback: "自動でコピーできませんでした。下の文章を長押ししてコピーしてください。",
    sourceText: "原文（韓国語）・未翻訳: サービスで確認したとおりの内容をそのまま載せています。",
    koreanPrice:
      "料金は韓国で確認した金額です。支払い額が違う場合は、実際に支払っている金額を入力してください。",
  },
  notFound: {
    title: "ページが見つかりません",
    body: "アドレスが変わったか、存在しないページです。サブスクの記録はそのままです。",
    home: "トップへ",
    dashboard: "ダッシュボードへ",
  },
  app: { sheetClose: "閉じる", exitHint: "もう一度戻るを押すとアプリを終了します" },
};

export const vi: Widen<typeof ko> = {
  nav: {
    label: "Menu chính",
    dashboard: "Bảng điều khiển",
    subs: "Gói đăng ký của tôi",
    subsTab: "Gói đăng ký",
    report: "Báo cáo",
    settings: "Cài đặt",
  },
  theme: {
    label: "Chế độ hiển thị",
    current: (label) => `Chế độ hiển thị (${label})`,
    system: "Tự động",
    systemDetail: "Theo thiết bị",
    light: "Sáng",
    dark: "Tối",
  },
  account: {
    menu: "Menu tài khoản",
    menuFor: (username) => `Menu tài khoản (${username})`,
    signedOut: "Chưa đăng nhập",
    storedOnDevice: "Dữ liệu của bạn được lưu trên thiết bị này.",
    me: "Thông tin của tôi",
    loginOrSignup: "Đăng nhập / Đăng ký",
    backup: "Sao lưu dữ liệu",
    syncHint: "Đăng nhập để dùng cùng dữ liệu trên nhiều thiết bị.",
    help: "Trợ giúp & liên hệ",
    logout: "Đăng xuất",
  },
  demo: {
    title: "Bạn đang dùng thử SubSlash với dữ liệu mẫu.",
    body: (minutes) =>
      `Các gói hiển thị là ví dụ và không trộn với gói của bạn. Thay đổi ở đây không được lưu, và bản dùng thử kết thúc khi bạn tải lại trang hoặc sau ${minutes} phút.`,
    end: "Kết thúc dùng thử",
  },
  footer: {
    help: "Trợ giúp & liên hệ",
    privacy: "Chính sách quyền riêng tư",
    getApp: "Tải ứng dụng trên Google Play",
    trademarks:
      "Tên và logo dịch vụ là nhãn hiệu của chủ sở hữu, chỉ được dùng để nhận diện gói đăng ký. SubSlash không liên kết hay được các dịch vụ này bảo trợ.",
  },
  addMenu: {
    title: "Thêm gói đăng ký",
    manual: "Thêm thủ công",
    manualDetail: "Chọn dịch vụ rồi nhập số tiền và ngày thanh toán",
    mail: "Tìm trong email thanh toán",
    mailDetail: "Tìm gói đăng ký từ email thanh toán trong Gmail",
    paste: "Dán tin nhắn thanh toán",
    pasteDetail: "Dán tin nhắn thanh toán thẻ",
    phone: "Tìm từ dữ liệu sử dụng điện thoại",
    phoneDetail: "Tìm ứng dụng video như Netflix, TVING bạn đã dùng trên điện thoại này",
  },
  common: {
    confirm: "OK",
    cancel: "Hủy",
    close: "Đóng",
    loading: "Đang tải",
    copyFallback: "Không thể tự động sao chép. Hãy nhấn giữ đoạn văn bên dưới để sao chép.",
    sourceText:
      "Bản gốc (tiếng Hàn), chưa dịch: chúng tôi giữ nguyên nội dung đã kiểm tra trên dịch vụ.",
    koreanPrice:
      "Giá là mức đã kiểm tra tại Hàn Quốc. Nếu bạn trả số tiền khác, hãy nhập số tiền bạn thực sự trả.",
  },
  notFound: {
    title: "Không tìm thấy trang",
    body: "Địa chỉ đã thay đổi hoặc trang không tồn tại. Dữ liệu gói đăng ký của bạn vẫn còn nguyên.",
    home: "Trang chủ",
    dashboard: "Đến bảng điều khiển",
  },
  app: { sheetClose: "Đóng", exitHint: "Nhấn quay lại lần nữa để thoát ứng dụng" },
};

export const fr: Widen<typeof ko> = {
  nav: {
    label: "Menu principal",
    dashboard: "Tableau de bord",
    subs: "Mes abonnements",
    subsTab: "Abonnements",
    report: "Rapport",
    settings: "Réglages",
  },
  theme: {
    label: "Apparence",
    current: (label) => `Apparence (${label})`,
    system: "Auto",
    systemDetail: "Suit l'appareil",
    light: "Clair",
    dark: "Sombre",
  },
  account: {
    menu: "Menu du compte",
    menuFor: (username) => `Menu du compte (${username})`,
    signedOut: "Non connecté",
    storedOnDevice: "Vos données sont enregistrées sur cet appareil.",
    me: "Mon compte",
    loginOrSignup: "Connexion / Inscription",
    backup: "Sauvegarde des données",
    syncHint: "Connectez-vous pour utiliser les mêmes données sur plusieurs appareils.",
    help: "Aide et contact",
    logout: "Se déconnecter",
  },
  demo: {
    title: "Vous essayez SubSlash avec des données d'exemple.",
    body: (minutes) =>
      `Les abonnements affichés sont des exemples, séparés des vôtres. Les changements ne sont pas enregistrés, et l'essai se termine si vous actualisez ou après ${minutes} minutes.`,
    end: "Terminer l'essai",
  },
  footer: {
    help: "Aide et contact",
    privacy: "Politique de confidentialité",
    getApp: "Télécharger l’app sur Google Play",
    trademarks:
      "Les noms et logos des services sont des marques de leurs propriétaires, utilisés uniquement pour identifier les abonnements. SubSlash n'est ni affilié à ces services ni approuvé par eux.",
  },
  addMenu: {
    title: "Ajouter un abonnement",
    manual: "Ajouter manuellement",
    manualDetail: "Choisissez un service et saisissez le montant et le jour de paiement",
    mail: "Trouver dans les e-mails de paiement",
    mailDetail: "Trouver des abonnements dans les e-mails de paiement Gmail",
    paste: "Coller un SMS de paiement",
    pasteDetail: "Collez un SMS de paiement par carte",
    phone: "Trouver via l'utilisation du téléphone",
    phoneDetail:
      "Trouvez les applis de streaming comme Netflix ou TVING utilisées sur ce téléphone",
  },
  common: {
    confirm: "OK",
    cancel: "Annuler",
    close: "Fermer",
    loading: "Chargement",
    copyFallback:
      "Impossible de copier automatiquement. Appuyez longuement sur le texte ci-dessous pour le copier.",
    sourceText:
      "Texte original (coréen), non traduit : nous le gardons tel que nous l'avons vérifié sur le service.",
    koreanPrice:
      "Les prix sont ceux vérifiés pour la Corée. Si vous payez un autre montant, saisissez ce que vous payez réellement.",
  },
  notFound: {
    title: "Page introuvable",
    body: "L'adresse a changé ou la page n'existe pas. Vos abonnements enregistrés sont intacts.",
    home: "Accueil",
    dashboard: "Aller au tableau de bord",
  },
  app: {
    sheetClose: "Fermer",
    exitHint: "Appuyez à nouveau sur retour pour quitter l'application",
  },
};

export const es: Widen<typeof ko> = {
  nav: {
    label: "Menú principal",
    dashboard: "Panel",
    subs: "Mis suscripciones",
    subsTab: "Suscripciones",
    report: "Informe",
    settings: "Ajustes",
  },
  theme: {
    label: "Apariencia",
    current: (label) => `Apariencia (${label})`,
    system: "Automático",
    systemDetail: "Según el dispositivo",
    light: "Claro",
    dark: "Oscuro",
  },
  account: {
    menu: "Menú de la cuenta",
    menuFor: (username) => `Menú de la cuenta (${username})`,
    signedOut: "Sin iniciar sesión",
    storedOnDevice: "Tus registros se guardan en este dispositivo.",
    me: "Mi cuenta",
    loginOrSignup: "Iniciar sesión / Registrarse",
    backup: "Copia de seguridad",
    syncHint: "Inicia sesión para usar los mismos registros en varios dispositivos.",
    help: "Ayuda y contacto",
    logout: "Cerrar sesión",
  },
  demo: {
    title: "Estás probando SubSlash con datos de ejemplo.",
    body: (minutes) =>
      `Las suscripciones mostradas son ejemplos y no se mezclan con las tuyas. Los cambios no se guardan, y la prueba termina al recargar o tras ${minutes} minutos.`,
    end: "Terminar prueba",
  },
  footer: {
    help: "Ayuda y contacto",
    privacy: "Política de privacidad",
    getApp: "Descarga la app en Google Play",
    trademarks:
      "Los nombres y logotipos de los servicios son marcas de sus propietarios y se usan solo para identificar suscripciones. SubSlash no está afiliado ni respaldado por estos servicios.",
  },
  addMenu: {
    title: "Añadir suscripción",
    manual: "Añadir a mano",
    manualDetail: "Elige un servicio e introduce el importe y el día de cobro",
    mail: "Buscar en correos de pago",
    mailDetail: "Busca suscripciones en los correos de pago de Gmail",
    paste: "Pegar un SMS de pago",
    pasteDetail: "Pega un SMS de pago con tarjeta",
    phone: "Buscar en el uso del móvil",
    phoneDetail: "Busca apps de vídeo como Netflix o TVING que hayas usado en este móvil",
  },
  common: {
    confirm: "Aceptar",
    cancel: "Cancelar",
    close: "Cerrar",
    loading: "Cargando",
    copyFallback:
      "No se pudo copiar automáticamente. Mantén pulsado el texto de abajo para copiarlo.",
    sourceText:
      "Texto original (coreano), sin traducir: lo mantenemos tal como lo comprobamos en el servicio.",
    koreanPrice:
      "Los precios son los comprobados para Corea. Si pagas otro importe, introduce lo que pagas realmente.",
  },
  notFound: {
    title: "Página no encontrada",
    body: "La dirección cambió o la página no existe. Tus suscripciones guardadas siguen intactas.",
    home: "Inicio",
    dashboard: "Ir al panel",
  },
  app: { sheetClose: "Cerrar", exitHint: "Pulsa atrás otra vez para salir de la app" },
};

export const de: Widen<typeof ko> = {
  nav: {
    label: "Hauptmenü",
    dashboard: "Übersicht",
    subs: "Meine Abos",
    subsTab: "Abos",
    report: "Bericht",
    settings: "Einstellungen",
  },
  theme: {
    label: "Darstellung",
    current: (label) => `Darstellung (${label})`,
    system: "Automatisch",
    systemDetail: "Wie das Gerät",
    light: "Hell",
    dark: "Dunkel",
  },
  account: {
    menu: "Kontomenü",
    menuFor: (username) => `Kontomenü (${username})`,
    signedOut: "Nicht angemeldet",
    storedOnDevice: "Deine Daten sind auf diesem Gerät gespeichert.",
    me: "Mein Konto",
    loginOrSignup: "Anmelden / Registrieren",
    backup: "Datensicherung",
    syncHint: "Melde dich an, um dieselben Daten auf mehreren Geräten zu nutzen.",
    help: "Hilfe & Kontakt",
    logout: "Abmelden",
  },
  demo: {
    title: "Du testest SubSlash mit Beispieldaten.",
    body: (minutes) =>
      `Die angezeigten Abos sind Beispiele und werden nicht mit deinen vermischt. Änderungen werden nicht gespeichert, und der Test endet beim Neuladen oder nach ${minutes} Minuten.`,
    end: "Test beenden",
  },
  footer: {
    help: "Hilfe & Kontakt",
    privacy: "Datenschutzerklärung",
    getApp: "App bei Google Play laden",
    trademarks:
      "Namen und Logos der Dienste sind Marken ihrer Inhaber und dienen nur zur Erkennung der Abos. SubSlash ist mit diesen Diensten weder verbunden noch von ihnen unterstützt.",
  },
  addMenu: {
    title: "Abo hinzufügen",
    manual: "Manuell hinzufügen",
    manualDetail: "Dienst wählen und Betrag sowie Abbuchungstag eingeben",
    mail: "In Zahlungs-E-Mails suchen",
    mailDetail: "Abos in den Zahlungs-E-Mails in Gmail finden",
    paste: "Zahlungs-SMS einfügen",
    pasteDetail: "Eine Kartenzahlungs-SMS einfügen",
    phone: "Aus der Handynutzung suchen",
    phoneDetail:
      "Streaming-Apps wie Netflix oder TVING finden, die du auf diesem Handy genutzt hast",
  },
  common: {
    confirm: "OK",
    cancel: "Abbrechen",
    close: "Schließen",
    loading: "Wird geladen",
    copyFallback:
      "Automatisches Kopieren fehlgeschlagen. Halte den Text unten gedrückt, um ihn zu kopieren.",
    sourceText:
      "Original (Koreanisch), nicht übersetzt: Wir übernehmen es genau so, wie wir es beim Dienst geprüft haben.",
    koreanPrice:
      "Die Preise wurden für Korea geprüft. Wenn du einen anderen Betrag zahlst, gib ein, was du tatsächlich zahlst.",
  },
  notFound: {
    title: "Seite nicht gefunden",
    body: "Die Adresse hat sich geändert oder die Seite gibt es nicht. Deine Abo-Daten bleiben unverändert.",
    home: "Startseite",
    dashboard: "Zum Dashboard",
  },
  app: { sheetClose: "Schließen", exitHint: "Noch einmal Zurück drücken, um die App zu beenden" },
};

export const pt: Widen<typeof ko> = {
  nav: {
    label: "Menu principal",
    dashboard: "Painel",
    subs: "Minhas assinaturas",
    subsTab: "Assinaturas",
    report: "Relatório",
    settings: "Configurações",
  },
  theme: {
    label: "Aparência",
    current: (label) => `Aparência (${label})`,
    system: "Automático",
    systemDetail: "Segue o dispositivo",
    light: "Claro",
    dark: "Escuro",
  },
  account: {
    menu: "Menu da conta",
    menuFor: (username) => `Menu da conta (${username})`,
    signedOut: "Não conectado",
    storedOnDevice: "Seus registros estão salvos neste dispositivo.",
    me: "Minha conta",
    loginOrSignup: "Entrar / Cadastrar",
    backup: "Backup de dados",
    syncHint: "Entre para usar os mesmos registros em vários dispositivos.",
    help: "Ajuda e contato",
    logout: "Sair",
  },
  demo: {
    title: "Você está testando o SubSlash com dados de exemplo.",
    body: (minutes) =>
      `As assinaturas mostradas são exemplos e não se misturam com as suas. As mudanças não são salvas, e o teste termina ao atualizar a página ou depois de ${minutes} minutos.`,
    end: "Encerrar teste",
  },
  footer: {
    help: "Ajuda e contato",
    privacy: "Política de privacidade",
    getApp: "Baixe o app no Google Play",
    trademarks:
      "Os nomes e logotipos dos serviços são marcas de seus donos e são usados só para identificar assinaturas. O SubSlash não é afiliado nem endossado por esses serviços.",
  },
  addMenu: {
    title: "Adicionar assinatura",
    manual: "Adicionar manualmente",
    manualDetail: "Escolha um serviço e informe o valor e o dia de cobrança",
    mail: "Buscar nos e-mails de pagamento",
    mailDetail: "Encontre assinaturas nos e-mails de pagamento do Gmail",
    paste: "Colar SMS de pagamento",
    pasteDetail: "Cole um SMS de pagamento com cartão",
    phone: "Buscar no uso do celular",
    phoneDetail: "Encontre apps de vídeo como Netflix ou TVING usados neste celular",
  },
  common: {
    confirm: "OK",
    cancel: "Cancelar",
    close: "Fechar",
    loading: "Carregando",
    copyFallback:
      "Não foi possível copiar automaticamente. Toque e segure o texto abaixo para copiar.",
    sourceText:
      "Texto original (coreano), sem tradução: mantemos exatamente como conferimos no serviço.",
    koreanPrice:
      "Os preços são os conferidos para a Coreia. Se você paga outro valor, informe o que paga de fato.",
  },
  notFound: {
    title: "Página não encontrada",
    body: "O endereço mudou ou a página não existe. Seus registros de assinaturas continuam intactos.",
    home: "Início",
    dashboard: "Ir para o painel",
  },
  app: { sheetClose: "Fechar", exitHint: "Toque em voltar de novo para sair do app" },
};
