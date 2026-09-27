import { test, expect, type Page } from "@playwright/test";

/**
 * 해지 대신 할 수 있는 것(요금제 낮추기), 해지 기록(다시 살펴볼 날·환불 요청 글), 구독 영수증.
 *
 * 날짜에 따라 달라지는 화면이라 시계를 2026년 9월 27일에 고정한다.
 */
const NOW = new Date("2026-09-27T10:00:00+09:00");

function seed(): string {
  return JSON.stringify({
    state: {
      subscriptions: [
        {
          id: "netflix",
          name: "넷플릭스",
          amount: 17000,
          currency: "KRW",
          billingDay: 10,
          billingCycle: "monthly",
          category: "ott",
          status: "active",
          cancelUrl: "https://www.netflix.com/cancelplan",
          planId: "premium",
          planName: "프리미엄",
          createdAt: "2026-01-01T00:00:00.000Z",
          lastPriceCheckedAt: "2026-09-20T00:00:00.000Z",
        },
        {
          id: "youtube",
          name: "유튜브 프리미엄",
          amount: 14900,
          currency: "KRW",
          billingDay: 3,
          billingCycle: "monthly",
          category: "ott",
          status: "active",
          sharingCount: 2,
          createdAt: "2026-01-01T00:00:00.000Z",
          lastPriceCheckedAt: "2026-09-20T00:00:00.000Z",
        },
        {
          id: "tving",
          name: "티빙",
          amount: 13500,
          currency: "KRW",
          billingDay: 5,
          billingCycle: "monthly",
          category: "ott",
          status: "killed",
          createdAt: "2026-01-01T00:00:00.000Z",
          killedAt: "2026-08-20T03:00:00.000Z",
          chargedAfterKillAt: "2026.09.05",
          chargedAfterKillAmount: 13500,
        },
      ],
      usageLogs: [
        {
          id: "log-netflix",
          subscriptionId: "netflix",
          month: "2026-08",
          usageCount: 4,
          costPerUse: 4250,
          riskLevel: "yellow",
          checkedAt: "2026-08-25T00:00:00.000Z",
        },
      ],
      accounts: [],
    },
    version: 1,
  });
}

async function open(page: Page, path: string) {
  await page.clock.setFixedTime(NOW);
  await page.addInitScript((value) => {
    if (!localStorage.getItem("subslash-storage")) {
      localStorage.setItem("subslash-storage", value);
    }
  }, seed());
  await page.goto(path);
}

test("구독 상세가 해지 대신 더 싼 요금제를 1년 차액과 함께 보여 준다", async ({ page }) => {
  await open(page, "/subs/detail?id=netflix");

  const card = page
    .getByRole("region", { name: "해지 대신 할 수 있는 것" })
    .or(page.locator("section", { hasText: "해지 대신 할 수 있는 것" }));
  await expect(card.first()).toContainText("광고형 스탠다드");
  await expect(card.first()).toContainText("₩120,000");

  await card.first().getByRole("button", { name: "이 요금제로 바꿨어요" }).first().click();
  await page.getByRole("button", { name: "바꿨어요", exact: true }).click();
  await expect(page.getByText("요금제: 광고형 스탠다드")).toBeVisible();
});

test("해지 뒤 결제된 구독에 환불 요청 글을 주고, 다시 살펴볼 날을 저장한다", async ({ page }) => {
  await open(page, "/subs/detail?id=tving");

  await expect(page.getByText("해지 뒤에 결제됐어요")).toBeVisible();
  await expect(
    page.getByText(/2026\.08\.20에 구독을 해지했는데, 2026\.09\.05에 ₩13,500이/),
  ).toBeVisible();

  await page.getByLabel("다시 살펴볼 날").fill("2026-12-01");
  await page
    .locator("section", { hasText: "다시 살펴볼 날" })
    .getByRole("button", { name: "저장" })
    .first()
    .click();
  await page.reload();
  await expect(page.getByLabel("다시 살펴볼 날")).toHaveValue("2026-12-01");
});

test("지난달 구독 영수증에 기록상 결제된 구독과 지킨 돈이 나온다", async ({ page }) => {
  await open(page, "/report/receipt");

  const receipt = page.getByRole("article", { name: "2026년 8월 구독 영수증" });
  await expect(receipt).toContainText("넷플릭스");
  await expect(receipt).toContainText("4회 이용 · 1회 ₩4,250");
  // 나눠 내는 유튜브는 내 몫(반)으로 적는다.
  await expect(receipt).toContainText("₩7,450");
  // 티빙은 8월 5일 결제 뒤인 20일에 해지해 8월에는 청구됐다.
  await expect(receipt).toContainText("티빙");
  await expect(receipt).toContainText("카드 명세서와 다를 수 있어요");

  await page.getByRole("tab", { name: "연말 결산" }).click();
  await expect(page.getByRole("article", { name: "2026년 구독 영수증" })).toContainText("오늘까지");
});
