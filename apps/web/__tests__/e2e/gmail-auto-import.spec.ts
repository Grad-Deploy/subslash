import { test, expect, type Page } from "@playwright/test";

/**
 * Gmail 자동 가져오기의 화면 쪽. 서버(연결 토큰·파싱·후보 저장)는 통합 테스트가 실제 SQLite로 보므로,
 * 여기서는 로그인과 후보 API의 응답만 바꿔 브라우저가 후보를 어떻게 등록하는지 본다. 테스트 서버는
 * 시작일 전인 이 기능을 NEXT_PUBLIC_GMAIL_AUTO_IMPORT_TEST_OPEN으로 연다(playwright.config.ts).
 */

const STORAGE_KEY = "subslash-storage";

const TVING = {
  id: "existing-tving",
  name: "티빙",
  amount: 13900,
  currency: "KRW",
  billingDay: 3,
  billingCycle: "monthly",
  category: "ott",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const discovery = (overrides: Record<string, unknown>) => ({
  amount: 17000,
  currency: "KRW",
  billingDay: 10,
  billingCycle: "monthly",
  billingMonth: null,
  category: "ott",
  presetId: null,
  paymentMethod: "credit_card",
  receiptDate: "2026.09.10",
  sender: "billing@example.com",
  tier: "review",
  ...overrides,
});

async function seed(page: Page) {
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    {
      key: STORAGE_KEY,
      value: JSON.stringify({
        state: { subscriptions: [TVING], usageLogs: [], accounts: [] },
        version: 1,
      }),
    },
  );
}

async function mockLoggedIn(page: Page) {
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      json: {
        account: {
          id: "a1",
          username: "tester",
          email: "tester@gmail.com",
          age: null,
          gender: null,
          emailVerified: true,
          createdAt: "2026-09-01T00:00:00.000Z",
        },
      },
    }),
  );
}

async function storedNames(page: Page): Promise<string[]> {
  return page.evaluate(
    (key) =>
      (JSON.parse(localStorage.getItem(key) ?? "{}").state?.subscriptions ?? []).map(
        (sub: { name: string }) => sub.name,
      ),
    STORAGE_KEY,
  );
}

