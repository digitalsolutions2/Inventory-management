/**
 * @jest-environment node
 */

import type { UserContext } from "@/types";

const adminUser: UserContext = {
  id: "user-admin", email: "admin@demo.com", fullName: "Admin User",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "admin",
  permissions: ["transfers:approve", "transfers:fulfill", "transfers:receive"],
};
const whUser: UserContext = {
  id: "user-wh", email: "wh@demo.com", fullName: "Warehouse",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "warehouse",
  permissions: ["transfers:fulfill", "transfers:receive"],
};
const storeUser: UserContext = {
  id: "user-store", email: "store@demo.com", fullName: "Store",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "store",
  permissions: [],
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
const LOC1 = "550e8400-e29b-41d4-a716-446655440001";
const LOC2 = "550e8400-e29b-41d4-a716-446655440002";
const ITEM = "550e8400-e29b-41d4-a716-446655440003";
const LINE_ID = "550e8400-e29b-41d4-a716-446655440010";

const mockTrfFindFirst = jest.fn();
const mockTrfUpdate = jest.fn();
const mockInvFindUnique = jest.fn();
const mockTransaction = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    transfer: {
      findFirst: (...a: unknown[]) => mockTrfFindFirst(...a),
      update: (...a: unknown[]) => mockTrfUpdate(...a),
    },
    inventoryItem: { findUnique: (...a: unknown[]) => mockInvFindUnique(...a) },
    $transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}));

import { POST as approveTransfer } from "@/app/api/transfers/[id]/approve/route";
import { POST as fulfillTransfer } from "@/app/api/transfers/[id]/fulfill/route";
import { POST as receiveTransfer } from "@/app/api/transfers/[id]/receive/route";
import { NextRequest } from "next/server";

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => { jest.clearAllMocks(); mockCurrentUser = adminUser; });

