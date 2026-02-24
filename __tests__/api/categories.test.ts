/**
 * @jest-environment node
 */

import type { UserContext } from "@/types";

const adminUser: UserContext = {
  id: "user-admin", email: "admin@demo.com", fullName: "Admin User",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "admin",
  permissions: ["item:create", "item:read"],
};
const storeUser: UserContext = {
  id: "user-store", email: "store@demo.com", fullName: "Store Manager",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "store",
  permissions: ["requests:write"],
};

let mockCurrentUser: UserContext | null = adminUser;

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/api-utils", () => ({
  getCurrentUser: jest.fn(() => Promise.resolve(mockCurrentUser)),
  checkPermission: jest.fn((user: UserContext, perm: string) => user.permissions.includes(perm)),
  apiSuccess: jest.fn((data: unknown, status = 200) =>
    Response.json({ success: true, data }, { status })),
  apiError: jest.fn((message: string, status = 400) =>
    Response.json({ success: false, error: message }, { status })),
  createAuditLog: jest.fn(() => Promise.resolve()),
  sanitizePagination: jest.fn((page: string | null, pageSize: string | null) => ({
    page: Math.max(1, parseInt(page || "1") || 1),
    pageSize: Math.min(100, Math.max(1, parseInt(pageSize || "20") || 20)),
  })),
}));

const mockCatFindMany = jest.fn();
const mockCatCreate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findMany: (...a: unknown[]) => mockCatFindMany(...a),
      create: (...a: unknown[]) => mockCatCreate(...a),
    },
  },
}));

import { GET, POST } from "@/app/api/categories/route";
import { NextRequest } from "next/server";

beforeEach(() => { jest.clearAllMocks(); mockCurrentUser = adminUser; });

describe("GET /api/categories", () => {
  test("returns categories list", async () => {
    mockCatFindMany.mockResolvedValue([{ id: "1", name: "Raw Materials" }]);
    const response = await GET();
    expect(response.status).toBe(200);
  });

  test("returns 401 for unauthenticated", async () => {
    mockCurrentUser = null;
    const response = await GET();
    expect(response.status).toBe(401);
  });
});

describe("POST /api/categories", () => {
  test("creates category", async () => {
    mockCatCreate.mockResolvedValue({ id: "cat-1", name: "Packaging" });
    const response = await POST(new NextRequest("http://localhost:3000/api/categories", {
      method: "POST", body: JSON.stringify({ name: "Packaging" }),
    }));
    expect(response.status).toBe(201);
  });

  test("returns 403 without item:create permission", async () => {
    mockCurrentUser = storeUser;
    const response = await POST(new NextRequest("http://localhost:3000/api/categories", {
      method: "POST", body: JSON.stringify({ name: "Test" }),
    }));
    expect(response.status).toBe(403);
  });

  test("Zod rejects empty name", async () => {
    const response = await POST(new NextRequest("http://localhost:3000/api/categories", {
      method: "POST", body: JSON.stringify({ name: "" }),
    }));
    expect(response.status).toBe(400);
  });

  test("handles P2002 duplicate", async () => {
    mockCatCreate.mockRejectedValue({ code: "P2002" });
    const response = await POST(new NextRequest("http://localhost:3000/api/categories", {
      method: "POST", body: JSON.stringify({ name: "Existing" }),
    }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("already exists");
  });
});
