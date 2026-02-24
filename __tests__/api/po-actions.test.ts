/**
 * @jest-environment node
 */

import type { UserContext } from "@/types";

const adminUser: UserContext = {
  id: "user-admin", email: "admin@demo.com", fullName: "Admin User",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "admin",
  permissions: ["po:create", "po:edit", "po:approve"],
};
const procUser: UserContext = {
  id: "user-proc", email: "proc@demo.com", fullName: "Procurement",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "procurement",
  permissions: ["po:create"],
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

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const ITEM = "550e8400-e29b-41d4-a716-446655440001";

const mockPOFindFirst = jest.fn();
const mockPOUpdate = jest.fn();
const mockSupFindFirst = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    purchaseOrder: {
      findFirst: (...a: unknown[]) => mockPOFindFirst(...a),
      update: (...a: unknown[]) => mockPOUpdate(...a),
    },
    supplier: { findFirst: (...a: unknown[]) => mockSupFindFirst(...a) },
  },
}));

import { GET, PUT } from "@/app/api/purchase-orders/[id]/route";
import { POST as submitPO } from "@/app/api/purchase-orders/[id]/submit/route";
import { POST as approvePO } from "@/app/api/purchase-orders/[id]/approve/route";
import { POST as sendPO } from "@/app/api/purchase-orders/[id]/send/route";
import { NextRequest } from "next/server";

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => { jest.clearAllMocks(); mockCurrentUser = adminUser; });

// ============================
// GET /api/purchase-orders/[id]
// ============================
describe("GET /api/purchase-orders/[id]", () => {
  test("returns PO detail", async () => {
    mockPOFindFirst.mockResolvedValue({ id: UUID, poNumber: "PO-00001" });
    const response = await GET(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}`),
      makeParams(UUID)
    );
    expect(response.status).toBe(200);
  });

  test("returns 404 for non-existent PO", async () => {
    mockPOFindFirst.mockResolvedValue(null);
    const response = await GET(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}`),
      makeParams(UUID)
    );
    expect(response.status).toBe(404);
  });

  test("returns 401 for unauthenticated", async () => {
    mockCurrentUser = null;
    const response = await GET(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}`),
      makeParams(UUID)
    );
    expect(response.status).toBe(401);
  });
});

// ============================
// PUT /api/purchase-orders/[id]
// ============================
describe("PUT /api/purchase-orders/[id]", () => {
  test("updates draft PO", async () => {
    mockPOFindFirst.mockResolvedValue({ id: UUID, status: "DRAFT", totalAmount: 100 });
    mockPOUpdate.mockResolvedValue({ id: UUID, totalAmount: 200 });
    const response = await PUT(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}`, {
        method: "PUT", body: JSON.stringify({ notes: "Updated notes" }),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(200);
  });

  test("rejects edit of non-draft PO", async () => {
    mockPOFindFirst.mockResolvedValue({ id: UUID, status: "APPROVED" });
    const response = await PUT(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}`, {
        method: "PUT", body: JSON.stringify({ notes: "Try edit" }),
      }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("draft");
  });

  test("returns 403 without po:edit", async () => {
    mockCurrentUser = storeUser;
    const response = await PUT(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}`, {
        method: "PUT", body: JSON.stringify({ notes: "test" }),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(403);
  });
});

// ============================
// POST /api/purchase-orders/[id]/submit
// ============================
describe("POST /api/purchase-orders/[id]/submit", () => {
  test("submits draft PO", async () => {
    mockPOFindFirst.mockResolvedValue({ id: UUID, status: "DRAFT", lines: [{ id: "l1" }] });
    mockPOUpdate.mockResolvedValue({ id: UUID, status: "PENDING_APPROVAL" });
    const response = await submitPO(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}/submit`, { method: "POST" }),
      makeParams(UUID)
    );
    expect(response.status).toBe(200);
  });

  test("rejects non-draft PO", async () => {
    mockPOFindFirst.mockResolvedValue({ id: UUID, status: "APPROVED", lines: [] });
    const response = await submitPO(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}/submit`, { method: "POST" }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("draft");
  });

  test("rejects PO with no lines", async () => {
    mockPOFindFirst.mockResolvedValue({ id: UUID, status: "DRAFT", lines: [] });
    const response = await submitPO(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}/submit`, { method: "POST" }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("line item");
  });

  test("returns 403 without po:create", async () => {
    mockCurrentUser = storeUser;
    const response = await submitPO(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}/submit`, { method: "POST" }),
      makeParams(UUID)
    );
    expect(response.status).toBe(403);
  });
});

// ============================
// POST /api/purchase-orders/[id]/approve
// ============================
describe("POST /api/purchase-orders/[id]/approve", () => {
  test("approves pending PO", async () => {
    mockPOFindFirst.mockResolvedValue({ id: UUID, status: "PENDING_APPROVAL", createdById: "other-user" });
    mockPOUpdate.mockResolvedValue({ id: UUID, status: "APPROVED" });
    const response = await approvePO(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}/approve`, {
        method: "POST", body: JSON.stringify({}),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(200);
  });

  test("rejects non-pending PO", async () => {
    mockPOFindFirst.mockResolvedValue({ id: UUID, status: "DRAFT", createdById: "other-user" });
    const response = await approvePO(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}/approve`, {
        method: "POST", body: JSON.stringify({}),
      }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("pending");
  });

  test("prevents self-approval", async () => {
    mockPOFindFirst.mockResolvedValue({ id: UUID, status: "PENDING_APPROVAL", createdById: adminUser.id });
    const response = await approvePO(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}/approve`, {
        method: "POST", body: JSON.stringify({}),
      }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("cannot approve your own");
  });

  test("rejects PO with reason", async () => {
    mockPOFindFirst.mockResolvedValue({ id: UUID, status: "PENDING_APPROVAL", createdById: "other-user", notes: "" });
    mockPOUpdate.mockResolvedValue({ id: UUID, status: "CANCELLED" });
    const response = await approvePO(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}/approve`, {
        method: "POST", body: JSON.stringify({ action: "reject", reason: "Too expensive" }),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(200);
    expect(mockPOUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "CANCELLED" }) })
    );
  });

  test("returns 403 without po:approve", async () => {
    mockCurrentUser = procUser;
    const response = await approvePO(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}/approve`, {
        method: "POST", body: JSON.stringify({}),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(403);
  });
});

// ============================
// POST /api/purchase-orders/[id]/send
// ============================
describe("POST /api/purchase-orders/[id]/send", () => {
  test("marks approved PO as sent", async () => {
    mockPOFindFirst.mockResolvedValue({ id: UUID, status: "APPROVED" });
    mockPOUpdate.mockResolvedValue({ id: UUID, status: "SENT" });
    const response = await sendPO(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}/send`, { method: "POST" }),
      makeParams(UUID)
    );
    expect(response.status).toBe(200);
  });

  test("rejects non-approved PO", async () => {
    mockPOFindFirst.mockResolvedValue({ id: UUID, status: "DRAFT" });
    const response = await sendPO(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}/send`, { method: "POST" }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("approved");
  });

  test("returns 403 without po:edit", async () => {
    mockCurrentUser = storeUser;
    const response = await sendPO(
      new NextRequest(`http://localhost:3000/api/purchase-orders/${UUID}/send`, { method: "POST" }),
      makeParams(UUID)
    );
    expect(response.status).toBe(403);
  });
});
