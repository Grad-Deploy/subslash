import { APP_RETURN_SCHEMES } from "../app-return";

/**
 * 'Google 계정 용량 확인' 웹 앱. SubSlash 운영자가 Gmail 연결 웹 앱과 **다른** Apps Script 프로젝트로 한 번
 * 배포한다(실행: 웹 앱에 액세스하는 사용자). Gmail 연결 웹 앱에 드라이브 권한을 더하면, 이미 연결한 사람은
 * 그 권한에 동의하지 않은 채라 2주 검사 트리거가 권한 오류로 멈출 수 있어 따로 둔다.
 *
 * 권한은 drive.file 하나다 — Drive의 about.get(storageQuota)은 이 권한으로 읽힌다(2026년 10월 시험 배포에서
 * 확인). 파일 목록·이름·내용은 읽지 않는다. 읽은 한도·사용량은 SubSlash 서버로 보내지 않고 연 사람의 화면으로만
 * 돌려준다: 앱은 돌아오는 주소(`<앱 ID>://oauth-done?flow=storage&…`, lib/app-return), 웹은 SubSlash의
 * 끝 화면(`/storage-quota/done#…`) — `#` 뒤는 브라우저가 서버로 보내지 않는다.
 */
export const STORAGE_QUOTA_WEB_APP_MANIFEST = `${JSON.stringify(
  {
    timeZone: "Asia/Seoul",
    runtimeVersion: "V8",
    exceptionLogging: "STACKDRIVER",
    oauthScopes: ["https://www.googleapis.com/auth/drive.file"],
    dependencies: {
      enabledAdvancedServices: [{ userSymbol: "Drive", serviceId: "drive", version: "v3" }],
    },
    webapp: { executeAs: "USER_ACCESSING", access: "ANYONE" },
  },
  null,
  2,
)}
`;

