import type { ReceiptEmail } from "@subslash/shared";

/**
 * Gmail 결제 메일 가져오기.
 *
 * SubSlash는 Gmail에 직접 연결하지 않는다. 사용자가 자기 Google 계정에 아래 Apps Script를 만들어
 * 열면, 스크립트가 결제 메일을 찾아 압축한 뒤 `/import#gmail=…` 버튼으로 넘긴다. 주소의 `#` 뒤는
 * 브라우저가 서버로 보내지 않으므로 메일 내용은 SubSlash 서버를 거치지 않고, 이 파일이 브라우저
 * 안에서 풀어 가져오기 창에 넘긴다. 등록은 사용자가 창에서 고른 것만 한다.
 */

export const GMAIL_HASH_PREFIX = "#gmail=";

const MAX_EMAILS = 200;

export class GmailImportError extends Error {
  constructor() {
    super("가져온 메일 내용을 읽지 못했습니다. Apps Script 화면에서 버튼을 다시 눌러주세요.");
    this.name = "GmailImportError";
  }
}

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

/** `#gmail=` 뒤의 값(웹 안전 base64로 적은 gzip JSON)을 메일 목록으로 푼다. */
export async function decodeGmailImport(encoded: string): Promise<ReceiptEmail[]> {
  let data: unknown;
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    data = JSON.parse(await new Response(stream).text());
  } catch {
    throw new GmailImportError();
  }

  const emails = readReceiptEmails(data);
  if (!emails) throw new GmailImportError();
  return emails;
}

/**
 * 스크립트가 보낸 `{ v: 1, emails: [...] }`를 검사해 메일 목록으로 바꾼다. 형식이 틀리면 null.
 * 브라우저(`#gmail=`)와 서버(자동 가져오기)가 같은 규칙으로 받는다.
 */
export function readReceiptEmails(data: unknown): ReceiptEmail[] | null {
  if (typeof data !== "object" || data === null) return null;
  const { v, emails } = data as { v?: unknown; emails?: unknown };
  if (v !== 1 || !Array.isArray(emails)) return null;

  return emails
    .slice(0, MAX_EMAILS)
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      from: text(item.from, 300),
      subject: text(item.subject, 300),
      date: text(item.date, 40),
      body: text(item.body, 5000),
    }))
    .filter((email) => email.date && (email.subject || email.body));
}

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

