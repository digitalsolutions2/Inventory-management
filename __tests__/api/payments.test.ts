/**
 * @jest-environment node
 */

import type { UserContext } from "@/types";

const financeUser: UserContext = {
  id: "user-fin", email: "finance@demo.com", fullName: "Finance User",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "finance",
  permissions: ["payments:read", "payments:write", "po:approve"],
};
const storeUser: UserContext = {
  id: "user-store", email: "store@demo.com", fullName: "Store Manager",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "store",
  permissions: ["requests:write"],
};

let mockCurrentUser: UserContext | null = financeUser;

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

const mockPayFindMany = jest.fn();
const mockPayCount = jest.fn();
const mockPayCreate = jest.fn();
const mockPayAggregate = jest.fn();
const mockPOFindFirst = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    payment: {
      findMany: (...a: unknown[]) => mockPayFindMany(...a),
      count: (...a: unknown[]) => mockPayCount(...a),
      create: (...a: unknown[]) => mockPayCreate(...a),
      aggregate: (...a: unknown[]) => mockPayAggregate(...a),
    },
    purchaseOrder: { findFirst: (...a: unknown[]) => mockPOFindFirst(...a) },
  },
}));

import { GET, POST } from "@/app/api/payments/route";
import { NextRequest } from "next/server";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

beforeEach(() => { jest.clearAllMocks(); mockCurrentUser = financeUser; });

describe("GET /api/payments", () => {
  test("returns payment list", async () => {
    mockPayFindMany.mockResolvedValue([]);
    mockPayCount.mockResolvedValue(0);
    const response = await GET(new NextRequest("http://localhost:3000/api/payments"));
    expect(response.status).toBe(200);
  });

  test("returns 403 without payments:read", async () => {
    mockCurrentUser = storeUser;
    const response = await GET(new NextRequest("http://localhost:3000/api/payments"));
    expect(response.status).toBe(403);
  });
});

describe("POST /api/payments", () => {
  test("creates payment", async () => {
    mockPOFindFirst.mockResolvedValue({ id: UUID, totalAmount: 5000 });
    mockPayAggregate.mockResolvedValue({ _sum: { amount: 1000 } });
    mockPayCreate.mockResolvedValue({ id: "pay-1", amount: 500 });
    const response = await POST(new NextRequest("http://localhost:3000/api/payments", {
      method: "POST", body: JSON.stringify({ purchaseOrderId: UUID, amount: 500 }),
    }));
    expect(response.status).toBe(201);
  });

  test("prevents overpayment", async () => {
    mockPOFindFirst.mockResolvedValue({ id: UUID, totalAmount: 1000 });
    mockPayAggregate.mockResolvedValue({ _sum: { amount: 900 } });
    const response = await POST(new NextRequest("http://localhost:3000/api/payments", {
      method: "POST", body: JSON.stringify({ purchaseOrderId: UUID, amount: 250 }),
    }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("exceed PO total");
  });

  test("sets PAID status when paidAt provided", async () => {
    mockPOFindFirst.mockResolvedValue({ id: UUID, totalAmount: 5000 });
    mockPayAggregate.mockResolvedValue({ _sum: { amount: 0 } });
    mockPayCreate.mockResolvedValue({ id: "pay-1" });
    await POST(new NextRequest("http://localhost:3000/api/payments", {
      method: "POST", body: JSON.stringify({
        purchaseOrderId: UUID, amount: 500, paidAt: "2026-02-24T00:00:00.000Z",
      }),
    }));
    expect(mockPayCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PAID" }) })
    );
  });

  test("Zod rejects zero amount", async () => {
    const response = await POST(new NextRequest("http://localhost:3000/api/payments", {
      method: "POST", body: JSON.stringify({ purchaseOrderId: UUID, amount: 0 }),
    }));
    expect(response.status).toBe(400);
  });

  test("Zod rejects negative amount", async () => {
    const response = await POST(new NextRequest("http://localhost:3000/api/payments", {
      method: "POST", body: JSON.stringify({ purchaseOrderId: UUID, amount: -100 }),
    }));
    expect(response.status).toBe(400);
  });

  test("returns 404 for non-existent PO", async () => {
    mockPOFindFirst.mockResolvedValue(null);
    const response = await POST(new NextRequest("http://localhost:3000/api/payments", {
      method: "POST", body: JSON.stringify({ purchaseOrderId: UUID, amount: 500 }),
    }));
    expect(response.status).toBe(404);
  });

  test("returns 403 without payments:write", async () => {
    mockCurrentUser = storeUser;
    const response = await POST(new NextRequest("http://localhost:3000/api/payments", {
      method: "POST", body: JSON.stringify({ purchaseOrderId: UUID, amount: 500 }),
    }));
    expect(response.status).toBe(403);
  });
});
