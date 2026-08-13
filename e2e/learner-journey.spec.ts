import { expect, learnerCourseSlug, learnerLessonSlug, learnerModuleSlug, test } from "./fixtures";

test("learner can navigate dashboard, course outline, and lesson", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Accounting Foundations" })).toBeVisible();

  await page.getByRole("link", { name: "Accounting Pre-Master" }).click();
  await expect(page).toHaveURL(`/courses/${learnerCourseSlug}`);
  await expect(page.getByRole("heading", { name: "Accounting Pre-Master" })).toBeVisible();

  await page.getByRole("link", { name: /Accounting Foundations/ }).click();
  await expect(page).toHaveURL(`/learn/${learnerCourseSlug}/${learnerModuleSlug}/${learnerLessonSlug}`);
  await expect(page.getByRole("heading", { name: "Accounting Foundations" })).toBeVisible();
  await expect(page.getByText("Assets = Liabilities + Equity.")).toBeVisible();
});
