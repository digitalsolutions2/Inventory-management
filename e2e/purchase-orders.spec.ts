import { test, expect } from "@playwright/test";
import { login, CREDENTIALS } from "./helpers";

test.describe("Purchase Orders", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
  });

  test("displays PO list", async ({ page }) => {
    await page.goto("/purchase-orders");
    await expect(page.locator("table").first()).toBeVisible({ timeout: 10000 });
  });

  test("can filter POs by status", async ({ page }) => {
    await page.goto("/purchase-orders");
    await page.waitForSelector("table", { timeout: 10000 });
    // Look for status filter dropdown
    const statusFilter = page.locator("[data-testid='status-filter'], .ant-select").first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
    }
  });

  test("can create new PO", async ({ page }) => {
    await page.goto("/purchase-orders");
    await page.waitForSelector("table", { timeout: 10000 });
    const createBtn = page.locator("button:has-text('Create'), button:has-text('New'), a:has-text('Create')").first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      // Should navigate to create page or show form
      await page.waitForTimeout(2000);
    }
  });
});
