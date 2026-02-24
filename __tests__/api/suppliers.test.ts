/**
 * @jest-environment node
 */

import type { UserContext } from "@/types";

const adminUser: UserContext = {
  id: "user-admin", email: "admin@demo.com", fullName: "Admin User",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "admin",
  permissions: ["supplier:create", "supplier:read"],
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

const mockSupFindMany = jest.fn();
const mockSupCount = jest.fn();
const mockSupCreate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    supplier: {
      findMany: (...a: unknown[]) => mockSupFindMany(...a),
      count: (...a: unknown[]) => mockSupCount(...a),
      create: (...a: unknown[]) => mockSupCreate(...a),
    },
  },
}));

import { GET, POST } from "@/app/api/suppliers/route";
import { NextRequest } from "next/server";

beforeEach(() => { jest.clearAllMocks(); mockCurrentUser = adminUser; });

describe("GET /api/suppliers", () => {
  test("returns paginated suppliers", async () => {
    mockSupFindMany.mockResolvedValue([{ id: "1", name: "Acme" }]);
    mockSupCount.mockResolvedValue(1);
    const response = await GET(new NextRequest("http://localhost:3000/api/suppliers"));
    expect(response.status).toBe(200);
  });

  test("returns all active suppliers", async () => {
    mockSupFindMany.mockResolvedValue([]);
    const response = await GET(new NextRequest("http://localhost:3000/api/suppliers?all=true"));
    expect(response.status).toBe(200);
  });

  test("returns 401 for unauthenticated", async () => {
    mockCurrentUser = null;
    const response = await GET(new NextRequest("http://localhost:3000/api/suppliers"));
    expect(response.status).toBe(401);
  });

  test("passes search filter", async () => {
    mockSupFindMany.mockResolvedValue([]);
    mockSupCount.mockResolvedValue(0);
    await GET(new NextRequest("http://localhost:3000/api/suppliers?search=acme"));
    expect(mockSupFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: { contains: "acme", mode: "insensitive" } }),
          ]),
        }),
      })
    );
  });
});

describe("POST /api/suppliers", () => {
  test("creates supplier", async () => {
    mockSupCreate.mockResolvedValue({ id: "sup-1", code: "SUP-01" });
    const response = await POST(new NextRequest("http://localhost:3000/api/suppliers", {
      method: "POST", body: JSON.stringify({ code: "sup-01", name: "New Supplier" }),
    }));
    expect(response.status).toBe(201);
  });

  test("uppercases code", async () => {
    mockSupCreate.mockResolvedValue({ id: "sup-1" });
    await POST(new NextRequest("http://localhost:3000/api/suppliers", {
      method: "POST", body: JSON.stringify({ code: "acme-corp", name: "Acme Corp" }),
    }));
    expect(mockSupCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ code: "ACME-CORP" }) })
    );
  });

  test("returns 403 without supplier:create", async () => {
    mockCurrentUser = storeUser;
    const response = await POST(new NextRequest("http://localhost:3000/api/suppliers", {
      method: "POST", body: JSON.stringify({ code: "TEST", name: "Test" }),
    }));
    expect(response.status).toBe(403);
  });

  test("Zod rejects empty name", async () => {
    const response = await POST(new NextRequest("http://localhost:3000/api/suppliers", {
      method: "POST", body: JSON.stringify({ code: "TEST", name: "" }),
    }));
    expect(response.status).toBe(400);
  });

  test("handles P2002 duplicate", async () => {
    mockSupCreate.mockRejectedValue({ code: "P2002" });
    const response = await POST(new NextRequest("http://localhost:3000/api/suppliers", {
      method: "POST", body: JSON.stringify({ code: "EXISTING", name: "Dup" }),
    }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("already exists");
  });
});
