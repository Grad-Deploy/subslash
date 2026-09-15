import { test, expect } from "@playwright/test";

test.describe("새 구독 등록 — 서비스 고르기 (E2E)", () => {
  test("분류 탭으로 좁히고, 검색은 고른 분류와 상관없이 전체에서 찾는다", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /내 구독 모두 계산하기/ }).click();

    const dialog = page.getByRole("dialog");
    const tabs = dialog.getByRole("group", { name: "서비스 분류" });
    await expect(tabs.getByRole("button", { name: /전체/ })).toHaveAttribute(
      "aria-pressed",
      "true",
      {
        timeout: 30_000,
      },
    );

    // AI 탭에서는 AI 서비스만 보인다.
    await tabs.getByRole("button", { name: /AI/ }).click();
    await expect(dialog.getByRole("button", { name: /GitHub Copilot/ })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /넷플릭스/ })).toHaveCount(0);

    // AI 탭을 켠 채 검색해도 OTT인 넷플릭스를 찾는다.
    await dialog.getByPlaceholder(/서비스 이름 검색/).fill("넷플");
    await expect(dialog.getByRole("button", { name: /넷플릭스/ })).toBeVisible();
    await expect(tabs.getByRole("button", { name: /AI/ })).toHaveAttribute("aria-pressed", "false");
  });

  test("세금이 따로 붙는 서비스는 세금을 고르게 하고, 결제 주기를 바꾸면 연 결제 요금제로 옮긴다", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /내 구독 모두 계산하기/ }).click();

    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder(/서비스 이름 검색/).fill("Claude");
    await dialog
      .getByRole("button", { name: /Claude/ })
      .first()
      .click({ timeout: 30_000 });

    // 연 결제 요금제에는 월 결제보다 얼마나 덜 내는지 적는다.
    await expect(dialog.getByText("월 $16.67꼴 · 월 결제보다 연 $40.00 적게 (17%)")).toBeVisible();

    // 세금은 미리 골라 두지 않는다.
    const tax = dialog.getByLabel("세금");
    await expect(tax).toHaveValue("");
    await expect(dialog.getByText(/Claude 요금표는 세금을 뺀 가격이라고/)).toBeVisible();

    await dialog.locator('input[name="planId"][value="pro"]').check({ force: true });
    await tax.selectOption("10");
    await expect(dialog.getByLabel("월 요금 (세금 제외)")).toHaveValue("20");
    await expect(
      dialog.getByText("카드에 청구되는 금액: $22.00 (요금 $20.00 + 부가세 10%)"),
    ).toBeVisible();

    // 매년으로 바꾸면 같은 요금제의 연 결제로 옮긴다.
    await dialog.getByLabel("주기").selectOption("yearly");
    await expect(dialog.locator('input[name="planId"][value="pro-yearly"]')).toBeChecked();
    await expect(dialog.getByLabel("연 요금 (세금 제외)")).toHaveValue("200");

    // 연 결제 요금이 목록에 없는 요금제는 월 요금을 1년치로 남기지 않고 비운다.
    await dialog.locator('input[name="planId"][value="max-5x"]').check({ force: true });
    await expect(dialog.getByLabel("월 요금 (세금 제외)")).toHaveValue("100");
    await dialog.getByLabel("주기").selectOption("yearly");
    await expect(dialog.getByLabel("연 요금 (세금 제외)")).toHaveValue("");
    await expect(dialog.getByText(/Claude의 연 결제 요금은 목록에 없습니다/)).toBeVisible();
  });
});
