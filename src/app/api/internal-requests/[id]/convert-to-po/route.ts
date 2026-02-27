import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
} from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "po:write")) return apiError("Forbidden", 403);

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { supplierId } = body;

    if (!supplierId) return apiError("supplierId is required");

    // Fetch the internal request with lines
    const internalRequest = await prisma.internalRequest.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        lines: {
          include: {
            item: { select: { id: true, code: true, name: true, uom: true, avgCost: true } },
          },
        },
      },
    });

    if (!internalRequest) return apiError("Internal request not found", 404);

    // Check if a PO already exists for this request
    const existingPO = await prisma.purchaseOrder.findFirst({
      where: { internalRequestId: id, tenantId: user.tenantId },
    });
    if (existingPO) return apiError("A PO already exists for this request");

    // Validate supplier
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, tenantId: user.tenantId, isActive: true },
    });
    if (!supplier) return apiError("Supplier not found or inactive", 404);

    // Generate PO number
    const count = await prisma.purchaseOrder.count({
      where: { tenantId: user.tenantId },
    });
    const poNumber = `PO-${String(count + 1).padStart(5, "0")}`;

    // Build lines from request items
    const poLines = internalRequest.lines.map((line) => ({
      itemId: line.itemId,
      quantity: line.requestedQty,
      unitCost: line.item.avgCost || 0,
      totalCost: line.requestedQty * (line.item.avgCost || 0),
      notes: line.notes,
    }));

    const totalAmount = poLines.reduce((sum, l) => sum + l.totalCost, 0);

    const po = await prisma.purchaseOrder.create({
      data: {
        tenantId: user.tenantId,
        poNumber,
        supplierId,
        totalAmount,
        createdById: user.id,
        internalRequestId: id,
        notes: `Created from request ${internalRequest.requestNumber}`,
        lines: { create: poLines },
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
      action: "po:create_from_request",
      entityType: "PurchaseOrder",
      entityId: po.id,
      afterData: {
        poNumber,
        supplierId,
        totalAmount,
        internalRequestId: id,
        requestNumber: internalRequest.requestNumber,
      },
    });

    return apiSuccess(po, 201);
  } catch (e) {
    console.error("POST /api/internal-requests/[id]/convert-to-po error:", e);
    return apiError("Failed to convert request to PO", 500);
  }
}