// 두 스크립트가 함께 쓰는 메일 읽기. 스크립트마다 MAX_BODY_CHARS를 정해 둔다.
const MAIL_HELPERS = String.raw`function collectReceiptEmails(queries, maxMessages) {
  var refs = [];
  var seen = {};
  for (var q = 0; q < queries.length; q++) {
    // 쿼리마다 자리를 나눠 씁니다. 앞 쿼리에 상한을 다 주면 뒤 쿼리는 아예 돌지 못합니다.
    var room = Math.ceil((maxMessages - refs.length) / (queries.length - q));
    if (room < 1) break;
    var list = withGmailQuota(function () {
      return Gmail.Users.Messages.list("me", { q: queries[q], maxResults: room });
    });
    var found = list.messages || [];
    for (var i = 0; i < found.length; i++) {
      if (seen[found[i].id]) continue;
      seen[found[i].id] = true;
      refs.push(found[i]);
    }
  }
  return refs.map(function (ref) {
    var message = withGmailQuota(function () {
      return Gmail.Users.Messages.get("me", ref.id, { format: "full" });
    });
    var headers = message.payload.headers || [];
    return {
      from: headerValue(headers, "From"),
      subject: headerValue(headers, "Subject"),
      date: new Date(Number(message.internalDate)).toISOString(),
      body: messageText(message.payload).slice(0, MAX_BODY_CHARS),
    };
  });
}

// Gmail API는 사람마다 1분에 쓸 수 있는 양이 정해져 있습니다(메일 한 통 읽기가 20, 한도 6,000).
// 첫 검사는 200통을 읽어 그 3분의 2를 쓰므로, 1분 안에 다시 연결하면 한도에 걸립니다. 걸리면
// 포기하지 않고 한도가 풀릴 때까지 기다렸다가 다시 부릅니다. 다른 오류는 그대로 올립니다.
var GMAIL_QUOTA_WAITS_MS = [10000, 30000, 65000];

function withGmailQuota(call) {
  for (var attempt = 0; ; attempt++) {
    try {
      return call();
    } catch (error) {
      var quota = /quota|rate ?limit|too many requests|429/i.test(String(error && error.message));
      if (!quota || attempt >= GMAIL_QUOTA_WAITS_MS.length) throw error;
      Utilities.sleep(GMAIL_QUOTA_WAITS_MS[attempt]);
    }
  }
}

function headerValue(headers, name) {
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i].name).toLowerCase() === name.toLowerCase()) return headers[i].value;
  }
  return "";
}

// 글자 본문이 안내 한 줄뿐인 메일이 있어, 짧으면 HTML 본문을 글자로 바꿔 쓴다.
function messageText(payload) {
  var plainPart = findPart(payload, "text/plain");
  var plain = plainPart ? tidy(partText(plainPart)) : "";
  if (plain.length >= 80) return plain;
  var htmlPart = findPart(payload, "text/html");
  var html = htmlPart ? tidy(htmlToText(partText(htmlPart))) : "";
  return html.length > plain.length ? html : plain;
}

function findPart(part, mimeType) {
  if (part.mimeType === mimeType && part.body && part.body.data) return part;
  var parts = part.parts || [];
  for (var i = 0; i < parts.length; i++) {
    var found = findPart(parts[i], mimeType);
    if (found) return found;
  }
  return null;
}

// 한국 카드사 메일은 EUC-KR이 많아, 파트에 적힌 문자셋으로 읽는다.
function partText(part) {
  var data = part.body.data;
  var bytes = data;
  if (typeof data === "string") {
    while (data.length % 4 !== 0) data += "=";
    bytes = Utilities.base64DecodeWebSafe(data);
  }
  var blob = Utilities.newBlob(bytes);
  try {
    return blob.getDataAsString(charsetOf(part));
  } catch (error) {
    return blob.getDataAsString("UTF-8");
  }
}

function charsetOf(part) {
  var contentType = headerValue(part.headers || [], "Content-Type");
  var match = /charset="?([^";\s]+)"?/i.exec(contentType);
  return match ? match[1] : "UTF-8";
}

function htmlToText(html) {
  return html
    .replace(/<(style|script|head)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|table|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, function (_, code) {
      return String.fromCodePoint(Number(code));
    })
    .replace(/&#x([0-9a-f]+);/gi, function (_, code) {
      return String.fromCodePoint(parseInt(code, 16));
    })
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}

function tidy(text) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
`;

/**
 * 자동 가져오기 스크립트의 매니페스트. 메일 읽기에 더해, SubSlash로 보내기(외부 요청)와
 * 2주마다 실행(트리거) 권한을 쓴다. 웹 앱으로 배포하지 않는다.
 */
export const GMAIL_AUTO_SCRIPT_MANIFEST = `${JSON.stringify(
  {
    timeZone: "Asia/Seoul",
    runtimeVersion: "V8",
    exceptionLogging: "STACKDRIVER",
    oauthScopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/script.external_request",
      "https://www.googleapis.com/auth/script.scriptapp",
    ],
    dependencies: {
      enabledAdvancedServices: [{ userSymbol: "Gmail", serviceId: "gmail", version: "v1" }],
    },
  },
  null,
  2,
)}
`;

