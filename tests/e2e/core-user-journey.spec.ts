import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";
import { Pool } from "pg";
import { z } from "zod";

const suffix = randomUUID();
const email = `e2e-${suffix}@example.invalid`;
const password = "DevLog-e2e-2026";
const displayName = "E2E 사용자";
const projectTitle = `E2E 프로젝트 ${suffix.slice(0, 8)}`;
const taskTitle = `E2E Task ${suffix.slice(0, 8)}`;
const learningTitle = `E2E 학습 ${suffix.slice(0, 8)}`;
const technologyNames = ["Next.js", "TypeScript"];

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

test("로그인부터 핵심 기록의 Dashboard 반영까지 완료한다", async ({
  page,
}) => {
  await page.goto("/signup");
  await page.getByLabel("이름").fill(displayName);
  await page.getByLabel("이메일").fill(email);
  await page.locator("#password").fill(password);
  await page.getByLabel("비밀번호 확인").fill(password);
  await page.getByRole("button", { name: "계정 만들기" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: `안녕하세요, ${displayName}님` }),
  ).toBeVisible();

  await page.getByRole("button", { name: "로그아웃" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/projects/new");
  await page.getByLabel("프로젝트 이름").fill(projectTitle);
  await page
    .getByLabel("설명")
    .fill("핵심 사용자 여정을 검증하는 E2E 프로젝트입니다.");
  await page.getByLabel("상태").selectOption("IN_PROGRESS");
  await page.getByLabel("Next.js", { exact: true }).check();
  await page.getByRole("button", { name: "프로젝트 만들기" }).click();

  await expect(
    page.getByRole("heading", { name: projectTitle, exact: true }),
  ).toBeVisible();
  await expect(page.getByText("프로젝트를 만들었습니다.")).toBeVisible();

  await page.getByRole("link", { name: "Task 추가" }).first().click();
  await page.getByLabel("제목").fill(taskTitle);
  await page
    .getByLabel("설명")
    .fill("프로젝트 생성 후 Task 완료 상태를 검증합니다.");
  await page.getByLabel("우선순위").selectOption("HIGH");
  await page.getByRole("button", { name: "Task 추가" }).click();

  const task = page.getByRole("article").filter({ hasText: taskTitle });
  await expect(task).toBeVisible();
  await task.getByRole("button", { name: "완료" }).click();
  await expect(task.getByRole("button", { name: "재개" })).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: `${projectTitle} 진행률` }),
  ).toHaveAttribute("aria-valuenow", "100");

  await page.goto("/learning/new");
  await page.getByLabel("카테고리").selectOption("FRAMEWORK");
  await page.getByLabel("학습 제목").fill(learningTitle);
  await page
    .getByLabel("학습 내용")
    .fill("Server Action과 Dashboard 집계 흐름을 E2E로 검증했습니다.");
  await page.getByLabel("시간").fill("0");
  await page.getByLabel("분").fill("45");
  await page.getByLabel("TypeScript", { exact: true }).check();
  await page.getByRole("button", { name: "학습 기록 저장" }).click();

  await expect(page).toHaveURL(/\/learning\?created=1$/);
  await expect(page.getByText("학습 기록을 저장했습니다.")).toBeVisible();
  await expect(page.getByText(learningTitle)).toBeVisible();

  await page.goto("/dashboard");
  const summary = page.getByRole("region", { name: "개발 현황 요약" });
  await expect(
    summary.getByText("완료한 Task").locator("..").getByText("1개"),
  ).toBeVisible();
  await expect(
    summary.getByText("이번 주 학습").locator("..").getByText("45분"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: projectTitle, exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: `${projectTitle} 진행률` }),
  ).toHaveAttribute("aria-valuenow", "100");
});
