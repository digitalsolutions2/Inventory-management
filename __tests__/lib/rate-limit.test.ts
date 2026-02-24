import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  test("allows first request", () => {
    const result = rateLimit("test-user-1", "crud");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(59); // 60 limit - 1
  });

  test("tracks remaining count correctly", () => {
    const id = "test-user-remaining";
    const r1 = rateLimit(id, "crud");
    const r2 = rateLimit(id, "crud");
    const r3 = rateLimit(id, "crud");

    expect(r1.remaining).toBe(59);
    expect(r2.remaining).toBe(58);
    expect(r3.remaining).toBe(57);
  });

  test("blocks requests after limit exceeded", () => {
    const id = "test-user-block";
    // Use 'exports' preset which has limit of 5
    for (let i = 0; i < 5; i++) {
      const r = rateLimit(id, "exports");
      expect(r.allowed).toBe(true);
    }

    // 6th request should be blocked
    const blocked = rateLimit(id, "exports");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  test("returns resetIn value", () => {
    const result = rateLimit("test-user-reset", "crud");
    expect(result.resetIn).toBeGreaterThan(0);
    expect(result.resetIn).toBeLessThanOrEqual(60);
  });

  test("isolates rate limits by identifier", () => {
    const r1 = rateLimit("user-a", "exports");
    const r2 = rateLimit("user-b", "exports");

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
  });

  test("isolates rate limits by preset", () => {
    const id = "test-user-presets";
    const r1 = rateLimit(id, "crud");
    const r2 = rateLimit(id, "reports");

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
  });

  test("login preset has 5 request limit", () => {
    const id = "test-login-limit";
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(id, "login").allowed).toBe(true);
    }
    expect(rateLimit(id, "login").allowed).toBe(false);
  });

  test("reports preset has 10 request limit", () => {
    const id = "test-reports-limit";
    for (let i = 0; i < 10; i++) {
      expect(rateLimit(id, "reports").allowed).toBe(true);
    }
    expect(rateLimit(id, "reports").allowed).toBe(false);
  });

  test("search preset has 100 request limit", () => {
    const id = "test-search-limit";
    for (let i = 0; i < 100; i++) {
      expect(rateLimit(id, "search").allowed).toBe(true);
    }
    expect(rateLimit(id, "search").allowed).toBe(false);
  });
});
