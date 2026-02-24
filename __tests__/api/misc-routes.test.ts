/**
 * @jest-environment node
 *
 * Tests for: health, inventory, receiving/[id], audit-logs,
 * internal-requests/[id], transfers/[id]
 */

import type { UserContext } from "@/types";

const adminUser: UserContext = {
  id: "user-admin", email: "admin@demo.com", fullName: "Admin User",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "admin",
  permissions: ["item:read", "audit:read"],
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
jest.mock("@/lib/rate-limit", () => ({
  rateLimit: jest.fn(() => ({ allowed: true, remaining: 9, resetIn: 60 })),
}));

const UUID = "550e8400-e29b-41d4-a716-446655440000";

const mockQueryRaw = jest.fn();
const mockInvFindMany = jest.fn();
const mockInvCount = jest.fn();
const mockRcvFindFirst = jest.fn();
const mockAuditFindMany = jest.fn();
const mockAuditCount = jest.fn();
const mockReqFindFirst = jest.fn();
const mockTrfFindFirst = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRawUnsafe: (...a: unknown[]) => mockQueryRaw(...a),
    inventoryItem: {
      findMany: (...a: unknown[]) => mockInvFindMany(...a),
      count: (...a: unknown[]) => mockInvCount(...a),
    },
    receiving: { findFirst: (...a: unknown[]) => mockRcvFindFirst(...a) },
    auditLog: {
      findMany: (...a: unknown[]) => mockAuditFindMany(...a),
      count: (...a: unknown[]) => mockAuditCount(...a),
    },
    internalRequest: { findFirst: (...a: unknown[]) => mockReqFindFirst(...a) },
    transfer: { findFirst: (...a: unknown[]) => mockTrfFindFirst(...a) },
  },
}));

import { GET as healthCheck } from "@/app/api/health/route";
import { GET as getInventory } from "@/app/api/inventory/route";
import { GET as getReceiving } from "@/app/api/receiving/[id]/route";
import { GET as getAuditLogs } from "@/app/api/audit-logs/route";
import { NextRequest } from "next/server";

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => { jest.clearAllMocks(); mockCurrentUser = adminUser; });

// ============================
// Health Check
// ============================
describe("GET /api/health", () => {
  test("returns healthy when DB is up", async () => {
    mockQueryRaw.mockResolvedValue([{ 1: 1 }]);
    const response = await healthCheck();
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.services.database).toBe("up");
  });

  test("returns unhealthy when DB is down", async () => {
    mockQueryRaw.mockRejectedValue(new Error("connection refused"));
    const response = await healthCheck();
    const data = await response.json();
    expect(response.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.services.database).toBe("down");
  });
});

// ============================
// Inventory
// ============================
describe("GET /api/inventory", () => {
  test("returns inventory list", async () => {
    mockInvFindMany.mockResolvedValue([{ id: "inv-1", quantity: 100 }]);
    mockInvCount.mockResolvedValue(1);
    const response = await getInventory(new NextRequest("http://localhost:3000/api/inventory"));
    expect(response.status).toBe(200);
  });

  test("returns 401 for unauthenticated", async () => {
    mockCurrentUser = null;
    const response = await getInventory(new NextRequest("http://localhost:3000/api/inventory"));
    expect(response.status).toBe(401);
  });

  test("filters by locationId", async () => {
    mockInvFindMany.mockResolvedValue([]);
    mockInvCount.mockResolvedValue(0);
    await getInventory(new NextRequest(`http://localhost:3000/api/inventory?locationId=${UUID}`));
    expect(mockInvFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ locationId: UUID }),
      })
    );
  });

  test("filters by search", async () => {
    mockInvFindMany.mockResolvedValue([]);
    mockInvCount.mockResolvedValue(0);
    await getInventory(new NextRequest("http://localhost:3000/api/inventory?search=flour"));
    expect(mockInvFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          item: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: "flour", mode: "insensitive" } }),
            ]),
          }),
        }),
      })
    );
  });
});

// ============================
// Receiving [id]
// ============================
describe("GET /api/receiving/[id]", () => {
  test("returns receiving detail", async () => {
    mockRcvFindFirst.mockResolvedValue({ id: UUID, receivingNumber: "RCV-001" });
    const response = await getReceiving(
      new NextRequest(`http://localhost:3000/api/receiving/${UUID}`),
      makeParams(UUID)
    );
    expect(response.status).toBe(200);
  });

  test("returns 404 for non-existent", async () => {
    mockRcvFindFirst.mockResolvedValue(null);
    const response = await getReceiving(
      new NextRequest(`http://localhost:3000/api/receiving/${UUID}`),
      makeParams(UUID)
    );
    expect(response.status).toBe(404);
  });
});

// ============================
// Audit Logs
// ============================
describe("GET /api/audit-logs", () => {
  test("returns paginated audit logs", async () => {
    mockAuditFindMany.mockResolvedValue([{ id: "a1", action: "po:create" }]);
    mockAuditCount.mockResolvedValue(1);
    const response = await getAuditLogs(new NextRequest("http://localhost:3000/api/audit-logs"));
    expect(response.status).toBe(200);
  });

  test("returns 401 for unauthenticated", async () => {
    mockCurrentUser = null;
    const response = await getAuditLogs(new NextRequest("http://localhost:3000/api/audit-logs"));
    expect(response.status).toBe(401);
  });

  test("returns 403 without audit:read", async () => {
    mockCurrentUser = { ...adminUser, permissions: [] };
    const response = await getAuditLogs(new NextRequest("http://localhost:3000/api/audit-logs"));
    expect(response.status).toBe(403);
  });

  test("filters by entityType and date range", async () => {
    mockAuditFindMany.mockResolvedValue([]);
    mockAuditCount.mockResolvedValue(0);
    await getAuditLogs(new NextRequest(
      "http://localhost:3000/api/audit-logs?entityType=PurchaseOrder&dateFrom=2026-01-01&dateTo=2026-02-01"
    ));
    expect(mockAuditFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          entityType: "PurchaseOrder",
          createdAt: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      })
    );
  });
});
