import "dotenv/config";

import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";

const execFileAsync = promisify(execFile);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3001";
const storageStatePath = "e2e/.auth/learner.json";

function required(name: "E2E_DATABASE_URL" | "E2E_LEARNER_EMAIL" | "E2E_LEARNER_PASSWORD") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for E2E tests.`);
  }
  return value;
}

export default async function globalSetup() {
  const databaseUrl = required("E2E_DATABASE_URL");
  const email = required("E2E_LEARNER_EMAIL");
  const password = required("E2E_LEARNER_PASSWORD");

  await execFileAsync("pnpm.cmd", ["db:seed"], {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      E2E_LEARNER_EMAIL: email,
      E2E_LEARNER_PASSWORD: password,
    },
  });

  await mkdir("e2e/.auth", { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ baseURL });

  try {
    await page.goto("/login");
    await page.getByLabel("อีเมลหรือชื่อผู้ใช้").fill(email);
    await page.getByLabel("รหัสผ่าน").fill(password);
    await page.getByRole("button", { name: "เข้าสู่ระบบ" }).click();
    await page.waitForURL("/");
    await page.context().storageState({ path: storageStatePath });
  } finally {
    await browser.close();
  }
}