const AUTO_SCRIPT = String.raw`/**
 * SubSlash — Gmail 결제 메일 자동 가져오기
 *
 * 내 Google 계정에서 2주마다 돌며 새 결제 메일을 찾아 SubSlash로 보냅니다.
 * SubSlash는 받은 메일에서 구독 후보(서비스·금액·결제일·보낸 사람)만 남기고
 * 메일 제목·본문은 저장하지 않습니다. 메일을 보내거나 지우는 권한은 없습니다.
 *
 * 처음 한 번: 위쪽 함수 목록에서 setup을 골라 실행하고 권한을 허용하세요.
 * 그만두려면: SubSlash에서 연결을 끊으세요(이 스크립트는 그때부터 거절됩니다).
 * 트리거까지 지우려면 왼쪽의 시계 모양(트리거)에서 scan을 지우세요.
 */

var SUBSLASH_INGEST_URL = __INGEST_URL__;
var SUBSLASH_TOKEN = __TOKEN__;

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
  "from:(apple.com OR google.com) (영수증 OR receipt OR 주문)",
  "category:purchases (구독 OR 멤버십 OR 정기결제 OR 자동결제 OR 이용권 OR subscription OR membership OR renewal)",
  "category:purchases",
  "(영수증 OR 결제 OR 청구 OR 정기결제 OR 구독 OR 멤버십 OR receipt OR invoice OR subscription OR payment)",
];
// 처음에는 연간 결제까지 보이게 400일을 봅니다. 그 뒤로는 지난 검사 이후 메일만 봅니다.
var FIRST_SCAN_DAYS = 400;
// 첫 검사는 400일치라 더 많이 읽습니다. 그 뒤로는 2주치뿐이라 100통이면 남습니다.
var FIRST_SCAN_MAX_MESSAGES = 200;
var MAX_MESSAGES = 100;
var MAX_BODY_CHARS = 1500;

function setup() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "scan") ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger("scan")
    .timeBased()
    .everyWeeks(2)
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();
  scan();
}

function scan() {
  var properties = PropertiesService.getScriptProperties();
  var lastScanAt = Number(properties.getProperty("lastScanAt") || 0);
  var startedAt = Date.now();
  var range = lastScanAt
    ? " after:" + Math.floor(lastScanAt / 1000)
    : " newer_than:" + FIRST_SCAN_DAYS + "d";
  var emails = collectReceiptEmails(
    SEARCH_QUERIES.map(function (query) {
      return query + range;
    }),
    lastScanAt ? MAX_MESSAGES : FIRST_SCAN_MAX_MESSAGES,
  );

  var response = UrlFetchApp.fetch(SUBSLASH_INGEST_URL, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + SUBSLASH_TOKEN },
    payload: JSON.stringify({ v: 1, emails: emails }),
    muteHttpExceptions: true,
  });
  var status = response.getResponseCode();
  if (status === 401) {
    throw new Error(
      "SubSlash 연결이 끊겼습니다. SubSlash에서 스크립트를 다시 받아 붙여 넣은 뒤 setup을 실행하세요.",
    );
  }
  if (status !== 200) {
    // 검사 시각을 남기지 않아, 다음 실행 때 같은 기간을 다시 봅니다.
    throw new Error("SubSlash에 보내지 못했습니다(" + status + "). 다음 실행 때 다시 보냅니다.");
  }
  properties.setProperty("lastScanAt", String(startedAt));
  Logger.log("결제 메일 " + emails.length + "통을 SubSlash로 보냈습니다.");
}

`;

/**
 * 원클릭 연결 웹 앱의 매니페스트. SubSlash 운영자가 한 번 배포한다. 접속한 사용자의 권한으로
 * 실행되므로(USER_ACCESSING) 사람마다 Google이 권한을 묻고, 트리거와 저장값도 사람마다 따로다.
 */
export const GMAIL_CONNECT_WEB_APP_MANIFEST = `${JSON.stringify(
  {
    timeZone: "Asia/Seoul",
    runtimeVersion: "V8",
    exceptionLogging: "STACKDRIVER",
    oauthScopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      // 결제일을 쓸 전용 캘린더를 만들고 일정을 넣는다. Calendar 고급 서비스는 이 권한 하나만
      // 있고 더 좁은 권한으로는 캘린더를 만들지 못한다.
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/script.external_request",
      "https://www.googleapis.com/auth/script.scriptapp",
    ],
    dependencies: {
      enabledAdvancedServices: [
        { userSymbol: "Gmail", serviceId: "gmail", version: "v1" },
        { userSymbol: "Calendar", serviceId: "calendar", version: "v3" },
      ],
    },
    webapp: { executeAs: "USER_ACCESSING", access: "ANYONE" },
  },
  null,
  2,
)}
`;

