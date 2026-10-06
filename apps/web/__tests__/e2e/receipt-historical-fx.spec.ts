import { test, expect, type Page } from "@playwright/test";

/**
 * 지난 달 영수증·연말 결산의 달러 결제는 결제일의 고시 환율로 바꾼다. 예전에는 지금 환율로 바꿔, 환율이 움직인 만큼
 * 그때 낸 돈과 다른 금액이 나왔다.
 *
 * 시계를 2026년 9월 28일에 고정하고, 고시 환율(`/api/fx/history`)은 정한 값으로 돌려준다 — 8월 10일 1,300원.
 * 사용자 환율은 1,400원이다.
 */
const NOW = new Date("2026-09-28T10:00:00+09:00");

function seed(): string {
  return JSON.stringify({
    state: {
      subscriptions: [
        {
          id: "chatgpt",
          name: "ChatGPT Plus",
          amount: 20,
          currency: "USD",
          billingDay: 10,
          billingCycle: "monthly",
          category: "ai",
          status: "active",
          createdAt: "2026-07-01T00:00:00.000Z",
        },
      ],
      usageLogs: [],
      accounts: [],
      exchangeRate: { rate: 1400, source: "manual", updatedAt: "2026-09-27T00:00:00.000Z" },
    },
    version: 1,
  });
}

async function open(page: Page, path: string, rates: Record<string, number> | null) {
  await page.clock.setFixedTime(NOW);
  await page.route("**/api/fx/history**", (route) =>
    rates
      ? route.fulfill({ json: { rates, source: "ecb" } })
      : route.fulfill({ status: 502, json: { error: "upstream_unavailable" } }),
  );
  await page.addInitScript((value) => {
    if (!localStorage.getItem("subslash-storage")) {
      localStorage.setItem("subslash-storage", value);
    }
  }, seed());
  await page.goto(path);
}

test("지난 달 달러 결제는 결제일의 고시 환율로 적는다", async ({ page }) => {
  await open(page, "/report/receipt?month=2026-08", { "2026-08-10": 1300 });

  const receipt = page.getByRole("article", { name: "2026년 8월 구독 영수증" });
  // 20달러 × 1,300원. 지금 환율(1,400원)이면 ₩28,000이 나온다.
  await expect(receipt).toContainText("₩26,000", { timeout: 30_000 });
  await expect(receipt).not.toContainText("₩28,000");
  await expect(receipt).toContainText("결제일의 고시 환율(ECB 기준)");
});

test("고시 환율을 받지 못하면 지금 환율로 계산하고 그렇다고 적는다", async ({ page }) => {
  await open(page, "/report/receipt?month=2026-08", null);

  const receipt = page.getByRole("article", { name: "2026년 8월 구독 영수증" });
  await expect(receipt).toContainText("₩28,000", { timeout: 30_000 });
  await expect(receipt).toContainText("그날 환율을 받지 못해 지금 설정한 환율로 계산했어요");
});

test("연말 결산의 막은 결제도 결제일의 고시 환율로 적는다", async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await page.route("**/api/fx/history**", (route) =>
    route.fulfill({
      json: {
        rates: { "2026-07-10": 1250, "2026-08-10": 1300, "2026-09-10": 1350 },
        source: "ecb",
      },
    }),
  );
  await page.addInitScript(() => {
    if (localStorage.getItem("subslash-storage")) return;
    localStorage.setItem(
      "subslash-storage",
      JSON.stringify({
        state: {
          subscriptions: [
            {
              id: "chatgpt",
              name: "ChatGPT Plus",
              amount: 20,
              currency: "USD",
              billingDay: 10,
              billingCycle: "monthly",
              category: "ai",
              status: "killed",
              createdAt: "2026-01-01T00:00:00.000Z",
              killedAt: "2026-07-05T00:00:00.000Z",
              killVerifiedAt: "2026-07-11T00:00:00.000Z",
            },
          ],
          usageLogs: [],
          accounts: [],
          exchangeRate: { rate: 1400, source: "manual", updatedAt: "2026-09-27T00:00:00.000Z" },
        },
        version: 1,
      }),
    );
  });
  await page.goto("/savings/review?year=2026");

  const defended = page.getByRole("region", { name: /해지로 막은 결제/ });
  // 7·8·9월 10일에 막은 20달러를 그날의 환율로: 25,000 + 26,000 + 27,000. 지금 환율이면 ₩84,000이다.
  await expect(defended).toContainText("₩78,000", { timeout: 30_000 });
  await expect(defended).toContainText("그날의 고시 환율(ECB 기준)");
});
