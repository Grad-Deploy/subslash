import { MAIL_HELPERS } from "./mail-helpers";

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
// 실행 기록에 남기는 문구. 스크립트를 받은 SubSlash 화면의 언어로 만들어집니다.
var TEXT = __TEXT__;

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
// SubSlash로 보내려고 외부 요청 권한이 이미 있어, 메일을 여러 통씩 한꺼번에 받습니다.
var PARALLEL_FETCH = true;

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
    throw new Error(TEXT.disconnected);
  }
  if (status !== 200) {
    // 검사 시각을 남기지 않아, 다음 실행 때 같은 기간을 다시 봅니다.
    throw new Error(TEXT.sendFailed.replace("{status}", String(status)));
  }
  properties.setProperty("lastScanAt", String(startedAt));
  Logger.log(TEXT.sent.replace("{count}", String(emails.length)));
}

`;

/**
 * 자동 가져오기 스크립트. 연결 토큰이 들어가므로 발급 직후 화면에서만 만든다 — 서버는 토큰을 다시
 * 보여줄 수 없다(해시만 남는다).
 */
export function gmailAutoScript(
  ingestUrl: string,
  token: string,
  lang: "ko" | "en" = "ko",
): string {
  return (
    AUTO_SCRIPT.replace("__INGEST_URL__", () => JSON.stringify(ingestUrl))
      .replace("__TOKEN__", () => JSON.stringify(token))
      .replace("__TEXT__", () => JSON.stringify(AUTO_TEXT[lang])) + MAIL_HELPERS
  );
}

/** 실행 기록에 남기는 문구. 스크립트를 받은 SubSlash 화면 언어로 넣는다. */
const AUTO_TEXT = {
  ko: {
    disconnected:
      "SubSlash 연결이 끊겼습니다. SubSlash에서 스크립트를 다시 받아 붙여 넣은 뒤 setup을 실행하세요.",
    sendFailed: "SubSlash에 보내지 못했습니다({status}). 다음 실행 때 다시 보냅니다.",
    sent: "결제 메일 {count}통을 SubSlash로 보냈습니다.",
  },
  en: {
    disconnected:
      "SubSlash was disconnected. Get the script again from SubSlash, paste it, then run setup.",
    sendFailed: "Couldn't send to SubSlash ({status}). It will be sent again on the next run.",
    sent: "Sent {count} payment emails to SubSlash.",
  },
};
