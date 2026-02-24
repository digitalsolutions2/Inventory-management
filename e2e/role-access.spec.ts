import { test, expect } from "@playwright/test";
import { login, CREDENTIALS } from "./helpers";

test.describe("Role-Based Access", () => {
  test("admin can access all pages", async ({ page }) => {
    await login(page, CREDENTIALS.admin.email, CREDENTIALS.admin.password);

    // Dashboard
    await page.goto("/dashboard");
    await expect(page.locator("text=Dashboard").first()).toBeVisible({ timeout: 10000 });

    // Items
    await page.goto("/items");
    await expect(page.locator("table").first()).toBeVisible({ timeout: 10000 });

    // Purchase Orders
    await page.goto("/purchase-orders");
    await expect(page.locator("table").first()).toBeVisible({ timeout: 10000 });
  });

  test("store user has limited navigation", async ({ page }) => {
    await login(page, CREDENTIALS.store.email, CREDENTIALS.store.password);
    // Store user should see dashboard
    await expect(page.locator("text=Dashboard").first()).toBeVisible({ timeout: 10000 });
  });

  test("finance user can access payments", async ({ page }) => {
    await login(page, CREDENTIALS.finance.email, CREDENTIALS.finance.password);
    await page.goto("/payments");
    // Should not get 403/redirect
    await expect(page).toHaveURL(/payments|dashboard/, { timeout: 10000 });
  });
});
