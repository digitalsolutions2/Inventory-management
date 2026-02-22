import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
  isPositiveNumber,
} from "@/lib/api-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  try {
    const { id } = await params;
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        supplier: true,
        createdBy: { select: { id: true, fullName: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, email: true } },
        lines: {
          include: { item: { select: { id: true, code: true, name: true, uom: true } } },
        },
      },
    });

    if (!po) return apiError("Purchase order not found", 404);
    return apiSuccess(po);
  } catch (e) {
    console.error("GET /api/purchase-orders/[id] error:", e);
    return apiError("Failed to fetch purchase order", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "po:edit")) return apiError("Forbidden", 403);

  try {
    const { id } = await params;
    const existing = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) return apiError("Purchase order not found", 404);
    if (existing.status !== "DRAFT") return apiError("Only draft POs can be edited");

    const body = await request.json();
    const { supplierId, expectedDate, notes, lines } = body;

    // Validate lines if provided
    if (lines) {
      if (!Array.isArray(lines) || lines.length === 0)
        return apiError("At least one line item is required");
      for (const line of lines) {
        if (!line.itemId) return apiError("Each line must have an itemId");
        if (!isPositiveNumber(line.quantity))
          return apiError("Quantity must be a positive number");
        if (!isPositiveNumber(line.unitCost))
          return apiError("Unit cost must be a positive number");
      }
    }

    // Validate supplier if changed
    if (supplierId) {
      const supplier = await prisma.supplier.findFirst({
        where: { id: supplierId, tenantId: user.tenantId, isActive: true },
      });
      if (!supplier) return apiError("Supplier not found or inactive", 404);
    }

    const totalAmount = lines
      ? lines.reduce(
          (sum: number, line: { quantity: number; unitCost: number }) =>
            sum + line.quantity * line.unitCost,
          0
        )
      : undefined;

    const po = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...(supplierId !== undefined && { supplierId }),
        ...(expectedDate !== undefined && {
          expectedDate: expectedDate ? new Date(expectedDate) : null,
        }),
        ...(notes !== undefined && { notes }),
        ...(totalAmount !== undefined && { totalAmount }),
        ...(lines && {
          lines: {
            deleteMany: {},
            create: lines.map(
              (line: { itemId: string; quantity: number; unitCost: number; notes?: string }) => ({
                itemId: line.itemId,
                quantity: line.quantity,
                unitCost: line.unitCost,
                totalCost: line.quantity * line.unitCost,
                notes: line.notes,
              })
            ),
          },
        }),
      },
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true } },
        lines: {
          include: { item: { select: { id: true, code: true, name: true, uom: true } } },
        },
      },
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "po:edit",
      entityType: "PurchaseOrder",
      entityId: id,
      beforeData: { totalAmount: existing.totalAmount },
      afterData: { totalAmount: po.totalAmount },
    });

    return apiSuccess(po);
  } catch (e) {
    console.error("PUT /api/purchase-orders/[id] error:", e);
    return apiError("Failed to update purchase order", 500);
  }
}