const CONNECT_WEB_APP = String.raw`/**
 * SubSlash — Gmail 연결 웹 앱
 *
 * SubSlash 운영자가 한 번 배포합니다(실행: 웹 앱에 액세스하는 사용자, 액세스: Google 계정이 있는
 * 모든 사용자). 사용자가 SubSlash에서 'Gmail 연결'을 누르면 이 웹 앱으로 오고, Google 권한을
 * 허용하면 그 사람의 계정에 2주마다 도는 검사를 겁니다. 연결 토큰·검사 시각은 사람마다 따로
 * (UserProperties) 둡니다. SubSlash는 받은 메일에서 구독 후보만 남기고 제목·본문은 저장하지 않습니다.
 *
 * '구글 캘린더에 등록'(action=calendar)도 이 웹 앱이 합니다. SubSlash에서 받은 1회용 코드로 결제일을
 * 받아, 이 계정의 'SubSlash 결제일' 캘린더에 반복 일정으로 씁니다. 다른 캘린더는 건드리지 않고,
 * 전에 SubSlash가 쓴 일정은 지우고 다시 씁니다(전체 교체).
 */

// 연결 코드를 바꾸고 메일을 보낼 SubSlash 주소. 이 목록에 없는 주소로는 보내지 않습니다.
var ALLOWED_ORIGINS = __ORIGINS__;

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
  "from:(apple.com OR google.com) (영수증 OR receipt OR 주문)",
  "category:purchases (구독 OR 멤버십 OR 정기결제 OR 자동결제 OR 이용권 OR subscription OR membership OR renewal)",
  "category:purchases",
  "(영수증 OR 결제 OR 청구 OR 정기결제 OR 구독 OR 멤버십 OR receipt OR invoice OR subscription OR payment)",
];
var FIRST_SCAN_DAYS = 400;
var FIRST_SCAN_MAX_MESSAGES = 200;
var MAX_MESSAGES = 100;
var MAX_BODY_CHARS = 1500;

function doGet(e) {
  var params = (e && e.parameter) || {};
  var origin = String(params.origin || "");
  if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
    return connectPage(
      "연결할 수 없습니다",
      "허용되지 않은 주소에서 왔습니다. SubSlash에서 다시 연결해 주세요.",
      null,
    );
  }
  if (!params.code) {
    return connectPage("연결할 수 없습니다", "연결 코드가 없습니다. SubSlash에서 다시 연결해 주세요.", origin);
  }
  if (String(params.action || "") === "calendar") return calendarPage(origin, String(params.code));

  var response = UrlFetchApp.fetch(origin + "/api/gmail/connect/exchange", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ code: String(params.code) }),
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) {
    return connectPage(
      "연결하지 못했습니다",
      responseError(response, "연결 코드가 만료됐거나 이미 쓰였습니다. SubSlash에서 다시 연결해 주세요."),
      origin,
    );
  }

  var properties = PropertiesService.getUserProperties();
  properties.deleteAllProperties();
  properties.setProperties({ token: JSON.parse(response.getContentText()).token, origin: origin });
  removeScanTriggers();
  ScriptApp.newTrigger("scan")
    .timeBased()
    .everyWeeks(2)
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();

  try {
    var sent = scan();
    return connectPage(
      "Gmail을 연결했습니다",
      "최근 메일 " + sent + "통을 확인했습니다. SubSlash로 돌아가면 찾은 구독이 등록됩니다. " +
        "앞으로 2주마다 새 결제 메일을 확인합니다.",
      origin,
    );
  } catch (error) {
    return connectPage(
      "Gmail을 연결했습니다",
      "첫 검사는 하지 못해 2주 뒤 검사 때 다시 합니다(" + error.message + ").",
      origin,
    );
  }
}

// 2주마다 트리거가 부른다. 보낸 메일 수를 돌려준다.
function scan() {
  var properties = PropertiesService.getUserProperties();
  var token = properties.getProperty("token");
  var origin = properties.getProperty("origin");
  if (!token || ALLOWED_ORIGINS.indexOf(origin) === -1) {
    removeScanTriggers();
    return 0;
  }

  var lastScanAt = Number(properties.getProperty("lastScanAt") || 0);
  var startedAt = Date.now();
  var range = lastScanAt
    ? " after:" + Math.floor(lastScanAt / 1000)
    : " newer_than:" + FIRST_SCAN_DAYS + "d";
  var emails = collectReceiptEmails(
    SEARCH_QUERIES.map(function (query) {
      return query + range;
    }),
    lastScanAt ? MAX_MESSAGES : FIRST_SCAN_MAX_MESSAGES,
  );

  var response = UrlFetchApp.fetch(origin + "/api/gmail/ingest", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + token },
    payload: JSON.stringify({ v: 1, emails: emails }),
    muteHttpExceptions: true,
  });
  var status = response.getResponseCode();
  if (status === 401) {
    // SubSlash에서 연결을 끊었다. 이 사람의 검사를 멈추고 저장값을 지운다.
    removeScanTriggers();
    properties.deleteAllProperties();
    return 0;
  }
  if (status !== 200) {
    // 검사 시각을 남기지 않아, 다음 실행 때 같은 기간을 다시 본다.
    throw new Error("SubSlash에 보내지 못했습니다(" + status + ")");
  }
  properties.setProperty("lastScanAt", String(startedAt));
  return emails.length;
}

function removeScanTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "scan") ScriptApp.deleteTrigger(trigger);
  });
}

function responseError(response, fallback) {
  try {
    var body = JSON.parse(response.getContentText());
    return typeof body.error === "string" ? body.error : fallback;
  } catch (error) {
    return fallback;
  }
}

// 'SubSlash 결제일' 캘린더에 결제일을 쓴다. SubSlash에서 받은 1회용 코드가 자격증명이다.
function calendarPage(origin, code) {
  var response = UrlFetchApp.fetch(origin + "/api/calendar-sync/claim", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ code: code }),
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) {
    return connectPage(
      "캘린더에 등록하지 못했습니다",
      responseError(response, "요청이 만료됐거나 이미 쓰였습니다. SubSlash에서 다시 눌러 주세요."),
      origin,
      "/subs",
    );
  }

  var plan = JSON.parse(response.getContentText());
  try {
    var written = writeBillingEvents(plan.calendarName, plan.events || []);
    return connectPage(
      "구글 캘린더에 등록했습니다",
      "'" + plan.calendarName + "' 캘린더에 결제일 " + written + "건을 넣었습니다. " +
        "구독을 고친 뒤 SubSlash에서 다시 누르면 이 캘린더를 통째로 새로 씁니다.",
      origin,
      "/subs",
    );
  } catch (error) {
    return connectPage(
      "캘린더에 등록하지 못했습니다",
      String(error.message || error),
      origin,
      "/subs",
    );
  }
}

// 결제일 일정을 전부 다시 쓴다. 미러·백업과 같은 규칙이다 — 합치지 않고 통째로 바꾼다.
function writeBillingEvents(calendarName, events) {
  var calendarId = billingCalendarId(calendarName);
  clearBillingEvents(calendarId);
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    Calendar.Events.insert(
      {
        summary: event.summary,
        description: event.description,
        start: { date: event.start },
        end: { date: event.end },
        recurrence: ["RRULE:" + event.rrule],
        // 결제일에 다른 일정을 잡지 못하게 막지 않는다.
        transparency: "transparent",
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: event.reminderMinutes }],
        },
        // 다시 쓸 때 SubSlash가 만든 일정만 찾아 지우는 표식.
        extendedProperties: { private: { subslash: "1", uid: String(event.uid) } },
      },
      calendarId,
    );
  }
  return events.length;
}

// 전용 캘린더를 찾거나 만든다. 기본 캘린더에 쓰지 않는다 — 그러면 지울 때 하나씩 지워야 한다.
function billingCalendarId(calendarName) {
  var properties = PropertiesService.getUserProperties();
  var saved = properties.getProperty("calendarId");
  if (saved) {
    try {
      return Calendar.Calendars.get(saved).id;
    } catch (error) {
      // 사용자가 캘린더를 지웠다. 아래에서 다시 만든다.
      properties.deleteProperty("calendarId");
    }
  }

  var list = Calendar.CalendarList.list({ maxResults: 250 }).items || [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].summary === calendarName && list[i].accessRole === "owner") {
      properties.setProperty("calendarId", list[i].id);
      return list[i].id;
    }
  }

  var created = Calendar.Calendars.insert({ summary: calendarName, timeZone: "Asia/Seoul" });
  properties.setProperty("calendarId", created.id);
  return created.id;
}

// 전에 SubSlash가 쓴 일정만 지운다. 같은 캘린더에 사용자가 직접 넣은 일정은 남는다.
function clearBillingEvents(calendarId) {
  var pageToken = null;
  do {
    var page = Calendar.Events.list(calendarId, {
      privateExtendedProperty: "subslash=1",
      showDeleted: false,
      maxResults: 250,
      pageToken: pageToken,
    });
    var items = page.items || [];
    for (var i = 0; i < items.length; i++) {
      Calendar.Events.remove(calendarId, items[i].id);
    }
    pageToken = page.nextPageToken;
  } while (pageToken);
}

// backPath는 '돌아가기'가 열 SubSlash 화면이다. 캘린더는 버튼이 있던 '내 구독'으로 돌려보낸다.
function connectPage(title, message, origin, backPath) {
  var back = origin
    ? '<p><a href="' + escapeHtml(origin + (backPath || "/import")) + '" target="_top" ' +
      'style="display:inline-block;padding:12px 20px;border-radius:10px;background:#18181b;color:#fff;text-decoration:none;font-weight:700">' +
      "SubSlash로 돌아가기</a></p>"
    : "";
  return HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;line-height:1.6;padding:8px">' +
      "<h2>" + escapeHtml(title) + "</h2><p>" + escapeHtml(message) + "</p>" + back +
      "</div>",
  )
    .setTitle("SubSlash Gmail 연결")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

`;

