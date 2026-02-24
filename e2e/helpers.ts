import { Page } from "@playwright/test";

/**
 * Login helper that handles Supabase auth
 */
export async function login(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto("/login");
  await page.fill("input[type='email']", email);
  await page.fill("input[type='password']", password);
  await page.click("button[type='submit']");
  // Wait for redirect to dashboard
  await page.waitForURL("**/dashboard", { timeout: 15000 });
}

export const CREDENTIALS = {
  admin: { email: "admin@demo.com", password: "Admin123!" },
  procurement: { email: "procurement@demo.com", password: "Proc123!" },
  qc: { email: "qc@demo.com", password: "QC123456!" },
  warehouse: { email: "warehouse@demo.com", password: "Wh123456!" },
  store: { email: "store@demo.com", password: "Store123!" },
  finance: { email: "finance@demo.com", password: "Fin123456!" },
};
