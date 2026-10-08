import { describe, expect, it } from "vitest";
import { messages } from "@lib/i18n/messages";
import {
  canCheckGoogleStorage,
  parseStorageQuotaResult,
  storageCheckInFrom,
  storageQuotaCheckUrl,
  storageQuotaWebAppUrl,
  type StorageQuotaResult,
} from "@lib/storage-quota";
import { STORAGE_QUOTA_WEB_APP_MANIFEST, storageQuotaWebApp } from "@lib/storage-quota/web-app";

const URL_ = "https://script.google.com/macros/s/AKfy-cb_123/exec";
const ORIGIN = "https://www.subslash.me";
const STATE = "a1b2c3d4e5f6";
const GIB = 1024 ** 3;

/** 웹 앱 코드를 가짜 Drive·HtmlService로 돌려 화면 HTML을 받는다. */
function runWebApp(
  quota: Record<string, string> | Error,
  parameter: Record<string, string>,
): string {
  let html = "";
  const output = { setTitle: () => output, addMetaTag: () => output };
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
  new Function("Drive", "HtmlService", "e", `${storageQuotaWebApp([ORIGIN])}\nreturn doGet(e);`)(
    Drive,
    HtmlService,
    { parameter },
  );
  return html;
}

/** 화면이 곧바로 여는 돌아갈 주소. */
function returnUrlOf(html: string): string | null {
  const match = html.match(/window\.top\.location\.href = "([^"]+)"/);
  return match ? match[1] : null;
}

const googleOne = (planId?: string, sharingCount?: number) => ({
  name: "구글 원",
  cancelUrl: "https://one.google.com/about/plans",
  planId,
  sharingCount,
});
const measured = (usageGiB: number, limitGiB: number | null): StorageQuotaResult => ({
  state: STATE,
  ok: true,
  usage: Math.round(usageGiB * GIB),
  limit: limitGiB === null ? null : Math.round(limitGiB * GIB),
});

/** 한국어 화면의 문구. */
const text = messages.ko.checkin.storage;

describe("Google 계정 용량 측정 — 주소", () => {
  it("Apps Script 웹 앱 주소만 받는다", () => {
    expect(storageQuotaWebAppUrl(URL_)).toBe(URL_);
    expect(storageQuotaWebAppUrl(` ${URL_} `)).toBe(URL_);
    expect(storageQuotaWebAppUrl(undefined)).toBeNull();
    expect(storageQuotaWebAppUrl("https://evil.example/macros/s/x/exec")).toBeNull();
    expect(storageQuotaWebAppUrl("javascript:alert(1)")).toBeNull();
  });

  it("구글 원만 이 웹 앱으로 잰다", () => {
    expect(canCheckGoogleStorage({ name: "구글 원" })).toBe(true);
    expect(canCheckGoogleStorage({ name: "Google One" })).toBe(true);
    expect(canCheckGoogleStorage({ name: "아이클라우드" })).toBe(false);
    expect(canCheckGoogleStorage({ name: "Google AI Pro" })).toBe(false);
  });

  it("웹은 돌아올 주소를, 앱은 돌아올 앱 ID를 싣는다", () => {
    const web = new URL(storageQuotaCheckUrl(URL_, { state: STATE, origin: ORIGIN }));
    expect(web.searchParams.get("origin")).toBe(ORIGIN);
    expect(web.searchParams.get("state")).toBe(STATE);
    expect(web.searchParams.has("client")).toBe(false);

    const app = new URL(storageQuotaCheckUrl(URL_, { state: STATE, scheme: "com.subslash.app" }));
    expect(app.searchParams.get("client")).toBe("app");
    expect(app.searchParams.get("return")).toBe("com.subslash.app");
    expect(app.searchParams.has("origin")).toBe(false);
  });
});

