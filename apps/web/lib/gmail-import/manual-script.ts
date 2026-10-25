import type { AppsScriptLocale } from "../i18n/config";
import { MAIL_HELPERS } from "./mail-helpers";

/**
 * Apps Script 프로젝트의 매니페스트(appsscript.json).
 *
 * `GmailApp`은 메일 전송·삭제까지 되는 전체 Gmail 권한을 요구하고, 읽기 전용 권한으로 좁히면
 * 오류 없이 빈 결과를 준다. 그래서 Gmail API 고급 서비스를 켜고 권한을 읽기 전용 하나로 적는다.
 */
export const GMAIL_APPS_SCRIPT_MANIFEST = `${JSON.stringify(
  {
    timeZone: "Asia/Seoul",
    runtimeVersion: "V8",
    exceptionLogging: "STACKDRIVER",
    oauthScopes: ["https://www.googleapis.com/auth/gmail.readonly"],
    dependencies: {
      enabledAdvancedServices: [{ userSymbol: "Gmail", serviceId: "gmail", version: "v1" }],
    },
    webapp: { executeAs: "USER_DEPLOYING", access: "MYSELF" },
  },
  null,
  2,
)}\n`;

// String.raw: 정규식의 역슬래시를 그대로 남긴다. 스크립트 안에서는 백틱과 `${`를 쓰지 않는다.
const MANUAL_SCRIPT = String.raw`/**
 * SubSlash — Gmail 결제 메일 가져오기
 *
 * 내 Google 계정 안에서만 돕니다. 찾은 메일은 SubSlash 서버로 보내지 않고,
 * 'SubSlash로 가져오기' 버튼 주소의 # 뒤에 담겨 내 브라우저에서만 읽힙니다.
 * 권한은 메일 읽기(gmail.readonly)뿐이라 메일을 보내거나 지울 수 없습니다.
 */

var SUBSLASH_IMPORT_URL = __IMPORT_URL__;

// 찾을 메일. Gmail 검색창과 같은 문법입니다.
//
// 네 갈래로 나눠 찾고 합칩니다. 한 갈래에 다 맡기면 상한을 그 갈래가 다 써 버리기 때문입니다.
// ⓪ 앱스토어·구글 플레이 영수증 — 한 통으로 여러 앱을 청구하고, 연간 구독은 1년에 한 번만
//    옵니다. 수가 적어 따로 찾으면 다른 메일에 밀리지 않습니다(반년 전 굿노트 영수증이
//    아래 갈래들의 상한 밖으로 밀려 아예 읽히지 않았습니다).
// ① '구매' 분류 안에서 구독을 가리키는 말 — 구독 영수증에 가장 가깝습니다.
// ② '구매' 분류 전체 — 주문·영수증만 모여 광고가 거의 없지만, 쇼핑 주문이 대부분이라
//    이것만 보면 1년에 한 번 오는 연간 구독 영수증이 상한 밖으로 밀립니다.
// ③ 결제 낱말 — Gmail이 '구매'로 분류하지 못한 영수증을 줍습니다. 광고가 섞이지만
//    SubSlash가 결제한 증거가 없는 메일은 버립니다.
// 빠지는 결제 메일이 있으면 ③에 단어를 더하세요.
var SEARCH_QUERIES = [
  "from:(apple.com OR google.com) (영수증 OR receipt OR 주문) newer_than:400d",
  "category:purchases (구독 OR 멤버십 OR 정기결제 OR 자동결제 OR 이용권 OR subscription OR membership OR renewal) newer_than:400d",
  "category:purchases newer_than:400d",
  "(영수증 OR 결제 OR 청구 OR 정기결제 OR 구독 OR 멤버십 OR receipt OR invoice OR subscription OR payment) newer_than:400d",
];
// 읽을 메일 수. 400일치를 보므로 넉넉히 둡니다. 주소에 실어 보내는 방식이라 자동 가져오기보다
// 적게 읽습니다.
var MAX_MESSAGES = 150;
var MAX_BODY_CHARS = 1500;
// 이 스크립트는 메일 읽기 권한 하나만 씁니다. 여러 통을 한꺼번에 받으려면 외부 요청 권한이 더
// 필요해서, 한 통씩 받습니다(150통이면 1분쯤 걸립니다).
var PARALLEL_FETCH = false;

// 화면 문구. 스크립트를 받은 SubSlash 화면의 언어로 만들어집니다.
var TEXT = __TEXT__;

function doGet() {
  var emails = collectReceiptEmails(SEARCH_QUERIES, MAX_MESSAGES);
  var body;
  if (emails.length === 0) {
    body =
      "<h2>" + escapeHtml(TEXT.noneTitle) + "</h2>" +
      "<p>" + escapeHtml(TEXT.noneBody) + "</p>";
  } else {
    var link = SUBSLASH_IMPORT_URL + "#gmail=" + encodeEmails(emails);
    body =
      "<h2>" + escapeHtml(TEXT.found.replace("{count}", String(emails.length))) + "</h2>" +
      "<p>" + escapeHtml(TEXT.foundBody) + "</p>" +
      '<p><a href="' + escapeHtml(link) + '" target="_blank" rel="noopener" ' +
      'style="display:inline-block;padding:12px 20px;border-radius:10px;background:#18181b;color:#fff;text-decoration:none;font-weight:700">' +
      escapeHtml(TEXT.button) + "</a></p>";
  }
  return HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;line-height:1.6;padding:8px">' + body + "</div>",
  )
    .setTitle(TEXT.title)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function encodeEmails(emails) {
  var json = JSON.stringify({ v: 1, emails: emails });
  var gzipped = Utilities.gzip(Utilities.newBlob(json, "application/json"));
  return Utilities.base64EncodeWebSafe(gzipped.getBytes()).replace(/=+$/, "");
}
`;

