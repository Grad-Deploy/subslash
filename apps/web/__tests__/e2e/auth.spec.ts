import { test, expect } from "@playwright/test";

// 클래스가 붙었는지가 아니라 실제로 칠해진 색을 본다. 예전에는 border-destructive
// 클래스가 붙어 있어도 전역 CSS에 가려 테두리가 회색 그대로였다.
const DEFAULT_BORDER = "rgb(228, 228, 231)"; // --border #e4e4e7
const ERROR_BORDER = "rgb(239, 68, 68)"; // --destructive #ef4444

test.describe("계정 (E2E)", () => {
  test("가입 폼은 나이·성별을 묻지 않고, 만 14세 확인만 필수로 받는다", async ({ page }) => {
    await page.goto("/signup");

    const over14 = page.getByLabel(/만 14세 이상입니다/);
    await expect(over14).toBeVisible({ timeout: 30_000 });
    await expect(over14).not.toBeChecked();
    await expect(page.locator("#age")).toHaveCount(0);
    await expect(page.locator("#gender")).toHaveCount(0);

    // 확인하지 않고 제출하면 서버까지 가지 않고 그 자리에서 알려준다.
    await page.getByRole("button", { name: "회원가입" }).click();
    await expect(page.getByText("만 14세 이상인지 확인해주세요.")).toBeVisible();
    await expect(page.locator("label[for=isOver14]")).toHaveCSS("border-top-color", ERROR_BORDER);
    // 비워 둔 칸도 제출하는 순간 칸마다 무엇이 빠졌는지 보인다.
    await expect(page.getByText("아이디를 입력해주세요.")).toBeVisible();
    await expect(page.getByText("이메일을 입력해주세요.")).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("회원가입을 누르기 전에, 입력하는 동안 칸마다 오류와 붉은 테두리를 보여준다", async ({
    page,
  }) => {
    await page.goto("/signup");

    const username = page.locator("#username");
    await expect(username).toBeVisible({ timeout: 30_000 });
    // 처음 연 폼은 아직 틀린 게 없으므로 붉지 않다.
    await expect(username).toHaveAttribute("aria-invalid", "false");
    await expect(username).toHaveCSS("border-top-color", DEFAULT_BORDER);

    await username.fill("ab");
    await expect(page.getByText("아이디는 4~20자로 입력해주세요.")).toBeVisible();
    await expect(username).toHaveAttribute("aria-invalid", "true");
    await expect(username).toHaveCSS("border-top-color", ERROR_BORDER);

    // 다 지우면 비었다고 알려준다.
    await username.fill("");
    await expect(page.getByText("아이디를 입력해주세요.")).toBeVisible();

    await username.fill("sean_01");
    await expect(username).not.toHaveCSS("border-top-color", DEFAULT_BORDER);
    await expect(username).not.toHaveCSS("border-top-color", ERROR_BORDER);

    // 이메일은 입력이 멈추면 형식과 도메인을 바로 알려준다.
    const email = page.locator("#email");
    await email.fill("sean@");
    await expect(page.getByText(/잘못된 이메일 형식입니다/)).toBeVisible();
    await expect(email).toHaveCSS("border-top-color", ERROR_BORDER);

    // 실제로 있는 도메인이어도 자주 쓰는 메일 서비스가 아니면 받지 않는다.
    await email.fill("sean@exampl.com");
    await expect(page.getByText(/가입할 수 없는 이메일입니다/)).toBeVisible();
    await expect(email).toHaveCSS("border-top-color", ERROR_BORDER);

    await email.fill("sean@gmial.com");
    await expect(page.getByText(/혹시 gmail\.com 아닌가요\?/)).toBeVisible();

    await email.fill("sean@naver.com");
    await expect(page.getByText(/쓸 수 있는 이메일입니다/)).toBeVisible();
    await expect(email).not.toHaveCSS("border-top-color", ERROR_BORDER);

    // 다른 칸으로 넘어가도 틀린 칸의 붉은 테두리는 남는다.
    await expect(username).not.toHaveCSS("border-top-color", ERROR_BORDER);
    await username.fill("ab");
    await email.focus();
    await expect(username).toHaveCSS("border-top-color", ERROR_BORDER);

    const password = page.locator("#password");
    await password.fill("short");
    await expect(page.getByText(/비밀번호를 5자 더 입력해주세요/)).toBeVisible();
    await expect(password).toHaveCSS("border-top-color", ERROR_BORDER);

    await expect(page).toHaveURL(/\/signup/);
  });

  test("로그인하지 않고 내 정보에 오면, 로그인 없이도 쓸 수 있다고 안내한다", async ({ page }) => {
    await page.goto("/me");

    await expect(page.getByText(/로그인한 계정에만 있는 화면입니다/)).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("link", { name: "로그인하기" })).toBeVisible();
  });
});
