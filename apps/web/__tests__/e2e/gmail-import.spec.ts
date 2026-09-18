import { test, expect } from "@playwright/test";
import { gzipSync } from "node:zlib";

/**
 * Apps Script의 'SubSlash로 가져오기' 버튼이 여는 `/import#gmail=…`. 스크립트가 만드는 값과 같은
 * 모양(gzip JSON을 웹 안전 base64로)을 직접 만들어 연다.
 */

const STORAGE_KEY = "subslash-storage";

const EXISTING_SUB = {
  id: "existing-notion",
  name: "내 노션",
  amount: 16800,
  currency: "KRW",
  billingDay: 5,
  billingCycle: "monthly",
  category: "other",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
};

function gmailHash(emails: { from: string; subject: string; date: string; body: string }[]) {
  const encoded = gzipSync(Buffer.from(JSON.stringify({ v: 1, emails }), "utf8")).toString(
    "base64url",
  );
  return `#gmail=${encoded}`;
}

test.describe("Gmail 결제 메일 가져오기 (E2E)", () => {
  test("메일에서 찾은 구독을 기존 목록을 지우지 않고 더하고, 주소에서 메일 내용을 지운다", async ({
    page,
  }) => {
    await page.addInitScript(
      ({ key, value }) => {
        if (!localStorage.getItem(key)) localStorage.setItem(key, value);
      },
      {
        key: STORAGE_KEY,
        value: JSON.stringify({
          state: { subscriptions: [EXISTING_SUB], usageLogs: [], accounts: [] },
          version: 1,
        }),
      },
    );

    const recent = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    await page.goto(
      `/import${gmailHash([
        {
          from: "Netflix <info@account.netflix.com>",
          subject: "넷플릭스 결제 안내",
          date: recent,
          body: "결제 금액 : 17,000원\n멤버십은 언제든 해지할 수 있습니다.",
        },
      ])}`,
    );

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Gmail 메일 1통에서")).toBeVisible({ timeout: 30_000 });
    await expect(dialog.getByText("넷플릭스", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/import$/);

    // 메일에서 몇 건을 더하러 온 것이므로 '이전 기록을 모두 지우고'는 꺼진 채로 열린다.
    await expect(dialog.getByRole("checkbox", { name: /모두 지우고/ })).not.toBeChecked();
    await dialog.getByRole("button", { name: /1개 구독 일괄 등록/ }).click();
    await expect(page).toHaveURL(/\/subs/, { timeout: 30_000 });

    const names = await page.evaluate(
      (key) =>
        (JSON.parse(localStorage.getItem(key) ?? "{}").state?.subscriptions ?? []).map(
          (sub: { name: string }) => sub.name,
        ),
      STORAGE_KEY,
    );
    expect(names).toEqual(["내 노션", "넷플릭스"]);
  });

  test("망가진 값으로 열면 오류를 알리고 설치 안내로 갈 수 있다", async ({ page }) => {
    await page.goto("/import#gmail=broken");

    await expect(page.getByRole("heading", { name: "메일을 가져오지 못했습니다" })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: "설치 안내 보기" }).click();
    await expect(
      page.getByRole("heading", { name: "Gmail 결제 메일에서 구독 찾기" }),
    ).toBeVisible();
  });

  test("그냥 열면 이 사이트 주소가 들어간 스크립트를 안내한다", async ({ page, baseURL }) => {
    await page.goto("/import");

    await expect(page.getByRole("heading", { name: "Gmail 결제 메일에서 구독 찾기" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(`var SUBSLASH_IMPORT_URL = "${baseURL}/import";`)).toBeVisible();
    await expect(page.getByText('"https://www.googleapis.com/auth/gmail.readonly"')).toBeVisible();
  });
});
