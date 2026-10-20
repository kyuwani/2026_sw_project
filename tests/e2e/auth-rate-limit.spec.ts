import { expect, test } from "@playwright/test";

test("로그인 요청이 rate limit으로 거절되면 재시도 안내를 표시한다", async ({
  page,
}) => {
  await page.route("**/login", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({ status: 429, body: "Too Many Requests" });
      return;
    }

    await route.continue();
  });

  await page.goto("/login");
  await page.getByLabel("이메일").fill("rate-limit@example.invalid");
  await page.getByLabel("비밀번호").fill("DevLog-rate-limit-2026");
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(
    page.getByRole("heading", { name: "요청을 처리하지 못했습니다" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "DevLog" })).toBeVisible();

  await page.unroute("**/login");
  await page.getByRole("button", { name: "다시 시도" }).click();

  await expect(page.getByLabel("이메일")).toBeVisible();
});
