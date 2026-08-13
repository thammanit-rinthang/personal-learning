import { expect, learnerCourseSlug, learnerLessonSlug, learnerModuleSlug, test } from "./fixtures";

const learnerRoutes = [
  "/",
  `/courses/${learnerCourseSlug}`,
  `/learn/${learnerCourseSlug}/${learnerModuleSlug}/${learnerLessonSlug}`,
];

test("learner pages fit the configured responsive viewport", async ({ page }) => {
  for (const route of learnerRoutes) {
    await page.goto(route);
    await expect(page.getByRole("main")).toBeVisible();
    expect(await page.locator("html").evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
});
