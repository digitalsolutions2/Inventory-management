/**
 * @jest-environment node
 *
 * Tests for [id] detail routes: items, categories, locations, suppliers
 */

import type { UserContext } from "@/types";

const adminUser: UserContext = {
  id: "user-admin", email: "admin@demo.com", fullName: "Admin User",
  tenantId: "tenant-1", tenantName: "Demo Corp", role: "admin",
  permissions: ["item:create", "item:read", "item:edit", "item:delete",
    "location:create", "location:edit", "location:delete",
    "supplier:create", "supplier:edit", "supplier:delete"],
};
const storeUser: UserContext = {
  id: "user-store", email: "store@demo.com", fullName: "Store",
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

const mockItemFindFirst = jest.fn();
const mockItemUpdate = jest.fn();
const mockCatFindFirst = jest.fn();
const mockCatUpdate = jest.fn();
const mockLocFindFirst = jest.fn();
const mockLocUpdate = jest.fn();
const mockSupFindFirst = jest.fn();
const mockSupUpdate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findFirst: (...a: unknown[]) => mockItemFindFirst(...a),
      update: (...a: unknown[]) => mockItemUpdate(...a),
    },
    category: {
      findFirst: (...a: unknown[]) => mockCatFindFirst(...a),
      update: (...a: unknown[]) => mockCatUpdate(...a),
    },
    location: {
      findFirst: (...a: unknown[]) => mockLocFindFirst(...a),
      update: (...a: unknown[]) => mockLocUpdate(...a),
    },
    supplier: {
      findFirst: (...a: unknown[]) => mockSupFindFirst(...a),
      update: (...a: unknown[]) => mockSupUpdate(...a),
    },
  },
}));

import { GET as getItem, PUT as updateItem, DELETE as deleteItem } from "@/app/api/items/[id]/route";
import { PUT as updateCat, DELETE as deleteCat } from "@/app/api/categories/[id]/route";
import { GET as getLoc, PUT as updateLoc, DELETE as deleteLoc } from "@/app/api/locations/[id]/route";
import { GET as getSup, PUT as updateSup, DELETE as deleteSup } from "@/app/api/suppliers/[id]/route";
import { NextRequest } from "next/server";

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => { jest.clearAllMocks(); mockCurrentUser = adminUser; });

// ============================
// Items [id]
// ============================
describe("Items /api/items/[id]", () => {
  test("GET returns item detail", async () => {
    mockItemFindFirst.mockResolvedValue({ id: UUID, name: "Flour" });
    const res = await getItem(new NextRequest(`http://localhost:3000/api/items/${UUID}`), makeParams(UUID));
    expect(res.status).toBe(200);
  });

  test("GET returns 404", async () => {
    mockItemFindFirst.mockResolvedValue(null);
    const res = await getItem(new NextRequest(`http://localhost:3000/api/items/${UUID}`), makeParams(UUID));
    expect(res.status).toBe(404);
  });

  test("PUT updates item", async () => {
    mockItemFindFirst.mockResolvedValue({ id: UUID });
    mockItemUpdate.mockResolvedValue({ id: UUID, name: "Updated" });
    const res = await updateItem(
      new NextRequest(`http://localhost:3000/api/items/${UUID}`, {
        method: "PUT", body: JSON.stringify({ name: "Updated" }),
      }),
      makeParams(UUID)
    );
    expect(res.status).toBe(200);
  });

  test("PUT returns 403 without item:edit", async () => {
    mockCurrentUser = storeUser;
    const res = await updateItem(
      new NextRequest(`http://localhost:3000/api/items/${UUID}`, {
        method: "PUT", body: JSON.stringify({ name: "Test" }),
      }),
      makeParams(UUID)
    );
    expect(res.status).toBe(403);
  });

  test("DELETE soft-deletes item", async () => {
    mockItemFindFirst.mockResolvedValue({ id: UUID });
    mockItemUpdate.mockResolvedValue({ id: UUID, isActive: false });
    const res = await deleteItem(new NextRequest(`http://localhost:3000/api/items/${UUID}`), makeParams(UUID));
    expect(res.status).toBe(200);
    expect(mockItemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    );
  });

  test("DELETE returns 403 without item:delete", async () => {
    mockCurrentUser = storeUser;
    const res = await deleteItem(new NextRequest(`http://localhost:3000/api/items/${UUID}`), makeParams(UUID));
    expect(res.status).toBe(403);
  });
});

