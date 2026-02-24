/**
 * @jest-environment node
 */

import type { UserContext } from "@/types";

const adminUser: UserContext = {
  id: "user-admin", email: "admin@demo.com", fullName: "Admin User",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "admin",
  permissions: ["item:read"],
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
}));

jest.mock("@/lib/rate-limit", () => ({
  rateLimit: jest.fn(() => ({ allowed: true, remaining: 9, resetIn: 60 })),
}));

const mockInvFindMany = jest.fn();
const mockPOCount = jest.fn();
const mockTrfCount = jest.fn();
const mockReqCount = jest.fn();
const mockPayAggregate = jest.fn();
const mockAuditFindMany = jest.fn();
const mockTxFindMany = jest.fn();
const mockPOGroupBy = jest.fn();
const mockPayFindMany = jest.fn();
const mockPOFindMany = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    inventoryItem: {
      findMany: (...a: unknown[]) => mockInvFindMany(...a),
    },
    purchaseOrder: {
      count: (...a: unknown[]) => mockPOCount(...a),
      groupBy: (...a: unknown[]) => mockPOGroupBy(...a),
      findMany: (...a: unknown[]) => mockPOFindMany(...a),
    },
    transfer: { count: (...a: unknown[]) => mockTrfCount(...a) },
    internalRequest: { count: (...a: unknown[]) => mockReqCount(...a) },
    payment: {
      aggregate: (...a: unknown[]) => mockPayAggregate(...a),
      findMany: (...a: unknown[]) => mockPayFindMany(...a),
    },
    auditLog: { findMany: (...a: unknown[]) => mockAuditFindMany(...a) },
    inventoryTransaction: { findMany: (...a: unknown[]) => mockTxFindMany(...a) },
  },
}));

import { GET } from "@/app/api/dashboard/route";

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser = adminUser;
  // Default mocks for all 12 parallel queries
  mockInvFindMany.mockResolvedValue([
    { quantity: 100, avgCost: 10 },
    { quantity: 50, avgCost: 20 },
  ]);
  mockPOCount.mockResolvedValue(3);
  mockTrfCount.mockResolvedValue(1);
  mockReqCount.mockResolvedValue(2);
  // lowStockItems reuses mockInvFindMany - second call returns items with reorderPoint
  mockInvFindMany.mockResolvedValueOnce([
    { quantity: 100, avgCost: 10 },
    { quantity: 50, avgCost: 20 },
  ]).mockResolvedValueOnce([
    { quantity: 2, avgCost: 5, item: { id: "i1", code: "FL-01", name: "Flour", uom: "KG", reorderPoint: 10, minStock: 5 }, location: { id: "l1", name: "WH-01" } },
  ]).mockResolvedValueOnce([
    { quantity: 100, avgCost: 10, item: { code: "SG-01", name: "Sugar" } },
  ]);
  mockPayAggregate.mockResolvedValue({ _sum: { amount: 5000 }, _count: 3 });
  mockAuditFindMany.mockResolvedValue([
    { id: "a1", action: "po:create", entityType: "PurchaseOrder", entityId: "p1", user: { fullName: "Admin" }, createdAt: new Date() },
  ]);
  mockTxFindMany.mockResolvedValue([
    { id: "t1", type: "INBOUND", item: { code: "FL-01", name: "Flour" }, location: { name: "WH-01" }, quantity: 50, createdAt: new Date() },
  ]);
  mockPOGroupBy.mockResolvedValue([
    { status: "DRAFT", _count: 5, _sum: { totalAmount: 1000 } },
    { status: "APPROVED", _count: 3, _sum: { totalAmount: 5000 } },
  ]);
  mockPayFindMany.mockResolvedValue([]);
  mockPOFindMany.mockResolvedValue([
    { totalAmount: 3000, supplier: { id: "s1", name: "Acme Supplier" } },
    { totalAmount: 2000, supplier: { id: "s1", name: "Acme Supplier" } },
  ]);
});

describe("GET /api/dashboard", () => {
  test("returns dashboard data with KPIs", async () => {
    const response = await GET();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.data.kpis).toBeDefined();
    expect(data.data.charts).toBeDefined();
    expect(data.data.alerts).toBeDefined();
    expect(data.data.recentActivity).toBeDefined();
    expect(data.data.recentTransactions).toBeDefined();
  });

  test("calculates totalInventoryValue", async () => {
    const response = await GET();
    const data = await response.json();
    // 100*10 + 50*20 = 2000
    expect(data.data.kpis.totalInventoryValue).toBe(2000);
  });

  test("calculates pending counts", async () => {
    const response = await GET();
    const data = await response.json();
    expect(data.data.kpis.pendingPOs).toBe(3);
    expect(data.data.kpis.pendingTransfers).toBe(1);
    expect(data.data.kpis.pendingRequests).toBe(2);
    expect(data.data.kpis.pendingApprovals).toBe(4); // 3 + 1
  });

  test("returns 401 for unauthenticated", async () => {
    mockCurrentUser = null;
    const response = await GET();
    expect(response.status).toBe(401);
  });

  test("returns 429 when rate limited", async () => {
    const { rateLimit } = require("@/lib/rate-limit");
    rateLimit.mockReturnValueOnce({ allowed: false, remaining: 0, resetIn: 30 });
    const response = await GET();
    expect(response.status).toBe(429);
  });
});