// ============================
// Approve Transfer
// ============================
describe("POST /api/transfers/[id]/approve", () => {
  const pendingTrf = {
    id: UUID, tenantId: "tenant-1", status: "PENDING",
    createdById: whUser.id, notes: "",
  };

  test("approves pending transfer", async () => {
    mockTrfFindFirst.mockResolvedValue(pendingTrf);
    mockTrfUpdate.mockResolvedValue({ id: UUID, status: "APPROVED" });
    const response = await approveTransfer(
      new NextRequest(`http://localhost:3000/api/transfers/${UUID}/approve`, {
        method: "POST", body: JSON.stringify({}),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(200);
  });

  test("rejects non-PENDING transfer", async () => {
    mockTrfFindFirst.mockResolvedValue({ ...pendingTrf, status: "APPROVED" });
    const response = await approveTransfer(
      new NextRequest(`http://localhost:3000/api/transfers/${UUID}/approve`, {
        method: "POST", body: JSON.stringify({}),
      }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("Pending");
  });

  test("prevents self-approval", async () => {
    mockTrfFindFirst.mockResolvedValue({ ...pendingTrf, createdById: adminUser.id });
    const response = await approveTransfer(
      new NextRequest(`http://localhost:3000/api/transfers/${UUID}/approve`, {
        method: "POST", body: JSON.stringify({}),
      }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("cannot approve");
  });

  test("rejects transfer with reason", async () => {
    mockTrfFindFirst.mockResolvedValue(pendingTrf);
    mockTrfUpdate.mockResolvedValue({ id: UUID, status: "CANCELLED" });
    const response = await approveTransfer(
      new NextRequest(`http://localhost:3000/api/transfers/${UUID}/approve`, {
        method: "POST", body: JSON.stringify({ action: "reject", reason: "Not needed" }),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(200);
    expect(mockTrfUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "CANCELLED" }) })
    );
  });

  test("returns 403 without transfers:approve", async () => {
    mockCurrentUser = storeUser;
    const response = await approveTransfer(
      new NextRequest(`http://localhost:3000/api/transfers/${UUID}/approve`, {
        method: "POST", body: JSON.stringify({}),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(403);
  });
});

// ============================
// Fulfill Transfer
// ============================
describe("POST /api/transfers/[id]/fulfill", () => {
  const approvedTrf = {
    id: UUID, tenantId: "tenant-1", status: "APPROVED",
    fromLocationId: LOC1, toLocationId: LOC2, transferNumber: "TRF-00001",
    notes: null,
    lines: [{ id: LINE_ID, itemId: ITEM, quantity: 10, item: { name: "Test Item" } }],
  };

  test("fulfills approved transfer", async () => {
    mockCurrentUser = whUser;
    mockTrfFindFirst.mockResolvedValue(approvedTrf);
    mockInvFindUnique.mockResolvedValue({ quantity: 50, avgCost: 5 });
    mockTransaction.mockResolvedValue({ id: UUID, status: "IN_TRANSIT" });
    const response = await fulfillTransfer(
      new NextRequest(`http://localhost:3000/api/transfers/${UUID}/fulfill`, {
        method: "POST", body: JSON.stringify({}),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(200);
  });

  test("rejects non-APPROVED transfer", async () => {
    mockCurrentUser = whUser;
    mockTrfFindFirst.mockResolvedValue({ ...approvedTrf, status: "PENDING" });
    const response = await fulfillTransfer(
      new NextRequest(`http://localhost:3000/api/transfers/${UUID}/fulfill`, {
        method: "POST", body: JSON.stringify({}),
      }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("Approved");
  });

  test("rejects insufficient stock at source", async () => {
    mockCurrentUser = whUser;
    mockTrfFindFirst.mockResolvedValue(approvedTrf);
    mockInvFindUnique.mockResolvedValue({ quantity: 3, avgCost: 5 });
    const response = await fulfillTransfer(
      new NextRequest(`http://localhost:3000/api/transfers/${UUID}/fulfill`, {
        method: "POST", body: JSON.stringify({}),
      }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("Insufficient stock");
  });

  test("returns 403 without transfers:fulfill", async () => {
    mockCurrentUser = storeUser;
    const response = await fulfillTransfer(
      new NextRequest(`http://localhost:3000/api/transfers/${UUID}/fulfill`, {
        method: "POST", body: JSON.stringify({}),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(403);
  });
});

// ============================
// Receive Transfer
// ============================
describe("POST /api/transfers/[id]/receive", () => {
  const inTransitTrf = {
    id: UUID, tenantId: "tenant-1", status: "IN_TRANSIT",
    fromLocationId: LOC1, toLocationId: LOC2, transferNumber: "TRF-00001",
    notes: null,
    lines: [{ id: LINE_ID, itemId: ITEM, quantity: 10, item: { name: "Test Item" } }],
  };

  test("receives in-transit transfer", async () => {
    mockTrfFindFirst.mockResolvedValue(inTransitTrf);
    mockTransaction.mockResolvedValue({ id: UUID, status: "RECEIVED" });
    const response = await receiveTransfer(
      new NextRequest(`http://localhost:3000/api/transfers/${UUID}/receive`, {
        method: "POST",
        body: JSON.stringify({ lines: [{ id: LINE_ID, receivedQty: 10 }] }),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(200);
  });

  test("rejects non-IN_TRANSIT transfer", async () => {
    mockTrfFindFirst.mockResolvedValue({ ...inTransitTrf, status: "APPROVED" });
    const response = await receiveTransfer(
      new NextRequest(`http://localhost:3000/api/transfers/${UUID}/receive`, {
        method: "POST",
        body: JSON.stringify({ lines: [{ id: LINE_ID, receivedQty: 10 }] }),
      }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("In Transit");
  });

  test("rejects receivedQty > shipped qty", async () => {
    mockTrfFindFirst.mockResolvedValue(inTransitTrf);
    const response = await receiveTransfer(
      new NextRequest(`http://localhost:3000/api/transfers/${UUID}/receive`, {
        method: "POST",
        body: JSON.stringify({ lines: [{ id: LINE_ID, receivedQty: 99 }] }),
      }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("exceeds shipped");
  });

  test("returns 404 for non-existent transfer", async () => {
    mockTrfFindFirst.mockResolvedValue(null);
    const response = await receiveTransfer(
      new NextRequest(`http://localhost:3000/api/transfers/${UUID}/receive`, {
        method: "POST",
        body: JSON.stringify({ lines: [{ id: LINE_ID, receivedQty: 10 }] }),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(404);
  });

  test("returns 403 without transfers:receive", async () => {
    mockCurrentUser = storeUser;
    const response = await receiveTransfer(
      new NextRequest(`http://localhost:3000/api/transfers/${UUID}/receive`, {
        method: "POST",
        body: JSON.stringify({ lines: [{ id: LINE_ID, receivedQty: 10 }] }),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(403);
  });
});