/** 스크립트 화면 문구. 스크립트를 받은 SubSlash 화면 언어로 넣는다. `{count}`는 찾은 메일 수다. */
const MANUAL_TEXT: Record<
  AppsScriptLocale,
  {
    noneTitle: string;
    noneBody: string;
    found: string;
    foundBody: string;
    button: string;
    title: string;
  }
> = {
  ko: {
    noneTitle: "결제 메일을 찾지 못했습니다",
    noneBody:
      "스크립트의 SEARCH_QUERIES에 결제 메일 제목에 들어가는 단어를 더한 뒤 다시 배포해 보세요.",
    found: "최근 메일 {count}통을 찾았습니다",
    foundBody:
      "버튼을 누르면 SubSlash가 열리고, 등록할 구독을 직접 고릅니다. 메일 내용은 SubSlash 서버로 전송되지 않습니다.",
    button: "SubSlash로 가져오기",
    title: "SubSlash 가져오기",
  },
  en: {
    noneTitle: "No payment emails found",
    noneBody:
      "Add words that appear in your payment email subjects to SEARCH_QUERIES in the script, then deploy again.",
    found: "Found {count} recent emails",
    foundBody:
      "Tap the button to open SubSlash and pick the subscriptions to add. Email contents aren't sent to SubSlash's servers.",
    button: "Import into SubSlash",
    title: "SubSlash import",
  },
  zh: {
    noneTitle: "没有找到付款邮件",
    noneBody: "请把付款邮件标题中的词加到脚本的 SEARCH_QUERIES，然后重新部署。",
    found: "找到 {count} 封最近的邮件",
    foundBody: "点按钮会打开 SubSlash，由你选择要登记的订阅。邮件内容不会发送到 SubSlash 服务器。",
    button: "导入到 SubSlash",
    title: "SubSlash 导入",
  },
  ja: {
    noneTitle: "支払いメールが見つかりませんでした",
    noneBody:
      "支払いメールの件名に入る言葉をスクリプトの SEARCH_QUERIES に足して、もう一度デプロイしてください。",
    found: "最近のメールが {count} 通見つかりました",
    foundBody:
      "ボタンを押すと SubSlash が開き、登録するサブスクを自分で選びます。メールの内容は SubSlash のサーバーに送られません。",
    button: "SubSlash に取り込む",
    title: "SubSlash 取り込み",
  },
  vi: {
    noneTitle: "Không tìm thấy email thanh toán",
    noneBody:
      "Thêm các từ có trong tiêu đề email thanh toán vào SEARCH_QUERIES trong script rồi triển khai lại.",
    found: "Tìm thấy {count} email gần đây",
    foundBody:
      "Nhấn nút để mở SubSlash và tự chọn gói cần đăng ký. Nội dung email không được gửi đến máy chủ SubSlash.",
    button: "Nhập vào SubSlash",
    title: "Nhập vào SubSlash",
  },
  fr: {
    noneTitle: "Aucun e-mail de paiement trouvé",
    noneBody:
      "Ajoutez à SEARCH_QUERIES dans le script des mots présents dans l'objet de vos e-mails de paiement, puis redéployez.",
    found: "{count} e-mail(s) récent(s) trouvé(s)",
    foundBody:
      "Touchez le bouton pour ouvrir SubSlash et choisir les abonnements à ajouter. Le contenu des e-mails n'est pas envoyé aux serveurs de SubSlash.",
    button: "Importer dans SubSlash",
    title: "Import SubSlash",
  },
  es: {
    noneTitle: "No se encontraron correos de pago",
    noneBody:
      "Añade a SEARCH_QUERIES en el script palabras que aparezcan en el asunto de tus correos de pago y vuelve a implementar.",
    found: "Se encontraron {count} correo(s) reciente(s)",
    foundBody:
      "Toca el botón para abrir SubSlash y elegir las suscripciones que quieres añadir. El contenido de los correos no se envía a los servidores de SubSlash.",
    button: "Importar en SubSlash",
    title: "Importación de SubSlash",
  },
  de: {
    noneTitle: "Keine Zahlungs-E-Mails gefunden",
    noneBody:
      "Füg Wörter aus den Betreffzeilen deiner Zahlungs-E-Mails zu SEARCH_QUERIES im Skript hinzu und stell es erneut bereit.",
    found: "{count} neue E-Mail(s) gefunden",
    foundBody:
      "Tippe auf den Button, um SubSlash zu öffnen und die Abos zum Hinzufügen auszuwählen. E-Mail-Inhalte werden nicht an SubSlash-Server gesendet.",
    button: "In SubSlash importieren",
    title: "SubSlash-Import",
  },
  pt: {
    noneTitle: "Nenhum e-mail de pagamento encontrado",
    noneBody:
      "Adicione a SEARCH_QUERIES no script palavras que aparecem no assunto dos seus e-mails de pagamento e implante de novo.",
    found: "{count} e-mail(s) recente(s) encontrado(s)",
    foundBody:
      "Toque no botão para abrir o SubSlash e escolher as assinaturas para adicionar. O conteúdo dos e-mails não é enviado aos servidores do SubSlash.",
    button: "Importar para o SubSlash",
    title: "Importação do SubSlash",
  },
};

