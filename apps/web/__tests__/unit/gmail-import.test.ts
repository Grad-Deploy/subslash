import { describe, it, expect } from "vitest";
import { gzipSync } from "node:zlib";
import { parseReceiptEmails } from "@subslash/shared";
import {
  GMAIL_APPS_SCRIPT_MANIFEST,
  GmailImportError,
  decodeGmailImport,
  GMAIL_AUTO_SCRIPT_MANIFEST,
  GMAIL_CONNECT_WEB_APP_MANIFEST,
  gmailAppsScript,
  gmailConnectWebApp,
  gmailAutoScript,
  readReceiptEmails,
} from "../../lib/gmail-import";

/**
 * Apps Script는 Google 밖에서 돌릴 수 없다. 스크립트가 쓰는 Gmail API 고급 서비스와 Utilities,
 * HtmlService를 Google 문서에 적힌 모양대로 흉내 내고, 사용자가 붙여 넣을 코드 그대로를 실행해
 * "메일 → 링크 → 브라우저에서 풀기 → 구독 후보"를 이어서 본다.
 */

type Part = {
  mimeType: string;
  headers?: { name: string; value: string }[];
  body?: { data?: string };
  parts?: Part[];
};

const b64url = (text: string, charset = "utf8") =>
  Buffer.from(text, charset as BufferEncoding).toString("base64url");

// 티빙 결제 안내(HTML, EUC-KR) — Windows 코드 페이지 949로 만든 바이트
const TVING_EUC_KR_HTML = Buffer.from(
  "PHA+xry6+SDBpLHisOHBpiC+yLO7PC9wPjxwPrDhwaax3b7XIDogMTMsOTAwv/g8L3A+",
  "base64",
).toString("base64url");

function message(id: string, from: string, subject: string, date: string, payload: Part) {
  return {
    id,
    internalDate: String(new Date(date).getTime()),
    payload: {
      ...payload,
      headers: [
        { name: "From", value: from },
        { name: "Subject", value: subject },
        ...(payload.headers ?? []),
      ],
    },
  };
}

const MESSAGES = [
  message(
    "m1",
    "Netflix <info@account.netflix.com>",
    "넷플릭스 결제 안내",
    "2026-09-10T03:00:00.000Z",
    {
      mimeType: "multipart/alternative",
      parts: [
        { mimeType: "text/plain", body: { data: b64url("브라우저에서 보기") } },
        {
          mimeType: "text/html",
          body: {
            data: b64url(
              "<style>p{color:red}</style><p>결제 금액 : 17,000원</p><p>쿠팡플레이도 만나보세요&nbsp;&amp; 언제든 해지할 수 있습니다</p>",
            ),
          },
        },
      ],
    },
  ),
  message("m2", "TVING <noreply@tving.com>", "티빙 정기결제 안내", "2026-09-03T03:00:00.000Z", {
    mimeType: "text/html",
    headers: [{ name: "Content-Type", value: 'text/html; charset="EUC-KR"' }],
    body: { data: TVING_EUC_KR_HTML },
  }),
];

/**
 * 외부 요청 권한이 있는 스크립트가 메일을 여러 통씩 받을 때 부르는 Gmail REST API. 부른 묶음의 크기를
 * 남기고, `rateLimited`만큼은 한도 초과(429)로 거절한다.
 */
function gmailRest(options: { rateLimited?: number } = {}) {
  let rateLimited = options.rateLimited ?? 0;
  const batches: number[] = [];
  const fetchAll = (requests: { url: string; headers: Record<string, string> }[]) => {
    batches.push(requests.length);
    return requests.map(({ url, headers }) => {
      const id = decodeURIComponent(url.split("/messages/")[1].split("?")[0]);
      const ok = headers.Authorization === "Bearer oauth-token" && rateLimited-- <= 0;
      const body = ok ? MESSAGES.find((m) => m.id === id) : { error: { code: 429 } };
      return {
        getResponseCode: () => (ok ? 200 : 429),
        getContentText: () => JSON.stringify(body),
      };
    });
  };
  return { fetchAll, batches, getOAuthToken: () => "oauth-token" };
}

