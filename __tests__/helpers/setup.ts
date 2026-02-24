/**
 * Shared mocks and helpers for API route testing.
 * Next.js App Router routes export async functions (GET, POST, etc.)
 * that take NextRequest and return NextResponse.
 */

import type { UserContext } from "@/types";

// ============================================================
// Mock user contexts for different roles
// ============================================================

export const adminUser: UserContext = {
  id: "user-admin",
  email: "admin@demo.com",
  fullName: "Admin User",
  tenantId: "tenant-1",
  tenantName: "Demo Corp",
  role: "admin",
  permissions: [
    "item:create", "item:read", "item:edit", "item:delete",
    "location:create", "location:read",
    "supplier:create", "supplier:read",
    "po:create", "po:edit", "po:approve", "po:submit",
    "receiving:proc_verify", "receiving:qc_inspect", "receiving:warehouse_receive",
    "requests:write", "requests:fulfill", "requests:confirm",
    "transfers:write", "transfers:fulfill", "transfers:receive",
    "payments:read", "payments:write",
    "audit:read",
  ],
};

export const procurementUser: UserContext = {
  id: "user-procurement",
  email: "procurement@demo.com",
  fullName: "Procurement User",
  tenantId: "tenant-1",
  tenantName: "Demo Corp",
  role: "procurement",
  permissions: ["po:create", "po:edit", "po:submit", "receiving:proc_verify", "item:read"],
};

export const qcUser: UserContext = {
  id: "user-qc",
  email: "qc@demo.com",
  fullName: "QC Inspector",
  tenantId: "tenant-1",
  tenantName: "Demo Corp",
  role: "qc",
  permissions: ["receiving:qc_inspect", "item:read"],
};

export const warehouseUser: UserContext = {
  id: "user-warehouse",
  email: "warehouse@demo.com",
  fullName: "Warehouse User",
  tenantId: "tenant-1",
  tenantName: "Demo Corp",
  role: "warehouse",
  permissions: [
    "receiving:warehouse_receive",
    "requests:fulfill",
    "transfers:fulfill", "transfers:receive",
    "item:read",
  ],
};

export const storeUser: UserContext = {
  id: "user-store",
  email: "store@demo.com",
  fullName: "Store Manager",
  tenantId: "tenant-1",
  tenantName: "Demo Corp",
  role: "store",
  permissions: ["requests:write", "requests:confirm", "item:read"],
};

export const financeUser: UserContext = {
  id: "user-finance",
  email: "finance@demo.com",
  fullName: "Finance User",
  tenantId: "tenant-1",
  tenantName: "Demo Corp",
  role: "finance",
  permissions: ["po:approve", "payments:read", "payments:write", "audit:read"],
};

// ============================================================
// Helper to create NextRequest-like objects
// ============================================================

export function createRequest(
  method: string,
  url: string,
  body?: unknown
): Request {
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) {
    init.body = JSON.stringify(body);
  }
  return new Request(`http://localhost:3000${url}`, init);
}

// ============================================================
// Helper to parse API response
// ============================================================

export async function parseResponse(response: Response) {
  const data = await response.json();
  return { status: response.status, body: data };
}