test.describe("Gmail 자동 가져오기 (E2E)", () => {
  test("확실한 후보는 등록하고 되돌릴 수 있으며, 이미 구독 중인 것은 건너뛰고, 나머지는 골라 등록한다", async ({
    page,
  }) => {
    await seed(page);
    await mockLoggedIn(page);
    const acknowledged: string[][] = [];
    await page.route("**/api/gmail/discoveries", async (route) => {
      if (route.request().method() === "DELETE") {
        const ids = (route.request().postDataJSON() as { ids: string[] }).ids;
        acknowledged.push(ids);
        return route.fulfill({ json: { deleted: ids.length } });
      }
      return route.fulfill({
        json: {
          discoveries: [
            discovery({ id: "d-netflix", name: "넷플릭스", presetId: "netflix", tier: "auto" }),
            discovery({
              id: "d-tving",
              name: "티빙",
              presetId: "tving",
              tier: "auto",
              amount: 13900,
            }),
            discovery({ id: "d-unknown", name: "알 수 없는 결제 (₩8,900)", amount: 8900 }),
          ],
        },
      });
    });

    await page.goto("/dashboard");
    const banner = page.getByRole("status").filter({ hasText: "Gmail 결제 메일" });
    await expect(banner.getByText(/구독 1건을 등록했습니다/)).toBeVisible({ timeout: 30_000 });
    await expect(banner.getByText(/넷플릭스\./)).toBeVisible();

    await expect.poll(() => storedNames(page)).toEqual(["티빙", "넷플릭스"]);
    // 등록한 것과 이미 구독 중인 것만 지우고, 확인할 후보는 남긴다.
    await expect.poll(() => acknowledged).toEqual([["d-netflix", "d-tving"]]);

    await banner.getByRole("button", { name: "되돌리기" }).click();
    await expect.poll(() => storedNames(page)).toEqual(["티빙"]);

    await banner.getByRole("button", { name: "확인하기" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("Gmail 자동 검사에서")).toBeVisible();
    await expect(dialog.getByText("알 수 없는 결제 (₩8,900)")).toBeVisible();
    await dialog.getByRole("button", { name: /1개 구독 일괄 등록/ }).click();

    await expect.poll(() => storedNames(page)).toEqual(["티빙", "알 수 없는 결제 (₩8,900)"]);
    await expect.poll(() => acknowledged).toEqual([["d-netflix", "d-tving"], ["d-unknown"]]);
    await expect(page.getByRole("status").filter({ hasText: "Gmail 결제 메일" })).toHaveCount(0);
  });

  test("로그인하지 않으면 후보를 받지 않는다", async ({ page }) => {
    await seed(page);
    let requested = false;
    await page.route("**/api/gmail/discoveries", (route) => {
      requested = true;
      return route.fulfill({ json: { discoveries: [] } });
    });
    await page.route("**/api/auth/me", (route) => route.fulfill({ json: { account: null } }));

    await page.goto("/dashboard");
    await expect(page.getByText("티빙").first()).toBeVisible({ timeout: 30_000 });
    expect(requested).toBe(false);
  });

  test("자동 가져오기를 켜면 이 사이트의 수신 주소와 연결 토큰이 든 스크립트를 준다", async ({
    page,
    baseURL,
  }) => {
    await mockLoggedIn(page);
    let linked = false;
    await page.route("**/api/gmail/link", (route) => {
      if (route.request().method() === "POST") {
        linked = true;
        return route.fulfill({ json: { token: "e2e-link-token" } });
      }
      return route.fulfill({
        json: linked
          ? {
              open: true,
              linked: true,
              createdAt: "2026-09-17T00:00:00.000Z",
              lastIngestAt: null,
              lastEmailCount: null,
              pendingCount: 0,
            }
          : { open: true, linked: false },
      });
    });

    await page.goto("/import");
    await page.getByRole("button", { name: "자동 가져오기 켜기" }).click({ timeout: 30_000 });

    await expect(page.getByText(/아직 받은 메일이 없어요/)).toBeVisible();
    await expect(
      page.getByText(`var SUBSLASH_INGEST_URL = "${baseURL}/api/gmail/ingest";`),
    ).toBeVisible();
    await expect(page.getByText('var SUBSLASH_TOKEN = "e2e-link-token";')).toBeVisible();
    await expect(
      page.getByText('"https://www.googleapis.com/auth/script.scriptapp"'),
    ).toBeVisible();
  });

  test("로그인하지 않았으면 자동 가져오기 대신 로그인을 안내하고, 직접 실행 방법은 그대로 보인다", async ({
    page,
  }) => {
    await page.route("**/api/auth/me", (route) => route.fulfill({ json: { account: null } }));
    await page.goto("/import");

    await expect(page.getByText(/이 필요해요/)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "직접 실행해서 가져오기" })).toBeVisible();
  });
  test("원클릭 연결이 설정돼 있으면 Gmail 연결하기가 웹 앱으로 보내고, 복사 방식은 접혀 있다", async ({
    page,
  }) => {
    await mockLoggedIn(page);
    const webApp =
      "https://script.google.com/macros/s/E2E/exec?code=signed&origin=http%3A%2F%2Flocalhost%3A3000";
    await page.route("**/api/gmail/link", (route) =>
      route.fulfill({ json: { open: true, linked: false, connectAvailable: true } }),
    );
    await page.route("**/api/gmail/connect", (route) => route.fulfill({ json: { url: webApp } }));
    // 실제 Google로 나가지 않는다. 이동한 주소만 본다.
    await page
      .context()
      .route("https://script.google.com/**", (route) =>
        route.fulfill({ contentType: "text/html", body: "<h1>google</h1>" }),
      );

    await page.goto("/import");
    await expect(page.getByRole("button", { name: "Gmail 연결하기" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: "자동 가져오기 켜기" })).toHaveCount(0);

    await page.getByRole("button", { name: /경고 없이 직접 설치하기/ }).click();
    await expect(page.getByRole("button", { name: "자동 가져오기 켜기" })).toBeVisible();

    await page.getByRole("button", { name: "Gmail 연결하기" }).click();
    await page.waitForURL(/script\.google\.com/);
    expect(page.url()).toBe(webApp);
  });
});
