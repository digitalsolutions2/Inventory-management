import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
} from "@/lib/api-utils";
import { UpdatePOSchema, parseBody } from "@/lib/validations";

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
        qcApprovedBy: { select: { id: true, fullName: true, email: true } },
        financeApprovedBy: { select: { id: true, fullName: true, email: true } },
        warehouseApprovedBy: { select: { id: true, fullName: true, email: true } },
        rejectedBy: { select: { id: true, fullName: true, email: true } },
        internalRequest: { select: { id: true, requestNumber: true, status: true } },
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
  if (!checkPermission(user, "po:write")) return apiError("Forbidden", 403);

  try {
    const { id } = await params;
    const existing = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId: user.tenantId },
    });
    if (!existing) return apiError("Purchase order not found", 404);
    if (existing.status !== "DRAFT") return apiError("Only draft POs can be edited");

    const body = await request.json();
    const parsed = parseBody(UpdatePOSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const { supplierId, expectedDate, notes, lines } = parsed.data;

    // Validate supplier if changed
    if (supplierId) {
      const supplier = await prisma.supplier.findFirst({
        where: { id: supplierId, tenantId: user.tenantId, isActive: true },
      });
      if (!supplier) return apiError("Supplier not found or inactive", 404);
    }

    const totalAmount = lines
      ? lines.reduce(
          (sum, line) => sum + line.quantity * line.unitCost,
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
            create: lines.map((line) => ({
              itemId: line.itemId,
              quantity: line.quantity,
              unitCost: line.unitCost,
              totalCost: line.quantity * line.unitCost,
              notes: line.notes,
            })),
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
