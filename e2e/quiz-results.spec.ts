import { expect, test } from "./fixtures";

test("learner can submit a quiz and see an immutable result", async ({ page, assessmentId }) => {
  await page.goto(`/quiz/${assessmentId}`);
  await expect(page.getByRole("heading", { name: /ข้อ 1 จาก/ })).toBeVisible();

  for (let index = 0; index < 20; index += 1) {
    const choice = page.locator('fieldset input[type="radio"], fieldset input[type="checkbox"]').first();
    const numeric = page.getByLabel("คำตอบตัวเลข");

    if (await choice.count()) {
      await choice.check();
    } else {
      await numeric.fill("0");
    }

    if (index < 19) {
      await page.getByRole("button", { name: "ถัดไป" }).click();
    }
  }

  await page.getByRole("button", { name: "ส่งคำตอบ" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "ยืนยันส่งคำตอบ" }).click();

  await expect(page).toHaveURL(/\/results\//);
  await expect(page.getByRole("heading", { name: "Week 01 Quiz" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "สรุปคำตอบ" })).toBeVisible();
});
