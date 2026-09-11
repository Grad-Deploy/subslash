import { test, expect, type Page } from "@playwright/test";

// Must match the `name` given to zustand's persist middleware in lib/store.ts.
const STORAGE_KEY = "subslash-storage";

const base = {
  currency: "KRW",
  billingDay: 15,
  billingCycle: "monthly",
  createdAt: "2026-01-01T00:00:00.000Z",
};

/** 8월 1일에 해지했고, 8월 15일 결제가 멈춘 것을 확인한 넷플릭스. */
const killedNetflix = {
  ...base,
  id: "netflix",
  name: "넷플릭스",
  amount: 17000,
  category: "ott",
  status: "killed",
  killedAt: "2026-08-01T03:00:00.000Z",
  killVerifiedAt: "2026-08-16T03:00:00.000Z",
};

const activeMelon = {
  ...base,
  id: "melon",
  name: "멜론",
  amount: 10900,
  category: "music",
  status: "active",
};

async function seedOnce(page: Page, subscriptions: Record<string, unknown>[]) {
  const value = JSON.stringify({
    state: { subscriptions, usageLogs: [], accounts: [] },
    version: 1,
  });
  await page.addInitScript(
    ([key, stored]) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, stored);
    },
    [STORAGE_KEY, value] as const,
  );
}

async function readState(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").state, STORAGE_KEY);
}

test.describe("해지한 구독의 상태 (E2E)", () => {
  test("메인 화면은 해지한 구독을 구독 중으로 세지 않는다", async ({ page }) => {
    await seedOnce(page, [killedNetflix]);
    await page.goto("/");

    await expect(page.getByText("지금 구독 중인 서비스는 없습니다.")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/구독이 등록되어 있습니다|구독 중인 서비스가 \d+개/)).toHaveCount(
      0,
    );

    await page.getByRole("button", { name: /절약 현황 보기/ }).click();
    await expect(page).toHaveURL(/\/savings/, { timeout: 30_000 });
  });

  test("구독 중과 해지한 구독이 섞여 있으면 구독 중인 것만 센다", async ({ page }) => {
    await seedOnce(page, [killedNetflix, activeMelon]);
    await page.goto("/");

    await expect(page.getByText("현재 구독 중인 서비스가 1개 있습니다.")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/해지한 구독 1개는 절약 현황에 있습니다/)).toBeVisible();
  });

  test("해지한 구독의 상세에서는 다시 해지로 기록하거나 체크인할 수 없다", async ({ page }) => {
    await seedOnce(page, [killedNetflix]);
    await page.goto("/subs/netflix");

    await expect(page.getByText("해지한 구독입니다.")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /체크인 하기/ })).toHaveCount(0);

    await page.getByRole("button", { name: /해지 방법 보기/ }).click();
    const guide = page.getByRole("dialog");
    await expect(guide.getByText(/이미 해지한 구독으로 기록되어 있습니다/)).toBeVisible();
    await expect(guide.getByRole("button", { name: "해지 완료했어요" })).toHaveCount(0);
    await guide.getByRole("button", { name: "닫기" }).last().click();

    // 해지일과 결제 멈춤 확인이 그대로다.
    const [sub] = (await readState(page)).subscriptions;
    expect(sub.killedAt).toBe(killedNetflix.killedAt);
    expect(sub.killVerifiedAt).toBe(killedNetflix.killVerifiedAt);
  });

  test("해지 전에 받은 체크인 메일 링크는 해지한 구독에 체크인을 남기지 않는다", async ({
    page,
  }) => {
    await seedOnce(page, [killedNetflix]);
    await page.goto("/check-in?sub=netflix&count=0");

    await expect(page.getByRole("heading", { name: "이미 해지한 구독입니다" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: /해지 가이드 열기/ })).toHaveCount(0);

    const state = await readState(page);
    expect(state.usageLogs).toHaveLength(0);
    expect(state.subscriptions[0].status).toBe("killed");
    expect(state.subscriptions[0].killedAt).toBe(killedNetflix.killedAt);
  });
});
