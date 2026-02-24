/**
 * @jest-environment node
 */

import type { UserContext } from "@/types";

const adminUser: UserContext = {
  id: "user-admin", email: "admin@demo.com", fullName: "Admin User",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "admin",
  permissions: ["transfers:write", "transfers:read"],
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

const UUID1 = "550e8400-e29b-41d4-a716-446655440000";
const UUID2 = "550e8400-e29b-41d4-a716-446655440001";
const ITEM = "550e8400-e29b-41d4-a716-446655440002";

const mockTrfFindMany = jest.fn();
const mockTrfCount = jest.fn();
const mockTrfCreate = jest.fn();
const mockLocFindFirst = jest.fn();
const mockInvFindUnique = jest.fn();
const mockItemFindUnique = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    transfer: {
      findMany: (...a: unknown[]) => mockTrfFindMany(...a),
      count: (...a: unknown[]) => mockTrfCount(...a),
      create: (...a: unknown[]) => mockTrfCreate(...a),
    },
    location: { findFirst: (...a: unknown[]) => mockLocFindFirst(...a) },
    inventoryItem: { findUnique: (...a: unknown[]) => mockInvFindUnique(...a) },
    item: { findUnique: (...a: unknown[]) => mockItemFindUnique(...a) },
  },
}));

import { GET, POST } from "@/app/api/transfers/route";
import { NextRequest } from "next/server";

beforeEach(() => { jest.clearAllMocks(); mockCurrentUser = adminUser; });

describe("GET /api/transfers", () => {
  test("returns paginated transfers", async () => {
    mockTrfFindMany.mockResolvedValue([]);
    mockTrfCount.mockResolvedValue(0);
    const response = await GET(new NextRequest("http://localhost:3000/api/transfers"));
    expect(response.status).toBe(200);
  });

  test("returns 401 for unauthenticated", async () => {
    mockCurrentUser = null;
    const response = await GET(new NextRequest("http://localhost:3000/api/transfers"));
    expect(response.status).toBe(401);
  });

  test("filters by status", async () => {
    mockTrfFindMany.mockResolvedValue([]);
    mockTrfCount.mockResolvedValue(0);
    await GET(new NextRequest("http://localhost:3000/api/transfers?status=PENDING,APPROVED"));
    expect(mockTrfFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ["PENDING", "APPROVED"] } }),
      })
    );
  });
});

describe("POST /api/transfers", () => {
  const validBody = {
    fromLocationId: UUID1, toLocationId: UUID2,
    lines: [{ itemId: ITEM, quantity: 10 }],
  };

  test("creates transfer", async () => {
    mockLocFindFirst.mockResolvedValueOnce({ id: UUID1, isActive: true })
      .mockResolvedValueOnce({ id: UUID2, isActive: true });
    mockInvFindUnique.mockResolvedValue({ quantity: 100, avgCost: 5 });
    mockTrfCount.mockResolvedValue(0);
    mockTrfCreate.mockResolvedValue({ id: "trf-1", transferNumber: "TRF-00001" });
    const response = await POST(new NextRequest("http://localhost:3000/api/transfers", {
      method: "POST", body: JSON.stringify(validBody),
    }));
    expect(response.status).toBe(201);
  });

  test("rejects same source and destination", async () => {
    mockLocFindFirst.mockResolvedValue({ id: UUID1, isActive: true });
    const response = await POST(new NextRequest("http://localhost:3000/api/transfers", {
      method: "POST", body: JSON.stringify({ ...validBody, toLocationId: UUID1 }),
    }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("different");
  });

  test("rejects insufficient stock", async () => {
    mockLocFindFirst.mockResolvedValueOnce({ id: UUID1 }).mockResolvedValueOnce({ id: UUID2 });
    mockInvFindUnique.mockResolvedValue({ quantity: 5, avgCost: 10 });
    mockItemFindUnique.mockResolvedValue({ name: "Test Item" });
    const response = await POST(new NextRequest("http://localhost:3000/api/transfers", {
      method: "POST", body: JSON.stringify({
        ...validBody, lines: [{ itemId: ITEM, quantity: 100 }],
      }),
    }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("Insufficient stock");
  });

  test("rejects source location not found", async () => {
    mockLocFindFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: UUID2 });
    const response = await POST(new NextRequest("http://localhost:3000/api/transfers", {
      method: "POST", body: JSON.stringify(validBody),
    }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("Source location");
  });

  test("returns 403 without transfers:write", async () => {
    mockCurrentUser = storeUser;
    const response = await POST(new NextRequest("http://localhost:3000/api/transfers", {
      method: "POST", body: JSON.stringify(validBody),
    }));
    expect(response.status).toBe(403);
  });

  test("Zod rejects empty lines", async () => {
    const response = await POST(new NextRequest("http://localhost:3000/api/transfers", {
      method: "POST", body: JSON.stringify({ fromLocationId: UUID1, toLocationId: UUID2, lines: [] }),
    }));
    expect(response.status).toBe(400);
  });

  test("sets PENDING status for high-value transfers", async () => {
    mockLocFindFirst.mockResolvedValueOnce({ id: UUID1 }).mockResolvedValueOnce({ id: UUID2 });
    mockInvFindUnique.mockResolvedValue({ quantity: 1000, avgCost: 50 }); // 500 * 50 = $25,000
    mockTrfCount.mockResolvedValue(0);
    mockTrfCreate.mockResolvedValue({ id: "trf-1" });
    await POST(new NextRequest("http://localhost:3000/api/transfers", {
      method: "POST", body: JSON.stringify({
        ...validBody, lines: [{ itemId: ITEM, quantity: 500 }],
      }),
    }));
    expect(mockTrfCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PENDING" }) })
    );
  });
});