const STORAGE_QUOTA_WEB_APP = String.raw`/**
 * SubSlash — Google 계정 용량 확인 웹 앱
 *
 * SubSlash 운영자가 한 번 배포합니다(실행: 웹 앱에 액세스하는 사용자, 액세스: Google 계정이 있는 모든
 * 사용자). SubSlash의 구글 원 체크인에서 '사용량 측정'을 누르면 이 화면이 열리고, 접속한 사람의 계정
 * 저장 용량(한도·사용량)만 읽어 그 사람의 SubSlash 화면으로 돌려줍니다. SubSlash 서버로는 보내지 않습니다.
 *
 * 이 파일은 SubSlash 저장소의 apps/web/lib/storage-quota/web-app.ts에서 만들어집니다. 여기서 고치지 마세요.
 */

// 값을 돌려줄 SubSlash 주소. 이 목록에 없는 주소로는 돌려주지 않고 화면에만 보여 줍니다.
var ALLOWED_ORIGINS = __ORIGINS__;
// 앱이 돌아올 주소의 스킴(앱 ID). 아무 스킴이나 받으면 이 화면이 남의 앱을 여는 데 쓰입니다.
var APP_RETURN_SCHEMES = __RETURN_SCHEMES__;

// 화면 언어. SubSlash가 화면 언어를 주소에 싣는다(lang=en). 모르는 값은 한국어다.
var LANG = "ko";

// 화면 문구. SubSlash 화면 언어(한국어·영어)를 따른다.
var TEXT = {
  ko: {
    readFailedTitle: "용량을 읽지 못했습니다",
    readFailed: "Google에서 저장 용량을 받지 못했습니다. 잠시 뒤 다시 측정해 주세요.",
    back: "SubSlash로 돌아가기",
    pageTitle: "Google 계정 용량 측정 — SubSlash",
    unknown: "모름",
    underOne: "1% 미만",
    limit: "이 계정의 저장 한도",
    usage: "쓰는 양 (Gmail·포토·드라이브 합계)",
    drive: "그중 드라이브",
    percent: "한도 중 쓰는 비율",
    resultTitle: "Google 계정 용량",
    fill: "SubSlash 체크인에 채우기",
    privacy: "이 화면은 저장 용량 숫자만 읽고, SubSlash 서버를 포함해 어디로도 보내지 않습니다.",
    buttonBlocked: "버튼이 열리지 않으면 이 창을 닫고 위의 비율을 직접 적어 주세요.",
    closeToApp: "창을 닫으면 앱으로 돌아갑니다. 위의 비율을 체크인에 적어 주세요.",
    closeTab: "이 탭을 닫고 SubSlash로 돌아가 위의 비율을 체크인에 적어 주세요.",
  },
  en: {
    readFailedTitle: "Couldn't read your storage",
    readFailed: "Google didn't return your storage quota. Please measure again in a moment.",
    back: "Back to SubSlash",
    pageTitle: "Google account storage — SubSlash",
    unknown: "Unknown",
    underOne: "Under 1%",
    limit: "Storage limit of this account",
    usage: "Used (Gmail, Photos and Drive combined)",
    drive: "Of which Drive",
    percent: "Share of the limit used",
    resultTitle: "Google account storage",
    fill: "Fill in my SubSlash check-in",
    privacy: "This page only reads your storage numbers and doesn't send them anywhere, including SubSlash's servers.",
    buttonBlocked: "If the button doesn't open, close this window and enter the share above yourself.",
    closeToApp: "Close this window to go back to the app, then enter the share above in your check-in.",
    closeTab: "Close this tab, go back to SubSlash and enter the share above in your check-in.",
  },
};

function t() {
  return TEXT[LANG];
}

function doGet(e) {
  var params = (e && e.parameter) || {};
  LANG = String(params.lang || "") === "en" ? "en" : "ko";
  var fromApp = String(params.client || "") === "app";
  var scheme = APP_RETURN_SCHEMES.indexOf(String(params["return"] || "")) !== -1 ? String(params["return"]) : "";
  var origin = ALLOWED_ORIGINS.indexOf(String(params.origin || "")) !== -1 ? String(params.origin) : "";
  // 여러 번 누른 측정끼리 섞이지 않게 SubSlash가 만든 값. 글자·숫자만 받습니다.
  var state = /^[A-Za-z0-9_-]{8,64}$/.test(String(params.state || "")) ? String(params.state) : "";

  var quota = null;
  var error = "";
  try {
    quota = summarize(Drive.About.get({ fields: "storageQuota" }).storageQuota || {});
  } catch (err) {
    error = String((err && err.message) || err);
  }

  var result = { state: state };
  if (quota) {
    result.usage = quota.usage === null ? "" : String(quota.usage);
    result.limit = quota.limit === null ? "" : String(quota.limit);
  } else {
    result.error = "1";
  }
  var returnUrl = fromApp ? (scheme ? appReturnUrl(scheme, result) : "") : origin ? webReturnUrl(origin, result) : "";

  var html = quota
    ? resultHtml(quota, returnUrl, fromApp)
    : page(
        t().readFailedTitle,
        "<p>" + escapeHtml(t().readFailed) + "</p>" +
          "<p class='note'>" + escapeHtml(error) + "</p>" +
          backButton(returnUrl, fromApp, t().back),
        fromApp,
      );
  // 결과를 들고 곧바로 SubSlash로 돌아가 본다. 사용자 동작 없는 이동을 막는 브라우저에서는 화면의 버튼이 남는다.
  if (returnUrl) {
    html += "<script>try { window.top.location.href = " + scriptJson(returnUrl) + "; } catch (e) {}</script>";
  }
  return HtmlService.createHtmlOutput(html)
    .setTitle(t().pageTitle)
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function query(result) {
  var parts = ["flow=storage"];
  for (var key in result) {
    if (result[key] !== undefined && result[key] !== "") parts.push(key + "=" + encodeURIComponent(result[key]));
  }
  return parts.join("&");
}

function appReturnUrl(scheme, result) {
  return scheme + "://oauth-done?" + query(result);
}

// 값은 '#' 뒤에만 싣는다 — '?'에 실으면 SubSlash 서버(접속 기록)로 간다.
function webReturnUrl(origin, result) {
  return origin + "/storage-quota/done#" + query(result);
}

// Drive API는 바이트를 문자열(int64)로 줍니다. 없으면(무제한 등) null입니다.
function toNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  var n = Number(value);
  return isFinite(n) && n >= 0 ? n : null;
}

function summarize(quota) {
  var limit = toNumber(quota.limit);
  var usage = toNumber(quota.usage);
  return {
    limit: limit,
    usage: usage,
    usageInDrive: toNumber(quota.usageInDrive),
    percent: limit && usage !== null ? (usage / limit) * 100 : null,
  };
}

// Google One은 1024 단위로 셉니다(5TB 요금제의 한도는 5,120GB로 나옵니다).
function formatBytes(bytes) {
  if (bytes === null) return t().unknown;
  var gb = bytes / Math.pow(1024, 3);
  if (gb >= 1024) return Math.round((gb / 1024) * 10) / 10 + "TB";
  if (gb >= 10) return Math.round(gb) + "GB";
  return Math.round(gb * 100) / 100 + "GB";
}

function formatPercent(percent) {
  if (percent === null) return t().unknown;
  if (percent > 0 && percent < 1) return t().underOne;
  return Math.round(percent * 10) / 10 + "%";
}

function resultHtml(s, returnUrl, fromApp) {
  var rows = [
    [t().limit, formatBytes(s.limit)],
    [t().usage, formatBytes(s.usage)],
    [t().drive, formatBytes(s.usageInDrive)],
    [t().percent, formatPercent(s.percent)],
  ];
  var table =
    "<table>" +
    rows
      .map(function (row) {
        return "<tr><td>" + escapeHtml(row[0]) + "</td><td>" + escapeHtml(row[1]) + "</td></tr>";
      })
      .join("") +
    "</table>";
  return page(
    t().resultTitle,
    table +
      backButton(returnUrl, fromApp, t().fill) +
      "<p class='note'>" + escapeHtml(t().privacy) + "</p>",
    fromApp,
  );
}

// 돌아갈 곳을 모르면(예전 앱, 허용하지 않은 주소) 숫자만 보여 주고 직접 적게 한다.
function backButton(returnUrl, fromApp, label) {
  if (returnUrl) {
    return (
      "<p><a class='button' href='" + escapeHtml(returnUrl) + "' target='_top'>" + escapeHtml(label) + "</a></p>" +
      (fromApp ? "<p class='note'>" + escapeHtml(t().buttonBlocked) + "</p>" : "")
    );
  }
  return (
    "<p class='note'>" + escapeHtml(fromApp ? t().closeToApp : t().closeTab) + "</p>"
  );
}

function page(title, body, fromApp) {
  return (
    "<!doctype html><html lang='" + LANG + "'><head><meta charset='utf-8'>" +
    "<meta name='viewport' content='width=device-width, initial-scale=1'>" +
    "<style>body{font-family:system-ui,-apple-system,sans-serif;margin:16px;line-height:1.6;color:#111}" +
    "h1{font-size:20px}table{border-collapse:collapse;width:100%}" +
    "td{border-bottom:1px solid #e5e5e5;padding:8px 4px;vertical-align:top}td:first-child{color:#555;width:55%}" +
    ".button{display:inline-block;margin-top:16px;padding:12px 20px;border-radius:10px;background:#18181b;" +
    "color:#fff;text-decoration:none;font-weight:700}" +
    ".note{color:#666;font-size:13px}</style></head><body>" +
    "<h1>" + escapeHtml(title) + "</h1>" +
    body +
    "</body></html>"
  );
}

// <script> 안에 값을 넣는다. '</script>'로 스크립트를 닫지 못하게 '<'를 바꾼다.
function scriptJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
`;

/**
 * 운영자가 배포할 웹 앱 코드. `origins`는 값을 돌려줄 SubSlash 배포 주소들이다(끝의 `/` 없이).
 * `pnpm --filter @subslash/web storage:web-app`이 파일로 써 준다.
 */
export function storageQuotaWebApp(origins: string[]): string {
  return STORAGE_QUOTA_WEB_APP.replace("__ORIGINS__", () => JSON.stringify(origins)).replace(
    "__RETURN_SCHEMES__",
    () => JSON.stringify(APP_RETURN_SCHEMES),
  );
}
