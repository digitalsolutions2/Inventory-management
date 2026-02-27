import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  checkPermission,
  apiSuccess,
  apiError,
  createAuditLog,
} from "@/lib/api-utils";
import { POReceiveSchema, parseBody } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);
  if (!checkPermission(user, "po:approve_warehouse"))
    return apiError("Forbidden", 403);

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = parseBody(POReceiveSchema, body);
    if (!parsed.success) return apiError(parsed.error);

    const { locationId, notes } = parsed.data;

    // Fetch the PO with lines
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId: user.tenantId },
      include: { lines: { include: { item: true } } },
    });

    if (!po) return apiError("Purchase order not found", 404);
    if (po.status !== "APPROVED") {
      return apiError("PO must be in APPROVED status to receive");
    }

    // Validate location exists and is active
    const location = await prisma.location.findFirst({
      where: { id: locationId, tenantId: user.tenantId, isActive: true },
    });
    if (!location)
      return apiError("Location not found or inactive", 404);

    // Perform all updates in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. For each PO line: upsert inventory + create transaction
      for (const line of po.lines) {
        if (line.quantity <= 0) continue;

        // Upsert InventoryItem
        const existingInv = await tx.inventoryItem.findUnique({
          where: {
            tenantId_itemId_locationId: {
              tenantId: user.tenantId,
              itemId: line.itemId,
              locationId,
            },
          },
        });

        if (existingInv) {
          // Weighted average cost
          const totalQty = existingInv.quantity + line.quantity;
          const newAvgCost =
            totalQty > 0
              ? (existingInv.quantity * existingInv.avgCost +
                  line.quantity * line.unitCost) /
                totalQty
              : line.unitCost;

          await tx.inventoryItem.update({
            where: { id: existingInv.id },
            data: {
              quantity: totalQty,
              avgCost: newAvgCost,
            },
          });
        } else {
          await tx.inventoryItem.create({
            data: {
              tenantId: user.tenantId,
              itemId: line.itemId,
              locationId,
              quantity: line.quantity,
              avgCost: line.unitCost,
            },
          });
        }

        // Create InventoryTransaction
        await tx.inventoryTransaction.create({
          data: {
            tenantId: user.tenantId,
            itemId: line.itemId,
            locationId,
            type: "INBOUND",
            quantity: line.quantity,
            unitCost: line.unitCost,
            referenceType: "PurchaseOrder",
            referenceId: po.id,
            notes: notes || `Received from ${po.poNumber}`,
          },
        });

        // Update PO line receivedQty to fully received
        await tx.purchaseOrderLine.update({
          where: { id: line.id },
          data: { receivedQty: line.quantity },
        });
      }

      // 2. Set PO status to RECEIVED
      await tx.purchaseOrder.update({
        where: { id },
        data: { status: "RECEIVED" },
      });
    });

    // Fetch updated PO for response
    const result = await prisma.purchaseOrder.findFirst({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        lines: {
          include: {
            item: { select: { id: true, code: true, name: true, uom: true } },
          },
        },
      },
    });

    await createAuditLog({
      tenantId: user.tenantId,
      userId: user.id,
      action: "po:receive",
      entityType: "PurchaseOrder",
      entityId: id,
      beforeData: { status: "APPROVED" },
      afterData: {
        status: "RECEIVED",
        locationId,
        inventoryUpdated: true,
      },
    });

    return apiSuccess(result);
  } catch (e) {
    console.error("POST /api/purchase-orders/[id]/receive error:", e);
    return apiError("Failed to receive PO into inventory", 500);
  }
}
