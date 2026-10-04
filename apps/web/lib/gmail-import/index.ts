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

// 사용자 계정에서 도는 Apps Script 코드. 스크립트마다 한 파일이고, 메일 읽기는 mail-helpers를 함께 붙인다.
export { GMAIL_APPS_SCRIPT_MANIFEST, gmailAppsScript } from "./manual-script";
export { GMAIL_AUTO_SCRIPT_MANIFEST, gmailAutoScript } from "./auto-script";
export { GMAIL_CONNECT_WEB_APP_MANIFEST, gmailConnectWebApp } from "./connect-web-app";
