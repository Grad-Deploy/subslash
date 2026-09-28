import { test, expect, type Page } from "@playwright/test";

/**
 * 이번 달 구독 영수증. 결제일(10일)이 지난 뒤에 등록한 구독도 그 달에는 구독 중이던 것으로 적고, 결제일이
 * 오지 않은 구독은 '결제 예정'으로 적는다 — 예전에는 둘 다 빠져 '결제된 구독이 없어요'만 나왔다.
 *
 * 시계를 2026년 9월 28일에 고정한다.
 */
const NOW = new Date("2026-09-28T10:00:00+09:00");

function seed(): string {
  return JSON.stringify({
    state: {
      subscriptions: [
        {
          id: "baemin",
          name: "배민클럽 + 유튜브 프리미엄",
          amount: 14900,
          currency: "KRW",
          billingDay: 10,
          billingCycle: "monthly",
          category: "ott",
          status: "active",
          createdAt: "2026-09-28T00:30:00.000Z",
        },
        {
          id: "watcha",
          name: "왓챠",
          amount: 7900,
          currency: "KRW",
          billingDay: 30,
          billingCycle: "monthly",
          category: "ott",
          status: "active",
          createdAt: "2026-09-28T00:30:00.000Z",
        },
      ],
      usageLogs: [],
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

test("이번 달 영수증에 지금 구독 중인 구독이 나오고, 결제일이 오지 않은 것은 결제 예정이다", async ({
  page,
}) => {
  await open(page, "/report/receipt?month=2026-09");

  const receipt = page.getByRole("article", { name: "2026년 9월 구독 영수증" });
  await expect(receipt).toContainText("배민클럽 + 유튜브 프리미엄");
  await expect(receipt).toContainText("09.10 결제");
  await expect(receipt).toContainText("왓챠");
  await expect(receipt).toContainText("09.30 결제 예정");
  await expect(receipt).toContainText("결제 예정 포함");
  await expect(receipt).toContainText("₩22,800");
  await expect(receipt).not.toContainText("결제된 구독이 없어요");

  // 등록한 달보다 앞선 8월은 구독 중이었는지 모른다.
  await page.goto("/report/receipt?month=2026-08");
  const august = page.getByRole("article", { name: "2026년 8월 구독 영수증" });
  await expect(august).toContainText("결제된 구독이 없어요");
  await expect(august).toContainText(
    "등록한 달보다 앞선 달은 구독 중이었는지 몰라 넣지 않았어요(2개)",
  );
});
