import { test, expect } from "@playwright/test";

import { PRIVACY_OFFICER } from "../../lib/privacy";

test.describe("개인정보처리방침 (E2E)", () => {
  test("어느 화면에서든 푸터로 들어가고, 법이 적으라고 한 것과 연락처를 지어내지 않고 보여준다", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    // 대시보드는 로딩 표시를 그렸다가 본문으로 바뀌며 푸터가 아래로 밀린다. 그 사이에 누르면
    // 클릭이 엉뚱한 곳에 떨어지므로(WebKit에서 재현), 본문이 뜬 뒤에 누른다.
    await expect(page.getByRole("heading", { name: "오늘의 구독 점검" })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("contentinfo").getByRole("link", { name: "개인정보처리방침" }).click({
      timeout: 30_000,
    });

    // 하이드레이션 전에 누른 클릭은 React가 붙은 뒤에 처리된다. 느린 기기(WebKit)에서는 기본 5초가
    // 모자랄 수 있다.
    await expect(page).toHaveURL(/\/privacy$/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1, name: "개인정보처리방침" })).toBeVisible({
      timeout: 30_000,
    });
    // 서버로 가는 것이 무엇인지와, 국외 처리 위치를 적는다.
    await expect(page.getByText("일본 도쿄(AWS)")).toBeVisible();
    // 법이 적으라고 한 것들 — 권익침해 구제를 맡는 기관과 Google 데이터 취급.
    await expect(page.getByText("개인정보분쟁조정위원회")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Google 사용자 데이터 취급/ })).toBeVisible();
    // 보호책임자는 정한 사람을 적고, 정하기 전에는 비어 있다고 말한다 — 어느 쪽이든 화면이
    // 지어내지 않는다는 것이 이 테스트가 지키는 것이다.
    if (PRIVACY_OFFICER) {
      await expect(page.getByText(PRIVACY_OFFICER.name, { exact: false })).toBeVisible();
      await expect(page.getByRole("link", { name: PRIVACY_OFFICER.email })).toHaveAttribute(
        "href",
        `mailto:${PRIVACY_OFFICER.email}`,
      );
    } else {
      await expect(
        page.getByText(/개인정보 보호책임자와 연락처를 아직 정하지 않았습니다/),
      ).toBeVisible();
    }
  });

  test("가입 화면에서 방침을 볼 수 있다", async ({ page }) => {
    await page.goto("/signup");
    await expect(
      page.getByRole("main").getByRole("link", { name: "개인정보처리방침" }),
    ).toHaveAttribute("href", "/privacy", { timeout: 30_000 });
  });
});
