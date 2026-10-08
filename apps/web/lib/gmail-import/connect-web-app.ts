import { KNOWN_RECEIPT_SENDER_DOMAINS } from "@subslash/shared";
import { APP_RETURN_SCHEMES } from "../app-return";
import { MAIL_HELPERS } from "./mail-helpers";

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
// ④ 영수증을 보내는 것으로 확인된 서비스의 발신 도메인 — 서비스(KNOWN_SENDER_DOMAINS)가 보낸
//    결제 낱말이 든 메일만 따로 찾습니다. 양이 적어 쇼핑 주문에 밀리지 않으므로, 1년에 한 번 오는
//    연간 구독 영수증이 ①~③의 상한 밖으로 밀려 읽히지 않던 것을 막습니다.
var KNOWN_SENDER_DOMAINS = __SENDER_DOMAINS__;
var SEARCH_QUERIES = [
  "from:(apple.com OR google.com) (영수증 OR receipt OR 주문)",
  "from:(" + KNOWN_SENDER_DOMAINS.join(" OR ") + ") (영수증 OR 결제 OR 청구 OR 구독 OR 갱신 OR receipt OR invoice OR subscription OR payment OR renewal)",
  "category:purchases (구독 OR 멤버십 OR 정기결제 OR 자동결제 OR 이용권 OR subscription OR membership OR renewal)",
  "category:purchases",
  "(영수증 OR 결제 OR 청구 OR 정기결제 OR 구독 OR 멤버십 OR receipt OR invoice OR subscription OR payment)",
];
var FIRST_SCAN_DAYS = 400;
var FIRST_SCAN_MAX_MESSAGES = 200;
var MAX_MESSAGES = 100;
// 연결 화면에서는 최근 메일만 바로 본다 — 월 결제는 한 달 안에 영수증이 오므로 여기서 거의 다
// 잡힌다. 400일치 200통을 다 보는 동안 사용자가 빈 화면에서 기다렸다. 나머지(연간 결제)는
// 화면을 돌려준 뒤 트리거(scanOlder)가 이어서 본다.
var RECENT_DAYS = 40;
var RECENT_MAX_MESSAGES = 60;
// 나머지는 한 번에 400일치를 최신순으로 읽으면 쇼핑 주문이 상한을 채워 오래된 달의 영수증이
// 밀리므로, 기간을 나눠 창마다 따로 상한을 둔다. 창 하나를 1분 간격으로 한 번씩 돌린다 —
// Gmail 사용 한도가 풀리고, 한 번의 실행 시간 제한도 넘지 않는다.
// OLDER_BOUNDS[i]~OLDER_BOUNDS[i+1]일 전이 i번째 창이다.
var OLDER_BOUNDS = [RECENT_DAYS, 130, 250, FIRST_SCAN_DAYS];
var OLDER_WINDOW_MAX_MESSAGES = 80;
var MAX_BODY_CHARS = 1500;
// 연결 코드를 바꾸려고 외부 요청 권한이 이미 있어, 메일을 여러 통씩 한꺼번에 받습니다. 사용자가
// 연결 화면에서 첫 검사가 끝나기를 기다리므로 여기가 가장 중요합니다.
var PARALLEL_FETCH = true;

// SubSlash 앱(모바일)에서 왔는지. 앱은 이 화면을 인앱 브라우저로 열고, 창을 닫으면 앱으로 돌아간다.
// 그래서 앱에서 왔을 때는 웹사이트로 가는 '돌아가기' 링크를 두지 않는다 — 인앱 브라우저 안에서 웹사이트가
// 열려, 웹에 로그인돼 있으면 찾은 구독을 웹이 먼저 받아 가고 앱에는 오지 않는다.
var FROM_APP = false;

