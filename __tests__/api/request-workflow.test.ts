/**
 * @jest-environment node
 */

import type { UserContext } from "@/types";

const storeUser: UserContext = {
  id: "user-store", email: "store@demo.com", fullName: "Store Manager",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "store",
  permissions: ["requests:write", "requests:confirm"],
};
const whUser: UserContext = {
  id: "user-wh", email: "wh@demo.com", fullName: "Warehouse",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "warehouse",
  permissions: ["requests:fulfill"],
};
const otherUser: UserContext = {
  id: "user-other", email: "other@demo.com", fullName: "Other User",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "admin",
  permissions: [],
};

let mockCurrentUser: UserContext | null = whUser;

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
const LINE_ID = "550e8400-e29b-41d4-a716-446655440010";
const ITEM = "550e8400-e29b-41d4-a716-446655440001";
const LOC = "550e8400-e29b-41d4-a716-446655440002";

const mockReqFindFirst = jest.fn();
const mockLocFindFirst = jest.fn();
const mockInvFindUnique = jest.fn();
const mockTransaction = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    internalRequest: { findFirst: (...a: unknown[]) => mockReqFindFirst(...a) },
    location: { findFirst: (...a: unknown[]) => mockLocFindFirst(...a) },
    inventoryItem: { findUnique: (...a: unknown[]) => mockInvFindUnique(...a) },
    $transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}));

import { POST as fulfillRequest } from "@/app/api/internal-requests/[id]/fulfill/route";
import { POST as confirmRequest } from "@/app/api/internal-requests/[id]/confirm/route";
import { NextRequest } from "next/server";

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => { jest.clearAllMocks(); mockCurrentUser = whUser; });

