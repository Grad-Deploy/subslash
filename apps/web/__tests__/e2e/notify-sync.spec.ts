import { test, expect, type Page } from "@playwright/test";

/**
 * 결제 알림의 서버 사본(미러)에 무엇이 올라가는지, 서버가 이 브라우저의 토큰을 모를 때 화면이
 * 무엇을 보여주는지. 서버 쪽은 통합 테스트(notify-flow)가 실제 SQLite로 보므로, 여기서는 알림
 * API의 응답만 바꿔 화면의 흐름을 본다.
 */

const STORAGE_KEY = "subslash-storage";

const REAL_SUB = {
  id: "real-notion",
  name: "내 노션",
  amount: 16800,
  currency: "KRW",
  billingDay: 5,
  billingCycle: "monthly",
  category: "other",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
};

async function seed(page: Page, state: Record<string, unknown>) {
  const value = JSON.stringify({
    state: { subscriptions: [REAL_SUB], usageLogs: [], accounts: [], ...state },
    version: 1,
  });
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value },
  );
}

/** 서버 세션 대신 /api/auth/me 응답만 바꿔 로그인한 화면을 본다. */
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

test.describe("결제 알림 미러 (E2E)", () => {
  test.skip(({ isMobile }) => isMobile, "상단 바의 알림 아이콘은 sm 이상에서 보인다");

  test("샘플 체험 중에 알림을 켜도 서버에는 내 구독만 올라간다", async ({ page }) => {
    await mockLoggedIn(page);
    await page.route("**/api/notify/subscribe", (route) =>
      route.fulfill({
        json: { syncToken: "e2e-token", email: "me@gmail.com", reminderDays: 3, verified: false },
      }),
    );
    const uploads: string[] = [];
    await page.route("**/api/notify/sync", (route) => {
      if (route.request().method() !== "PUT") return route.fallback();
      uploads.push(route.request().postData() ?? "");
      return route.fulfill({ json: { synced: 1, skipped: 0, verified: false } });
    });
    await seed(page, {});

    await page.goto("/");
    await page.getByRole("button", { name: /샘플 데이터로 1초 체험/ }).click();
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
    await expect(page.getByText("샘플로 체험하는 중입니다.")).toBeVisible({ timeout: 30_000 });

    await page.getByRole("button", { name: "결제 알림 (꺼짐)" }).click({ timeout: 30_000 });
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder("아이디 입력").fill("me");
    await dialog.getByRole("button", { name: "확인 메일 받기" }).click();

    // 화면의 목록(샘플 3건)이 아니라 내 구독 1건이다.
    await expect(dialog.getByText(/동기화된 활성 구독 1건/)).toBeVisible();
    // 창이 곧바로 한 번, 동기화 훅이 잠시 뒤 한 번 올린다. 둘 다 내 구독만 담아야 한다.
    await expect.poll(() => uploads.length, { timeout: 10_000 }).toBeGreaterThanOrEqual(2);
    for (const body of uploads) {
      expect(body).toContain("내 노션");
      expect(body).not.toContain("쿠팡 와우 멤버십");
    }
  });

  test("서버가 이 브라우저의 토큰을 모르면 '끊김'으로 바꾸고 이유를 알린다", async ({ page }) => {
    await page.route("**/api/notify/sync", (route) =>
      route.fulfill({ status: 401, json: { error: "Unauthorized" } }),
    );
    await seed(page, {
      notify: {
        email: "me@gmail.com",
        syncToken: "gone-token",
        verified: true,
        reminderDays: 3,
        lastSyncedAt: null,
        calendarUrl: null,
      },
    });

    await page.goto("/dashboard");
    // 로그인하지 않은 브라우저여도 보인다 — 숨기면 왜 꺼졌는지 알 곳이 없다.
    await page.getByRole("button", { name: "결제 알림 (끊김)" }).click({ timeout: 30_000 });
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("이 브라우저의 결제 알림이 꺼졌습니다.")).toBeVisible();
    await expect(dialog.getByRole("button", { name: "확인 메일 받기" })).toBeVisible();

    const notify = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "{}").state?.notify,
      STORAGE_KEY,
    );
    expect(notify.syncToken).toBeNull();
    expect(notify.verified).toBe(false);
  });
});