// 앱이 돌아올 주소의 스킴(앱 ID). 이 목록에 있는 것만 받는다 — 아무 스킴이나 받으면 이 화면이 남의 앱을
// 여는 데 쓰인다. 있으면 끝 화면이 그 앱을 열고('<스킴>://oauth-done?flow=…'), 막히면 누르는 버튼을 둔다.
// 창을 닫으라는 말만으로는 인앱 브라우저를 닫는 법을 모르는 사람이 화면에 남았다. 주소에는 무엇을
// 마쳤는지(flow)만 싣는다.
var APP_RETURN_SCHEMES = __RETURN_SCHEMES__;
var RETURN_SCHEME = "";
var FLOW = "gmail";

function setClient(client, scheme, flow) {
  FROM_APP = String(client || "") === "app";
  RETURN_SCHEME = FROM_APP && APP_RETURN_SCHEMES.indexOf(String(scheme || "")) !== -1 ? String(scheme) : "";
  FLOW = flow;
}

function appReturnUrl() {
  return RETURN_SCHEME ? RETURN_SCHEME + "://oauth-done?flow=" + encodeURIComponent(FLOW) : "";
}

function doGet(e) {
  var params = (e && e.parameter) || {};
  var origin = String(params.origin || "");
  var flow = String(params.action || "") === "calendar" ? "calendar" : "gmail";
  setClient(params.client, params["return"], flow);
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
  return loadingPage(origin, String(params.code));
}

// 연결과 첫 검사는 15초 넘게 걸린다. doGet이 그동안 붙잡고 있으면 사용자는 빈 화면만 보므로, 먼저
// 로딩 화면을 돌려주고 화면이 google.script.run으로 두 단계(connectAccount → scanRecent)를 부른다.
// 단계가 끝날 때마다 문구를 바꾼다 — 진행률은 알 수 없으므로 지어내지 않는다.
function loadingPage(origin, code) {
  var args = scriptJson([code, origin, FROM_APP ? "app" : "", RETURN_SCHEME]);
  return HtmlService.createHtmlOutput(
    "<style>" +
      "@keyframes subslash-spin{to{transform:rotate(360deg)}}" +
      ".subslash-spinner{width:28px;height:28px;border:3px solid #e4e4e7;border-top-color:#18181b;" +
      "border-radius:50%;animation:subslash-spin .8s linear infinite}" +
      "</style>" +
      '<div id="root" style="font-family:sans-serif;line-height:1.6;padding:8px">' +
      '<div class="subslash-spinner" role="status" aria-label="진행 중"></div>' +
      '<h2 id="step">SubSlash와 연결하는 중</h2>' +
      "<p>창을 닫지 말고 기다려 주세요. 보통 20초 안에 끝납니다.</p>" +
      "</div>" +
      "<script>" +
      "var ARGS = " + args + ";" +
      "var RETURN_URL = " + scriptJson(appReturnUrl()) + ";" +
      // 끝 화면을 보이고 앱으로 돌아가 본다. 인앱 브라우저가 사용자 동작 없는 이동을 막으면 화면의 버튼이 남는다.
      "function show(html) { document.getElementById('root').innerHTML = html; if (RETURN_URL) { try { window.top.location.href = RETURN_URL; } catch (e) {} } }" +
      "function fail(error) { show(" + scriptJson(pageHtml("연결하지 못했습니다", "잠시 뒤 SubSlash에서 다시 연결해 주세요.", origin)) + "); }" +
      "google.script.run.withFailureHandler(fail).withSuccessHandler(function (result) {" +
      "  if (!result.ok) return show(result.html);" +
      "  document.getElementById('step').textContent = " + scriptJson("최근 " + RECENT_DAYS + "일 결제 메일을 확인하는 중") + ";" +
      "  google.script.run.withFailureHandler(fail).withSuccessHandler(show).scanRecent(ARGS[1], ARGS[2], ARGS[3]);" +
      "}).connectAccount(ARGS[0], ARGS[1], ARGS[2], ARGS[3]);" +
      "</script>",
  )
    .setTitle("SubSlash Gmail 연결")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

// 로딩 화면이 부르는 첫 단계. 코드를 토큰으로 바꾸고 2주 검사를 건다. { ok, html }을 돌려준다.
function connectAccount(code, origin, client, scheme) {
  setClient(client, scheme, "gmail");
  if (ALLOWED_ORIGINS.indexOf(origin) === -1) {
    return { ok: false, html: pageHtml("연결할 수 없습니다", "허용되지 않은 주소에서 왔습니다. SubSlash에서 다시 연결해 주세요.", null) };
  }
  var properties = PropertiesService.getUserProperties();
  // 로딩 중에 새로고침하면 이미 쓴 코드로 다시 온다. 그 코드로 이미 연결했으면 다시 바꾸지 않는다.
  if (properties.getProperty("connectCode") === String(code) && properties.getProperty("token")) {
    return { ok: true };
  }

  var response = UrlFetchApp.fetch(origin + "/api/gmail/connect/exchange", {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ code: String(code) }),
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) {
    return {
      ok: false,
      html: pageHtml(
        "연결하지 못했습니다",
        responseError(response, "연결 코드가 만료됐거나 이미 쓰였습니다. SubSlash에서 다시 연결해 주세요."),
        origin,
      ),
    };
  }

  properties.deleteAllProperties();
  properties.setProperties({
    token: JSON.parse(response.getContentText()).token,
    origin: origin,
    connectCode: String(code),
  });
  removeScanTriggers();
  ScriptApp.newTrigger("scan")
    .timeBased()
    .everyWeeks(2)
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();
  return { ok: true };
}

