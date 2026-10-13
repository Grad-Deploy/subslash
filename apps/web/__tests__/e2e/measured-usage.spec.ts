import { test, expect, type Page } from "@playwright/test";

/**
 * 여러 기기 사용 측정의 구독 상세 한 줄(components/usage/MeasuredUsage). 0번이면 왜 0번인지(1분 미만은 세지
 * 않음·측정한 기기는 안드로이드뿐)를 적고, AI 구독에는 'TV·PC에서 본 것'이 아니라 PC·웹에서 쓴 것이 빠졌다고
 * 말한다 — PC 기록으로 30일 중 30일 쓴 Claude 옆에 '0번'만 있어 틀린 숫자로 읽혔다. 로그인과 측정 결과는
 * 이 테스트가 API 응답으로 흉내 낸다.
 */

const ACCOUNT = {
  id: "a1",
  username: "tester",
  email: "tester@gmail.com",
  age: null,
  gender: null,
  emailVerified: true,
  createdAt: "2026-09-01T00:00:00.000Z",
};

function subscription(id: string, name: string, category: string) {
  return {
    id,
    name,
    amount: 30000,
    currency: "KRW",
    billingDay: 15,
    billingCycle: "monthly",
    category,
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

async function openDetail(page: Page, id: string) {
  const now = Date.now();
  await page.route("**/api/auth/me", (route) => route.fulfill({ json: { account: ACCOUNT } }));
  await page.route("**/api/account/snapshot**", (route) =>
    route.request().method() === "GET"
      ? route.fulfill({ status: 404, json: { status: "none" } })
      : route.fulfill({ json: { status: "saved" } }),
  );
  // 측정한 기기 1대, 그 기간에 세어진 서비스는 없다(0번).
  await page.route("**/api/usage**", (route) =>
    route.fulfill({
      json: {
        devices: [
          { deviceKey: "d1", label: null, measuredFrom: now - 20 * 86_400_000, measuredUntil: now },
        ],
        summary: {
          from: now - 30 * 86_400_000,
          to: now,
          services: [],
          measuredDeviceCount: 1,
          partial: true,
        },
      },
    }),
  );
  await page.addInitScript(
    ([key, value]) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    [
      "subslash-storage",
      JSON.stringify({
        state: {
          subscriptions: [
            subscription("c1", "Claude", "ai"),
            subscription("n1", "넷플릭스", "ott"),
          ],
          usageLogs: [],
          accounts: [],
        },
        version: 1,
      }),
    ] as const,
  );
  await page.goto(`/subs/detail?id=${id}`);
}

test("AI 구독이 0번이면 이유를 적고 PC·웹 사용이 빠졌다고 말한다", async ({ page }) => {
  await openDetail(page, "c1");
  await expect(page.getByText("측정한 기기에서 최근 30일")).toBeVisible();
  await expect(page.getByText(/1분 넘게 쓴 적이 없어요/)).toBeVisible();
  await expect(page.getByText(/PC·웹에서 쓴 것은 빠져 있어서/)).toBeVisible();
  await expect(page.getByText(/TV·PC에서 본 것은 없어서/)).toHaveCount(0);
});

test("AI가 아닌 구독은 TV·PC 안내를 그대로 둔다", async ({ page }) => {
  await openDetail(page, "n1");
  await expect(page.getByText(/1분 넘게 쓴 적이 없어요/)).toBeVisible();
  await expect(page.getByText(/TV·PC에서 본 것은 없어서/)).toBeVisible();
  await expect(page.getByText(/PC·웹에서 쓴 것은 빠져 있어서/)).toHaveCount(0);
});
