/**
 * @jest-environment node
 */

import type { UserContext } from "@/types";

const adminUser: UserContext = {
  id: "user-admin", email: "admin@demo.com", fullName: "Admin User",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "admin",
  permissions: ["po:create", "po:edit", "po:approve", "po:submit", "item:read"],
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

const mockPOFindMany = jest.fn();
const mockPOCount = jest.fn();
const mockPOCreate = jest.fn();
const mockSupplierFind = jest.fn();
const mockItemFindMany = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    purchaseOrder: {
      findMany: (...args: unknown[]) => mockPOFindMany(...args),
      count: (...args: unknown[]) => mockPOCount(...args),
      create: (...args: unknown[]) => mockPOCreate(...args),
    },
    supplier: { findFirst: (...args: unknown[]) => mockSupplierFind(...args) },
    item: { findMany: (...args: unknown[]) => mockItemFindMany(...args) },
  },
}));

import { GET, POST } from "@/app/api/purchase-orders/route";
import { NextRequest } from "next/server";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const UUID2 = "550e8400-e29b-41d4-a716-446655440001";

beforeEach(() => { jest.clearAllMocks(); mockCurrentUser = adminUser; });

describe("GET /api/purchase-orders", () => {
  test("returns paginated PO list", async () => {
    mockPOFindMany.mockResolvedValue([{ id: "1", poNumber: "PO-00001" }]);
    mockPOCount.mockResolvedValue(1);
    const response = await GET(new NextRequest("http://localhost:3000/api/purchase-orders"));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data.data).toHaveLength(1);
  });

  test("filters by status", async () => {
    mockPOFindMany.mockResolvedValue([]);
    mockPOCount.mockResolvedValue(0);
    await GET(new NextRequest("http://localhost:3000/api/purchase-orders?status=DRAFT,PENDING_APPROVAL"));
    expect(mockPOFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: { in: ["DRAFT", "PENDING_APPROVAL"] } }),
      })
    );
  });

  test("returns 401 for unauthenticated", async () => {
    mockCurrentUser = null;
    const response = await GET(new NextRequest("http://localhost:3000/api/purchase-orders"));
    expect(response.status).toBe(401);
  });
});

describe("POST /api/purchase-orders", () => {
  const validBody = {
    supplierId: UUID,
    lines: [{ itemId: UUID2, quantity: 100, unitCost: 10.5 }],
  };

  test("creates PO with valid data", async () => {
    mockSupplierFind.mockResolvedValue({ id: UUID, isActive: true });
    mockItemFindMany.mockResolvedValue([{ id: UUID2, isActive: true }]);
    mockPOCount.mockResolvedValue(5);
    mockPOCreate.mockResolvedValue({ id: "po-new", poNumber: "PO-00006", totalAmount: 1050 });
    const response = await POST(new NextRequest("http://localhost:3000/api/purchase-orders", {
      method: "POST", body: JSON.stringify(validBody),
    }));
    expect(response.status).toBe(201);
  });

  test("returns 403 for unauthorized user", async () => {
    mockCurrentUser = storeUser;
    const response = await POST(new NextRequest("http://localhost:3000/api/purchase-orders", {
      method: "POST", body: JSON.stringify(validBody),
    }));
    expect(response.status).toBe(403);
  });

  test("validates Zod - rejects empty lines", async () => {
    const response = await POST(new NextRequest("http://localhost:3000/api/purchase-orders", {
      method: "POST", body: JSON.stringify({ supplierId: UUID, lines: [] }),
    }));
    expect(response.status).toBe(400);
  });

  test("validates Zod - rejects zero quantity", async () => {
    const response = await POST(new NextRequest("http://localhost:3000/api/purchase-orders", {
      method: "POST", body: JSON.stringify({ supplierId: UUID, lines: [{ itemId: UUID2, quantity: 0, unitCost: 10 }] }),
    }));
    expect(response.status).toBe(400);
  });

  test("validates supplier exists", async () => {
    mockSupplierFind.mockResolvedValue(null);
    const response = await POST(new NextRequest("http://localhost:3000/api/purchase-orders", {
      method: "POST", body: JSON.stringify(validBody),
    }));
    const data = await response.json();
    expect(response.status).toBe(404);
    expect(data.error).toContain("Supplier not found");
  });

  test("validates items exist", async () => {
    mockSupplierFind.mockResolvedValue({ id: UUID, isActive: true });
    mockItemFindMany.mockResolvedValue([]);
    const response = await POST(new NextRequest("http://localhost:3000/api/purchase-orders", {
      method: "POST", body: JSON.stringify(validBody),
    }));
    expect(response.status).toBe(400);
  });

  test("calculates totalAmount correctly", async () => {
    mockSupplierFind.mockResolvedValue({ id: UUID, isActive: true });
    mockItemFindMany.mockResolvedValue([{ id: UUID2, isActive: true }, { id: "550e8400-e29b-41d4-a716-446655440002", isActive: true }]);
    mockPOCount.mockResolvedValue(0);
    mockPOCreate.mockResolvedValue({ id: "po-1" });
    await POST(new NextRequest("http://localhost:3000/api/purchase-orders", {
      method: "POST",
      body: JSON.stringify({
        supplierId: UUID,
        lines: [
          { itemId: UUID2, quantity: 10, unitCost: 5 },
          { itemId: "550e8400-e29b-41d4-a716-446655440002", quantity: 20, unitCost: 3 },
        ],
      }),
    }));
    expect(mockPOCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ totalAmount: 110 }) })
    );
  });

  test("generates sequential PO number", async () => {
    mockSupplierFind.mockResolvedValue({ id: UUID, isActive: true });
    mockItemFindMany.mockResolvedValue([{ id: UUID2, isActive: true }]);
    mockPOCount.mockResolvedValue(42);
    mockPOCreate.mockResolvedValue({ id: "po-1" });
    await POST(new NextRequest("http://localhost:3000/api/purchase-orders", {
      method: "POST", body: JSON.stringify(validBody),
    }));
    expect(mockPOCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ poNumber: "PO-00043" }) })
    );
  });
});
