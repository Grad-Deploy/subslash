import { test, expect } from "@playwright/test";

/**
 * 회원 탈퇴 화면. 서버 쪽 삭제는 통합 테스트(account-delete.test.ts)가 실제 SQLite로
 * 확인하므로, 여기서는 /api/auth/me와 탈퇴 응답만 바꿔 화면의 흐름을 본다.
 */
test.describe("회원 탈퇴 (E2E)", () => {
  test("비밀번호가 틀리면 알리고, 맞으면 탈퇴한 뒤 브라우저 기록은 남는다고 알린다", async ({
    page,
  }) => {
    let loggedIn = true;
    const deleteBodies: unknown[] = [];

    await page.route("**/api/auth/me", (route) =>
      route.fulfill({
        json: {
          account: loggedIn
            ? {
                id: "a1",
                username: "tester",
                email: "tester@gmail.com",
                age: null,
                gender: null,
                emailVerified: true,
                createdAt: "2026-09-01T00:00:00.000Z",
              }
            : null,
        },
      }),
    );
    await page.route("**/api/auth/account", async (route) => {
      const body = route.request().postDataJSON();
      deleteBodies.push(body);
      if (body?.password !== "right-password-1!") {
        await route.fulfill({
          status: 403,
          json: {
            error: "비밀번호가 맞지 않습니다.",
            fieldErrors: { password: "비밀번호가 맞지 않습니다." },
          },
        });
        return;
      }
      loggedIn = false;
      await route.fulfill({ json: { ok: true } });
    });

    await page.goto("/me");
    const section = page.getByRole("region", { name: "회원 탈퇴" });
    await expect(section).toBeVisible({ timeout: 30_000 });
    // 누르기 전에 무엇이 남는지 알린다.
    await expect(
      section.getByText(/이 브라우저에 있는 구독·체크인 기록은 지워지지 않습니다/),
    ).toBeVisible();

    // 비밀번호 없이 누르면 요청을 보내지 않는다.
    await section.getByRole("button", { name: "회원 탈퇴" }).click();
    await expect(section.getByRole("alert")).toHaveText("비밀번호를 입력해주세요.");
    expect(deleteBodies).toHaveLength(0);

    await section.getByLabel("비밀번호 확인").fill("wrong-password-1!");
    await section.getByRole("button", { name: "회원 탈퇴" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "탈퇴", exact: true }).click();
    await expect(section.getByRole("alert")).toHaveText("비밀번호가 맞지 않습니다.");

    await section.getByLabel("비밀번호 확인").fill("right-password-1!");
    await section.getByRole("button", { name: "회원 탈퇴" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "탈퇴", exact: true }).click();

    await expect(page.getByRole("status").getByText("탈퇴했습니다.")).toBeVisible();
    await expect(page.getByText(/이 브라우저의 구독 기록은 그대로 있어/)).toBeVisible();
    // 로그아웃 상태로 바뀐다.
    await expect(page.getByText(/로그인한 계정에만 있는 화면입니다/)).toBeVisible();
  });
});
