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

    // 등록을 마치면 대시보드로 간다. 대시보드는 목록이 아니라 행동 큐라서,
    // 방금 등록한 구독은 "아직 체크인한 적이 없다"는 이유로 큐에 올라온다.
    // 첫 이동에서는 dev 서버가 라우트를 컴파일하는 시간까지 기다린다.
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("heading", { name: /지금 결정할 것/ })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("Netflix").first()).toBeVisible();
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

  test("메일 체크인: '해지 가이드 열기'는 가이드를 열 뿐, 확인 전에는 해지로 기록하지 않는다", async ({
    page,
  }) => {
    await seed(page, [netflix]);
    await page.goto("/check-in?sub=sub1&count=0");

    await page.getByRole("button", { name: /해지 가이드 열기/ }).click({ timeout: 30_000 });

    // 예전에는 이 버튼이 곧바로 해지 완료로 기록하고 대시보드로 떠났다.
    const guideDialog = page.getByRole("dialog");
    await expect(guideDialog.getByText("해지 메뉴까지 가는 길")).toBeVisible();
    await expect(page).toHaveURL(/\/check-in/);
    const statusBefore = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "{}").state.subscriptions[0].status,
      STORAGE_KEY,
    );
    expect(statusBefore).toBe("active");

    await guideDialog.getByRole("button", { name: "해지 완료했어요" }).click();
    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog.getByText("구독 해지 완료 처리")).toBeVisible();
    await confirmDialog.getByRole("button", { name: "해지 완료" }).click();

    await expect(page).toHaveURL(/\/savings/);
    await expect(page.getByText("연 ₩204,000 절약")).toBeVisible({ timeout: 30_000 });
  });

  test("메일 체크인: 가이드에서 '나중에 하기'를 누르면 해지하지 않고 대시보드로 간다", async ({
    page,
  }) => {
    await seed(page, [netflix]);
    await page.goto("/check-in?sub=sub1&count=0");

    await page.getByRole("button", { name: /해지 가이드 열기/ }).click({ timeout: 30_000 });
    await page.getByRole("dialog").getByRole("button", { name: "나중에 하기" }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
    const status = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "{}").state.subscriptions[0].status,
      STORAGE_KEY,
    );
    expect(status).toBe("active");
  });

  test("행동 큐: 체크인한 구독은 큐에서 빠진다", async ({ page }) => {
    // 최근에 충분히 썼다고 체크인해두면 결정할 것이 없다. 결제일도 멀게 잡는다.
    const now = new Date();
    const farBillingDay = ((now.getDate() + 14) % 28) + 1;
    const quiet = {
      ...netflix,
      billingDay: farBillingDay,
      lastPriceCheckedAt: now.toISOString(),
    };

    await page.addInitScript(
      ([key, sub]) => {
        const s = sub as Record<string, unknown>;
        window.localStorage.setItem(
          key as string,
          JSON.stringify({
            state: {
              subscriptions: [s],
              usageLogs: [
                {
                  id: "log1",
                  subscriptionId: s.id,
                  month: "2026-09",
                  usageCount: 12,
                  costPerUse: 1416,
                  riskLevel: "green",
                  checkedAt: new Date().toISOString(),
                },
              ],
              accounts: [],
            },
            version: 1,
          }),
        );
      },
      [STORAGE_KEY, quiet] as const,
    );

    await page.goto("/dashboard");
    await expect(page.getByText("지금 결정할 것이 없습니다")).toBeVisible({ timeout: 30_000 });
  });

  test("행동 큐: 체크인 기록이 없으면 이유와 함께 올라온다", async ({ page }) => {
    await seed(page, [netflix]);
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: /지금 결정할 것 \(1\)/ })).toBeVisible({
      timeout: 30_000,
    });
    // 목록이 아니라 "왜 떴는지"를 보여준다.
    await expect(page.getByText(/체크인/).first()).toBeVisible();
  });

  test("절약 페이지", async ({ page }) => {
    await seed(page, [{ ...netflix, status: "killed", killedAt: new Date().toISOString() }]);
    await page.goto("/savings");

    // 17,000 x 12 months of defended spend.
    await expect(page.getByText("연 ₩204,000 절약")).toBeVisible();
  });
});
