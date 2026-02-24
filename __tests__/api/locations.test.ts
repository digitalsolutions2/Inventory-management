/**
 * @jest-environment node
 */

import type { UserContext } from "@/types";

const adminUser: UserContext = {
  id: "user-admin", email: "admin@demo.com", fullName: "Admin User",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "admin",
  permissions: ["location:create", "location:read"],
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

const mockLocFindMany = jest.fn();
const mockLocCount = jest.fn();
const mockLocCreate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    location: {
      findMany: (...a: unknown[]) => mockLocFindMany(...a),
      count: (...a: unknown[]) => mockLocCount(...a),
      create: (...a: unknown[]) => mockLocCreate(...a),
    },
  },
}));

import { GET, POST } from "@/app/api/locations/route";
import { NextRequest } from "next/server";

beforeEach(() => { jest.clearAllMocks(); mockCurrentUser = adminUser; });

describe("GET /api/locations", () => {
  test("returns paginated locations", async () => {
    mockLocFindMany.mockResolvedValue([{ id: "1", code: "WH-01" }]);
    mockLocCount.mockResolvedValue(1);
    const response = await GET(new NextRequest("http://localhost:3000/api/locations"));
    expect(response.status).toBe(200);
  });

  test("returns tree mode", async () => {
    mockLocFindMany.mockResolvedValue([]);
    const response = await GET(new NextRequest("http://localhost:3000/api/locations?tree=true"));
    expect(response.status).toBe(200);
  });

  test("returns 401 for unauthenticated", async () => {
    mockCurrentUser = null;
    const response = await GET(new NextRequest("http://localhost:3000/api/locations"));
    expect(response.status).toBe(401);
  });

  test("passes search filter", async () => {
    mockLocFindMany.mockResolvedValue([]);
    mockLocCount.mockResolvedValue(0);
    await GET(new NextRequest("http://localhost:3000/api/locations?search=warehouse"));
    expect(mockLocFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: { contains: "warehouse", mode: "insensitive" } }),
          ]),
        }),
      })
    );
  });
});

describe("POST /api/locations", () => {
  test("creates location", async () => {
    mockLocCreate.mockResolvedValue({ id: "loc-1", code: "WH-02", name: "Warehouse 2" });
    const response = await POST(new NextRequest("http://localhost:3000/api/locations", {
      method: "POST", body: JSON.stringify({ code: "wh-02", name: "Warehouse 2", type: "WAREHOUSE" }),
    }));
    expect(response.status).toBe(201);
  });

  test("uppercases code", async () => {
    mockLocCreate.mockResolvedValue({ id: "loc-1" });
    await POST(new NextRequest("http://localhost:3000/api/locations", {
      method: "POST", body: JSON.stringify({ code: "shelf-a1", name: "Shelf A1", type: "SHELF" }),
    }));
    expect(mockLocCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ code: "SHELF-A1" }) })
    );
  });

  test("returns 403 without location:create", async () => {
    mockCurrentUser = storeUser;
    const response = await POST(new NextRequest("http://localhost:3000/api/locations", {
      method: "POST", body: JSON.stringify({ code: "WH-03", name: "Test", type: "WAREHOUSE" }),
    }));
    expect(response.status).toBe(403);
  });

  test("Zod rejects empty code", async () => {
    const response = await POST(new NextRequest("http://localhost:3000/api/locations", {
      method: "POST", body: JSON.stringify({ code: "", name: "Test", type: "WAREHOUSE" }),
    }));
    expect(response.status).toBe(400);
  });

  test("handles P2002 duplicate", async () => {
    mockLocCreate.mockRejectedValue({ code: "P2002" });
    const response = await POST(new NextRequest("http://localhost:3000/api/locations", {
      method: "POST", body: JSON.stringify({ code: "WH-01", name: "Dup", type: "WAREHOUSE" }),
    }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("already exists");
  });
});