/**
 * 한국어가 아닌 화면에서 받은 스크립트의 머리말. 코드 주석은 한국어로만 쓰므로, 그 언어로는 이 머리말만 읽힌다
 * (`withoutKoreanComments`). 검색어(SEARCH_QUERIES)의 한국어 낱말은 한국어 영수증을 찾는 값이라 그대로 둔다.
 */
const MANUAL_HEADER: Record<Exclude<AppsScriptLocale, "ko">, string[]> = {
  en: [
    "SubSlash — import from Gmail payment emails",
    "",
    "Runs only inside your Google account. Found emails are not sent to the SubSlash server;",
    "they ride after the # in the 'Import to SubSlash' button link and are read only in your browser.",
    "The only permission is reading mail (gmail.readonly), so it can't send or delete mail.",
    "If a payment email is missed, add a word from its subject to SEARCH_QUERIES and deploy again.",
    "The Korean words in SEARCH_QUERIES match Korean receipts — keep them.",
  ],
  zh: [
    "SubSlash — 从 Gmail 付款邮件导入",
    "",
    "只在你的 Google 账户内运行。找到的邮件不会发送到 SubSlash 服务器，",
    "而是放在“导入到 SubSlash”按钮链接的 # 之后，只在你的浏览器中读取。",
    "唯一的权限是读取邮件（gmail.readonly），无法发送或删除邮件。",
    "如有遗漏的付款邮件，请把邮件标题中的词加入 SEARCH_QUERIES 后重新部署。",
    "SEARCH_QUERIES 中的韩语词用于匹配韩国的收据，请保留。",
  ],
  ja: [
    "SubSlash — Gmail の支払いメールから取り込む",
    "",
    "自分の Google アカウントの中だけで動きます。見つけたメールは SubSlash のサーバーに送らず、",
    "「SubSlash に取り込む」ボタンのリンクの # の後ろに入れて、自分のブラウザだけで読みます。",
    "権限はメールの読み取り（gmail.readonly）だけなので、メールの送信や削除はできません。",
    "取りこぼした支払いメールがあれば、件名の単語を SEARCH_QUERIES に足して再デプロイしてください。",
    "SEARCH_QUERIES の韓国語の単語は韓国の領収書を探すためのものなので、残してください。",
  ],
  vi: [
    "SubSlash — nhập từ email thanh toán trên Gmail",
    "",
    "Chỉ chạy trong tài khoản Google của bạn. Email tìm thấy không được gửi đến máy chủ SubSlash;",
    "chúng nằm sau dấu # trong liên kết nút 'Nhập vào SubSlash' và chỉ được đọc trong trình duyệt của bạn.",
    "Quyền duy nhất là đọc thư (gmail.readonly), nên không thể gửi hay xóa thư.",
    "Nếu sót email thanh toán, hãy thêm một từ trong tiêu đề vào SEARCH_QUERIES rồi triển khai lại.",
    "Các từ tiếng Hàn trong SEARCH_QUERIES dùng để tìm hóa đơn Hàn Quốc — hãy giữ lại.",
  ],
  fr: [
    "SubSlash — importer depuis les e-mails de paiement Gmail",
    "",
    "S'exécute uniquement dans votre compte Google. Les e-mails trouvés ne sont pas envoyés au serveur SubSlash ;",
    "ils passent après le # du lien du bouton « Importer dans SubSlash » et ne sont lus que dans votre navigateur.",
    "La seule autorisation est la lecture des e-mails (gmail.readonly) : impossible d'en envoyer ou d'en supprimer.",
    "S'il manque un e-mail de paiement, ajoutez un mot de son objet à SEARCH_QUERIES puis redéployez.",
    "Les mots coréens de SEARCH_QUERIES servent aux reçus coréens — gardez-les.",
  ],
  es: [
    "SubSlash — importar desde los correos de pago de Gmail",
    "",
    "Se ejecuta solo dentro de tu cuenta de Google. Los correos encontrados no se envían al servidor de SubSlash;",
    "viajan tras el # del enlace del botón «Importar a SubSlash» y solo se leen en tu navegador.",
    "El único permiso es leer el correo (gmail.readonly), así que no puede enviar ni borrar correos.",
    "Si falta algún correo de pago, añade una palabra de su asunto a SEARCH_QUERIES y vuelve a implementar.",
    "Las palabras en coreano de SEARCH_QUERIES sirven para recibos coreanos; no las quites.",
  ],
  de: [
    "SubSlash — Import aus Gmail-Zahlungsmails",
    "",
    "Läuft nur in deinem Google-Konto. Gefundene Mails werden nicht an den SubSlash-Server gesendet;",
    "sie stehen hinter dem # im Link der Schaltfläche „Nach SubSlash importieren“ und werden nur in deinem Browser gelesen.",
    "Die einzige Berechtigung ist das Lesen von Mails (gmail.readonly), Senden oder Löschen ist nicht möglich.",
    "Fehlt eine Zahlungsmail, füge ein Wort aus ihrem Betreff zu SEARCH_QUERIES hinzu und stelle neu bereit.",
    "Die koreanischen Wörter in SEARCH_QUERIES finden koreanische Belege — lass sie stehen.",
  ],
  pt: [
    "SubSlash — importar dos e-mails de pagamento do Gmail",
    "",
    "Roda só dentro da sua conta Google. Os e-mails encontrados não são enviados ao servidor do SubSlash;",
    "eles vão depois do # no link do botão 'Importar para o SubSlash' e só são lidos no seu navegador.",
    "A única permissão é ler e-mails (gmail.readonly), então não dá para enviar nem apagar e-mails.",
    "Se faltar algum e-mail de pagamento, adicione uma palavra do assunto em SEARCH_QUERIES e implante de novo.",
    "As palavras em coreano em SEARCH_QUERIES servem para recibos coreanos — mantenha-as.",
  ],
};

