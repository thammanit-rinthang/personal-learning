import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

for (const [kind, identifier] of [
  ["email", process.env.E2E_LEARNER_EMAIL],
  ["username", process.env.E2E_LEARNER_USERNAME ?? "learner"],
] as const) {
  test(`learner can sign in with a seeded ${kind}`, async ({ page }) => {
    const password = process.env.E2E_LEARNER_PASSWORD;
    if (!identifier || !password) {
      throw new Error("E2E_LEARNER_EMAIL and E2E_LEARNER_PASSWORD are required for E2E tests.");
    }

    await page.goto("/login");
    await page.getByLabel("อีเมลหรือชื่อผู้ใช้").fill(identifier);
    await page.getByLabel("รหัสผ่าน").fill(password);
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