// 로딩 화면이 부르는 둘째 단계. 최근 메일을 보내고 나머지 1년 치를 트리거에 맡긴다. 완료 화면을 돌려준다.
function scanRecent(origin, client, scheme) {
  setClient(client, scheme, "gmail");
  var properties = PropertiesService.getUserProperties();
  if (!properties.getProperty("token") || properties.getProperty("origin") !== origin) {
    return pageHtml("연결하지 못했습니다", "SubSlash에서 다시 연결해 주세요.", ALLOWED_ORIGINS.indexOf(origin) === -1 ? null : origin);
  }
  try {
    // 검사 시각은 나머지까지 다 보낸 뒤(scanOlder)에 남긴다. 그 전에 끊기면 2주 검사가 처음부터 본다.
    properties.setProperty("firstScanStartedAt", String(Date.now()));
    properties.deleteProperty("olderWindow");
    var sent = sendRange(" newer_than:" + RECENT_DAYS + "d", RECENT_MAX_MESSAGES);
    if (sent < 0) {
      return pageHtml("연결이 끊겼습니다", "SubSlash에서 연결을 끊었습니다. 다시 연결해 주세요.", origin);
    }
    ScriptApp.getProjectTriggers().forEach(function (trigger) {
      if (trigger.getHandlerFunction() === "scanOlder") ScriptApp.deleteTrigger(trigger);
    });
    ScriptApp.newTrigger("scanOlder").timeBased().after(60 * 1000).create();
    return pageHtml(
      "Gmail을 연결했습니다",
      "최근 " + RECENT_DAYS + "일 메일 " + sent + "통을 확인했습니다. SubSlash로 돌아가면 찾은 구독이 " +
        "등록됩니다. 1년 치 나머지(연간 결제)는 몇 분 안에 이어서 확인하고, 앞으로 2주마다 새 결제 " +
        "메일을 확인합니다.",
      origin,
    );
  } catch (error) {
    return pageHtml(
      "Gmail을 연결했습니다",
      "첫 검사는 하지 못해 2주 뒤 검사 때 다시 합니다(" + error.message + ").",
      origin,
    );
  }
}

// <script> 안에 값을 넣는다. '</script>'로 스크립트를 닫지 못하게 '<'를 바꾼다.
function scriptJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

