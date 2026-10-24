import { test, expect, type Page } from "@playwright/test";

/**
 * 구독 리포트(/report). 예전 '절약 현황'은 해지한 구독이 없으면 빈 화면이었다. 리포트는 해지하기
 * 전에도 지금 내는 돈과 1회 단가를 보여 준다.
 */

const STORAGE_KEY = "subslash-storage";

const NETFLIX = {
  id: "netflix",
  name: "넷플릭스",
  amount: 17000,
  currency: "KRW",
  billingDay: 3,
  billingCycle: "monthly",
  category: "ott",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
};
const MELON = {
  ...NETFLIX,
  id: "melon",
  name: "Melon",
  amount: 11990,
  category: "music",
};

async function seed(page: Page, state: Record<string, unknown>) {
  await page.addInitScript(
    ({ key, value }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value: JSON.stringify({ state, version: 1 }) },
  );
}

test.describe("구독 리포트 (E2E)", () => {
  test("구독이 없으면 등록하러 가는 길 하나만 보여준다", async ({ page }) => {
    await page.goto("/report");
    await expect(page.getByText("아직 등록한 구독이 없어요")).toBeVisible({ timeout: 30_000 });
    await page.getByRole("link", { name: "구독 등록하러 가기" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("해지하지 않아도 한 달 지출과 1회 단가 순위를 보여준다", async ({ page }) => {
    await seed(page, {
      subscriptions: [NETFLIX, MELON],
      usageLogs: [
        {
          id: "l1",
          subscriptionId: "netflix",
          month: "2026-09",
          usageCount: 2,
          costPerUse: 8500,
          riskLevel: "yellow",
          checkedAt: new Date().toISOString(),
        },
      ],
      accounts: [],
    });
    await page.goto("/report");

    const summary = page.getByRole("region", { name: "지출 요약" });
    await expect(summary.getByText("₩28,990")).toBeVisible({ timeout: 30_000 });
    await expect(summary.getByText("2개")).toBeVisible();

    // 위의 구독별 막대그래프도 목록이라 칸마다 그 안에서 찾는다. 횟수로 재는 넷플릭스는 1회 단가 순위에,
    // 들은 시간으로 재는 멜론은 아래 칸에 체크인 전으로 들어간다.
    const ranking = page.getByRole("region", { name: "1회 단가 순위" }).getByRole("listitem");
    await expect(ranking).toHaveCount(1);
    await expect(ranking.first()).toContainText("넷플릭스");
    await expect(ranking.first()).toContainText("₩8,500");
    const other = page
      .getByRole("region", { name: "횟수 말고 다른 기준으로 재는 구독" })
      .getByRole("listitem");
    await expect(other.first()).toContainText("멜론");
    await expect(other.first()).toContainText("체크인 전");
  });

  test("다른 사용자와의 비교와 여러 기기 사용 측정 칸은 리포트에 없다", async ({ page }) => {
    await seed(page, { subscriptions: [NETFLIX, MELON], usageLogs: [], accounts: [] });
    await page.goto("/report");
    await expect(page.getByRole("region", { name: "지출 요약" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/다른 사용자/)).toHaveCount(0);
    await expect(page.getByText(/기기를 오가며|모든 기기 합쳐/)).toHaveCount(0);
  });

  test("하단 탭의 '리포트'는 절약 기록 화면에서도 켜져 있다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/savings");
    const tab = page.locator("nav").getByRole("link", { name: "리포트" });
    await expect(tab).toHaveClass(/text-primary/, { timeout: 30_000 });
  });

  test("추천 질문은 서버로 보내지 않고, 기기가 모르는 질문은 질문 문장만 AI로 보내 고른 계산으로 답한다", async ({
    page,
  }) => {
    // AI 서버 대신 정해 둔 호출을 돌려준다 — 이 테스트는 무엇을 보내고 받은 호출로 어떻게 답하는지만 본다.
    const sent: unknown[] = [];
    await page.route("**/api/ask", async (route) => {
      sent.push(route.request().postDataJSON());
      await route.fulfill({
        json: { call: { tool: "spendTotal", args: { period: "year" } }, cached: false },
      });
    });
    await seed(page, { subscriptions: [NETFLIX, MELON], usageLogs: [], accounts: [] });
    await page.goto("/report");

    const ask = page.getByRole("region", { name: "리포트에 물어보기" });
    await expect(ask.getByText(/질문 문장만 AI로 보내요/)).toBeVisible({ timeout: 30_000 });

    // 추천 질문 버튼은 정해 둔 계산으로 바로 답한다.
    await ask.getByRole("button", { name: "한 달에 구독비 얼마 나가?" }).click();
    await expect(ask.getByText(/28,990/).first()).toBeVisible();
    expect(sent).toEqual([]);

    // 기기 규칙이 모르는 질문은 AI에 넘긴다 — 보내는 것은 질문(과 앞선 턴의 질문·호출)뿐이다.
    // 규칙이 넓어지면 여기 질문이 기기에서 답해져 서버로 가지 않으니, 그때는 규칙이 모르는 질문으로 바꾼다
    // (이름을 댄 서비스들의 합계를 규칙이 답하게 된 뒤 "넷플릭스랑 멜론 합치면 1년에?"가 그랬다).
    const question = "적금 대신 이 돈 모으면 어떨까?";
    await ask.getByRole("textbox").fill(question);
    await ask.getByRole("button", { name: "묻기", exact: true }).click();
    await expect(ask.getByText(/347,880/).first()).toBeVisible();
    expect(sent).toHaveLength(1);
    expect(JSON.stringify(sent[0])).not.toContain("17000");
    expect(sent[0]).toMatchObject({ question });
  });
});
