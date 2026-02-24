import { test, expect } from "@playwright/test";
import { login, CREDENTIALS } from "./helpers";

test.describe("Receiving Workflow", () => {
  test("procurement user sees receiving queue", async ({ page }) => {
    await login(page, CREDENTIALS.procurement.email, CREDENTIALS.procurement.password);
    await page.goto("/receiving");
    // Should redirect to procurement tab
    await expect(page).toHaveURL(/receiving/, { timeout: 10000 });
  });

  test("QC user sees QC inspection queue", async ({ page }) => {
    await login(page, CREDENTIALS.qc.email, CREDENTIALS.qc.password);
    await page.goto("/receiving/qc");
    await expect(page).toHaveURL(/receiving\/qc/, { timeout: 10000 });
  });

  test("warehouse user sees warehouse queue", async ({ page }) => {
    await login(page, CREDENTIALS.warehouse.email, CREDENTIALS.warehouse.password);
    await page.goto("/receiving/warehouse");
    await expect(page).toHaveURL(/receiving\/warehouse/, { timeout: 10000 });
  });
});