function runScript(messages: typeof MESSAGES, importUrl = "https://subslash.me/import") {
  const html: string[] = [];
  const blob = (bytes: Buffer) => ({
    getBytes: () => [...bytes],
    getDataAsString: (charset?: string) => new TextDecoder(charset ?? "utf-8").decode(bytes),
  });
  const Utilities = {
    base64DecodeWebSafe: (data: string) => [...Buffer.from(data, "base64url")],
    newBlob: (data: string | number[]) =>
      blob(typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data)),
    gzip: (source: { getBytes: () => number[] }) => blob(gzipSync(Buffer.from(source.getBytes()))),
    // Apps Script는 = 채움까지 붙여 돌려준다.
    base64EncodeWebSafe: (bytes: number[]) => {
      const raw = Buffer.from(bytes).toString("base64url");
      return raw + "=".repeat((4 - (raw.length % 4)) % 4);
    },
  };
  const Gmail = {
    Users: {
      Messages: {
        list: (_user: string, options: { q: string; maxResults: number }) => {
          expect(options.q).toContain("newer_than:400d");
          return { messages: messages.map((m) => ({ id: m.id })) };
        },
        get: (_user: string, id: string) => messages.find((m) => m.id === id),
      },
    },
  };
  const output = {
    setTitle: () => output,
    addMetaTag: () => output,
  };
  const HtmlService = {
    createHtmlOutput: (content: string) => {
      html.push(content);
      return output;
    },
  };

  const doGet = new Function(
    "Gmail",
    "Utilities",
    "HtmlService",
    `${gmailAppsScript(importUrl)}\nreturn doGet;`,
  )(Gmail, Utilities, HtmlService) as () => unknown;
  doGet();
  return html.join("");
}

function linkFrom(html: string): string {
  const href = /href="([^"]+)"/.exec(html)?.[1] ?? "";
  return href.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
}

describe("Gmail Apps Script → /import", () => {
  it("스크립트가 만든 링크를 브라우저에서 풀면 메일에서 구독 후보가 나온다", async () => {
    const link = linkFrom(runScript(MESSAGES));
    expect(link.startsWith("https://subslash.me/import#gmail=")).toBe(true);

    const emails = await decodeGmailImport(link.split("#gmail=")[1]);
    expect(emails.map((e) => e.subject)).toEqual(["넷플릭스 결제 안내", "티빙 정기결제 안내"]);
    // HTML은 글자만 남고, EUC-KR 본문도 한글로 읽힌다.
    expect(emails[0].body).toContain("결제 금액 : 17,000원");
    expect(emails[0].body).not.toContain("<p>");
    expect(emails[0].body).not.toContain("color:red");
    expect(emails[1].body).toContain("결제금액 : 13,900원");

    const found = parseReceiptEmails(emails, { now: new Date("2026-09-15T03:00:00.000Z") });
    expect(found.map((item) => [item.name, item.amount, item.billingDay, item.selected])).toEqual([
      ["넷플릭스", 17000, 10, true],
      ["티빙", 13900, 3, true],
    ]);
  });

  it("찾은 메일이 없으면 링크 대신 검색어를 고치라고 안내한다", () => {
    const html = runScript([]);
    expect(html).not.toContain("href=");
    expect(html).toContain("SEARCH_QUERIES");
  });

  it("가져오기 주소는 스크립트 안에 문자열로 들어간다", () => {
    const script = gmailAppsScript('https://example.com/import"; alert(1); "');
    expect(script).toContain(
      'var SUBSLASH_IMPORT_URL = "https://example.com/import\\"; alert(1); \\"";',
    );
  });

  it("매니페스트는 메일 읽기 권한 하나만 요청하고, 스크립트는 전체 권한이 필요한 GmailApp을 쓰지 않는다", () => {
    const manifest = JSON.parse(GMAIL_APPS_SCRIPT_MANIFEST);
    expect(manifest.oauthScopes).toEqual(["https://www.googleapis.com/auth/gmail.readonly"]);
    expect(manifest.webapp).toEqual({ executeAs: "USER_DEPLOYING", access: "MYSELF" });
    expect(gmailAppsScript("https://subslash.me/import")).not.toContain("GmailApp");
  });
});

