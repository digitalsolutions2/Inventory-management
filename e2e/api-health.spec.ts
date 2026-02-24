import { test, expect } from "@playwright/test";

test.describe("API Health", () => {
  test("health endpoint responds", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("healthy");
  });

  test("API returns 401 for unauthenticated requests", async ({ request }) => {
    const response = await request.get("/api/items");
    expect(response.status()).toBe(401);
  });

  test("API returns 401 for unauthenticated dashboard", async ({ request }) => {
    const response = await request.get("/api/dashboard");
    expect(response.status()).toBe(401);
  });
});
