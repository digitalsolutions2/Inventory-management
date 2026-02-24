import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login page
    await expect(page).toHaveURL(/login/);
  });

  test("shows login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("rejects invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type='email']", "wrong@test.com");
    await page.fill("input[type='password']", "wrongpassword");
    await page.click("button[type='submit']");
    // Should show error or stay on login
    await expect(page).toHaveURL(/login/);
  });

  test("successful login as admin", async ({ page }) => {
    await page.goto("/login");
    await page.fill("input[type='email']", "admin@demo.com");
    await page.fill("input[type='password']", "Admin123!");
    await page.click("button[type='submit']");
    // Should redirect to dashboard
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    await expect(page.locator("text=Dashboard").first()).toBeVisible({ timeout: 10000 });
  });
});