describe("decodeGmailImport", () => {
  const encode = (value: unknown) =>
    gzipSync(Buffer.from(JSON.stringify(value), "utf8")).toString("base64url");

  it("망가진 값은 알아볼 수 있는 오류로 알린다", async () => {
    await expect(decodeGmailImport("not-base64!!")).rejects.toBeInstanceOf(GmailImportError);
    await expect(decodeGmailImport(encode(null))).rejects.toBeInstanceOf(GmailImportError);
    await expect(decodeGmailImport(encode({ v: 2, emails: [] }))).rejects.toBeInstanceOf(
      GmailImportError,
    );
  });

  it("글자가 아닌 칸과 날짜 없는 메일은 버리고, 긴 본문은 자른다", async () => {
    const emails = await decodeGmailImport(
      encode({
        v: 1,
        emails: [
          { from: 1, subject: "결제", date: "2026-09-01T00:00:00.000Z", body: "가".repeat(6000) },
          { from: "a", subject: "날짜 없음", body: "본문" },
          "문자열",
        ],
      }),
    );
    expect(emails).toHaveLength(1);
    expect(emails[0].from).toBe("");
    expect(emails[0].body).toHaveLength(5000);
  });
});

describe("자동 가져오기 스크립트", () => {
  type Fetched = { url: string; options: { headers: Record<string, string>; payload: string } };

  function runAutoScript(
    options: {
      status?: number;
      lastScanAt?: string;
      quotaErrors?: number;
      otherError?: string;
      rateLimited?: number;
    } = {},
  ) {
    let quotaErrors = options.quotaErrors ?? 0;
    const rest = gmailRest({ rateLimited: options.rateLimited });
    const singleGets: string[] = [];
    const slept: number[] = [];
    const triggers: { handler: string; weeks?: number; day?: string; hour?: number }[] = [];
    const deleted: string[] = [];
    const properties = new Map<string, string>();
    if (options.lastScanAt) properties.set("lastScanAt", options.lastScanAt);
    const fetched: Fetched[] = [];
    const queries: string[] = [];

    const builder = (handler: string) => {
      const trigger: (typeof triggers)[number] = { handler };
      const chain = {
        timeBased: () => chain,
        everyWeeks: (n: number) => ((trigger.weeks = n), chain),
        onWeekDay: (day: string) => ((trigger.day = day), chain),
        atHour: (hour: number) => ((trigger.hour = hour), chain),
        create: () => triggers.push(trigger),
      };
      return chain;
    };
    const ScriptApp = {
      WeekDay: { MONDAY: "MONDAY" },
      getProjectTriggers: () => [
        { getHandlerFunction: () => "scan", id: "old-scan" },
        { getHandlerFunction: () => "somethingElse", id: "other" },
      ],
      deleteTrigger: (trigger: { id: string }) => deleted.push(trigger.id),
      newTrigger: builder,
      getOAuthToken: rest.getOAuthToken,
    };
    const PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key: string) => properties.get(key) ?? null,
        setProperty: (key: string, value: string) => properties.set(key, value),
      }),
    };
    const UrlFetchApp = {
      fetch: (url: string, init: Fetched["options"]) => {
        fetched.push({ url, options: init });
        return { getResponseCode: () => options.status ?? 200 };
      },
      fetchAll: rest.fetchAll,
    };
    const Gmail = {
      Users: {
        Messages: {
          list: (_user: string, { q }: { q: string }) => {
            if (options.otherError) throw new Error(options.otherError);
            if (quotaErrors > 0) {
              quotaErrors--;
              throw new Error(
                "Quota exceeded for quota metric 'Total Query Cost' and limit 'Units per minute per user'",
              );
            }
            queries.push(q);
            return { messages: MESSAGES.map((m) => ({ id: m.id })) };
          },
          get: (_user: string, id: string) => {
            singleGets.push(id);
            return MESSAGES.find((m) => m.id === id);
          },
        },
      },
    };
    const Utilities = {
      sleep: (ms: number) => slept.push(ms),
      base64DecodeWebSafe: (data: string) => [...Buffer.from(data, "base64url")],
      newBlob: (data: number[]) => ({
        getDataAsString: (charset?: string) =>
          new TextDecoder(charset ?? "utf-8").decode(Buffer.from(data)),
      }),
    };

    const script = gmailAutoScript("https://subslash.me/api/gmail/ingest", "secret-token");
    const api = new Function(
      "Gmail",
      "Utilities",
      "ScriptApp",
      "PropertiesService",
      "UrlFetchApp",
      "Logger",
      `${script}
return { setup: setup, scan: scan };`,
    )(Gmail, Utilities, ScriptApp, PropertiesService, UrlFetchApp, { log: () => undefined }) as {
      setup: () => void;
      scan: () => void;
    };
    return { api, triggers, deleted, properties, fetched, queries, slept, rest, singleGets };
  }

  it("setup은 예전 검사 트리거만 지우고 2주마다 도는 트리거를 건 뒤 바로 한 번 검사한다", () => {
    const run = runAutoScript();
    run.api.setup();

    expect(run.deleted).toEqual(["old-scan"]);
    expect(run.triggers).toEqual([{ handler: "scan", weeks: 2, day: "MONDAY", hour: 9 }]);
    expect(run.fetched).toHaveLength(1);
  });

  it("연결 토큰을 헤더로 실어 메일을 보내고, 서버가 같은 규칙으로 읽을 수 있다", () => {
    const run = runAutoScript();
    run.api.scan();

    const [request] = run.fetched;
    expect(request.url).toBe("https://subslash.me/api/gmail/ingest");
    expect(request.options.headers.Authorization).toBe("Bearer secret-token");
    const emails = readReceiptEmails(JSON.parse(request.options.payload));
    expect(emails?.map((e) => e.subject)).toEqual(["넷플릭스 결제 안내", "티빙 정기결제 안내"]);
  });

  it("'구매' 분류와 결제 낱말을 따로 찾아 합치고, 자리를 나눠 쓴다", () => {
    // 구매 분류만 보면 쇼핑 주문이 상한을 채워 구독 영수증이 밀린다. 반대로 낱말만 보면
    // 광고가 섞인다. 두 쿼리에 자리를 나눠 주고, 같은 메일은 한 번만 읽는다.
    const run = runAutoScript();
    run.api.scan();

    expect(run.queries).toHaveLength(4);
    // 앱스토어·구글 플레이 영수증은 따로, 맨 먼저 찾는다. 다른 갈래와 섞으면 반년 전 연간 구독
    // 영수증(굿노트)이 쇼핑 주문·광고에 밀려 아예 읽히지 않았다.
    expect(run.queries[0]).toBe(
      "from:(apple.com OR google.com) (영수증 OR receipt OR 주문) newer_than:400d",
    );
    expect(run.queries[1]).toContain("category:purchases");
    expect(run.queries[1]).toContain("구독");
    expect(run.queries[2]).toBe("category:purchases newer_than:400d");
    expect(run.queries[3]).not.toContain("category:");
    const emails = readReceiptEmails(JSON.parse(run.fetched[0].options.payload));
    expect(emails?.map((e) => e.subject)).toEqual(["넷플릭스 결제 안내", "티빙 정기결제 안내"]);
  });

  it("Gmail 사용 한도에 걸리면 기다렸다가 다시 불러, 첫 검사를 2주 뒤로 미루지 않는다", () => {
    // 첫 검사는 메일 200통을 읽어 1분 한도(6,000)의 3분의 2를 쓴다. 연결을 다시 누르면 곧바로
    // 한도에 걸렸고, 스크립트가 포기해 '첫 검사는 2주 뒤'라는 안내만 남았다.
    const run = runAutoScript({ quotaErrors: 2 });
    run.api.scan();

    expect(run.slept).toEqual([10000, 30000]);
    expect(run.fetched).toHaveLength(1);
    expect(run.properties.get("lastScanAt")).toBeDefined();
  });

  it("기다려도 풀리지 않거나 한도가 아닌 오류는 그대로 알린다", () => {
    const exhausted = runAutoScript({ quotaErrors: 10 });
    expect(() => exhausted.api.scan()).toThrow("Quota exceeded");
    expect(exhausted.slept).toHaveLength(3);
    expect(exhausted.fetched).toHaveLength(0);

    const other = runAutoScript({ otherError: "Invalid query" });
    expect(() => other.api.scan()).toThrow("Invalid query");
    expect(other.slept).toEqual([]);
  });

  it("메일을 한 통씩이 아니라 여러 통씩 한꺼번에 받는다", () => {
    // 200통을 한 통씩 받으면 200번을 차례로 왕복해 1분 넘게 걸렸다(받은 메일을 읽는 것은 15ms).
    const run = runAutoScript();
    run.api.scan();
    expect(run.singleGets).toEqual([]);
    expect(run.rest.batches).toEqual([MESSAGES.length]);
  });

  it("한꺼번에 받다 한도에 걸린 메일만 기다렸다가 다시 받는다", () => {
    const run = runAutoScript({ rateLimited: 1 });
    run.api.scan();
    expect(run.slept).toEqual([10000]);
    expect(run.rest.batches).toEqual([MESSAGES.length, 1]);
    const emails = readReceiptEmails(JSON.parse(run.fetched[0].options.payload));
    // 다시 받은 메일도 찾은 순서대로 들어간다.
    expect(emails?.map((e) => e.subject)).toEqual(["넷플릭스 결제 안내", "티빙 정기결제 안내"]);
  });

  it("처음에는 400일을 보고, 그 뒤로는 지난 검사 이후 메일만 본다", () => {
    const first = runAutoScript();
    first.api.scan();
    expect(first.queries[0]).toContain("newer_than:400d");
    expect(Number(first.properties.get("lastScanAt"))).toBeGreaterThan(0);

    const later = runAutoScript({ lastScanAt: String(Date.parse("2026-09-01T00:00:00Z")) });
    later.api.scan();
    expect(later.queries[0]).toContain(`after:${Date.parse("2026-09-01T00:00:00Z") / 1000}`);
    expect(later.queries[0]).not.toContain("newer_than");
  });

  it("보내지 못하면 검사 시각을 남기지 않아 다음 실행이 같은 기간을 다시 본다", () => {
    const rejected = runAutoScript({ status: 401, lastScanAt: "1000" });
    expect(() => rejected.api.scan()).toThrow("연결이 끊겼습니다");
    expect(rejected.properties.get("lastScanAt")).toBe("1000");

    const failed = runAutoScript({ status: 500, lastScanAt: "1000" });
    expect(() => failed.api.scan()).toThrow("보내지 못했습니다");
    expect(failed.properties.get("lastScanAt")).toBe("1000");
  });

  it("매니페스트는 메일 읽기·외부 요청·트리거 권한만 쓰고 웹 앱으로 배포하지 않는다", () => {
    const manifest = JSON.parse(GMAIL_AUTO_SCRIPT_MANIFEST);
    expect(manifest.oauthScopes).toEqual([
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/script.external_request",
      "https://www.googleapis.com/auth/script.scriptapp",
    ]);
    expect(manifest.webapp).toBeUndefined();
    expect(gmailAutoScript("https://x/api/gmail/ingest", "t")).not.toContain("GmailApp");
  });
});

