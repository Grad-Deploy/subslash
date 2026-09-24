import { test, expect } from "@playwright/test";

/**
 * '내 정보'의 비밀번호 변경 화면. 서버 쪽 변경은 통합 테스트(password-change.test.ts)가
 * 실제 SQLite로 확인하므로, 여기서는 /api/auth/me와 변경 응답만 바꿔 화면의 흐름을 본다.
 */
test.describe("비밀번호 변경 (E2E)", () => {
  test("지금 비밀번호가 틀리면 알리고, 맞으면 바꾼 뒤 칸을 비운다", async ({ page }) => {
    const bodies: unknown[] = [];

    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        json: {
          account: {
            id: "a1",
            username: "tester",
            email: "tester@gmail.com",
            age: null,
            gender: null,
            emailVerified: true,
            createdAt: "2026-09-01T00:00:00.000Z",
          },
        },
      }),
    );
    await page.route("**/api/auth/password", async (route) => {
      const body = route.request().postDataJSON();
      bodies.push(body);
      if (body?.currentPassword !== "old-password-2026") {
        await route.fulfill({
          status: 403,
          json: {
            error: "지금 비밀번호가 맞지 않습니다.",
            fieldErrors: { currentPassword: "지금 비밀번호가 맞지 않습니다." },
          },
        });
        return;
      }
      await route.fulfill({ json: { status: "changed" } });
    });

    await page.goto("/me");
    const section = page.getByRole("region", { name: "비밀번호 변경" });
    await expect(section).toBeVisible({ timeout: 30_000 });
    const submit = section.getByRole("button", { name: "비밀번호 바꾸기" });

    // 지금 비밀번호 없이 누르면 요청을 보내지 않는다.
    await submit.click();
    await expect(section.getByRole("alert")).toHaveText("지금 비밀번호를 입력해주세요.");
    expect(bodies).toHaveLength(0);

    // 지금 비밀번호와 같은 새 비밀번호는 화면에서 먼저 막는다.
    await section.getByLabel("지금 비밀번호").fill("old-password-2026");
    await section.getByLabel("새 비밀번호", { exact: true }).fill("old-password-2026");
    await expect(section.getByText("지금 비밀번호와 다른 비밀번호를 정해주세요.")).toBeVisible();

    await section.getByLabel("지금 비밀번호").fill("wrong-password-1");
    await section.getByLabel("새 비밀번호", { exact: true }).fill("new-password-2026");
    await section.getByLabel("새 비밀번호 확인").fill("new-password-2026");
    await submit.click();
    await expect(section.getByRole("alert")).toHaveText("지금 비밀번호가 맞지 않습니다.");

    await section.getByLabel("지금 비밀번호").fill("old-password-2026");
    await submit.click();
    await expect(section.getByRole("status")).toHaveText(
      "비밀번호를 바꿨습니다. 다른 기기에서는 새 비밀번호로 다시 로그인해주세요.",
    );
    expect(bodies.at(-1)).toEqual({
      currentPassword: "old-password-2026",
      password: "new-password-2026",
      passwordConfirm: "new-password-2026",
    });
    await expect(section.getByLabel("지금 비밀번호")).toHaveValue("");
    await expect(section.getByLabel("새 비밀번호", { exact: true })).toHaveValue("");
  });

  test("로그인하지 않으면 비밀번호 변경 칸이 없다", async ({ page }) => {
    await page.route("**/api/auth/me", (route) => route.fulfill({ json: { account: null } }));
    await page.goto("/me");
    await expect(page.getByText(/로그인하지 않아도 모든 기록을 쓸 수 있어요/)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("region", { name: "비밀번호 변경" })).toHaveCount(0);
  });
});