// ============================
// Categories [id]
// ============================
describe("Categories /api/categories/[id]", () => {
  test("PUT updates category", async () => {
    mockCatFindFirst.mockResolvedValue({ id: UUID });
    mockCatUpdate.mockResolvedValue({ id: UUID, name: "Updated" });
    const res = await updateCat(
      new NextRequest(`http://localhost:3000/api/categories/${UUID}`, {
        method: "PUT", body: JSON.stringify({ name: "Updated" }),
      }),
      makeParams(UUID)
    );
    expect(res.status).toBe(200);
  });

  test("PUT returns 404 for non-existent", async () => {
    mockCatFindFirst.mockResolvedValue(null);
    const res = await updateCat(
      new NextRequest(`http://localhost:3000/api/categories/${UUID}`, {
        method: "PUT", body: JSON.stringify({ name: "Test" }),
      }),
      makeParams(UUID)
    );
    expect(res.status).toBe(404);
  });

  test("DELETE soft-deletes category", async () => {
    mockCatFindFirst.mockResolvedValue({ id: UUID });
    mockCatUpdate.mockResolvedValue({ id: UUID, isActive: false });
    const res = await deleteCat(new NextRequest(`http://localhost:3000/api/categories/${UUID}`), makeParams(UUID));
    expect(res.status).toBe(200);
  });
});

// ============================
// Locations [id]
// ============================
describe("Locations /api/locations/[id]", () => {
  test("GET returns location detail", async () => {
    mockLocFindFirst.mockResolvedValue({ id: UUID, code: "WH-01" });
    const res = await getLoc(new NextRequest(`http://localhost:3000/api/locations/${UUID}`), makeParams(UUID));
    expect(res.status).toBe(200);
  });

  test("GET returns 404", async () => {
    mockLocFindFirst.mockResolvedValue(null);
    const res = await getLoc(new NextRequest(`http://localhost:3000/api/locations/${UUID}`), makeParams(UUID));
    expect(res.status).toBe(404);
  });

  test("PUT updates location", async () => {
    mockLocFindFirst.mockResolvedValue({ id: UUID });
    mockLocUpdate.mockResolvedValue({ id: UUID, name: "Updated" });
    const res = await updateLoc(
      new NextRequest(`http://localhost:3000/api/locations/${UUID}`, {
        method: "PUT", body: JSON.stringify({ name: "Updated" }),
      }),
      makeParams(UUID)
    );
    expect(res.status).toBe(200);
  });

  test("PUT prevents self-parent", async () => {
    mockLocFindFirst.mockResolvedValue({ id: UUID });
    const res = await updateLoc(
      new NextRequest(`http://localhost:3000/api/locations/${UUID}`, {
        method: "PUT", body: JSON.stringify({ parentId: UUID }),
      }),
      makeParams(UUID)
    );
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toContain("own parent");
  });

  test("DELETE soft-deletes location", async () => {
    mockLocFindFirst.mockResolvedValue({ id: UUID });
    mockLocUpdate.mockResolvedValue({ id: UUID, isActive: false });
    const res = await deleteLoc(new NextRequest(`http://localhost:3000/api/locations/${UUID}`), makeParams(UUID));
    expect(res.status).toBe(200);
  });
});

// ============================
// Suppliers [id]
// ============================
describe("Suppliers /api/suppliers/[id]", () => {
  test("GET returns supplier detail", async () => {
    mockSupFindFirst.mockResolvedValue({ id: UUID, name: "Acme" });
    const res = await getSup(new NextRequest(`http://localhost:3000/api/suppliers/${UUID}`), makeParams(UUID));
    expect(res.status).toBe(200);
  });

  test("GET returns 404", async () => {
    mockSupFindFirst.mockResolvedValue(null);
    const res = await getSup(new NextRequest(`http://localhost:3000/api/suppliers/${UUID}`), makeParams(UUID));
    expect(res.status).toBe(404);
  });

  test("PUT updates supplier", async () => {
    mockSupFindFirst.mockResolvedValue({ id: UUID });
    mockSupUpdate.mockResolvedValue({ id: UUID, name: "Updated" });
    const res = await updateSup(
      new NextRequest(`http://localhost:3000/api/suppliers/${UUID}`, {
        method: "PUT", body: JSON.stringify({ name: "Updated" }),
      }),
      makeParams(UUID)
    );
    expect(res.status).toBe(200);
  });

  test("DELETE soft-deletes supplier", async () => {
    mockSupFindFirst.mockResolvedValue({ id: UUID });
    mockSupUpdate.mockResolvedValue({ id: UUID, isActive: false });
    const res = await deleteSup(new NextRequest(`http://localhost:3000/api/suppliers/${UUID}`), makeParams(UUID));
    expect(res.status).toBe(200);
  });

  test("DELETE returns 403 without supplier:delete", async () => {
    mockCurrentUser = storeUser;
    const res = await deleteSup(new NextRequest(`http://localhost:3000/api/suppliers/${UUID}`), makeParams(UUID));
    expect(res.status).toBe(403);
  });
});
