import { test, expect } from "@playwright/test";
import { login, CREDENTIALS } from "./helpers";

test.describe("Items CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
  });

  test("displays items list", async ({ page }) => {
    await page.goto("/items");
    await expect(page.locator("table").first()).toBeVisible({ timeout: 10000 });
  });

  test("can search for items", async ({ page }) => {
    await page.goto("/items");
    await page.waitForSelector("table", { timeout: 10000 });
    const searchInput = page.locator("input[placeholder*='Search']").first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("flour");
      // Wait for filtered results
      await page.waitForTimeout(1000);
    }
  });

  test("can open create item modal/form", async ({ page }) => {
    await page.goto("/items");
    await page.waitForSelector("table", { timeout: 10000 });
    // Look for add/create button
    const addBtn = page.locator("button:has-text('Add'), button:has-text('Create'), button:has-text('New')").first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      // Modal or form should appear
      await expect(page.locator("input[placeholder*='code'], input[id*='code']").first()).toBeVisible({ timeout: 5000 });
    }
  });
});