describe("Google 계정 용량 측정 — 웹 앱", () => {
  const quota = { limit: String(5120 * GIB), usage: String(Math.round(3.42 * GIB)) };

  it("권한은 drive.file 하나다", () => {
    expect(JSON.parse(STORAGE_QUOTA_WEB_APP_MANIFEST).oauthScopes).toEqual([
      "https://www.googleapis.com/auth/drive.file",
    ]);
  });

  it("웹에는 값을 '#' 뒤에만 실어 SubSlash 끝 화면으로 돌려준다", () => {
    const url = returnUrlOf(runWebApp(quota, { origin: ORIGIN, state: STATE }))!;
    expect(url.startsWith(`${ORIGIN}/storage-quota/done#`)).toBe(true);
    expect(url).not.toContain("?");
    const result = parseStorageQuotaResult(new URLSearchParams(url.split("#")[1]));
    expect(result).toEqual({
      state: STATE,
      ok: true,
      usage: Number(quota.usage),
      limit: 5120 * GIB,
    });
  });

  it("앱에는 돌아오는 주소(oauth-done?flow=storage)로 돌려준다", () => {
    const url = returnUrlOf(
      runWebApp(quota, { client: "app", return: "com.subslash.app", state: STATE }),
    )!;
    expect(url.startsWith("com.subslash.app://oauth-done?flow=storage&")).toBe(true);
    expect(parseStorageQuotaResult(new URL(url).searchParams)?.ok).toBe(true);
  });

  it("허용하지 않은 주소·스킴으로는 돌려주지 않고 화면에만 보여 준다", () => {
    const evil = runWebApp(quota, { origin: "https://evil.example", state: STATE });
    expect(returnUrlOf(evil)).toBeNull();
    expect(evil).not.toContain("evil.example");
    expect(evil).toContain("5TB");

    const otherApp = runWebApp(quota, { client: "app", return: "other.app", state: STATE });
    expect(returnUrlOf(otherApp)).toBeNull();
    expect(otherApp).toContain("창을 닫으면 앱으로 돌아갑니다");
  });

  it("읽지 못하면 실패를 돌려주고 오류를 이스케이프해 보여 준다", () => {
    const html = runWebApp(new Error("<script>x</script>"), { origin: ORIGIN, state: STATE });
    expect(html).toContain("용량을 읽지 못했습니다");
    expect(html).not.toContain("<script>x");
    const url = returnUrlOf(html)!;
    expect(parseStorageQuotaResult(new URLSearchParams(url.split("#")[1]))).toEqual({
      state: STATE,
      ok: false,
    });
  });
});

describe("Google 계정 용량 측정 — 체크인 값", () => {
  it("시험 배포의 값: AI 프로 5TB(5,120GB 한도)에 3.42GB → 1% 미만이라 1%", () => {
    const checkIn = storageCheckInFrom(googleOne("ai-pro"), measured(3.42, 5120), text);
    expect(checkIn.quantity).toBe(1);
    expect(checkIn.message).toContain("5TB 중 3.42GB");
    expect(checkIn.message).toContain("1%로 채웠어요");
  });

  it("비율을 반올림해 채운다", () => {
    expect(storageCheckInFrom(googleOne("basic"), measured(42.4, 100), text).quantity).toBe(42);
    expect(storageCheckInFrom(googleOne("ai-plus"), measured(1024, 2048), text).quantity).toBe(50);
  });

  it("아무것도 두지 않았을 때만 0%", () => {
    expect(storageCheckInFrom(googleOne("basic"), measured(0, 100), text).quantity).toBe(0);
  });

  it("한도가 등록한 요금제와 다르면 채우지 않는다 — 다른 계정이거나 가족·회사 계정의 한도다", () => {
    const checkIn = storageCheckInFrom(googleOne("basic"), measured(3, 5120), text);
    expect(checkIn.quantity).toBeNull();
    expect(checkIn.message).toContain("베이직 100GB");
  });

  it("가족과 나누는 구독은 채우지 않는다 — 이 계정의 사용량은 내 몫뿐이다", () => {
    const checkIn = storageCheckInFrom(googleOne("ai-pro", 4), measured(3.42, 5120), text);
    expect(checkIn.quantity).toBeNull();
    expect(checkIn.message).toContain("가족과 나누는");
  });

  it("한도가 없으면 채우지 않는다", () => {
    expect(storageCheckInFrom(googleOne("ai-pro"), measured(3, null), text).quantity).toBeNull();
  });

  it("요금제를 모르면 채우되 요금제를 고르라고 말한다", () => {
    const checkIn = storageCheckInFrom(googleOne(), measured(50, 100), text);
    expect(checkIn.quantity).toBe(50);
    expect(checkIn.message).toContain("요금제를 골라 두면");
  });

  it("측정하지 못했으면 채우지 않는다", () => {
    expect(
      storageCheckInFrom(googleOne("ai-pro"), { state: STATE, ok: false }, text).quantity,
    ).toBeNull();
  });

  it("측정 결과가 아닌 돌아오는 주소(간편 로그인 등)는 받지 않는다", () => {
    expect(parseStorageQuotaResult(new URLSearchParams("oauthVia=google"))).toBeNull();
    expect(parseStorageQuotaResult(new URLSearchParams("flow=gmail"))).toBeNull();
    expect(parseStorageQuotaResult(new URLSearchParams("flow=storage&usage=-1"))).toBeNull();
    expect(parseStorageQuotaResult(null)).toBeNull();
  });
});