// 연결한 직후 도는 트리거. 첫 검사의 나머지(40일 앞 ~ 400일)를 창(OLDER_BOUNDS) 하나씩 보내고, 다음
// 창을 1분 뒤로 건다. 마지막 창까지 보낸 뒤에 검사 시각을 남긴다. 서버는 같은 서비스의 더 최근
// 영수증을 옛 영수증으로 덮지 않으므로 나눠 보내도 된다.
function scanOlder() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "scanOlder") ScriptApp.deleteTrigger(trigger);
  });
  var properties = PropertiesService.getUserProperties();
  var startedAt = Number(properties.getProperty("firstScanStartedAt") || 0);
  if (!startedAt || properties.getProperty("lastScanAt")) return;
  var index = Number(properties.getProperty("olderWindow") || 0);
  if (!(index >= 0 && index < OLDER_BOUNDS.length - 1)) index = 0;
  var sent = sendRange(
    " newer_than:" + OLDER_BOUNDS[index + 1] + "d older_than:" + OLDER_BOUNDS[index] + "d",
    OLDER_WINDOW_MAX_MESSAGES,
  );
  if (sent < 0) return;
  if (index + 1 < OLDER_BOUNDS.length - 1) {
    properties.setProperty("olderWindow", String(index + 1));
    ScriptApp.newTrigger("scanOlder").timeBased().after(60 * 1000).create();
    return;
  }
  properties.setProperty("lastScanAt", String(startedAt));
  properties.deleteProperty("firstScanStartedAt");
  properties.deleteProperty("olderWindow");
}

// 기간 조건(range)을 붙여 찾은 메일을 SubSlash로 보낸다. 보낸 메일 수를 돌려주고, 연결이 끊겼으면
// 검사를 멈추고 -1을 돌려준다. 그 밖의 실패는 던진다.
function sendRange(range, maxMessages) {
  var properties = PropertiesService.getUserProperties();
  var token = properties.getProperty("token");
  var origin = properties.getProperty("origin");
  if (!token || ALLOWED_ORIGINS.indexOf(origin) === -1) {
    removeScanTriggers();
    return -1;
  }
  var emails = collectReceiptEmails(
    SEARCH_QUERIES.map(function (query) {
      return query + range;
    }),
    maxMessages,
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
    return -1;
  }
  if (status !== 200) throw new Error("SubSlash에 보내지 못했습니다(" + status + ")");
  return emails.length;
}

// 2주마다 트리거가 부른다. 보낸 메일 수를 돌려준다. 첫 검사를 다 끝내지 못했으면(scanOlder가
// 돌지 못함) 400일치를 처음부터 본다.
function scan() {
  var properties = PropertiesService.getUserProperties();
  var lastScanAt = Number(properties.getProperty("lastScanAt") || 0);
  var startedAt = Date.now();
  var range = lastScanAt
    ? " after:" + Math.floor(lastScanAt / 1000)
    : " newer_than:" + FIRST_SCAN_DAYS + "d";
  // 실패하면 던져서 검사 시각을 남기지 않는다 — 다음 실행 때 같은 기간을 다시 본다.
  var sent = sendRange(range, lastScanAt ? MAX_MESSAGES : FIRST_SCAN_MAX_MESSAGES);
  if (sent < 0) return 0;
  properties.setProperty("lastScanAt", String(startedAt));
  properties.deleteProperty("firstScanStartedAt");
  properties.deleteProperty("olderWindow");
  return sent;
}

function removeScanTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    var handler = trigger.getHandlerFunction();
    if (handler === "scan" || handler === "scanOlder") ScriptApp.deleteTrigger(trigger);
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
    var written = writeBillingEvents(
      plan.calendarName,
      plan.calendarNames || [plan.calendarName],
      plan.events || [],
    );
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
function writeBillingEvents(calendarName, knownNames, events) {
  var calendarId = billingCalendarId(calendarName, knownNames);
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
function billingCalendarId(calendarName, knownNames) {
  var properties = PropertiesService.getUserProperties();
  var saved = properties.getProperty("calendarId");
  if (saved) {
    try {
      return renameIfNeeded(Calendar.Calendars.get(saved), calendarName);
    } catch (error) {
      // 사용자가 캘린더를 지웠다. 아래에서 다시 만든다.
      properties.deleteProperty("calendarId");
    }
  }

  var list = Calendar.CalendarList.list({ maxResults: 250 }).items || [];
  for (var i = 0; i < list.length; i++) {
    if (knownNames.indexOf(list[i].summary) >= 0 && list[i].accessRole === "owner") {
      properties.setProperty("calendarId", list[i].id);
      return renameIfNeeded(list[i], calendarName);
    }
  }

  var created = Calendar.Calendars.insert({ summary: calendarName, timeZone: "Asia/Seoul" });
  properties.setProperty("calendarId", created.id);
  return created.id;
}

// 다른 언어로 등록했던 SubSlash 캘린더면 이번에 등록한 언어의 이름으로 바꾼다. 일정은 그대로 다시 쓴다.
function renameIfNeeded(calendar, calendarName) {
  if (calendar.summary !== calendarName) {
    Calendar.Calendars.patch({ summary: calendarName }, calendar.id);
  }
  return calendar.id;
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
  var returnUrl = appReturnUrl();
  return HtmlService.createHtmlOutput(
    '<div style="font-family:sans-serif;line-height:1.6;padding:8px">' +
      pageHtml(title, message, origin, backPath) +
      "</div>" +
      // 로딩 화면과 같이 앱으로 돌아가 본다. 막히면 버튼이 남는다.
      (returnUrl
        ? "<script>try { window.top.location.href = " + scriptJson(returnUrl) + "; } catch (e) {}</script>"
        : ""),
  )
    // 캘린더 등록도 이 화면을 쓴다. 제목줄(인앱 브라우저·탭)이 'Gmail 연결'이면 무엇을 한 화면인지 헷갈린다.
    .setTitle(FLOW === "calendar" ? "SubSlash 캘린더 등록" : "SubSlash Gmail 연결")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

// 결과 화면의 내용. 로딩 화면은 이 HTML로 자기 내용을 바꾼다.
function pageHtml(title, message, origin, backPath) {
  var returnUrl = appReturnUrl();
  var back = returnUrl
    ? '<p><a href="' + escapeHtml(returnUrl) + '" target="_top" ' +
      'style="display:inline-block;padding:12px 20px;border-radius:10px;background:#18181b;color:#fff;text-decoration:none;font-weight:700">' +
      "SubSlash 앱으로 돌아가기</a></p>" +
      '<p style="color:#71717a;font-size:14px">버튼이 열리지 않으면 이 창을 닫아도 앱으로 돌아갑니다.</p>'
    : FROM_APP
    ? '<p style="font-weight:700">이 창을 닫으면 SubSlash 앱으로 돌아갑니다.</p>'
    : origin
      ? '<p><a href="' + escapeHtml(origin + (backPath || "/import")) + '" target="_top" ' +
        'style="display:inline-block;padding:12px 20px;border-radius:10px;background:#18181b;color:#fff;text-decoration:none;font-weight:700">' +
        "SubSlash로 돌아가기</a></p>"
      : "";
  return "<h2>" + escapeHtml(title) + "</h2><p>" + escapeHtml(message) + "</p>" + back;
}

`;

/**
 * 운영자가 배포할 원클릭 연결 웹 앱 코드. `origins`는 연결을 받아 줄 SubSlash 배포 주소들이다
 * (끝의 `/` 없이). `pnpm --filter @subslash/web gmail:web-app`이 파일로 써 준다.
 */
export function gmailConnectWebApp(origins: string[]): string {
  return (
    CONNECT_WEB_APP.replace("__ORIGINS__", () => JSON.stringify(origins))
      .replace("__SENDER_DOMAINS__", () => JSON.stringify(KNOWN_RECEIPT_SENDER_DOMAINS))
      .replace("__RETURN_SCHEMES__", () => JSON.stringify(APP_RETURN_SCHEMES)) + MAIL_HELPERS
  );
}
