import { randomUUID } from "node:crypto";

import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { Pool } from "pg";
import { z } from "zod";

const suffix = randomUUID();
const email = `e2e-a11y-${suffix}@example.invalid`;
const password = "DevLog-a11y-2026";
const displayName = "접근성 사용자";
const projectTitle = `키보드 프로젝트 ${suffix.slice(0, 8)}`;
const technologyNames = ["Next.js"];

async function expectNoSeriousAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page }).analyze();
  const violations = results.violations.filter(
    ({ impact }) => impact === "serious" || impact === "critical",
  );
  const summary = violations
    .map(
      ({ help, id, nodes }) =>
        `${id}: ${help} (${nodes.map(({ target }) => target.join(" ")).join(", ")})`,
    )
    .join("\n");

  expect(violations, summary).toEqual([]);
}

async function expectNoHorizontalOverflow(page: Page) {
  const layout = await page.evaluate(() => {
    const contentWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
    );
    const overflowingElements = Array.from(document.querySelectorAll("body *"))
      .map((element) => {
        const bounds = element.getBoundingClientRect();

        return {
          element: `${element.tagName.toLowerCase()}.${element.className}`,
          right: Math.round(bounds.right),
          width: Math.round(bounds.width),
        };
      })
      .filter(({ right }) => right > window.innerWidth + 1)
      .sort((left, right) => right.right - left.right)
      .slice(0, 5);

    return {
      overflow: contentWidth - window.innerWidth,
      overflowingElements,
    };
  });

  expect(
    layout.overflow,
    `${page.url()}\n${JSON.stringify(layout.overflowingElements, null, 2)}`,
  ).toBeLessThanOrEqual(1);
}

async function tabTo(page: Page, target: Locator, maximumTabs = 80) {
  for (let index = 0; index < maximumTabs; index += 1) {
    const focused = await target.evaluate(
      (element) => element === document.activeElement,
    );

    if (focused) {
      return;
    }

    await page.keyboard.press("Tab");
  }

  throw new Error(`Tab ${maximumTabs}회 안에 목표 요소로 이동하지 못했습니다.`);
}

test.afterAll(async () => {
  const databaseUrl = z.url().parse(process.env.DATABASE_URL);
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    await pool.query('DELETE FROM "User" WHERE "email" = $1', [email]);
    await pool.query(
      `DELETE FROM "Technology" AS technology
       WHERE technology."name" = ANY($1::text[])
         AND NOT EXISTS (
           SELECT 1 FROM "ProjectTechnology"
           WHERE "technologyId" = technology."id"
         )
         AND NOT EXISTS (
           SELECT 1 FROM "LearningLogTechnology"
           WHERE "technologyId" = technology."id"
         )
         AND NOT EXISTS (
           SELECT 1 FROM "UserTechnology"
           WHERE "technologyId" = technology."id"
         )`,
      [technologyNames],
    );
  } finally {
    await pool.end();
  }
});

test("키보드, Dialog 포커스와 주요 viewport 접근성을 검증한다", async ({
  page,
}) => {
  test.setTimeout(120_000);

  await page.goto("/signup");
  await expectNoSeriousAccessibilityViolations(page);
  await page.getByLabel("이름").fill(displayName);
  await page.getByLabel("이메일").fill(email);
  await page.locator("#password").fill(password);
  await page.getByLabel("비밀번호 확인").fill(password);
  await page.getByRole("button", { name: "계정 만들기" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/projects/new");
  const titleInput = page.getByLabel("프로젝트 이름");
  await tabTo(page, titleInput);
  await page.keyboard.type(projectTitle);

  const descriptionInput = page.getByLabel("설명");
  await tabTo(page, descriptionInput);
  await page.keyboard.type("키보드만으로 생성한 접근성 검증 프로젝트입니다.");

  const statusSelect = page.getByLabel("상태");
  await tabTo(page, statusSelect);
  await page.keyboard.press("ArrowDown");

  const technologyCheckbox = page.getByLabel("Next.js", { exact: true });
  await tabTo(page, technologyCheckbox);
  await page.keyboard.press("Space");

  const createButton = page.getByRole("button", {
    name: "프로젝트 만들기",
  });
  await tabTo(page, createButton);
  await page.keyboard.press("Enter");

  await expect(
    page.getByRole("heading", { name: projectTitle, exact: true }),
  ).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);

  const deleteButton = page.getByRole("button", { name: "프로젝트 삭제" });
  await tabTo(page, deleteButton);
  await page.keyboard.press("Enter");

  const dialog = page.getByRole("dialog", {
    name: "프로젝트를 삭제할까요?",
  });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "대화상자 닫기" }),
  ).toBeFocused();
  await expectNoSeriousAccessibilityViolations(page);

  await page.keyboard.press("Shift+Tab");
  await expect
    .poll(() =>
      dialog.evaluate(
        (element) =>
          element === document.activeElement ||
          element.contains(document.activeElement),
      ),
    )
    .toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(deleteButton).toBeFocused();

  const routes = [
    "/dashboard",
    "/projects",
    "/tasks",
    "/learning",
    "/analytics",
    "/profile",
  ];
  const viewports = [
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  }

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/dashboard");
  const menuButton = page.getByRole("button", { name: "메뉴 열기" });
  await menuButton.click();
  const mobileMenu = page.getByRole("dialog", { name: "모바일 주요 메뉴" });
  await expect(mobileMenu).toBeVisible();
  await expect(mobileMenu.getByRole("button", { name: "메뉴 닫기" })).toBeFocused();
  await expectNoSeriousAccessibilityViolations(page);
  await page.keyboard.press("Escape");
  await expect(mobileMenu).not.toBeVisible();
  await expect(menuButton).toBeFocused();
});