/**
 * 운영자가 배포할 원클릭 연결 웹 앱 코드. `origins`는 연결을 받아 줄 SubSlash 배포 주소들이다
 * (끝의 `/` 없이). `pnpm --filter @subslash/web gmail:web-app`이 파일로 써 준다.
 */
export function gmailConnectWebApp(origins: string[]): string {
  return CONNECT_WEB_APP.replace("__ORIGINS__", () => JSON.stringify(origins)) + MAIL_HELPERS;
}

/** 사용자가 Apps Script 편집기에 붙여 넣을 코드. 가져오기 주소는 지금 보고 있는 SubSlash다. */
export function gmailAppsScript(importUrl: string): string {
  return MANUAL_SCRIPT.replace("__IMPORT_URL__", () => JSON.stringify(importUrl)) + MAIL_HELPERS;
}

/**
 * 자동 가져오기 스크립트. 연결 토큰이 들어가므로 발급 직후 화면에서만 만든다 — 서버는 토큰을 다시
 * 보여줄 수 없다(해시만 남는다).
 */
export function gmailAutoScript(ingestUrl: string, token: string): string {
  return (
    AUTO_SCRIPT.replace("__INGEST_URL__", () => JSON.stringify(ingestUrl)).replace(
      "__TOKEN__",
      () => JSON.stringify(token),
    ) + MAIL_HELPERS
  );
}