// ============================
// Fulfill Internal Request
// ============================
describe("POST /api/internal-requests/[id]/fulfill", () => {
  const pendingReq = {
    id: UUID, tenantId: "tenant-1", status: "PENDING",
    createdById: storeUser.id, requestNumber: "REQ-00001",
    lines: [{ id: LINE_ID, itemId: ITEM, requestedQty: 10 }],
  };

  test("fulfills pending request", async () => {
    mockReqFindFirst.mockResolvedValue(pendingReq);
    mockLocFindFirst.mockResolvedValue({ id: LOC, isActive: true });
    mockInvFindUnique.mockResolvedValue({ quantity: 50, avgCost: 5 });
    mockTransaction.mockResolvedValue({ id: UUID, status: "ISSUED" });
    const response = await fulfillRequest(
      new NextRequest(`http://localhost:3000/api/internal-requests/${UUID}/fulfill`, {
        method: "POST",
        body: JSON.stringify({ lines: [{ id: LINE_ID, issuedQty: 10 }], locationId: LOC }),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(200);
  });

  test("rejects non-PENDING request", async () => {
    mockReqFindFirst.mockResolvedValue({ ...pendingReq, status: "ISSUED" });
    const response = await fulfillRequest(
      new NextRequest(`http://localhost:3000/api/internal-requests/${UUID}/fulfill`, {
        method: "POST",
        body: JSON.stringify({ lines: [{ id: LINE_ID, issuedQty: 10 }], locationId: LOC }),
      }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("Pending");
  });

  test("enforces segregation - fulfiller ≠ requester", async () => {
    mockCurrentUser = { ...storeUser, permissions: ["requests:fulfill"] };
    mockReqFindFirst.mockResolvedValue({ ...pendingReq, createdById: storeUser.id });
    mockLocFindFirst.mockResolvedValue({ id: LOC, isActive: true });
    const response = await fulfillRequest(
      new NextRequest(`http://localhost:3000/api/internal-requests/${UUID}/fulfill`, {
        method: "POST",
        body: JSON.stringify({ lines: [{ id: LINE_ID, issuedQty: 10 }], locationId: LOC }),
      }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("segregation");
  });

  test("rejects insufficient stock", async () => {
    mockReqFindFirst.mockResolvedValue(pendingReq);
    mockLocFindFirst.mockResolvedValue({ id: LOC, isActive: true });
    mockInvFindUnique.mockResolvedValue({ quantity: 3, avgCost: 5 });
    const response = await fulfillRequest(
      new NextRequest(`http://localhost:3000/api/internal-requests/${UUID}/fulfill`, {
        method: "POST",
        body: JSON.stringify({ lines: [{ id: LINE_ID, issuedQty: 10 }], locationId: LOC }),
      }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("Insufficient stock");
  });

  test("rejects issuedQty > requestedQty", async () => {
    mockReqFindFirst.mockResolvedValue(pendingReq);
    mockLocFindFirst.mockResolvedValue({ id: LOC, isActive: true });
    const response = await fulfillRequest(
      new NextRequest(`http://localhost:3000/api/internal-requests/${UUID}/fulfill`, {
        method: "POST",
        body: JSON.stringify({ lines: [{ id: LINE_ID, issuedQty: 99 }], locationId: LOC }),
      }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("exceeds requested");
  });

  test("returns 403 without requests:fulfill", async () => {
    mockCurrentUser = otherUser;
    const response = await fulfillRequest(
      new NextRequest(`http://localhost:3000/api/internal-requests/${UUID}/fulfill`, {
        method: "POST",
        body: JSON.stringify({ lines: [{ id: LINE_ID, issuedQty: 10 }], locationId: LOC }),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(403);
  });
});

// ============================
// Confirm Internal Request
// ============================
describe("POST /api/internal-requests/[id]/confirm", () => {
  const issuedReq = {
    id: UUID, tenantId: "tenant-1", status: "ISSUED",
    createdById: storeUser.id, fulfilledById: whUser.id,
    requestNumber: "REQ-00001", notes: null,
    lines: [{ id: LINE_ID, itemId: ITEM, requestedQty: 10, issuedQty: 10, notes: null }],
  };

  test("confirms issued request", async () => {
    mockCurrentUser = storeUser;
    mockReqFindFirst.mockResolvedValue(issuedReq);
    mockTransaction.mockResolvedValue({ id: UUID, status: "CONFIRMED" });
    const response = await confirmRequest(
      new NextRequest(`http://localhost:3000/api/internal-requests/${UUID}/confirm`, {
        method: "POST",
        body: JSON.stringify({ lines: [{ id: LINE_ID, confirmedQty: 10 }] }),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(200);
  });

  test("rejects non-ISSUED request", async () => {
    mockCurrentUser = storeUser;
    mockReqFindFirst.mockResolvedValue({ ...issuedReq, status: "PENDING" });
    const response = await confirmRequest(
      new NextRequest(`http://localhost:3000/api/internal-requests/${UUID}/confirm`, {
        method: "POST",
        body: JSON.stringify({ lines: [{ id: LINE_ID, confirmedQty: 10 }] }),
      }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("Issued");
  });

  test("enforces segregation - confirmer ≠ fulfiller", async () => {
    mockCurrentUser = { ...whUser, permissions: ["requests:confirm"] };
    mockReqFindFirst.mockResolvedValue(issuedReq);
    const response = await confirmRequest(
      new NextRequest(`http://localhost:3000/api/internal-requests/${UUID}/confirm`, {
        method: "POST",
        body: JSON.stringify({ lines: [{ id: LINE_ID, confirmedQty: 10 }] }),
      }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("segregation");
  });

  test("rejects confirmedQty > issuedQty", async () => {
    mockCurrentUser = storeUser;
    mockReqFindFirst.mockResolvedValue(issuedReq);
    const response = await confirmRequest(
      new NextRequest(`http://localhost:3000/api/internal-requests/${UUID}/confirm`, {
        method: "POST",
        body: JSON.stringify({ lines: [{ id: LINE_ID, confirmedQty: 99 }] }),
      }),
      makeParams(UUID)
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("exceed issued");
  });

  test("returns 403 without requests:confirm", async () => {
    mockCurrentUser = otherUser;
    const response = await confirmRequest(
      new NextRequest(`http://localhost:3000/api/internal-requests/${UUID}/confirm`, {
        method: "POST",
        body: JSON.stringify({ lines: [{ id: LINE_ID, confirmedQty: 10 }] }),
      }),
      makeParams(UUID)
    );
    expect(response.status).toBe(403);
  });
});
