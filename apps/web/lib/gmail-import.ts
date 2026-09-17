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

  if (typeof data !== "object" || data === null) throw new GmailImportError();
  const { v, emails } = data as { v?: unknown; emails?: unknown };
  if (v !== 1 || !Array.isArray(emails)) throw new GmailImportError();

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
const SCRIPT_TEMPLATE = String.raw`/**
 * SubSlash — Gmail 결제 메일 가져오기
 *
 * 내 Google 계정 안에서만 돕니다. 찾은 메일은 SubSlash 서버로 보내지 않고,
 * 'SubSlash로 가져오기' 버튼 주소의 # 뒤에 담겨 내 브라우저에서만 읽힙니다.
 * 권한은 메일 읽기(gmail.readonly)뿐이라 메일을 보내거나 지울 수 없습니다.
 */

var SUBSLASH_IMPORT_URL = __IMPORT_URL__;

// 찾을 메일. Gmail 검색창과 같은 문법입니다. 빠지는 결제 메일이 있으면 단어를 더하세요.
var SEARCH_QUERY =
  "newer_than:400d (결제 OR 영수증 OR 청구 OR 구독 OR 멤버십 OR receipt OR invoice OR subscription OR payment)";
var MAX_MESSAGES = 60;
var MAX_BODY_CHARS = 1500;

function doGet() {
  var emails = collectReceiptEmails();
  var body;
  if (emails.length === 0) {
    body =
      "<h2>결제 메일을 찾지 못했습니다</h2>" +
      "<p>스크립트의 SEARCH_QUERY에 결제 메일 제목에 들어가는 단어를 더한 뒤 다시 배포해 보세요.</p>";
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

function collectReceiptEmails() {
  var list = Gmail.Users.Messages.list("me", { q: SEARCH_QUERY, maxResults: MAX_MESSAGES });
  var refs = list.messages || [];
  return refs.map(function (ref) {
    var message = Gmail.Users.Messages.get("me", ref.id, { format: "full" });
    var headers = message.payload.headers || [];
    return {
      from: headerValue(headers, "From"),
      subject: headerValue(headers, "Subject"),
      date: new Date(Number(message.internalDate)).toISOString(),
      body: messageText(message.payload).slice(0, MAX_BODY_CHARS),
    };
  });
}

function encodeEmails(emails) {
  var json = JSON.stringify({ v: 1, emails: emails });
  var gzipped = Utilities.gzip(Utilities.newBlob(json, "application/json"));
  return Utilities.base64EncodeWebSafe(gzipped.getBytes()).replace(/=+$/, "");
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

/** 사용자가 Apps Script 편집기에 붙여 넣을 코드. 가져오기 주소는 지금 보고 있는 SubSlash다. */
export function gmailAppsScript(importUrl: string): string {
  return SCRIPT_TEMPLATE.replace("__IMPORT_URL__", () => JSON.stringify(importUrl));
}
