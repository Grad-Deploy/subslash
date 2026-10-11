import { PAYMENT_METHOD_OPTIONS, type PaymentMethodOption } from "@subslash/shared";
import { translationFor, type Locale, type Translations } from "./i18n/config";

type PaymentMethodText = Pick<PaymentMethodOption, "label" | "shortName" | "guide">;

/**
 * 결제 수단 목록(`PAYMENT_METHOD_OPTIONS`)의 영어 화면 문구. 구독에는 `value`만 저장되므로 보여 줄 때 바꾼다.
 * 해지 경로의 메뉴 이름은 각 회사가 영어 화면에서 쓰는 이름을 따른다. 목록에 결제 수단을 더하면 여기도
 * 더한다(테스트가 확인한다).
 */
export const PAYMENT_METHODS_EN: Record<string, PaymentMethodText> = {
  credit_card: { label: "Credit / debit card" },
  kakaopay: {
    label: "KakaoPay auto-pay",
    shortName: "KakaoPay",
    guide: "KakaoTalk > More > KakaoPay > Payments > Manage auto-pay > cancel the service",
  },
  naverpay: {
    label: "Naver Pay recurring payment",
    shortName: "Naver Pay",
    guide: "Naver Pay home > My wallet > Recurring payments > cancel the service",
  },
  apple_iap: {
    label: "Apple App Store in-app purchase",
    shortName: "App Store",
    guide:
      "Settings > your name (Apple ID) > Subscriptions > choose the subscription > Cancel Subscription",
  },
  google_play: {
    label: "Google Play subscription",
    shortName: "Google Play",
    guide: "Google Play app or web > Profile > Payments & subscriptions > Subscriptions > Cancel",
  },
  telecom: {
    label: "Carrier bundle / add-on service",
    guide: "Cancel from the add-on services menu of your carrier's app (SKT T world, KT, LG U+)",
  },
  other: { label: "Other payment method" },
};

/** 중국어(간체). 애플·구글 메뉴는 그 언어판의 메뉴 이름, 카카오·네이버 메뉴는 영어판과 같은 이름이다. */
const PAYMENT_METHODS_ZH: Record<string, PaymentMethodText> = {
  credit_card: { label: "信用卡 / 借记卡" },
  kakaopay: {
    label: "KakaoPay 自动支付",
    shortName: "KakaoPay",
    guide: "KakaoTalk > More > KakaoPay > Payments > Manage auto-pay > 取消该服务",
  },
  naverpay: {
    label: "Naver Pay 定期支付",
    shortName: "Naver Pay",
    guide: "Naver Pay 首页 > My wallet > Recurring payments > 取消该服务",
  },
  apple_iap: {
    label: "Apple App Store 应用内购买",
    shortName: "App Store",
    guide: "设置 > 你的姓名（Apple ID）> 订阅 > 选择订阅 > 取消订阅",
  },
  google_play: {
    label: "Google Play 订阅",
    shortName: "Google Play",
    guide: "Google Play 应用或网页 > 个人资料 > 付款和订阅 > 订阅 > 取消",
  },
  telecom: {
    label: "运营商套餐 / 附加服务",
    guide: "在运营商应用（SKT T world、KT、LG U+）的附加服务菜单中取消",
  },
  other: { label: "其他支付方式" },
};

/** 일본어. */
const PAYMENT_METHODS_JA: Record<string, PaymentMethodText> = {
  credit_card: { label: "クレジットカード / デビットカード" },
  kakaopay: {
    label: "KakaoPay 自動支払い",
    shortName: "KakaoPay",
    guide: "KakaoTalk > More > KakaoPay > Payments > Manage auto-pay > サービスを解約",
  },
  naverpay: {
    label: "Naver Pay 定期決済",
    shortName: "Naver Pay",
    guide: "Naver Pay ホーム > My wallet > Recurring payments > サービスを解約",
  },
  apple_iap: {
    label: "Apple App Store アプリ内課金",
    shortName: "App Store",
    guide:
      "設定 > ユーザ名（Apple ID）> サブスクリプション > サブスクリプションを選択 > サブスクリプションをキャンセルする",
  },
  google_play: {
    label: "Google Play 定期購入",
    shortName: "Google Play",
    guide: "Google Play アプリまたはウェブ > プロフィール > お支払いと定期購入 > 定期購入 > 解約",
  },
  telecom: {
    label: "通信会社のセット / 付加サービス",
    guide: "通信会社のアプリ（SKT T world、KT、LG U+）の付加サービスメニューから解約",
  },
  other: { label: "その他の支払い方法" },
};

