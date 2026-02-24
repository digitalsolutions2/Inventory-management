/**
 * Tests for pure utility functions from api-utils.ts
 * We mock next/server and supabase/prisma since they need server globals.
 */

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data: unknown, init?: { status?: number }) => ({
      _body: data,
      status: init?.status ?? 200,
    })),
  },
}));

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {},
}));

import { checkPermission, isPositiveNumber, isNonNegativeNumber, sanitizePagination, apiSuccess, apiError } from "@/lib/api-utils";
import type { UserContext } from "@/types";

const mockUser: UserContext = {
  id: "user-1",
  email: "test@demo.com",
  fullName: "Test User",
  tenantId: "tenant-1",
  tenantName: "Demo Tenant",
  role: "admin",
  permissions: ["item:create", "item:read", "po:create", "po:approve"],
};

// ============================================================
// checkPermission
// ============================================================

describe("checkPermission", () => {
  test("returns true when user has the permission", () => {
    expect(checkPermission(mockUser, "item:create")).toBe(true);
    expect(checkPermission(mockUser, "po:approve")).toBe(true);
  });

  test("returns false when user lacks the permission", () => {
    expect(checkPermission(mockUser, "admin:manage")).toBe(false);
    expect(checkPermission(mockUser, "transfers:write")).toBe(false);
  });

  test("returns false for empty string permission", () => {
    expect(checkPermission(mockUser, "")).toBe(false);
  });

  test("handles user with no permissions", () => {
    const emptyUser = { ...mockUser, permissions: [] };
    expect(checkPermission(emptyUser, "item:create")).toBe(false);
  });
});

// ============================================================
// isPositiveNumber
// ============================================================

describe("isPositiveNumber", () => {
  test("returns true for positive numbers", () => {
    expect(isPositiveNumber(1)).toBe(true);
    expect(isPositiveNumber(0.001)).toBe(true);
    expect(isPositiveNumber(999999)).toBe(true);
  });

  test("returns false for zero", () => {
    expect(isPositiveNumber(0)).toBe(false);
  });

  test("returns false for negative numbers", () => {
    expect(isPositiveNumber(-1)).toBe(false);
    expect(isPositiveNumber(-0.5)).toBe(false);
  });

  test("returns false for non-numbers", () => {
    expect(isPositiveNumber("5")).toBe(false);
    expect(isPositiveNumber(null)).toBe(false);
    expect(isPositiveNumber(undefined)).toBe(false);
    expect(isPositiveNumber({})).toBe(false);
  });

  test("returns false for Infinity and NaN", () => {
    expect(isPositiveNumber(Infinity)).toBe(false);
    expect(isPositiveNumber(-Infinity)).toBe(false);
    expect(isPositiveNumber(NaN)).toBe(false);
  });
});

// ============================================================
// isNonNegativeNumber
// ============================================================

describe("isNonNegativeNumber", () => {
  test("returns true for zero", () => {
    expect(isNonNegativeNumber(0)).toBe(true);
  });

  test("returns true for positive numbers", () => {
    expect(isNonNegativeNumber(1)).toBe(true);
    expect(isNonNegativeNumber(100.5)).toBe(true);
  });

  test("returns false for negative numbers", () => {
    expect(isNonNegativeNumber(-1)).toBe(false);
    expect(isNonNegativeNumber(-0.001)).toBe(false);
  });

  test("returns false for non-numbers", () => {
    expect(isNonNegativeNumber("0")).toBe(false);
    expect(isNonNegativeNumber(null)).toBe(false);
    expect(isNonNegativeNumber(undefined)).toBe(false);
  });

  test("returns false for Infinity and NaN", () => {
    expect(isNonNegativeNumber(Infinity)).toBe(false);
    expect(isNonNegativeNumber(NaN)).toBe(false);
  });
});

// ============================================================
// sanitizePagination
// ============================================================

describe("sanitizePagination", () => {
  test("returns defaults for null inputs", () => {
    expect(sanitizePagination(null, null)).toEqual({ page: 1, pageSize: 20 });
  });

  test("parses valid page and pageSize", () => {
    expect(sanitizePagination("3", "50")).toEqual({ page: 3, pageSize: 50 });
  });

  test("clamps page to minimum of 1", () => {
    expect(sanitizePagination("0", "20")).toEqual({ page: 1, pageSize: 20 });
    expect(sanitizePagination("-5", "20")).toEqual({ page: 1, pageSize: 20 });
  });

  test("clamps pageSize to max 100", () => {
    expect(sanitizePagination("1", "200")).toEqual({ page: 1, pageSize: 100 });
    expect(sanitizePagination("1", "101")).toEqual({ page: 1, pageSize: 100 });
  });

  test("falls back to default 20 for zero/falsy pageSize", () => {
    // parseInt("0") = 0, which is falsy, so || 20 kicks in
    expect(sanitizePagination("1", "0")).toEqual({ page: 1, pageSize: 20 });
  });

  test("clamps negative pageSize to 1", () => {
    expect(sanitizePagination("1", "-10")).toEqual({ page: 1, pageSize: 1 });
  });

  test("handles non-numeric strings", () => {
    expect(sanitizePagination("abc", "xyz")).toEqual({ page: 1, pageSize: 20 });
  });

  test("handles empty strings", () => {
    expect(sanitizePagination("", "")).toEqual({ page: 1, pageSize: 20 });
  });
});

// ============================================================
// apiSuccess / apiError
// ============================================================

describe("apiSuccess", () => {
  test("returns success response with data", () => {
    const result = apiSuccess({ items: [] }) as unknown as { _body: { success: boolean; data: unknown }; status: number };
    expect(result._body).toEqual({ success: true, data: { items: [] } });
    expect(result.status).toBe(200);
  });

  test("returns custom status code", () => {
    const result = apiSuccess({ id: "1" }, 201) as unknown as { _body: unknown; status: number };
    expect(result.status).toBe(201);
  });
});

describe("apiError", () => {
  test("returns error response with message", () => {
    const result = apiError("Not found", 404) as unknown as { _body: { success: boolean; error: string }; status: number };
    expect(result._body).toEqual({ success: false, error: "Not found" });
    expect(result.status).toBe(404);
  });

  test("defaults to 400 status", () => {
    const result = apiError("Bad input") as unknown as { _body: unknown; status: number };
    expect(result.status).toBe(400);
  });
});
