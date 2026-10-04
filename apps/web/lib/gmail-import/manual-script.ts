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

function doGet() {
  var emails = collectReceiptEmails(SEARCH_QUERIES, MAX_MESSAGES);
  var body;
  if (emails.length === 0) {
    body =
      "<h2>결제 메일을 찾지 못했습니다</h2>" +
      "<p>스크립트의 SEARCH_QUERIES에 결제 메일 제목에 들어가는 단어를 더한 뒤 다시 배포해 보세요.</p>";
  } else {
    var link = SUBSLASH_IMPORT_URL + "#gmail=" + encodeEmails(emails);
    body =
      "<h2>최근 메일 " + emails.length + "통을 찾았습니다</h2>" +
      "<p>버튼을 누르면 SubSlash가 열리고, 등록할 구독을 직접 고릅니다. " +
      "메일 내용은 SubSlash 서버로 전송되지 않습니다.</p>" +
      '<p><a href="' + escapeHtml(link) + '" target="_blank" rel="noopener" ' +
      'style="display:inline-block;padding:12px 20px;border-radius:10px;background:#18181b;color:#fff;text-decoration:none;font-weight:700">' +
      "SubSlash로 가져오기</a></p>";
  }
  return HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;line-height:1.6;padding:8px">' + body + "</div>",
  )
    .setTitle("SubSlash 가져오기")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function encodeEmails(emails) {
  var json = JSON.stringify({ v: 1, emails: emails });
  var gzipped = Utilities.gzip(Utilities.newBlob(json, "application/json"));
  return Utilities.base64EncodeWebSafe(gzipped.getBytes()).replace(/=+$/, "");
}
`;

/** 사용자가 Apps Script 편집기에 붙여 넣을 코드. 가져오기 주소는 지금 보고 있는 SubSlash다. */
export function gmailAppsScript(importUrl: string): string {
  return MANUAL_SCRIPT.replace("__IMPORT_URL__", () => JSON.stringify(importUrl)) + MAIL_HELPERS;
}
