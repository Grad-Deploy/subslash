import { test, expect, type Page } from "@playwright/test";

/**
 * '구글 캘린더에 결제일 등록'의 화면 쪽. 서버(계획 맡기기·받아 가기)는 통합 테스트가 실제 SQLite로
 * 보므로, 여기서는 브라우저가 무엇을 보내고 어디로 가는지만 본다. 실제 Google로는 나가지 않는다.
 */

const STORAGE_KEY = "subslash-storage";

const NETFLIX = {
  id: "sub-netflix",
  name: "넷플릭스",
  amount: 17000,
  currency: "KRW",
  billingDay: 25,
  billingCycle: "monthly",
  category: "ott",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
};
const KILLED = { ...NETFLIX, id: "sub-killed", name: "왓챠", status: "killed" };
const UNDATED_YEARLY = {
  ...NETFLIX,
  id: "sub-yearly",
  name: "노션",
  billingCycle: "yearly",
  billingMonth: undefined,
};

async function seed(page: Page) {
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    {
      key: STORAGE_KEY,
      value: JSON.stringify({
        state: {
          subscriptions: [NETFLIX, KILLED, UNDATED_YEARLY],
          usageLogs: [],
          accounts: [],
        },
        version: 1,
      }),
    },
  );
}

async function mockLoggedIn(page: Page, connectAvailable = true) {
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
  await page.route("**/api/gmail/link", (route) =>
    route.fulfill({ json: { open: true, linked: false, connectAvailable } }),
  );
}

test.describe("구글 캘린더에 결제일 등록 (E2E)", () => {
  test("구독 중인 결제일만 보내고, 받은 웹 앱 주소로 간다", async ({ page }) => {
    await seed(page);
    await mockLoggedIn(page);
    const webApp = "https://script.google.com/macros/s/E2E/exec?action=calendar&code=plan";
    let sent: { entries: Array<{ name: string }>; reminderDays: number } | null = null;
    await page.route("**/api/calendar-sync", (route) => {
      sent = route.request().postDataJSON();
      return route.fulfill({ json: { url: webApp } });
    });
    await page
      .context()
      .route("https://script.google.com/**", (route) =>
        route.fulfill({ contentType: "text/html", body: "<h1>google</h1>" }),
      );

    await page.goto("/import");
    // 결제 월을 모르는 연간 구독은 빼고 센다.
    await expect(page.getByText(/지금 올릴 결제일/)).toContainText("1건", { timeout: 30_000 });
    await expect(page.getByText(/지금 올릴 결제일/)).toContainText("연간 구독 1건은 뺍니다");

    await page.getByRole("button", { name: "구글 캘린더에 등록하기" }).click();
    await page.waitForURL(/script\.google\.com/);
    expect(page.url()).toBe(webApp);

    // 알림 설정을 건드리지 않았으므로 기본값(3일 전)이 간다.
    expect(sent!.reminderDays).toBe(3);
    // 해지한 구독은 보내지 않는다. 결제 월을 모르는 연간 구독은 서버가 뺀다.
    expect(sent!.entries.map((entry) => entry.name)).toEqual(["넷플릭스", "노션"]);
  });

  test("웹 앱이 설정되지 않은 서버에서는 캘린더 구독을 안내한다", async ({ page }) => {
    await seed(page);
    await mockLoggedIn(page, false);

    await page.goto("/import");
    await expect(
      page.getByText(/이 서버에는 구글 캘린더 등록이 설정되어 있지 않습니다/),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: "구글 캘린더에 등록하기" })).toHaveCount(0);
  });
});
