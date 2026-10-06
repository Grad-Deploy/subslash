import { describe, expect, it } from "vitest";
import {
  canCheckGoogleStorage,
  storageQuotaCheckUrl,
  storageQuotaWebAppUrl,
} from "@lib/storage-quota";
import { STORAGE_QUOTA_WEB_APP, STORAGE_QUOTA_WEB_APP_MANIFEST } from "@lib/storage-quota/web-app";

const URL = "https://script.google.com/macros/s/AKfy-cb_123/exec";
const GIB = 1024 ** 3;

/** 웹 앱 코드를 가짜 Drive·HtmlService로 돌려 화면 HTML을 받는다. */
function runWebApp(quota: Record<string, string> | Error, client?: string): string {
  let html = "";
  const output = {
    setTitle: () => output,
    addMetaTag: () => output,
  };
  const Drive = {
    About: {
      get: () => {
        if (quota instanceof Error) throw quota;
        return { storageQuota: quota };
      },
    },
  };
  const HtmlService = {
    createHtmlOutput: (value: string) => {
      html = value;
      return output;
    },
  };
  new Function("Drive", "HtmlService", "e", `${STORAGE_QUOTA_WEB_APP}\nreturn doGet(e);`)(
    Drive,
    HtmlService,
    { parameter: client ? { client } : {} },
  );
  return html;
}

describe("Google 계정 용량 확인", () => {
  it("Apps Script 웹 앱 주소만 받는다", () => {
    expect(storageQuotaWebAppUrl(URL)).toBe(URL);
    expect(storageQuotaWebAppUrl(` ${URL} `)).toBe(URL);
    expect(storageQuotaWebAppUrl(undefined)).toBeNull();
    expect(storageQuotaWebAppUrl("")).toBeNull();
    expect(storageQuotaWebAppUrl("https://evil.example/macros/s/x/exec")).toBeNull();
    expect(storageQuotaWebAppUrl("javascript:alert(1)")).toBeNull();
  });

  it("구글 원만 이 웹 앱으로 확인한다", () => {
    expect(canCheckGoogleStorage({ name: "구글 원" })).toBe(true);
    expect(canCheckGoogleStorage({ name: "Google One" })).toBe(true);
    expect(canCheckGoogleStorage({ name: "아이클라우드" })).toBe(false);
    expect(canCheckGoogleStorage({ name: "Google AI Pro" })).toBe(false);
  });

  it("앱에서 열면 앱으로 돌아가는 안내를 띄우게 표시한다", () => {
    expect(storageQuotaCheckUrl(URL, false)).toBe(URL);
    expect(storageQuotaCheckUrl(URL, true)).toBe(`${URL}?client=app`);
  });

  it("권한은 drive.file 하나다", () => {
    expect(JSON.parse(STORAGE_QUOTA_WEB_APP_MANIFEST).oauthScopes).toEqual([
      "https://www.googleapis.com/auth/drive.file",
    ]);
  });

  it("1% 미만이라도 쓰고 있으면 체크인에 1%를 적게 한다 — 0%는 아무것도 두지 않음이다", () => {
    // 시험 배포에서 본 값: AI 프로 5TB에 3.42GB.
    const html = runWebApp({
      limit: String(5120 * GIB),
      usage: String(Math.round(3.42 * GIB)),
      usageInDrive: String(Math.round(2.97 * GIB)),
    });
    expect(html).toContain("5TB");
    expect(html).toContain("1% 미만");
    expect(html).toContain("<b>1%</b>");
    expect(html).toContain("이 탭을 닫고");
  });

  it("비율을 반올림해 적게 하고, 앱에서 열었으면 앱으로 돌아가라고 한다", () => {
    const html = runWebApp({ limit: String(100 * GIB), usage: String(42.4 * GIB) }, "app");
    expect(html).toContain("<b>42%</b>");
    expect(html).toContain("창을 닫으면 앱으로 돌아갑니다");
  });

  it("한도가 없으면 비율을 적지 말라고 한다", () => {
    const html = runWebApp({ usage: String(10 * GIB) });
    expect(html).toContain("비율을 셀 수 없습니다");
    expect(html).not.toContain("<b>");
  });

  it("읽지 못하면 오류를 이스케이프해 보여 준다", () => {
    const html = runWebApp(new Error("<script>x</script>"));
    expect(html).toContain("용량을 읽지 못했습니다");
    expect(html).not.toContain("<script>x");
  });
});
