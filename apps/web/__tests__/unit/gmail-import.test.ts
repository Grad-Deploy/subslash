import { describe, it, expect } from "vitest";
import { gzipSync } from "node:zlib";
import { parseReceiptEmails } from "@subslash/shared";
import {
  GMAIL_APPS_SCRIPT_MANIFEST,
  GmailImportError,
  decodeGmailImport,
  gmailAppsScript,
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
    expect(html).toContain("SEARCH_QUERY");
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
