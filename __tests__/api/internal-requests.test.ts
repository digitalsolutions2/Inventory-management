/**
 * @jest-environment node
 */

import type { UserContext } from "@/types";

const storeUser: UserContext = {
  id: "user-store", email: "store@demo.com", fullName: "Store Manager",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "store",
  permissions: ["requests:write"],
};
const adminUser: UserContext = {
  id: "user-admin", email: "admin@demo.com", fullName: "Admin User",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "admin",
  permissions: ["item:read"],
};

let mockCurrentUser: UserContext | null = storeUser;

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

const ITEM = "550e8400-e29b-41d4-a716-446655440001";

const mockReqFindMany = jest.fn();
const mockReqCount = jest.fn();
const mockReqCreate = jest.fn();
const mockInvAggregate = jest.fn();
const mockItemFindUnique = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    internalRequest: {
      findMany: (...a: unknown[]) => mockReqFindMany(...a),
      count: (...a: unknown[]) => mockReqCount(...a),
      create: (...a: unknown[]) => mockReqCreate(...a),
    },
    inventoryItem: { aggregate: (...a: unknown[]) => mockInvAggregate(...a) },
    item: { findUnique: (...a: unknown[]) => mockItemFindUnique(...a) },
  },
}));

import { GET, POST } from "@/app/api/internal-requests/route";
import { NextRequest } from "next/server";

beforeEach(() => { jest.clearAllMocks(); mockCurrentUser = storeUser; });

describe("GET /api/internal-requests", () => {
  test("returns paginated requests", async () => {
    mockReqFindMany.mockResolvedValue([]);
    mockReqCount.mockResolvedValue(0);
    const response = await GET(new NextRequest("http://localhost:3000/api/internal-requests"));
    expect(response.status).toBe(200);
  });

  test("returns 401 for unauthenticated", async () => {
    mockCurrentUser = null;
    const response = await GET(new NextRequest("http://localhost:3000/api/internal-requests"));
    expect(response.status).toBe(401);
  });

  test("filters by status", async () => {
    mockReqFindMany.mockResolvedValue([]);
    mockReqCount.mockResolvedValue(0);
    await GET(new NextRequest("http://localhost:3000/api/internal-requests?status=PENDING"));
    expect(mockReqFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ["PENDING"] } }),
      })
    );
  });
});

describe("POST /api/internal-requests", () => {
  const validBody = { lines: [{ itemId: ITEM, requestedQty: 10 }] };

  test("creates internal request", async () => {
    mockInvAggregate.mockResolvedValue({ _sum: { quantity: 100 } });
    mockReqCount.mockResolvedValue(0);
    mockReqCreate.mockResolvedValue({ id: "req-1", requestNumber: "REQ-00001" });
    const response = await POST(new NextRequest("http://localhost:3000/api/internal-requests", {
      method: "POST", body: JSON.stringify(validBody),
    }));
    expect(response.status).toBe(201);
  });

  test("rejects insufficient stock", async () => {
    mockInvAggregate.mockResolvedValue({ _sum: { quantity: 5 } });
    mockItemFindUnique.mockResolvedValue({ name: "Test Item" });
    const response = await POST(new NextRequest("http://localhost:3000/api/internal-requests", {
      method: "POST", body: JSON.stringify({ lines: [{ itemId: ITEM, requestedQty: 100 }] }),
    }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("Insufficient stock");
  });

  test("returns 403 without requests:write", async () => {
    mockCurrentUser = adminUser;
    const response = await POST(new NextRequest("http://localhost:3000/api/internal-requests", {
      method: "POST", body: JSON.stringify(validBody),
    }));
    expect(response.status).toBe(403);
  });

  test("Zod rejects empty lines", async () => {
    const response = await POST(new NextRequest("http://localhost:3000/api/internal-requests", {
      method: "POST", body: JSON.stringify({ lines: [] }),
    }));
    expect(response.status).toBe(400);
  });

  test("generates sequential request number", async () => {
    mockInvAggregate.mockResolvedValue({ _sum: { quantity: 100 } });
    mockReqCount.mockResolvedValue(14);
    mockReqCreate.mockResolvedValue({ id: "req-1" });
    await POST(new NextRequest("http://localhost:3000/api/internal-requests", {
      method: "POST", body: JSON.stringify(validBody),
    }));
    expect(mockReqCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ requestNumber: "REQ-00015" }) })
    );
  });
});
