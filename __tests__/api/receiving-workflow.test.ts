/**
 * @jest-environment node
 *
 * Tests the 3-step inbound receiving process:
 * Step 1: Procurement Verify  (POST /api/receiving)
 * Step 2: QC Inspect           (POST /api/receiving/[id]/qc-inspect)
 * Step 3: Warehouse Receive    (POST /api/receiving/[id]/warehouse-receive)
 */

import type { UserContext } from "@/types";

const procUser: UserContext = {
  id: "user-proc", email: "proc@demo.com", fullName: "Procurement",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "procurement",
  permissions: ["po:create", "receiving:proc_verify"],
};
const qcUser: UserContext = {
  id: "user-qc", email: "qc@demo.com", fullName: "QC Inspector",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "qc",
  permissions: ["receiving:qc_inspect"],
};
const whUser: UserContext = {
  id: "user-wh", email: "wh@demo.com", fullName: "Warehouse",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "warehouse",
  permissions: ["receiving:warehouse_receive"],
};

let mockCurrentUser: UserContext | null = procUser;

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

const mockPOFindFirst = jest.fn();
const mockRcvCreate = jest.fn();
const mockRcvFindFirst = jest.fn();
const mockRcvCount = jest.fn();
const mockRcvFindMany = jest.fn().mockResolvedValue([]);
const mockLocFindFirst = jest.fn();
const mockTransaction = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    purchaseOrder: { findFirst: (...a: unknown[]) => mockPOFindFirst(...a) },
    receiving: {
      create: (...a: unknown[]) => mockRcvCreate(...a),
      findFirst: (...a: unknown[]) => mockRcvFindFirst(...a),
      count: (...a: unknown[]) => mockRcvCount(...a),
      findMany: (...a: unknown[]) => mockRcvFindMany(...a),
    },
    location: { findFirst: (...a: unknown[]) => mockLocFindFirst(...a) },
    $transaction: (...a: unknown[]) => mockTransaction(...a),
  },
}));

import { POST as createReceiving } from "@/app/api/receiving/route";
import { POST as qcInspect } from "@/app/api/receiving/[id]/qc-inspect/route";
import { POST as warehouseReceive } from "@/app/api/receiving/[id]/warehouse-receive/route";
import { NextRequest } from "next/server";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const ITEM = "550e8400-e29b-41d4-a716-446655440001";
const LINE_ID = "550e8400-e29b-41d4-a716-446655440010";

beforeEach(() => { jest.clearAllMocks(); mockCurrentUser = procUser; });