describe("원클릭 연결 웹 앱", () => {
  const ORIGIN = "https://www.subslash.me";
  // 서버(`lib/calendar-sync`)가 만들어 보내는 모양. 스크립트는 이 값을 그대로 캘린더에 넣는다.
  const CALENDAR_EVENT = {
    uid: "sub-netflix",
    summary: "💳 넷플릭스 ₩17,000",
    description: "넷플릭스 결제일입니다.",
    start: "2026-09-25",
    end: "2026-09-26",
    rrule: "FREQ=MONTHLY;BYMONTHDAY=25",
    reminderMinutes: 4320,
  };

  function runWebApp(
    options: {
      exchangeStatus?: number;
      ingestStatus?: number;
      claimStatus?: number;
      events?: unknown[];
      calendars?: { id: string; summary: string; accessRole: string }[];
      existingEvents?: { id: string }[];
      stored?: Record<string, string>;
    } = {},
  ) {
    const html: string[] = [];
    const fetched: {
      url: string;
      options: { headers?: Record<string, string>; payload: string };
    }[] = [];
    const triggers: { handler: string; weeks?: number }[] = [];
    const deleted: string[] = [];
    const properties = new Map<string, string>(Object.entries(options.stored ?? {}));
    const calendarList = options.calendars ?? [];
    const insertedCalendars: { summary: string }[] = [];
    const insertedEvents: Record<string, unknown>[] = [];
    const removedEvents: string[] = [];
    const listedEvents: Record<string, unknown>[] = [];
    const rest = gmailRest();

    const builder = (handler: string) => {
      const trigger: (typeof triggers)[number] = { handler };
      const chain = {
        timeBased: () => chain,
        everyWeeks: (n: number) => ((trigger.weeks = n), chain),
        onWeekDay: () => chain,
        atHour: () => chain,
        create: () => triggers.push(trigger),
      };
      return chain;
    };
    const response = (status: number, body: unknown) => ({
      getResponseCode: () => status,
      getContentText: () => JSON.stringify(body),
    });
    const globals = {
      Gmail: {
        Users: {
          Messages: {
            list: () => ({ messages: MESSAGES.map((m) => ({ id: m.id })) }),
            get: (_user: string, id: string) => MESSAGES.find((m) => m.id === id),
          },
        },
      },
      Utilities: {
        base64DecodeWebSafe: (data: string) => [...Buffer.from(data, "base64url")],
        newBlob: (data: number[]) => ({
          getDataAsString: (charset?: string) =>
            new TextDecoder(charset ?? "utf-8").decode(Buffer.from(data)),
        }),
      },
      ScriptApp: {
        WeekDay: { MONDAY: "MONDAY" },
        getProjectTriggers: () => [{ getHandlerFunction: () => "scan", id: "old-scan" }],
        deleteTrigger: (trigger: { id: string }) => deleted.push(trigger.id),
        newTrigger: builder,
        getOAuthToken: rest.getOAuthToken,
      },
      PropertiesService: {
        getUserProperties: () => ({
          getProperty: (key: string) => properties.get(key) ?? null,
          setProperty: (key: string, value: string) => properties.set(key, value),
          setProperties: (values: Record<string, string>) => {
            for (const [key, value] of Object.entries(values)) properties.set(key, value);
          },
          deleteAllProperties: () => properties.clear(),
        }),
      },
      UrlFetchApp: {
        fetch: (url: string, init: { headers?: Record<string, string>; payload: string }) => {
          fetched.push({ url, options: init });
          if (url.endsWith("/api/gmail/connect/exchange")) {
            const status = options.exchangeStatus ?? 200;
            return status === 200
              ? response(200, { token: "issued-token" })
              : response(status, { error: "연결 코드가 만료됐거나 이미 쓰였습니다." });
          }
          if (url.endsWith("/api/calendar-sync/claim")) {
            const status = options.claimStatus ?? 200;
            return status === 200
              ? response(200, {
                  calendarName: "SubSlash 결제일",
                  events: options.events ?? [CALENDAR_EVENT],
                })
              : response(status, { error: "요청이 만료됐거나 이미 쓰였습니다." });
          }
          return response(options.ingestStatus ?? 200, { received: 2, candidates: 2 });
        },
        fetchAll: rest.fetchAll,
      },
      Calendar: {
        Calendars: {
          get: (id: string) => {
            const found = calendarList.find((calendar) => calendar.id === id);
            if (!found) throw new Error("not found");
            return found;
          },
          insert: (body: { summary: string }) => {
            insertedCalendars.push(body);
            const created = { id: "made-calendar", summary: body.summary, accessRole: "owner" };
            calendarList.push(created);
            return created;
          },
        },
        CalendarList: { list: () => ({ items: calendarList }) },
        Events: {
          list: (_id: string, query: Record<string, unknown>) => {
            listedEvents.push(query);
            return { items: options.existingEvents ?? [] };
          },
          insert: (body: Record<string, unknown>, calendarId: string) =>
            insertedEvents.push({ ...body, calendarId }),
          remove: (_calendarId: string, eventId: string) => removedEvents.push(eventId),
        },
      },
      HtmlService: {
        createHtmlOutput: (content: string) => {
          html.push(content);
          const output = { setTitle: () => output, addMetaTag: () => output };
          return output;
        },
      },
    };

    const api = new Function(
      ...Object.keys(globals),
      `${gmailConnectWebApp([ORIGIN])}\nreturn { doGet: doGet, scan: scan };`,
    )(...Object.values(globals)) as {
      doGet: (e: { parameter: Record<string, string> }) => unknown;
      scan: () => number;
    };
    return {
      api,
      html,
      fetched,
      triggers,
      deleted,
      properties,
      insertedCalendars,
      insertedEvents,
      removedEvents,
      listedEvents,
      rest,
    };
  }

  it("허용 목록에 없는 주소에서 오면 코드를 어디로도 보내지 않는다", () => {
    const run = runWebApp();
    run.api.doGet({ parameter: { code: "c", origin: "https://evil.example" } });

    expect(run.fetched).toEqual([]);
    expect(run.html.join("")).toContain("허용되지 않은 주소");
    expect(run.html.join("")).not.toContain("evil.example");
  });

  it("코드를 토큰으로 바꿔 이 사람의 저장소에 두고, 트리거를 새로 건 뒤 바로 검사한다", () => {
    const run = runWebApp({ stored: { lastScanAt: "1000", token: "old" } });
    run.api.doGet({ parameter: { code: "signed-code", origin: ORIGIN } });

    const [exchange, ingest] = run.fetched;
    expect(exchange.url).toBe(`${ORIGIN}/api/gmail/connect/exchange`);
    expect(JSON.parse(exchange.options.payload)).toEqual({ code: "signed-code" });
    // 토큰은 주소가 아니라 헤더로 보낸다.
    expect(ingest.url).toBe(`${ORIGIN}/api/gmail/ingest`);
    expect(ingest.options.headers?.Authorization).toBe("Bearer issued-token");

    expect(run.properties.get("token")).toBe("issued-token");
    expect(run.properties.get("origin")).toBe(ORIGIN);
    // 다시 연결하면 처음부터(400일) 본다.
    expect(Number(run.properties.get("lastScanAt"))).toBeGreaterThan(1000);
    expect(run.deleted).toEqual(["old-scan"]);
    expect(run.triggers).toEqual([{ handler: "scan", weeks: 2 }]);
    expect(run.html.join("")).toContain("Gmail을 연결했습니다");
    expect(run.html.join("")).toContain(`href="${ORIGIN}/import"`);
    // 사용자가 이 화면에서 첫 검사를 기다리므로 메일을 한꺼번에 받는다.
    expect(run.rest.batches).toEqual([MESSAGES.length]);
    expect(JSON.parse(ingest.options.payload).emails).toHaveLength(MESSAGES.length);
  });

  it("앱에서 왔으면 웹사이트로 가는 '돌아가기' 대신 창을 닫으라고 한다", () => {
    // 앱의 인앱 브라우저에서 웹사이트를 열면, 웹에 로그인된 브라우저가 찾은 구독을 먼저 받아 간다.
    for (const parameter of [
      { code: "signed-code", origin: ORIGIN, client: "app" } as Record<string, string>,
      { action: "calendar", code: "plan-code", origin: ORIGIN, client: "app" },
    ]) {
      const run = runWebApp();
      run.api.doGet({ parameter });
      const page = run.html.join("");
      expect(page).toContain("이 창을 닫으면 SubSlash 앱으로 돌아갑니다");
      expect(page).not.toContain("href=");
    }

    // 같은 실행 환경에서 이어 불려도 앞의 앱 요청이 웹 요청의 화면을 바꾸지 않는다.
    const run = runWebApp();
    run.api.doGet({ parameter: { code: "c", origin: ORIGIN, client: "app" } });
    run.api.doGet({ parameter: { code: "c", origin: ORIGIN } });
    expect(run.html[1]).toContain(`href="${ORIGIN}/import"`);
  });

  it("코드를 바꾸지 못하면 서버가 알려 준 이유를 보여주고 아무것도 설치하지 않는다", () => {
    const run = runWebApp({ exchangeStatus: 400 });
    run.api.doGet({ parameter: { code: "used-code", origin: ORIGIN } });

    expect(run.html.join("")).toContain("연결 코드가 만료됐거나 이미 쓰였습니다.");
    expect(run.triggers).toEqual([]);
    expect(run.properties.size).toBe(0);
  });

  it("SubSlash에서 연결을 끊었으면 다음 검사 때 트리거와 저장값을 스스로 지운다", () => {
    const run = runWebApp({ ingestStatus: 401, stored: { token: "t", origin: ORIGIN } });

    expect(run.api.scan()).toBe(0);
    expect(run.deleted).toEqual(["old-scan"]);
    expect(run.properties.size).toBe(0);
  });

  it("캘린더가 없으면 전용 캘린더를 만들고 결제일을 반복 일정으로 넣는다", () => {
    const run = runWebApp();
    run.api.doGet({ parameter: { action: "calendar", code: "plan-code", origin: ORIGIN } });

    const [claim] = run.fetched;
    expect(claim.url).toBe(`${ORIGIN}/api/calendar-sync/claim`);
    expect(JSON.parse(claim.options.payload)).toEqual({ code: "plan-code" });

    expect(run.insertedCalendars).toEqual([{ summary: "SubSlash 결제일", timeZone: "Asia/Seoul" }]);
    // 다음에 다시 누를 때 같은 캘린더를 쓴다.
    expect(run.properties.get("calendarId")).toBe("made-calendar");

    expect(run.insertedEvents).toHaveLength(1);
    const event = run.insertedEvents[0] as Record<string, never>;
    expect(event.calendarId).toBe("made-calendar");
    expect(event.recurrence).toEqual(["RRULE:FREQ=MONTHLY;BYMONTHDAY=25"]);
    expect(event.start).toEqual({ date: "2026-09-25" });
    expect(event.reminders).toEqual({
      useDefault: false,
      overrides: [{ method: "popup", minutes: 4320 }],
    });
    // 다시 쓸 때 우리 일정만 찾아 지우는 표식.
    expect(event.extendedProperties).toEqual({
      private: { subslash: "1", uid: "sub-netflix" },
    });
    expect(run.html.join("")).toContain("구글 캘린더에 등록했습니다");
    // 버튼이 있던 '내 구독'으로 돌려보낸다.
    expect(run.html.join("")).toContain(`href="${ORIGIN}/subs"`);
  });

  it("다시 누르면 전에 SubSlash가 쓴 일정만 지우고 새로 쓴다", () => {
    const run = runWebApp({
      calendars: [{ id: "kept", summary: "SubSlash 결제일", accessRole: "owner" }],
      stored: { calendarId: "kept" },
      existingEvents: [{ id: "old-1" }, { id: "old-2" }],
    });
    run.api.doGet({ parameter: { action: "calendar", code: "plan-code", origin: ORIGIN } });

    expect(run.insertedCalendars).toEqual([]);
    expect(run.listedEvents[0].privateExtendedProperty).toBe("subslash=1");
    expect(run.removedEvents).toEqual(["old-1", "old-2"]);
    expect(run.insertedEvents).toHaveLength(1);
  });

  it("결제일을 받지 못하면 이유를 보여주고 캘린더를 만들지 않는다", () => {
    const run = runWebApp({ claimStatus: 400 });
    run.api.doGet({ parameter: { action: "calendar", code: "used-code", origin: ORIGIN } });

    expect(run.html.join("")).toContain("요청이 만료됐거나 이미 쓰였습니다.");
    expect(run.insertedCalendars).toEqual([]);
    expect(run.insertedEvents).toEqual([]);
  });

  it("허용 목록에 없는 주소에서 오면 캘린더에도 손대지 않는다", () => {
    const run = runWebApp();
    run.api.doGet({
      parameter: { action: "calendar", code: "c", origin: "https://evil.example" },
    });

    expect(run.fetched).toEqual([]);
    expect(run.insertedCalendars).toEqual([]);
  });

  it("매니페스트는 접속한 사용자의 권한으로 실행하는 웹 앱이다", () => {
    const manifest = JSON.parse(GMAIL_CONNECT_WEB_APP_MANIFEST);
    expect(manifest.webapp).toEqual({ executeAs: "USER_ACCESSING", access: "ANYONE" });
    // 복사 스크립트가 쓰는 권한에, 결제일을 쓸 캘린더 권한 하나만 더한다. 그 밖의 권한을
    // 슬쩍 늘리면 권한 화면에서 사용자가 보는 목록이 달라진다.
    expect(new Set(manifest.oauthScopes)).toEqual(
      new Set([
        ...JSON.parse(GMAIL_AUTO_SCRIPT_MANIFEST).oauthScopes,
        "https://www.googleapis.com/auth/calendar",
      ]),
    );
  });
});
