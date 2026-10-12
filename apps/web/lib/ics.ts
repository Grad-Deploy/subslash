import {
  cancelNoteFor,
  getCancelUrlKind,
  needsBillingMonth,
  type BillingCycle,
} from "@subslash/shared";
import type { AppsScriptLocale } from "./i18n/config";

/**
 * 결제일을 캘린더 일정으로 옮기는 규칙(RFC 5545의 RRULE·일정 본문). '구글 캘린더에 결제일 등록'
 * (`lib/calendar-sync`)이 쓴다. 예전에는 캘린더 피드(.ics)도 이 규칙으로 만들었다 — 피드는 결제 알림
 * 메일과 함께 그만뒀다.
 */

export interface CalendarEntry {
  clientId: string;
  name: string;
  amount: number;
  currency: string;
  billingDay: number;
  billingCycle: string;
  billingMonth?: number | null;
  /** 이 구독의 해지 주소. 브라우저가 계획에 실어 보낸다. 없으면 일정 메모에 해지 줄이 없다. */
  cancelUrl?: string | null;
}

/**
 * Repeat rule for a billing date.
 *
 * Days 29-31 do not exist in every month. `BYMONTHDAY=<day>,-1;BYSETPOS=1`
 * takes the earlier of "that day" and "the last day of the month", which is the
 * same clamping the app applies when it works out the next billing date. A
 * yearly plan pins the month as well, so Feb 29 lands on Feb 28 off-leap-years
 * instead of skipping three years at a time.
 */
export function billingRRule(entry: {
  billingDay: number;
  billingCycle?: string;
  billingMonth?: number | null;
}): string {
  const dayPart =
    entry.billingDay <= 28
      ? `BYMONTHDAY=${entry.billingDay}`
      : `BYMONTHDAY=${entry.billingDay},-1;BYSETPOS=1`;

  if (entry.billingCycle === "yearly" && entry.billingMonth) {
    return `FREQ=YEARLY;BYMONTH=${entry.billingMonth};${dayPart}`;
  }
  return `FREQ=MONTHLY;${dayPart}`;
}

/** Subscriptions that can be placed on a calendar. */
export function calendarEligible(entries: CalendarEntry[]): CalendarEntry[] {
  // A yearly plan whose billing month was never recorded has no date to
  // publish. Emitting it as a monthly event would put eleven charges on the
  // calendar that will never happen.
  return entries.filter(
    (entry) =>
      !needsBillingMonth({
        billingDay: entry.billingDay,
        billingCycle: entry.billingCycle as BillingCycle,
        billingMonth: entry.billingMonth ?? undefined,
      }),
  );
}

/** 주소의 성격(`getCancelUrlKind`)마다 해지 안내 문구를 고른다 — 화면과 같게 나눈다. */
function cancelNotesByKind(
  notes: Record<"direct" | "entry" | "unknown", (url: string) => string>,
): (url: string) => string {
  return (url) => notes[getCancelUrlKind(url)](url);
}

/**
 * 일정 메모 문구. 캘린더 이름(`CALENDAR_NAMES`)처럼 웹 앱이 아는 언어마다 하나다. 해지 안내(`cancel`)는 한국어·영어가
 * 공유 코드(`cancelNoteFor`)에 있어 그것을 부르고, 그 밖의 언어는 여기 둔다. 언어마다 꼭 채워야 해서, 웹 앱 언어를
 * 더하면 빠진 해지 안내가 타입 오류로 드러난다.
 */
const EVENT_TEXT: Record<
  AppsScriptLocale,
  {
    billingDay: (name: string) => string;
    detail: (url: string) => string;
    cancel: (url: string) => string | null;
  }