/**
 * 한국어 주석을 걷어 낸 코드. 첫 블록 주석(머리말)은 그 언어의 머리말로 바꾸고, 나머지 블록 주석과 한 줄 주석 가운데
 * 한글이 든 것은 지운다 — 영어 화면에서 받은 스크립트가 한국어 설명으로 가득했다. 코드 줄은 건드리지 않는다.
 */
function withoutKoreanComments(code: string, lang: Exclude<AppsScriptLocale, "ko">): string {
  const header = `/**\n${MANUAL_HEADER[lang].map((line) => (line ? ` * ${line}` : " *")).join("\n")}\n */`;
  let first = true;
  return code
    .replace(/\/\*\*[\s\S]*?\*\//g, (block) => {
      if (first) {
        first = false;
        return header;
      }
      return /[가-힣]/.test(block) ? "" : block;
    })
    .split("\n")
    .filter((line) => !(/^\s*\/\//.test(line) && /[가-힣]/.test(line)))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

/** 사용자가 Apps Script 편집기에 붙여 넣을 코드. 가져오기 주소는 지금 보고 있는 SubSlash다. */
export function gmailAppsScript(importUrl: string, lang: AppsScriptLocale = "ko"): string {
  const code =
    MANUAL_SCRIPT.replace("__IMPORT_URL__", () => JSON.stringify(importUrl)).replace(
      "__TEXT__",
      () => JSON.stringify(MANUAL_TEXT[lang]),
    ) + MAIL_HELPERS;
  return lang === "ko" ? code : withoutKoreanComments(code, lang);
}