// ============================
// Step 1: Procurement Verify
// ============================
describe("Step 1: POST /api/receiving", () => {
  const body = { purchaseOrderId: UUID, lines: [{ itemId: ITEM, receivedQty: 50 }] };
  const approvedPO = {
    id: UUID, tenantId: "tenant-1", status: "APPROVED",
    createdById: "user-admin",
    lines: [{ itemId: ITEM, quantity: 100, unitCost: 10, item: {} }],
  };

  test("creates receiving for approved PO", async () => {
    mockPOFindFirst.mockResolvedValue(approvedPO);
    mockRcvCount.mockResolvedValue(0);
    mockRcvCreate.mockResolvedValue({ id: "rcv-1", status: "PROC_VERIFIED" });
    const response = await createReceiving(new NextRequest("http://localhost:3000/api/receiving", {
      method: "POST", body: JSON.stringify(body),
    }));
    expect(response.status).toBe(201);
  });

  test("rejects non-APPROVED PO", async () => {
    mockPOFindFirst.mockResolvedValue({ ...approvedPO, status: "DRAFT" });
    const response = await createReceiving(new NextRequest("http://localhost:3000/api/receiving", {
      method: "POST", body: JSON.stringify(body),
    }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("Approved or Sent");
  });

  test("enforces segregation - cannot verify own PO", async () => {
    mockPOFindFirst.mockResolvedValue({ ...approvedPO, createdById: procUser.id });
    const response = await createReceiving(new NextRequest("http://localhost:3000/api/receiving", {
      method: "POST", body: JSON.stringify(body),
    }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("segregation");
  });

  test("rejects items not in PO", async () => {
    mockPOFindFirst.mockResolvedValue(approvedPO);
    const response = await createReceiving(new NextRequest("http://localhost:3000/api/receiving", {
      method: "POST", body: JSON.stringify({
        purchaseOrderId: UUID,
        lines: [{ itemId: "550e8400-e29b-41d4-a716-446655440099", receivedQty: 10 }],
      }),
    }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("not part of this purchase order");
  });

  test("Zod rejects zero receivedQty", async () => {
    const response = await createReceiving(new NextRequest("http://localhost:3000/api/receiving", {
      method: "POST", body: JSON.stringify({
        purchaseOrderId: UUID, lines: [{ itemId: ITEM, receivedQty: 0 }],
      }),
    }));
    expect(response.status).toBe(400);
  });

  test("returns 403 without proc_verify permission", async () => {
    mockCurrentUser = qcUser;
    const response = await createReceiving(new NextRequest("http://localhost:3000/api/receiving", {
      method: "POST", body: JSON.stringify(body),
    }));
    expect(response.status).toBe(403);
  });
});

// ============================
// Step 2: QC Inspection
// ============================
describe("Step 2: POST /api/receiving/[id]/qc-inspect", () => {
  const receiving = {
    id: "rcv-1", tenantId: "tenant-1", status: "PROC_VERIFIED",
    procVerifiedById: procUser.id,
    lines: [{ id: LINE_ID, itemId: ITEM, receivedQty: 50 }],
  };

  test("accepts valid QC inspection", async () => {
    mockCurrentUser = qcUser;
    mockRcvFindFirst.mockResolvedValue(receiving);
    mockTransaction.mockResolvedValue({ id: "rcv-1", status: "QC_APPROVED" });
    const response = await qcInspect(
      new NextRequest("http://localhost:3000/api/receiving/rcv-1/qc-inspect", {
        method: "POST", body: JSON.stringify({
          qcResult: "ACCEPTED", lines: [{ id: LINE_ID, acceptedQty: 50, rejectedQty: 0 }],
        }),
      }),
      { params: Promise.resolve({ id: "rcv-1" }) }
    );
    expect(response.status).toBe(200);
  });

  test("enforces segregation - QC ≠ verifier", async () => {
    mockCurrentUser = { ...procUser, permissions: [...procUser.permissions, "receiving:qc_inspect"] };
    mockRcvFindFirst.mockResolvedValue(receiving);
    const response = await qcInspect(
      new NextRequest("http://localhost:3000/api/receiving/rcv-1/qc-inspect", {
        method: "POST", body: JSON.stringify({
          qcResult: "ACCEPTED", lines: [{ id: LINE_ID, acceptedQty: 50, rejectedQty: 0 }],
        }),
      }),
      { params: Promise.resolve({ id: "rcv-1" }) }
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("segregation");
  });

  test("rejects if not PROC_VERIFIED status", async () => {
    mockCurrentUser = qcUser;
    mockRcvFindFirst.mockResolvedValue({ ...receiving, status: "QC_APPROVED" });
    const response = await qcInspect(
      new NextRequest("http://localhost:3000/api/receiving/rcv-1/qc-inspect", {
        method: "POST", body: JSON.stringify({
          qcResult: "ACCEPTED", lines: [{ id: LINE_ID, acceptedQty: 50, rejectedQty: 0 }],
        }),
      }),
      { params: Promise.resolve({ id: "rcv-1" }) }
    );
    expect(response.status).toBe(400);
  });

  test("validates accepted + rejected = received", async () => {
    mockCurrentUser = qcUser;
    mockRcvFindFirst.mockResolvedValue(receiving);
    const response = await qcInspect(
      new NextRequest("http://localhost:3000/api/receiving/rcv-1/qc-inspect", {
        method: "POST", body: JSON.stringify({
          qcResult: "PARTIAL", lines: [{ id: LINE_ID, acceptedQty: 30, rejectedQty: 10 }], // 40 ≠ 50
        }),
      }),
      { params: Promise.resolve({ id: "rcv-1" }) }
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("must equal Received");
  });

  test("rejects ACCEPTED with zero accepted", async () => {
    mockCurrentUser = qcUser;
    mockRcvFindFirst.mockResolvedValue(receiving);
    const response = await qcInspect(
      new NextRequest("http://localhost:3000/api/receiving/rcv-1/qc-inspect", {
        method: "POST", body: JSON.stringify({
          qcResult: "ACCEPTED", lines: [{ id: LINE_ID, acceptedQty: 0, rejectedQty: 50 }],
        }),
      }),
      { params: Promise.resolve({ id: "rcv-1" }) }
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("REJECTED instead");
  });
});

// ============================
// Step 3: Warehouse Receive
// ============================
describe("Step 3: POST /api/receiving/[id]/warehouse-receive", () => {
  const qcApproved = {
    id: "rcv-1", tenantId: "tenant-1", status: "QC_APPROVED",
    receivingNumber: "RCV-20260224-001",
    procVerifiedById: procUser.id, qcInspectedById: qcUser.id,
    purchaseOrderId: UUID,
    lines: [{ id: LINE_ID, itemId: ITEM, acceptedQty: 45, rejectedQty: 5, receivedQty: 50, unitCost: 10, item: {} }],
    purchaseOrder: { id: UUID, lines: [{ id: "pol1", itemId: ITEM, quantity: 100, receivedQty: 0 }] },
  };

  test("completes receiving", async () => {
    mockCurrentUser = whUser;
    mockRcvFindFirst.mockResolvedValue(qcApproved);
    mockLocFindFirst.mockResolvedValue({ id: UUID, isActive: true });
    mockTransaction.mockResolvedValue({ id: "rcv-1", status: "RECEIVED" });
    // Second call for result fetch
    mockRcvFindFirst.mockResolvedValueOnce(qcApproved).mockResolvedValueOnce({ ...qcApproved, status: "RECEIVED" });
    const response = await warehouseReceive(
      new NextRequest("http://localhost:3000/api/receiving/rcv-1/warehouse-receive", {
        method: "POST", body: JSON.stringify({ locationId: UUID }),
      }),
      { params: Promise.resolve({ id: "rcv-1" }) }
    );
    expect(response.status).toBe(200);
  });

  test("enforces segregation - warehouse ≠ verifier", async () => {
    mockCurrentUser = { ...procUser, permissions: [...procUser.permissions, "receiving:warehouse_receive"] };
    mockRcvFindFirst.mockResolvedValue(qcApproved);
    mockLocFindFirst.mockResolvedValue({ id: UUID, isActive: true });
    const response = await warehouseReceive(
      new NextRequest("http://localhost:3000/api/receiving/rcv-1/warehouse-receive", {
        method: "POST", body: JSON.stringify({ locationId: UUID }),
      }),
      { params: Promise.resolve({ id: "rcv-1" }) }
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("segregation");
  });

  test("enforces segregation - warehouse ≠ QC inspector", async () => {
    mockCurrentUser = { ...qcUser, permissions: [...qcUser.permissions, "receiving:warehouse_receive"] };
    mockRcvFindFirst.mockResolvedValue(qcApproved);
    mockLocFindFirst.mockResolvedValue({ id: UUID, isActive: true });
    const response = await warehouseReceive(
      new NextRequest("http://localhost:3000/api/receiving/rcv-1/warehouse-receive", {
        method: "POST", body: JSON.stringify({ locationId: UUID }),
      }),
      { params: Promise.resolve({ id: "rcv-1" }) }
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("segregation");
  });

  test("can't skip steps - rejects PROC_VERIFIED status", async () => {
    mockCurrentUser = whUser;
    mockRcvFindFirst.mockResolvedValue({ ...qcApproved, status: "PROC_VERIFIED" });
    const response = await warehouseReceive(
      new NextRequest("http://localhost:3000/api/receiving/rcv-1/warehouse-receive", {
        method: "POST", body: JSON.stringify({ locationId: UUID }),
      }),
      { params: Promise.resolve({ id: "rcv-1" }) }
    );
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toContain("QC Approved");
  });

  test("Zod requires locationId", async () => {
    mockCurrentUser = whUser;
    const response = await warehouseReceive(
      new NextRequest("http://localhost:3000/api/receiving/rcv-1/warehouse-receive", {
        method: "POST", body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "rcv-1" }) }
    );
    expect(response.status).toBe(400);
  });

  test("returns 403 without permission", async () => {
    mockCurrentUser = procUser;
    const response = await warehouseReceive(
      new NextRequest("http://localhost:3000/api/receiving/rcv-1/warehouse-receive", {
        method: "POST", body: JSON.stringify({ locationId: UUID }),
      }),
      { params: Promise.resolve({ id: "rcv-1" }) }
    );
    expect(response.status).toBe(403);
  });
});
