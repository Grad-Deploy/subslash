/**
 * Apps Script 쪽에서 결제 메일을 찾아 읽는 함수들. 세 스크립트(복사·자동·원클릭 웹 앱) 끝에 그대로 붙는다.
 */

// 두 스크립트가 함께 쓰는 메일 읽기. 스크립트마다 MAX_BODY_CHARS를 정해 둔다.
export const MAIL_HELPERS = String.raw`function collectReceiptEmails(queries, maxMessages) {
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
  var ids = refs.map(function (ref) {
    return ref.id;
  });
  var messages = PARALLEL_FETCH
    ? fetchMessagesParallel(ids)
    : ids.map(function (id) {
        return withGmailQuota(function () {
          return Gmail.Users.Messages.get("me", id, { format: "full" });
        });
      });
  return messages.map(function (message) {
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

// 메일을 한 통씩 받으면 200통에 200번을 차례로 왕복해 1분 넘게 걸립니다(받은 메일을 읽는 것은
// 1초도 안 걸립니다). 외부 요청 권한이 있는 스크립트는 Gmail API를 여러 통씩 한꺼번에 부릅니다.
// Gmail은 사람마다 1초에 쓸 수 있는 양도 정해 두어(메일 한 통 읽기가 5, 한도 250), 한 번에
// 너무 많이 부르면 거절합니다. 그래서 묶음을 작게 두고, 거절된 것만 기다렸다가 다시 부릅니다.
var PARALLEL_CHUNK = 25;

function fetchMessagesParallel(ids) {
  var token = ScriptApp.getOAuthToken();
  var byId = {};
  var pending = ids.slice();
  for (var attempt = 0; pending.length > 0; attempt++) {
    var retry = [];
    for (var start = 0; start < pending.length; start += PARALLEL_CHUNK) {
      var chunk = pending.slice(start, start + PARALLEL_CHUNK);
      var responses = UrlFetchApp.fetchAll(
        chunk.map(function (id) {
          return {
            url:
              "https://gmail.googleapis.com/gmail/v1/users/me/messages/" +
              encodeURIComponent(id) +
              "?format=full",
            headers: { Authorization: "Bearer " + token },
            muteHttpExceptions: true,
          };
        }),
      );
      for (var i = 0; i < responses.length; i++) {
        var code = responses[i].getResponseCode();
        var text = responses[i].getContentText();
        if (code === 200) {
          byId[chunk[i]] = JSON.parse(text);
        } else if (code === 429 || (code === 403 && /rate ?limit|quota/i.test(text))) {
          retry.push(chunk[i]);
        } else if (code !== 404) {
          // 404는 찾은 뒤 받기 전에 지운 메일입니다. 그 밖의 오류는 그대로 알립니다.
          throw new Error("Gmail에서 메일을 읽지 못했습니다(" + code + ")");
        }
      }
    }
    if (retry.length === 0) break;
    if (attempt >= GMAIL_QUOTA_WAITS_MS.length) throw new Error("Gmail 사용 한도에 걸렸습니다.");
    Utilities.sleep(GMAIL_QUOTA_WAITS_MS[attempt]);
    pending = retry;
  }
  // 찾은 순서를 지킵니다 — 쿼리 순서가 곧 우선순위입니다.
  return ids
    .filter(function (id) {
      return byId[id];
    })
    .map(function (id) {
      return byId[id];
    });
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