/** 베트남어. */
const PAYMENT_METHODS_VI: Record<string, PaymentMethodText> = {
  credit_card: { label: "Thẻ tín dụng / thẻ ghi nợ" },
  kakaopay: {
    label: "Thanh toán tự động KakaoPay",
    shortName: "KakaoPay",
    guide: "KakaoTalk > More > KakaoPay > Payments > Manage auto-pay > hủy dịch vụ",
  },
  naverpay: {
    label: "Thanh toán định kỳ Naver Pay",
    shortName: "Naver Pay",
    guide: "Trang chủ Naver Pay > My wallet > Recurring payments > hủy dịch vụ",
  },
  apple_iap: {
    label: "Mua trong ứng dụng Apple App Store",
    shortName: "App Store",
    guide: "Cài đặt > tên của bạn (Apple ID) > Đăng ký > chọn gói đăng ký > Hủy đăng ký",
  },
  google_play: {
    label: "Gói đăng ký Google Play",
    shortName: "Google Play",
    guide:
      "Ứng dụng hoặc web Google Play > Hồ sơ > Thanh toán và gói thuê bao > Gói thuê bao > Hủy",
  },
  telecom: {
    label: "Gói của nhà mạng / dịch vụ bổ sung",
    guide: "Hủy trong menu dịch vụ bổ sung của ứng dụng nhà mạng (SKT T world, KT, LG U+)",
  },
  other: { label: "Phương thức thanh toán khác" },
};

/** 프랑스어. */
const PAYMENT_METHODS_FR: Record<string, PaymentMethodText> = {
  credit_card: { label: "Carte de crédit / de débit" },
  kakaopay: {
    label: "Prélèvement automatique KakaoPay",
    shortName: "KakaoPay",
    guide: "KakaoTalk > More > KakaoPay > Payments > Manage auto-pay > résilier le service",
  },
  naverpay: {
    label: "Paiement récurrent Naver Pay",
    shortName: "Naver Pay",
    guide: "Accueil Naver Pay > My wallet > Recurring payments > résilier le service",
  },
  apple_iap: {
    label: "Achat intégré Apple App Store",
    shortName: "App Store",
    guide:
      "Réglages > votre nom (Apple ID) > Abonnements > choisir l'abonnement > Annuler l'abonnement",
  },
  google_play: {
    label: "Abonnement Google Play",
    shortName: "Google Play",
    guide: "Appli ou site Google Play > Profil > Paiements et abonnements > Abonnements > Résilier",
  },
  telecom: {
    label: "Offre groupée / option de l'opérateur",
    guide:
      "Résiliez depuis le menu des options de l'appli de votre opérateur (SKT T world, KT, LG U+)",
  },
  other: { label: "Autre moyen de paiement" },
};

/** 스페인어. */
const PAYMENT_METHODS_ES: Record<string, PaymentMethodText> = {
  credit_card: { label: "Tarjeta de crédito / débito" },
  kakaopay: {
    label: "Pago automático de KakaoPay",
    shortName: "KakaoPay",
    guide: "KakaoTalk > More > KakaoPay > Payments > Manage auto-pay > cancelar el servicio",
  },
  naverpay: {
    label: "Pago recurrente de Naver Pay",
    shortName: "Naver Pay",
    guide: "Inicio de Naver Pay > My wallet > Recurring payments > cancelar el servicio",
  },
  apple_iap: {
    label: "Compra integrada de Apple App Store",
    shortName: "App Store",
    guide:
      "Ajustes > tu nombre (Apple ID) > Suscripciones > elige la suscripción > Cancelar suscripción",
  },
  google_play: {
    label: "Suscripción de Google Play",
    shortName: "Google Play",
    guide: "App o web de Google Play > Perfil > Pagos y suscripciones > Suscripciones > Cancelar",
  },
  telecom: {
    label: "Paquete / servicio adicional del operador",
    guide:
      "Cancela desde el menú de servicios adicionales de la app de tu operador (SKT T world, KT, LG U+)",
  },
  other: { label: "Otro método de pago" },
};

