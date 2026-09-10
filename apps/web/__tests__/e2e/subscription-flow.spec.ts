import { test, expect, type Page } from "@playwright/test";

// Must match the `name` given to zustand's persist middleware in lib/store.ts.
const STORAGE_KEY = "subslash-storage";

const netflix = {
  id: "sub1",
  name: "Netflix",
  amount: 17000,
  currency: "KRW",
  billingDay: 15,
  billingCycle: "monthly",
  category: "ott",
  status: "active",
  createdAt: new Date().toISOString(),
};

async function seed(page: Page, subscriptions: Record<string, unknown>[]) {
  await page.addInitScript(
    ([key, subs]) => {
      window.localStorage.setItem(
        key as string,
        JSON.stringify({ state: { subscriptions: subs, usageLogs: [], accounts: [] }, version: 0 }),
      );
    },
    [STORAGE_KEY, subscriptions] as const,
  );
}

test.describe("Subscription Flow (E2E)", () => {
  test("구독 등록 플로우", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /지금 바로 시작하기/ }).click();

    const dialog = page.getByRole("dialog");
    await dialog.locator('input[name="name"]').fill("Netflix");
    await dialog.locator('input[name="amount"]').fill("17000");
    await dialog.locator('input[name="billingDay"]').fill("15");
    await dialog.locator('button[type="submit"]').click();

    // Submitting redirects to the dashboard, where the new card is listed. The
    // first client-side hit may also wait on the dev server compiling the route.
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("link", { name: /Netflix/ })).toBeVisible({ timeout: 30_000 });
  });

  test("체크인 플로우", async ({ page }) => {
    await seed(page, [netflix]);
    await page.goto("/dashboard");

    await page.getByRole("button", { name: "체크인" }).first().click();
    await page.getByRole("button", { name: "1회" }).click();
    await page.getByRole("button", { name: /가성비 분석 결과 보기/ }).click();

    // Cost-per-use shock message for a single use.
    await expect(page.getByText(/1회를/)).toBeVisible();
    await expect(page.getByText("₩17,000").first()).toBeVisible();
  });

  test("해지 플로우", async ({ page }) => {
    await seed(page, [netflix]);
    await page.goto("/subs");

    await page.getByRole("button", { name: "해지하기" }).first().click();

    // 실제 해지는 서비스 쪽에서 해야 하므로 먼저 해지 가이드가 열린다.
    const guideDialog = page.getByRole("dialog");
    await expect(guideDialog).toBeVisible();
    await expect(guideDialog.getByText("해지 메뉴까지 가는 길")).toBeVisible();
    await guideDialog.getByRole("button", { name: "해지 완료했어요" }).click();

    // 가이드가 닫히고 나서야 완료 처리 확인 모달이 뜬다.
    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog.getByText("구독 해지 완료 처리")).toBeVisible();
    await confirmDialog.getByRole("button", { name: "해지 완료" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("button", { name: /해지 완료 \(1\)/ }).click();

    await expect(page.getByRole("link", { name: /Netflix/ })).toBeVisible();
  });

  test("절약 페이지", async ({ page }) => {
    await seed(page, [{ ...netflix, status: "killed", killedAt: new Date().toISOString() }]);
    await page.goto("/savings");

    // 17,000 x 12 months of defended spend.
    await expect(page.getByText("연 ₩204,000 절약")).toBeVisible();
  });
});
