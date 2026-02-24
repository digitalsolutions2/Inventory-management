/**
 * @jest-environment node
 */

import type { UserContext } from "@/types";

const adminUser: UserContext = {
  id: "user-admin", email: "admin@demo.com", fullName: "Admin User",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "admin",
  permissions: ["item:create", "item:read", "item:edit"],
};

const storeUser: UserContext = {
  id: "user-store", email: "store@demo.com", fullName: "Store Manager",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "store",
  permissions: ["requests:write", "item:read"],
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
  sanitizePagination: jest.fn((page: string | null, pageSize: string | null) => {
    const p = Math.max(1, parseInt(page || "1") || 1);
    const ps = Math.min(100, Math.max(1, parseInt(pageSize || "20") || 20));
    return { page: p, pageSize: ps };
  }),
}));

const mockFindMany = jest.fn();
const mockCount = jest.fn();
const mockCreate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

import { GET, POST } from "@/app/api/items/route";
import { NextRequest } from "next/server";

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser = adminUser;
});

describe("GET /api/items", () => {
  test("returns paginated items list", async () => {
    mockFindMany.mockResolvedValue([
      { id: "1", code: "FLOUR-001", name: "All Purpose Flour" },
      { id: "2", code: "SUGAR-001", name: "White Sugar" },
    ]);
    mockCount.mockResolvedValue(2);

    const request = new NextRequest("http://localhost:3000/api/items?page=1&pageSize=20");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.data).toHaveLength(2);
    expect(data.data.total).toBe(2);
  });

  test("returns 401 for unauthenticated user", async () => {
    mockCurrentUser = null;

    const request = new NextRequest("http://localhost:3000/api/items");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  test("passes search filter to query", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const request = new NextRequest("http://localhost:3000/api/items?search=flour");
    await GET(request);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ name: { contains: "flour", mode: "insensitive" } }),
          ]),
        }),
      })
    );
  });

  test("filters by category", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const request = new NextRequest("http://localhost:3000/api/items?categoryId=cat-1");
    await GET(request);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ categoryId: "cat-1" }),
      })
    );
  });

  test("filters active items", async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const request = new NextRequest("http://localhost:3000/api/items?status=active");
    await GET(request);

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isActive: true }),
      })
    );
  });
});

describe("POST /api/items", () => {
  test("creates item with valid data", async () => {
    mockCreate.mockResolvedValue({ id: "new-1", code: "TEST-001", name: "Test Item" });

    const request = new NextRequest("http://localhost:3000/api/items", {
      method: "POST",
      body: JSON.stringify({ code: "test-001", name: "Test Item" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ code: "TEST-001", name: "Test Item", uom: "EA" }),
      })
    );
  });

  test("returns 400 for missing required fields", async () => {
    const request = new NextRequest("http://localhost:3000/api/items", {
      method: "POST",
      body: JSON.stringify({ code: "" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  test("returns 403 for unauthorized user", async () => {
    mockCurrentUser = storeUser;

    const request = new NextRequest("http://localhost:3000/api/items", {
      method: "POST",
      body: JSON.stringify({ code: "TEST", name: "Test" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(403);
  });

  test("returns error for duplicate item code (P2002)", async () => {
    mockCreate.mockRejectedValue({ code: "P2002" });

    const request = new NextRequest("http://localhost:3000/api/items", {
      method: "POST",
      body: JSON.stringify({ code: "EXISTING", name: "Duplicate Item" }),
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("already exists");
  });

  test("validates Zod - rejects negative minStock", async () => {
    const request = new NextRequest("http://localhost:3000/api/items", {
      method: "POST",
      body: JSON.stringify({ code: "TEST", name: "Test", minStock: -5 }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  test("applies Zod defaults for optional fields", async () => {
    mockCreate.mockResolvedValue({ id: "new-1" });

    const request = new NextRequest("http://localhost:3000/api/items", {
      method: "POST",
      body: JSON.stringify({ code: "TEST", name: "Test Item" }),
    });
    await POST(request);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ uom: "EA", minStock: 0, maxStock: 0, reorderPoint: 0 }),
      })
    );
  });
});