> = {
  ko: {
    billingDay: (name) =>
      `${name} 결제일입니다. 지난 30일 동안 몇 번 썼는지 돌아보고, 아깝다면 지금 해지하세요.`,
    detail: (url) =>
      `구독 보기·수정: ${url}
(이 구독을 등록한 기기에서 열거나, 로그인해 두면 다른 기기에서도 보입니다)`,
    cancel: (url) => cancelNoteFor(url, "ko"),
  },
  en: {
    billingDay: (name) =>
      `${name} billing day. Look back at how many times you used it in the last 30 days, and cancel now if it isn't worth it.`,
    detail: (url) =>
      `View or edit the subscription: ${url}
(Open it on the device where you registered it, or log in to see it on other devices too)`,
    cancel: (url) => cancelNoteFor(url, "en"),
  },
  zh: {
    billingDay: (name) =>
      `今天是 ${name} 的扣款日。回顾一下过去 30 天用了几次，不划算的话现在就退订吧。`,
    detail: (url) => `查看或修改订阅：${url}
（请在登记这个订阅的设备上打开，登录后在其他设备上也能看到）`,
    cancel: cancelNotesByKind({
      direct: (url) => `退订（已确认的退订页面）：${url}`,
      entry: (url) => `前往退订：${url}
（这是服务首页或账户页面，不是退订页面。请从那里找到退订菜单。）`,
      unknown: (url) => `前往退订：${url}
（这是你自己填写的地址，尚未确认会打开哪里。）`,
    }),
  },
  ja: {
    billingDay: (name) =>
      `${name} の支払日です。直近 30 日に何回使ったか振り返り、もったいなければ今すぐ解約しましょう。`,
    detail: (url) =>
      `サブスクを見る・直す: ${url}
（このサブスクを登録した端末で開くか、ログインしておけばほかの端末でも見られます）`,
    cancel: cancelNotesByKind({
      direct: (url) => `解約する（確認済みの解約ページ）: ${url}`,
      entry: (url) => `解約しに行く: ${url}
（解約ページではなく、サービスのトップやアカウントのページです。そこから解約メニューを探してください。）`,
      unknown: (url) => `解約しに行く: ${url}
（自分で入力したアドレスです。どこにつながるかは確認していません。）`,
    }),
  },
  vi: {
    billingDay: (name) =>
      `Hôm nay là ngày thanh toán ${name}. Hãy xem lại 30 ngày qua bạn dùng mấy lần, nếu thấy phí thì hủy ngay.`,
    detail: (url) =>
      `Xem hoặc sửa gói: ${url}
(Mở trên thiết bị đã đăng ký gói này, hoặc đăng nhập để xem trên thiết bị khác)`,
    cancel: cancelNotesByKind({
      direct: (url) => `Hủy (trang hủy đã xác nhận): ${url}`,
      entry: (url) => `Đi đến chỗ hủy: ${url}
(Đây là trang chủ hoặc trang tài khoản của dịch vụ, không phải trang hủy. Hãy tìm menu hủy từ đó.)`,
      unknown: (url) => `Đi đến chỗ hủy: ${url}
(Địa chỉ bạn tự nhập. Chưa kiểm tra nó dẫn đến đâu.)`,
    }),
  },
  fr: {
    billingDay: (name) =>
      `Jour de prélèvement de ${name}. Repensez au nombre d'utilisations des 30 derniers jours et résiliez maintenant si ça n'en vaut pas la peine.`,
    detail: (url) =>
      `Voir ou modifier l'abonnement : ${url}
(Ouvrez-le sur l'appareil où vous l'avez ajouté, ou connectez-vous pour le voir sur vos autres appareils)`,
    cancel: cancelNotesByKind({
      direct: (url) => `Résilier (page de résiliation vérifiée) : ${url}`,
      entry: (url) => `Aller résilier : ${url}
(C'est l'accueil ou la page de compte du service, pas la page de résiliation. Cherchez le menu de résiliation à partir de là.)`,
      unknown: (url) => `Aller résilier : ${url}
(Adresse saisie par vous. Sa destination n'a pas été vérifiée.)`,
    }),
  },
  es: {
    billingDay: (name) =>
      `Día de cobro de ${name}. Repasa cuántas veces la usaste en los últimos 30 días y cancela ahora si no vale la pena.`,
    detail: (url) =>
      `Ver o editar la suscripción: ${url}
(Ábrela en el dispositivo donde la añadiste, o inicia sesión para verla en otros dispositivos)`,
    cancel: cancelNotesByKind({
      direct: (url) => `Cancelar (página de cancelación comprobada): ${url}`,
      entry: (url) => `Ir a cancelar: ${url}
(Es la página de inicio o de la cuenta del servicio, no la de cancelación. Busca desde ahí el menú de cancelación.)`,
      unknown: (url) => `Ir a cancelar: ${url}
(Una dirección que escribiste tú. No se ha comprobado adónde lleva.)`,
    }),
  },
  de: {
    billingDay: (name) =>
      `Abbuchungstag von ${name}. Schau, wie oft du es in den letzten 30 Tagen genutzt hast, und kündige jetzt, wenn es sich nicht lohnt.`,
    detail: (url) =>
      `Abo ansehen oder bearbeiten: ${url}
(Öffne es auf dem Gerät, auf dem du es eingetragen hast, oder melde dich an, um es auf anderen Geräten zu sehen)`,
    cancel: cancelNotesByKind({
      direct: (url) => `Kündigen (geprüfte Kündigungsseite): ${url}`,
      entry: (url) => `Zum Kündigen: ${url}
(Das ist die Start- oder Kontoseite des Dienstes, nicht die Kündigungsseite. Such von dort das Kündigungsmenü.)`,
      unknown: (url) => `Zum Kündigen: ${url}
(Eine selbst eingegebene Adresse. Wohin sie führt, wurde nicht geprüft.)`,
    }),
  },
  pt: {
    billingDay: (name) =>
      `Dia de cobrança de ${name}. Veja quantas vezes você usou nos últimos 30 dias e cancele agora se não valer a pena.`,
    detail: (url) =>
      `Ver ou editar a assinatura: ${url}
(Abra no dispositivo onde você a cadastrou, ou entre na conta para ver em outros dispositivos)`,
    cancel: cancelNotesByKind({
      direct: (url) => `Cancelar (página de cancelamento verificada): ${url}`,
      entry: (url) => `Ir cancelar: ${url}
(É a página inicial ou da conta do serviço, não a de cancelamento. Procure o menu de cancelamento a partir dela.)`,
      unknown: (url) => `Ir cancelar: ${url}
(Um endereço que você digitou. Não foi verificado aonde ele leva.)`,
    }),
  },
};

/**
 * 일정 본문. 캘린더 앱은 본문의 주소를 눌러 열 수 있게 보여주므로, 결제일 알림에서 바로 구독을
 * 고치거나 해지하러 갈 수 있다.
 */
export function eventDescription(
  entry: CalendarEntry,
  detailUrl: string | null,
  lang: AppsScriptLocale = "ko",
): string {
  const text = EVENT_TEXT[lang];
  const parts = [text.billingDay(entry.name)];

  // 해지하려고 캘린더를 연 사람이 앱을 다시 열지 않아도 되게, 갈 곳을 메모에 적는다.
  const cancelNote = entry.cancelUrl ? text.cancel(entry.cancelUrl) : null;
  if (cancelNote) parts.push(cancelNote);

  // 구독 기록은 서버가 아니라 기기에 있다. 등록한 기기가 아니면 열어도 보이지 않으므로 미리
  // 적어 둔다. 로그인한 기기끼리는 계정 동기화로 맞춰지므로 그 길도 함께 알린다.
  if (detailUrl) parts.push(text.detail(detailUrl));

  return parts.join("\n\n");
}
