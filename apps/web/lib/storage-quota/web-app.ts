/**
 * 'Google 계정 용량 확인' 웹 앱. SubSlash 운영자가 Gmail 연결 웹 앱과 **다른** Apps Script 프로젝트로 한 번
 * 배포한다(실행: 웹 앱에 액세스하는 사용자). Gmail 연결 웹 앱에 드라이브 권한을 더하면, 이미 연결한 사람은
 * 그 권한에 동의하지 않은 채라 2주 검사 트리거가 권한 오류로 멈출 수 있어 따로 둔다.
 *
 * 권한은 drive.file 하나다 — Drive의 about.get(storageQuota)은 이 권한으로 읽힌다(2026년 10월 시험 배포에서
 * 확인). 파일 목록·이름·내용은 읽지 않는다. 읽은 숫자는 그 사람의 화면에만 보여 주고 SubSlash로 보내지
 * 않는다 — 그래서 SubSlash 주소도, 돌아가는 링크도 없다(앱의 인앱 브라우저에 웹사이트를 열지 않게).
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

export const STORAGE_QUOTA_WEB_APP = String.raw`/**
 * SubSlash — Google 계정 용량 확인 웹 앱
 *
 * SubSlash 운영자가 한 번 배포합니다(실행: 웹 앱에 액세스하는 사용자, 액세스: Google 계정이 있는 모든
 * 사용자). SubSlash의 체크인에서 'Google 계정에서 확인'을 누르면 이 화면이 열리고, 접속한 사람의 계정
 * 저장 용량(한도·사용량)만 읽어 보여 줍니다. 읽은 값은 어디로도 보내지 않습니다.
 *
 * 이 파일은 SubSlash 저장소의 apps/web/lib/storage-quota/web-app.ts에서 만들어집니다. 여기서 고치지 마세요.
 */

function doGet(e) {
  var fromApp = String((e && e.parameter && e.parameter.client) || "") === "app";
  var html;
  try {
    var quota = Drive.About.get({ fields: "storageQuota" }).storageQuota || {};
    html = resultHtml(summarize(quota), fromApp);
  } catch (error) {
    html = page(
      "용량을 읽지 못했습니다",
      "<p>Google에서 저장 용량을 받지 못했습니다. 잠시 뒤 다시 열어 주세요.</p>" +
        "<p class='note'>" + escapeHtml(String((error && error.message) || error)) + "</p>",
      fromApp,
    );
  }
  return HtmlService.createHtmlOutput(html)
    .setTitle("Google 계정 용량 확인 — SubSlash")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

// Drive API는 바이트를 문자열(int64)로 줍니다. 없으면(무제한 등) null입니다.
function toNumber(value) {
  if (value === undefined || value === null || value === "") return null;
  var n = Number(value);
  return isFinite(n) ? n : null;
}

function summarize(quota) {
  var limit = toNumber(quota.limit);
  var usage = toNumber(quota.usage);
  var percent = limit && usage !== null ? (usage / limit) * 100 : null;
  return {
    limit: limit,
    usage: usage,
    usageInDrive: toNumber(quota.usageInDrive),
    percent: percent,
    // SubSlash 체크인은 정수 %를 받습니다. 0%는 '아무것도 두지 않음'이라, 조금이라도 쓰면 1% 이상으로 적습니다.
    checkIn: percent === null ? null : usage > 0 ? Math.min(100, Math.max(1, Math.round(percent))) : 0,
  };
}

// Google One은 1024 단위로 셉니다(5TB 요금제의 한도는 5,120GB로 나옵니다).
function formatBytes(bytes) {
  if (bytes === null) return "모름";
  var gb = bytes / Math.pow(1024, 3);
  if (gb >= 1024) {
    var tb = gb / 1024;
    return (Math.round(tb * 10) / 10) + "TB";
  }
  if (gb >= 10) return Math.round(gb) + "GB";
  return (Math.round(gb * 100) / 100) + "GB";
}

function formatPercent(percent) {
  if (percent === null) return "모름";
  if (percent > 0 && percent < 1) return "1% 미만 (" + (Math.round(percent * 100) / 100) + "%)";
  return Math.round(percent * 10) / 10 + "%";
}

function resultHtml(s, fromApp) {
  var rows = [
    ["이 계정의 저장 한도", formatBytes(s.limit)],
    ["쓰는 양 (Gmail·포토·드라이브 합계)", formatBytes(s.usage)],
    ["그중 드라이브", formatBytes(s.usageInDrive)],
    ["한도 중 쓰는 비율", formatPercent(s.percent)],
  ];
  var table =
    "<table>" +
    rows
      .map(function (row) {
        return "<tr><td>" + escapeHtml(row[0]) + "</td><td>" + escapeHtml(row[1]) + "</td></tr>";
      })
      .join("") +
    "</table>";
  var answer =
    s.checkIn === null
      ? "<p class='box'>이 계정은 한도가 정해져 있지 않아 비율을 셀 수 없습니다. 체크인에 비율을 적지 마세요.</p>"
      : "<p class='box'>SubSlash 체크인에 <b>" + s.checkIn + "%</b>를 적어 주세요.</p>";
  return page(
    "Google 계정 용량",
    table +
      answer +
      "<p class='note'>한도가 SubSlash에 등록한 요금제 용량(예: 2TB)과 다르면, 가족 요금제의 전체 용량이거나 " +
      "회사·학교 계정의 한도일 수 있습니다. 그때는 이 비율이 내 요금제의 비율이 아니니 적지 마세요.</p>" +
      "<p class='note'>이 화면은 저장 용량 숫자만 읽고, SubSlash를 포함해 어디로도 보내지 않습니다.</p>",
    fromApp,
  );
}

function page(title, body, fromApp) {
  return (
    "<!doctype html><html><head><meta charset='utf-8'>" +
    "<meta name='viewport' content='width=device-width, initial-scale=1'>" +
    "<style>body{font-family:system-ui,-apple-system,sans-serif;margin:16px;line-height:1.6;color:#111}" +
    "h1{font-size:20px}table{border-collapse:collapse;width:100%}" +
    "td{border-bottom:1px solid #e5e5e5;padding:8px 4px;vertical-align:top}td:first-child{color:#555;width:55%}" +
    ".box{background:#f4f4f5;border-radius:12px;padding:12px;margin:16px 0}" +
    ".note{color:#666;font-size:13px}</style></head><body>" +
    "<h1>" + escapeHtml(title) + "</h1>" +
    body +
    "<p class='note'>" +
    (fromApp ? "창을 닫으면 앱으로 돌아갑니다." : "이 탭을 닫고 SubSlash로 돌아가 주세요.") +
    "</p></body></html>"
  );
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