/** 독일어. */
const PAYMENT_METHODS_DE: Record<string, PaymentMethodText> = {
  credit_card: { label: "Kredit- / Debitkarte" },
  kakaopay: {
    label: "KakaoPay-Lastschrift",
    shortName: "KakaoPay",
    guide: "KakaoTalk > More > KakaoPay > Payments > Manage auto-pay > Dienst kündigen",
  },
  naverpay: {
    label: "Naver Pay wiederkehrende Zahlung",
    shortName: "Naver Pay",
    guide: "Naver Pay Start > My wallet > Recurring payments > Dienst kündigen",
  },
  apple_iap: {
    label: "In-App-Kauf im Apple App Store",
    shortName: "App Store",
    guide: "Einstellungen > dein Name (Apple-ID) > Abonnements > Abo wählen > Abo kündigen",
  },
  google_play: {
    label: "Google Play-Abo",
    shortName: "Google Play",
    guide: "Google Play-App oder -Web > Profil > Zahlungen & Abos > Abos > Kündigen",
  },
  telecom: {
    label: "Mobilfunk-Paket / Zusatzdienst",
    guide: "Kündige im Zusatzdienst-Menü der App deines Anbieters (SKT T world, KT, LG U+)",
  },
  other: { label: "Andere Zahlungsmethode" },
};

/** 포르투갈어(브라질). */
const PAYMENT_METHODS_PT: Record<string, PaymentMethodText> = {
  credit_card: { label: "Cartão de crédito / débito" },
  kakaopay: {
    label: "Pagamento automático KakaoPay",
    shortName: "KakaoPay",
    guide: "KakaoTalk > More > KakaoPay > Payments > Manage auto-pay > cancelar o serviço",
  },
  naverpay: {
    label: "Pagamento recorrente Naver Pay",
    shortName: "Naver Pay",
    guide: "Início do Naver Pay > My wallet > Recurring payments > cancelar o serviço",
  },
  apple_iap: {
    label: "Compra no app pela Apple App Store",
    shortName: "App Store",
    guide:
      "Ajustes > seu nome (Apple ID) > Assinaturas > escolha a assinatura > Cancelar Assinatura",
  },
  google_play: {
    label: "Assinatura do Google Play",
    shortName: "Google Play",
    guide:
      "App ou site do Google Play > Perfil > Pagamentos e assinaturas > Assinaturas > Cancelar",
  },
  telecom: {
    label: "Pacote / serviço adicional da operadora",
    guide:
      "Cancele no menu de serviços adicionais do app da sua operadora (SKT T world, KT, LG U+)",
  },
  other: { label: "Outra forma de pagamento" },
};

/** 원문이 아닌 언어의 결제 수단 문구. */
const PAYMENT_METHODS: Translations<Record<string, PaymentMethodText>> = {
  en: PAYMENT_METHODS_EN,
  zh: PAYMENT_METHODS_ZH,
  ja: PAYMENT_METHODS_JA,
  vi: PAYMENT_METHODS_VI,
  fr: PAYMENT_METHODS_FR,
  es: PAYMENT_METHODS_ES,
  de: PAYMENT_METHODS_DE,
  pt: PAYMENT_METHODS_PT,
};

/** 지금 언어의 결제 수단 목록. 주소·해지 경로 종류 같은 값은 그대로다. */
export function paymentMethodOptions(locale: Locale): PaymentMethodOption[] {
  const texts = translationFor(PAYMENT_METHODS, locale);
  if (!texts) return PAYMENT_METHOD_OPTIONS;
  return PAYMENT_METHOD_OPTIONS.map((option) => ({
    ...option,
    ...texts[option.value],
  }));
}

/** 구독에 저장된 결제 수단(`value`)의 지금 언어 문구. 모르는 값이면 undefined. */
export function findPaymentMethod(
  value: string | undefined,
  locale: Locale,
): PaymentMethodOption | undefined {
  return paymentMethodOptions(locale).find((option) => option.value === value);
}
