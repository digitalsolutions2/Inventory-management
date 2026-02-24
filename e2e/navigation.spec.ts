import { test, expect } from "@playwright/test";
import { login, CREDENTIALS } from "./helpers";

test.describe("Navigation & Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);
  });

  test("dashboard loads with KPI cards", async ({ page }) => {
    await expect(page.locator("text=Dashboard").first()).toBeVisible();
    // KPI cards should be visible
    await expect(page.locator("text=Inventory Value").first()).toBeVisible({ timeout: 10000 });
  });

  test("navigate to Items page", async ({ page }) => {
    await page.click("text=Items");
    await expect(page).toHaveURL(/items/);
    await expect(page.locator("text=Item Master").first()).toBeVisible({ timeout: 10000 });
  });

  test("navigate to Purchase Orders page", async ({ page }) => {
    await page.click("text=Purchase Orders");
    await expect(page).toHaveURL(/purchase-orders/);
  });

  test("navigate to Suppliers page", async ({ page }) => {
    await page.click("text=Suppliers");
    await expect(page).toHaveURL(/suppliers/);
  });

  test("navigate to Locations page", async ({ page }) => {
    await page.click("text=Locations");
    await expect(page).toHaveURL(/locations/);
  });

  test("navigate to Receiving page", async ({ page }) => {
    await page.click("text=Receiving");
    await expect(page).toHaveURL(/receiving/);
  });

  test("sidebar shows user info", async ({ page }) => {
    await expect(page.locator("text=Admin User").first()).toBeVisible();
  });
});
